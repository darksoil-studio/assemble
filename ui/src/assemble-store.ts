import { lazyLoadAndPoll } from '@holochain-open-dev/stores';
import { LazyHoloHashMap } from '@holochain-open-dev/utils';
import { ActionHash } from '@holochain/client';

import { AssembleClient } from './assemble-client';

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

  satisfactionsForCommitment = new LazyHoloHashMap((commitmentHash: ActionHash) =>
    lazyLoadAndPoll(async () => {
      const records = await this.client.getSatisfactionsForCommitment(commitmentHash);
      return records.map(r => r.actionHash);
    }, 4000)
  );

  /** Collective Commitment */

  assemblies = new LazyHoloHashMap(
    (assemblyHash: ActionHash) =>
      lazyLoadAndPoll(
        async () =>
          this.client.getAssembly(assemblyHash),
        4000
      )
  );

  assembliesForCallToAction = new LazyHoloHashMap(
    (callToActionHash: ActionHash) =>
      lazyLoadAndPoll(async () => {
        const records =
          await this.client.getAssembliesForCallToAction(
            callToActionHash
          );
        return records.map(r => r.actionHash);
      }, 4000)
  );

  assembliesForSatisfaction = new LazyHoloHashMap(
    (satisfactionHash: ActionHash) =>
      lazyLoadAndPoll(async () => {
        const records =
          await this.client.getAssembliesForSatisfaction(
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

  allAssemblies = lazyLoadAndPoll(async () => {
    const records = await this.client.getAllAssemblies();
    return records.map(r => r.actionHash);
  }, 4000);
}
