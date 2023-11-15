import { CancellationsStore } from '@holochain-open-dev/cancellations';
import {
  deletesForEntryStore,
  immutableEntryStore,
  joinAsync,
  latestVersionOfEntryStore,
  liveLinksTargetsStore,
  mapAndJoin,
  pipe,
  toPromise,
} from '@holochain-open-dev/stores';
import { LazyHoloHashMap, slice } from '@holochain-open-dev/utils';
import { ActionHash } from '@holochain/client';

import { AssembleClient } from './assemble-client.js';
import { Need } from './types.js';

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
            this.commitments.get(commitmentHash).entry
          );

          // TODO: better check on whether what was cancelled was a commitment
          if (!commitment.entry.amount) return;

          const callToActionHash = commitment.entry.call_to_action_hash;
          const callToAction = await toPromise(
            this.callToActions.get(callToActionHash).latestVersion
          );

          const need = callToAction.entry.needs[commitment.entry.need_index];
          if (!need.requires_admin_approval) {
            // Create a new satisfaction if there are already enough commitments
            let commitmentHashes = Array.from(
              (
                await toPromise(
                  this.callToActions.get(callToActionHash).commitments
                    .uncancelled
                )
              ).keys()
            );
            commitmentHashes = [
              ...commitmentHashes.filter(
                h => h.toString() !== commitmentHash.toString()
              ),
              commitmentHash,
            ];
            const commitments = await toPromise(
              mapAndJoin(
                slice(this.commitments, commitmentHashes),
                c => c.entry
              )
            );

            const amountContributed = Array.from(commitments.values()).reduce(
              (acc, next) => acc + next.entry.amount,
              0
            );

            if (amountContributed >= need.min_necessary) {
              const satisfactionsForCallToAction = await toPromise(
                mapAndJoin(
                  slice(
                    this.satisfactions,
                    Array.from(
                      (
                        await toPromise(
                          this.callToActions.get(callToActionHash).satisfactions
                        )
                      ).keys()
                    )
                  ),
                  s => s.latestVersion
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
            this.commitments.get(commitmentHash).entry
          );

          // TODO: better check on whether what was cancelled was a commitment
          if (!commitment.entry.amount) return;
          const callToActionHash = commitment.entry.call_to_action_hash;
          const callToAction = await toPromise(
            this.callToActions.get(callToActionHash).latestVersion
          );

          const need = callToAction.entry.needs[commitment.entry.need_index];
          if (need.requires_admin_approval) {
            // If the admins need to approve this need, delete satisfactions
            const satisfactionsForCommitment = Array.from(
              (
                await toPromise(
                  this.commitments.get(commitmentHash).satisfactions
                )
              ).keys()
            );

            for (const satisfactionHash of satisfactionsForCommitment) {
              await this.client.deleteSatisfaction(satisfactionHash); // TODO: HEEEEERE
            }
          } else {
            // Only delete the satisfaction if there are not enough commitments to satisfy the need
            let commitmentHashes = Array.from(
              (
                await toPromise(
                  this.callToActions.get(callToActionHash).commitments
                    .uncancelled
                )
              ).keys()
            );
            commitmentHashes = commitmentHashes.filter(
              h => h.toString() !== commitmentHash.toString()
            );
            const commitments = await toPromise(
              mapAndJoin(
                slice(this.commitments, commitmentHashes),
                c => c.entry
              )
            );
            const commitmentsForNeed = Array.from(commitments.values()).filter(
              c => c.entry.need_index === commitment.entry.need_index
            );
            const amountContributed = commitmentsForNeed.reduce(
              (acc, next) => acc + next.entry.amount,
              0
            );

            if (amountContributed < need.min_necessary) {
              const satisfactionsForCallToAction = await toPromise(
                mapAndJoin(
                  slice(
                    this.satisfactions,
                    Array.from(
                      (
                        await toPromise(
                          this.callToActions.get(callToActionHash).satisfactions
                        )
                      ).keys()
                    )
                  ),
                  s => s.latestVersion
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

  callToActions = new LazyHoloHashMap((callToActionHash: ActionHash) => {
    const commitments = liveLinksTargetsStore(
      this.client,
      callToActionHash,
      () => this.client.getCommitmentsForCallToAction(callToActionHash),
      'CallToActionToCommitments'
    );
    const withCancellations = pipe(commitments, commitmentsHashes =>
      mapAndJoin(slice(this.commitments, commitmentsHashes), s => s.isCancelled)
    );
    const satisfactionsHashes = liveLinksTargetsStore(
      this.client,
      callToActionHash,
      () => this.client.getSatisfactionsForCallToAction(callToActionHash),
      'CallToActionToSatisfactions'
    );
    const latestVersion = latestVersionOfEntryStore(this.client, () =>
      this.client.getLatestCallToAction(callToActionHash)
    );
    const needs = joinAsync([
      latestVersion,
      pipe(satisfactionsHashes, hashes =>
        mapAndJoin(slice(this.satisfactions, hashes), s => s.latestVersion)
      ),
    ]);
    return {
      latestVersion,
      needs: {
        satisfied: pipe(needs, ([callToAction, satisfactions]) =>
          callToAction.entry.needs
            .map((n, i) => [n, i] as [Need, number])
            .filter(
              ([n, i]) =>
                n.min_necessary === 0 ||
                !!Array.from(satisfactions.values()).find(
                  s => s.entry.need_index === i
                )
            )
        ),
        unsatisfied: pipe(needs, ([callToAction, satisfactions]) =>
          callToAction.entry.needs
            .map((n, i) => [n, i] as [Need, number])
            .filter(
              ([n, i]) =>
                n.min_necessary > 0 &&
                !Array.from(satisfactions.values()).find(
                  s => s.entry.need_index === i
                )
            )
        ),
      },
      commitments: {
        cancelled: pipe(
          withCancellations,
          commitmentsToIsCancelledMap =>
            Array.from(commitmentsToIsCancelledMap.entries())
              .filter(([_commitmentHash, isCancelled]) => isCancelled)
              .map(([c]) => c),
          hashes => slice(this.commitments, hashes)
        ),
        uncancelled: pipe(
          withCancellations,
          commitmentsToIsCancelledMap =>
            Array.from(commitmentsToIsCancelledMap.entries())
              .filter(([_commitmentHash, isCancelled]) => !isCancelled)
              .map(([c]) => c),
          hashes => slice(this.commitments, hashes)
        ),
      },
      satisfactions: pipe(satisfactionsHashes, hashes =>
        slice(this.satisfactions, hashes)
      ),
      assemblies: pipe(
        liveLinksTargetsStore(
          this.client,
          callToActionHash,
          () => this.client.getAssembliesForCallToAction(callToActionHash),
          'CallToActionToAssemblies'
        ),
        hashes => slice(this.assemblies, hashes)
      ),
    };
  });

  callToActionsForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      liveLinksTargetsStore(
        this.client,
        callToActionHash,
        () => this.client.getCallToActionsForCallToAction(callToActionHash),
        'CallToActionToCallToActions'
      )
  );

  /** Commitment */

  commitments = new LazyHoloHashMap((commitmentHash: ActionHash) => ({
    entry: immutableEntryStore(() => this.client.getCommitment(commitmentHash)),
    cancellations: this.cancellationsStore.cancellationsFor.get(commitmentHash),
    isCancelled: pipe(
      this.cancellationsStore.cancellationsFor.get(commitmentHash).live,
      c => c.size > 0
    ),
    satisfactions: pipe(
      liveLinksTargetsStore(
        this.client,
        commitmentHash,
        () => this.client.getSatisfactionsForCommitment(commitmentHash),
        'CommitmentToSatisfactions'
      ),
      hashes => slice(this.satisfactions, hashes)
    ),
  }));

  /** Satisfaction */

  satisfactions = new LazyHoloHashMap((satisfactionHash: ActionHash) => ({
    latestVersion: latestVersionOfEntryStore(this.client, () =>
      this.client.getLatestSatisfaction(satisfactionHash)
    ),
    deletes: deletesForEntryStore(this.client, satisfactionHash, () =>
      this.client.getSatisfactionDeletes(satisfactionHash)
    ),
    assemblies: pipe(
      liveLinksTargetsStore(
        this.client,
        satisfactionHash,
        () => this.client.getAssembliesForSatisfaction(satisfactionHash),
        'SatisfactionToAssemblies'
      ),
      hashes => slice(this.assemblies, hashes)
    ),
  }));

  /** Assembly */

  assemblies = new LazyHoloHashMap((assemblyHash: ActionHash) =>
    immutableEntryStore(() => this.client.getAssembly(assemblyHash))
  );
}
