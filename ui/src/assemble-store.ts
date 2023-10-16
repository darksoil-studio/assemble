import {
  completed,
  joinAsync,
  lazyLoadAndPoll,
  manualReloadStore,
  pipe,
  sliceAndJoin,
} from '@holochain-open-dev/stores';
import {
  EntryRecord,
  HoloHashMap,
  LazyHoloHashMap,
} from '@holochain-open-dev/utils';
import { CancellationsStore } from '@holochain-open-dev/cancellations';
import { ActionHash } from '@holochain/client';

import { AssembleClient } from './assemble-client.js';
import { CallToAction } from './types.js';

export class AssembleStore {
  constructor(
    public client: AssembleClient,
    public cancellationsStore: CancellationsStore
  ) {}

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
        commitmentsHashes => {
          return joinAsync(
            commitmentsHashes.map(c =>
              this.cancellationsStore.cancellationsFor.get(c)
            )
          );
        },
        (cancellations, commitmentsHashes) =>
          commitmentsHashes.filter((c, i) => cancellations[i].length === 0)
      )
  );

  cancelledCommitmentsForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      pipe(
        this.commitmentsForCallToAction.get(callToActionHash),
        commitmentsHashes => {
          return joinAsync(
            commitmentsHashes.map(c =>
              this.cancellationsStore.cancellationsFor.get(c)
            )
          );
        },
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
        async () =>
          await this.client.getAssembliesForSatisfaction(satisfactionHash),
        4000
      )
  );
}
