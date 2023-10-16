import {
  completed,
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
import { ActionHash } from '@holochain/client';

import { AssembleClient } from './assemble-client.js';
import { CallToAction } from './types.js';

export class AssembleStore {
  constructor(public client: AssembleClient) {}

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
    lazyLoadAndPoll(async () => this.client.getCommitment(commitmentHash), 4000)
  );

  commitmentsForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      lazyLoadAndPoll(
        async () => this.client.getCommitmentsForCallToAction(callToActionHash),
        4000
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
      lazyLoadAndPoll(async () => {
        const records = await this.client.getSatisfactionsForCommitment(
          commitmentHash
        );
        return records.map(r => r.actionHash);
      }, 4000)
  );

  /** Assembly */

  assemblies = new LazyHoloHashMap((assemblyHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getAssembly(assemblyHash), 4000)
  );

  assembliesForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      lazyLoadAndPoll(async () => {
        const records = await this.client.getAssembliesForCallToAction(
          callToActionHash
        );
        return records.map(r => r.actionHash);
      }, 4000)
  );

  assembliesForSatisfaction = new LazyHoloHashMap(
    (satisfactionHash: ActionHash) =>
      lazyLoadAndPoll(async () => {
        const records = await this.client.getAssembliesForSatisfaction(
          satisfactionHash
        );
        return records.map(r => r.actionHash);
      }, 4000)
  );

  /** All Calls To Action */

  openCallsToAction = pipe(
    lazyLoadAndPoll(async () => this.client.getOpenCallsToAction(), 4000),
    callsToActionHashes =>
      sliceAndJoin(this.callToActions, callsToActionHashes),
    callsToActions => {
      const openCalls: HoloHashMap<
        ActionHash,
        EntryRecord<CallToAction>
      > = new HoloHashMap();

      for (const [callToActionHash, callToAction] of Array.from(
        callsToActions.entries()
      )) {
        if (
          callToAction.entry.expiration_time &&
          callToAction.entry.expiration_time < Date.now() * 1000
        ) {
          this.client.closeCallToAction(callToAction.actionHash);
        } else {
          openCalls.set(callToActionHash, callToAction);
        }
      }

      return openCalls;
    }
  );

  /** All Assemblies */

  allAssemblies = lazyLoadAndPoll(async () => {
    const records = await this.client.getAllAssemblies();
    return records.map(r => r.actionHash);
  }, 4000);

  /** My Calls To Action */

  myCallsToAction = lazyLoadAndPoll(
    async () => this.client.getMyCallsToAction(),
    1000
  );
}
