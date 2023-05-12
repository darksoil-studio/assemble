import { EntryRecord, ZomeClient } from '@holochain-open-dev/utils';
import { ActionHash, AppAgentClient, Record } from '@holochain/client';

import { Assembly } from './types';
import { Satisfaction } from './types';
import { Commitment } from './types';
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
  /** Commitment */

  async createCommitment(
    commitment: Commitment
  ): Promise<EntryRecord<Commitment>> {
    const record: Record = await this.callZome('create_commitment', commitment);
    return new EntryRecord(record);
  }

  async getCommitment(
    commitmentHash: ActionHash
  ): Promise<EntryRecord<Commitment> | undefined> {
    const record: Record = await this.callZome(
      'get_commitment',
      commitmentHash
    );
    return record ? new EntryRecord(record) : undefined;
  }

  async getCommitmentsForCallToAction(
    callToActionHash: ActionHash
  ): Promise<Array<EntryRecord<Commitment>>> {
    const records: Record[] = await this.callZome(
      'get_commitments_for_call_to_action',
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

  async getSatisfactionsForCommitment(
    commitmentHash: ActionHash
  ): Promise<Array<EntryRecord<Satisfaction>>> {
    const records: Record[] = await this.callZome(
      'get_satisfactions_for_commitment',
      commitmentHash
    );
    return records.map(r => new EntryRecord(r));
  }
  /** Assembly */

  async createAssembly(assembly: Assembly): Promise<EntryRecord<Assembly>> {
    const record: Record = await this.callZome('create_assembly', assembly);
    return new EntryRecord(record);
  }

  async getAssembly(
    assemblyHash: ActionHash
  ): Promise<EntryRecord<Assembly> | undefined> {
    const record: Record = await this.callZome('get_assembly', assemblyHash);
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

  async getOpenCallsToAction(): Promise<Array<ActionHash>> {
    return this.callZome('get_open_calls_to_action', null);
  }

  closeCallToAction(callToActionHash: ActionHash): Promise<void> {
    return this.callZome('close_call_to_action', callToActionHash);
  }

  /** All Assemblies */

  async getAllAssemblies(): Promise<Array<EntryRecord<Assembly>>> {
    const records: Record[] = await this.callZome('get_all_assemblies', null);
    return records.map(r => new EntryRecord(r));
  }

  /** My Calls To Action */

  async getMyCallsToAction(): Promise<Array<ActionHash>> {
    return this.callZome('get_my_calls_to_action', null);
  }

  async clearCallsToAction(
    callsToActionHashes: Array<ActionHash>
  ): Promise<void> {
    return this.callZome('clear_calls_to_action', callsToActionHashes);
  }
}
