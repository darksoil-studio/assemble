import {
  EntryRecord,
  ZomeClient,
  isSignalFromCellWithRole,
} from '@holochain-open-dev/utils';
import {
  ActionHash,
  AgentPubKey,
  AppAgentClient,
  EntryHash,
  Record,
} from '@holochain/client';

import { Assembly } from './types';
import { Satisfaction } from './types';
import { CallPromise } from './types';
import { CallToAction } from './types';
import { AssembleSignal } from './types';

export class AssembleClient extends ZomeClient<AssembleSignal> {
  constructor(
    public client: AppAgentClient,
    public roleName: string,
    public zomeName = 'assemble'
  ) {
    super(client, roleName, zomeName);
  }
  /** Call To Action */

  async createCallToAction(
    callToAction: CallToAction
  ): Promise<EntryRecord<CallToAction>> {
    const record: Record = await this.callZome(
      'create_call_to_action',
      callToAction
    );
    return new EntryRecord(record);
  }

  async getCallToAction(
    callToActionHash: ActionHash
  ): Promise<EntryRecord<CallToAction> | undefined> {
    const record: Record = await this.callZome(
      'get_call_to_action',
      callToActionHash
    );
    return record ? new EntryRecord(record) : undefined;
  }

  deleteCallToAction(
    originalCallToActionHash: ActionHash
  ): Promise<ActionHash> {
    return this.callZome('delete_call_to_action', originalCallToActionHash);
  }

  async updateCallToAction(
    previousCallToActionHash: ActionHash,
    updatedCallToAction: CallToAction
  ): Promise<EntryRecord<CallToAction>> {
    const record: Record = await this.callZome('update_call_to_action', {
      previous_call_to_action_hash: previousCallToActionHash,
      updated_call_to_action: updatedCallToAction,
    });
    return new EntryRecord(record);
  }

  async getCallToActionsForCallToAction(
    callToActionHash: ActionHash
  ): Promise<Array<EntryRecord<CallToAction>>> {
    const records: Record[] = await this.callZome(
      'get_call_to_actions_for_call_to_action',
      callToActionHash
    );
    return records.map(r => new EntryRecord(r));
  }
  /** Promise */

  async createPromise(promise: CallPromise): Promise<EntryRecord<CallPromise>> {
    const record: Record = await this.callZome('create_promise', promise);
    return new EntryRecord(record);
  }

  async getPromise(
    promiseHash: ActionHash
  ): Promise<EntryRecord<CallPromise> | undefined> {
    const record: Record = await this.callZome('get_promise', promiseHash);
    return record ? new EntryRecord(record) : undefined;
  }

  async getPromisesForCallToAction(
    callToActionHash: ActionHash
  ): Promise<Array<EntryRecord<CallPromise>>> {
    const records: Record[] = await this.callZome(
      'get_promises_for_call_to_action',
      callToActionHash
    );
    return records.map(r => new EntryRecord(r));
  }
  /** Satisfaction */

  async createSatisfaction(
    satisfaction: Satisfaction
  ): Promise<EntryRecord<Satisfaction>> {
    const record: Record = await this.callZome(
      'create_satisfaction',
      satisfaction
    );
    return new EntryRecord(record);
  }

  async getSatisfaction(
    satisfactionHash: ActionHash
  ): Promise<EntryRecord<Satisfaction> | undefined> {
    const record: Record = await this.callZome(
      'get_satisfaction',
      satisfactionHash
    );
    return record ? new EntryRecord(record) : undefined;
  }

  async updateSatisfaction(
    previousSatisfactionHash: ActionHash,
    updatedSatisfaction: Satisfaction
  ): Promise<EntryRecord<Satisfaction>> {
    const record: Record = await this.callZome('update_satisfaction', {
      previous_satisfaction_hash: previousSatisfactionHash,
      updated_satisfaction: updatedSatisfaction,
    });
    return new EntryRecord(record);
  }

  async getSatisfactionsForCallToAction(
    callToActionHash: ActionHash
  ): Promise<Array<EntryRecord<Satisfaction>>> {
    const records: Record[] = await this.callZome(
      'get_satisfactions_for_call_to_action',
      callToActionHash
    );
    return records.map(r => new EntryRecord(r));
  }

  async getSatisfactionsForPromise(
    promiseHash: ActionHash
  ): Promise<Array<EntryRecord<Satisfaction>>> {
    const records: Record[] = await this.callZome(
      'get_satisfactions_for_promise',
      promiseHash
    );
    return records.map(r => new EntryRecord(r));
  }
  /** Collective Commitment */

  async createAssembly(
    collectiveCommitment: Assembly
  ): Promise<EntryRecord<Assembly>> {
    const record: Record = await this.callZome(
      'create_assembly',
      collectiveCommitment
    );
    return new EntryRecord(record);
  }

  async getAssembly(
    collectiveCommitmentHash: ActionHash
  ): Promise<EntryRecord<Assembly> | undefined> {
    const record: Record = await this.callZome(
      'get_assembly',
      collectiveCommitmentHash
    );
    return record ? new EntryRecord(record) : undefined;
  }

  async getAssembliesForCallToAction(
    callToActionHash: ActionHash
  ): Promise<Array<EntryRecord<Assembly>>> {
    const records: Record[] = await this.callZome(
      'get_assemblies_for_call_to_action',
      callToActionHash
    );
    return records.map(r => new EntryRecord(r));
  }

  async getAssembliesForSatisfaction(
    satisfactionHash: ActionHash
  ): Promise<Array<EntryRecord<Assembly>>> {
    const records: Record[] = await this.callZome(
      'get_assemblies_for_satisfaction',
      satisfactionHash
    );
    return records.map(r => new EntryRecord(r));
  }

  /** All Calls To Action */

  async getAllCallsToAction(): Promise<Array<EntryRecord<CallToAction>>> {
    const records: Record[] = await this.callZome(
      'get_all_calls_to_action',
      null
    );
    return records.map(r => new EntryRecord(r));
  }

  /** All Collective Commitments */

  async getAllAssemblies(): Promise<
    Array<EntryRecord<Assembly>>
  > {
    const records: Record[] = await this.callZome(
      'get_all_assemblies',
      null
    );
    return records.map(r => new EntryRecord(r));
  }
}
