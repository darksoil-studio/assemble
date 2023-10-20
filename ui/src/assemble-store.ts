import { CancellationsStore } from '@holochain-open-dev/cancellations';
import {
  joinAsync,
  lazyLoadAndPoll,
  pipe,
  sliceAndJoin,
  toPromise,
} from '@holochain-open-dev/stores';
import { LazyHoloHashMap } from '@holochain-open-dev/utils';
import { ActionHash } from '@holochain/client';

import { AssembleClient } from './assemble-client.js';

export class AssembleStore {
  constructor(
    public client: AssembleClient,
    public cancellationsStore: CancellationsStore
  ) {
    cancellationsStore.client.onSignal(async signal => {
      if (signal.type === 'LinkDeleted') {
        // Something was uncancelled
        try {
          const commitmentHash = signal.action.hashed.content.base_address;
          const commitment = await toPromise(
            this.commitments.get(commitmentHash)
          );

          // TODO: better check on whether what was cancelled was a commitment
          if (!commitment.entry.amount) return;

          const callToActionHash = commitment.entry.call_to_action_hash;
          const callToAction = await toPromise(
            this.callToActions.get(callToActionHash)
          );

          const need = callToAction.entry.needs[commitment.entry.need_index];
          if (!need.requires_admin_approval) {
            // Create a new satisfaction if there are already enough commitments
            let commitmentHashes = await toPromise(
              this.uncancelledCommitmentsForCallToAction.get(callToActionHash)
            );
            commitmentHashes = [
              ...commitmentHashes.filter(
                h => h.toString() !== commitmentHash.toString()
              ),
              commitmentHash,
            ];
            const commitments = await toPromise(
              sliceAndJoin(this.commitments, commitmentHashes)
            );

            const amountContributed = Array.from(commitments.values()).reduce(
              (acc, next) => acc + next.entry.amount,
              0
            );

            if (amountContributed >= need.min_necessary) {
              const satisfactionsForCallToAction = await toPromise(
                sliceAndJoin(
                  this.satisfactions,
                  await toPromise(
                    this.satisfactionsForCallToAction.get(callToActionHash)
                  )
                )
              );

              if (
                !Array.from(satisfactionsForCallToAction.values()).find(
                  satisfaction =>
                    satisfaction.entry.need_index ===
                    commitment.entry.need_index
                )
              ) {
                await this.client.createSatisfaction({
                  need_index: commitment.entry.need_index,
                  call_to_action_hash: callToActionHash,
                  commitments_hashes: commitmentHashes,
                });
              }
            }
          }
        } catch (e) {
          // If this is not a commitment, nothing to do
          console.warn(e);
        }
      } else if (signal.type === 'EntryCreated') {
        // If a commitment was cancelled, delete any satisfactions for it
        try {
          const commitmentHash = signal.app_entry.cancelled_hash;
          const commitment = await toPromise(
            this.commitments.get(commitmentHash)
          );

          // TODO: better check on whether what was cancelled was a commitment
          if (!commitment.entry.amount) return;
          const callToActionHash = commitment.entry.call_to_action_hash;
          const callToAction = await toPromise(
            this.callToActions.get(callToActionHash)
          );

          const need = callToAction.entry.needs[commitment.entry.need_index];
          if (need.requires_admin_approval) {
            // If the admins need to approve this need, delete satisfactions
            const satisfactionsForCommitment = await toPromise(
              this.satisfactionsForCommitment.get(commitmentHash)
            );

            for (const satisfactionHash of satisfactionsForCommitment) {
              await this.client.deleteSatisfaction(satisfactionHash);
            }
          } else {
            // Only delete the satisfaction if there are not enough commitments to satisfy the need
            let commitmentHashes = await toPromise(
              this.uncancelledCommitmentsForCallToAction.get(callToActionHash)
            );
            commitmentHashes = commitmentHashes.filter(
              h => h.toString() !== commitmentHash.toString()
            );
            const commitments = await toPromise(
              sliceAndJoin(this.commitments, commitmentHashes)
            );

            const amountContributed = Array.from(commitments.values()).reduce(
              (acc, next) => acc + next.entry.amount,
              0
            );

            if (amountContributed < need.min_necessary) {
              const satisfactionsForCallToAction = await toPromise(
                sliceAndJoin(
                  this.satisfactions,
                  await toPromise(
                    this.satisfactionsForCallToAction.get(callToActionHash)
                  )
                )
              );

              for (const satisfaction of Array.from(
                satisfactionsForCallToAction.values()
              )) {
                if (
                  satisfaction.entry.need_index === commitment.entry.need_index
                ) {
                  await this.client.deleteSatisfaction(satisfaction.actionHash);
                }
              }
            }
          }
        } catch (e) {
          // If this is not a commitment, nothing to do
          console.warn(e);
        }
      }
    });
  }

  /** Call To Action */

  callToActions = new LazyHoloHashMap((callToActionHash: ActionHash) =>
    pipe(
      lazyLoadAndPoll(
        async () => this.client.getCallToAction(callToActionHash),
        4000
      ),
      c => {
        if (!c) throw new Error('Call to action was not found');
        return c;
      }
    )
  );

  callToActionsForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      lazyLoadAndPoll(async () => {
        const records = await this.client.getCallToActionsForCallToAction(
          callToActionHash
        );
        return records.map(r => r.actionHash);
      }, 4000)
  );

  /** Commitment */

  commitments = new LazyHoloHashMap((commitmentHash: ActionHash) =>
    lazyLoadAndPoll(async () => {
      const c = await this.client.getCommitment(commitmentHash);

      if (!c) throw new Error('Commitment was not found');
      return c;
    }, 4000)
  );

  commitmentsForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      lazyLoadAndPoll(
        async () => this.client.getCommitmentsForCallToAction(callToActionHash),
        4000
      )
  );

  uncancelledCommitmentsForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      pipe(
        this.commitmentsForCallToAction.get(callToActionHash),
        commitmentsHashes =>
          joinAsync(
            commitmentsHashes.map(c =>
              this.cancellationsStore.cancellationsFor.get(c)
            )
          ),
        (cancellations, commitmentsHashes) =>
          commitmentsHashes.filter((c, i) => cancellations[i].length === 0)
      )
  );

  cancelledCommitmentsForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      pipe(
        this.commitmentsForCallToAction.get(callToActionHash),
        commitmentsHashes =>
          joinAsync(
            commitmentsHashes.map(c =>
              this.cancellationsStore.cancellationsFor.get(c)
            )
          ),
        (cancellations, commitmentsHashes) =>
          commitmentsHashes.filter((c, i) => cancellations[i].length > 0)
      )
  );

  /** Satisfaction */

  satisfactions = new LazyHoloHashMap((satisfactionHash: ActionHash) =>
    lazyLoadAndPoll(
      async () => this.client.getSatisfaction(satisfactionHash),
      4000
    )
  );

  satisfactionsForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      lazyLoadAndPoll(
        async () =>
          this.client.getSatisfactionsForCallToAction(callToActionHash),
        4000
      )
  );

  satisfactionsForCommitment = new LazyHoloHashMap(
    (commitmentHash: ActionHash) =>
      lazyLoadAndPoll(
        async () => this.client.getSatisfactionsForCommitment(commitmentHash),
        4000
      )
  );

  /** Assembly */

  assemblies = new LazyHoloHashMap((assemblyHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getAssembly(assemblyHash), 4000)
  );

  assembliesForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      lazyLoadAndPoll(
        async () => this.client.getAssembliesForCallToAction(callToActionHash),
        4000
      )
  );

  assembliesForSatisfaction = new LazyHoloHashMap(
    (satisfactionHash: ActionHash) =>
      lazyLoadAndPoll(
        async () => this.client.getAssembliesForSatisfaction(satisfactionHash),
        4000
      )
  );
}
