import { AsyncReadable, lazyLoadAndPoll } from '@holochain-open-dev/stores';
import { EntryRecord, LazyHoloHashMap } from '@holochain-open-dev/utils';
import {
  ActionHash,
  AgentPubKey,
  EntryHash,
  NewEntryAction,
  Record,
} from '@holochain/client';

import { AssembleClient } from './assemble-client';
import { CollectiveCommitment } from './types';
import { Satisfaction } from './types';
import { CallPromise } from './types';
import { CallToAction } from './types';

export class AssembleStore {
  constructor(public client: AssembleClient) {}

  /** Call To Action */

  callToActions = new LazyHoloHashMap((callToActionHash: ActionHash) =>
    lazyLoadAndPoll(
      async () => this.client.getCallToAction(callToActionHash),
      4000
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

  /** Promise */

  promises = new LazyHoloHashMap((promiseHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getPromise(promiseHash), 4000)
  );

  promisesForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      lazyLoadAndPoll(async () => {
        return this.client.getPromisesForCallToAction(callToActionHash);
      }, 4000)
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
      lazyLoadAndPoll(async () => {
        return this.client.getSatisfactionsForCallToAction(callToActionHash);
      }, 4000)
  );

  satisfactionsForPromise = new LazyHoloHashMap((promiseHash: ActionHash) =>
    lazyLoadAndPoll(async () => {
      const records = await this.client.getSatisfactionsForPromise(promiseHash);
      return records.map(r => r.actionHash);
    }, 4000)
  );

  /** Collective Commitment */

  collectiveCommitments = new LazyHoloHashMap(
    (collectiveCommitmentHash: ActionHash) =>
      lazyLoadAndPoll(
        async () =>
          this.client.getCollectiveCommitment(collectiveCommitmentHash),
        4000
      )
  );

  collectiveCommitmentsForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      lazyLoadAndPoll(async () => {
        const records =
          await this.client.getCollectiveCommitmentsForCallToAction(
            callToActionHash
          );
        return records.map(r => r.actionHash);
      }, 4000)
  );

  collectiveCommitmentsForSatisfaction = new LazyHoloHashMap(
    (satisfactionHash: ActionHash) =>
      lazyLoadAndPoll(async () => {
        const records =
          await this.client.getCollectiveCommitmentsForSatisfaction(
            satisfactionHash
          );
        return records.map(r => r.actionHash);
      }, 4000)
  );

  /** All Calls To Action */

  allCallsToAction = lazyLoadAndPoll(async () => {
    const records = await this.client.getAllCallsToAction();
    return records.map(r => r.actionHash);
  }, 4000);

  /** All Collective Commitments */

  allCollectiveCommitments = lazyLoadAndPoll(async () => {
    const records = await this.client.getAllCollectiveCommitments();
    return records.map(r => r.actionHash);
  }, 4000);
}
