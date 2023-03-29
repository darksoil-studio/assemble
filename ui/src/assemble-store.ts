import { CollectiveCommitment } from './types';

import { Satisfaction } from './types';

import { Promise } from './types';

import { Call } from './types';

import { lazyLoadAndPoll, AsyncReadable } from '@holochain-open-dev/stores';
import { EntryRecord, LazyHoloHashMap } from '@holochain-open-dev/utils';
import {
  NewEntryAction,
  Record,
  ActionHash,
  EntryHash,
  AgentPubKey,
} from '@holochain/client';

import { AssembleClient } from './assemble-client';

export class AssembleStore {
  constructor(public client: AssembleClient) {}

  /** Call */

  calls = new LazyHoloHashMap((callHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getCall(callHash), 4000)
  );

  callsForCall = new LazyHoloHashMap((callHash: ActionHash) =>
    lazyLoadAndPoll(async () => {
      const records = await this.client.getCallsForCall(callHash);
      return records.map(r => r.actionHash);
    }, 4000)
  );

  /** Promise */

  promises = new LazyHoloHashMap((promiseHash: ActionHash) =>
    lazyLoadAndPoll(async () => this.client.getPromise(promiseHash), 4000)
  );

  promisesForCall = new LazyHoloHashMap((callHash: ActionHash) =>
    lazyLoadAndPoll(async () => {
      const records = await this.client.getPromisesForCall(callHash);
      return records.map(r => r.actionHash);
    }, 4000)
  );

  /** Satisfaction */

  satisfactions = new LazyHoloHashMap((satisfactionHash: ActionHash) =>
    lazyLoadAndPoll(
      async () => this.client.getSatisfaction(satisfactionHash),
      4000
    )
  );

  satisfactionsForCall = new LazyHoloHashMap((callHash: ActionHash) =>
    lazyLoadAndPoll(async () => {
      const records = await this.client.getSatisfactionsForCall(callHash);
      return records.map(r => r.actionHash);
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

  collectiveCommitmentsForCall = new LazyHoloHashMap((callHash: ActionHash) =>
    lazyLoadAndPoll(async () => {
      const records = await this.client.getCollectiveCommitmentsForCall(
        callHash
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
}
