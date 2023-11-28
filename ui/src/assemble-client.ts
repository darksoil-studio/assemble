import { EntryRecord, ZomeClient } from '@holochain-open-dev/utils';
import {
  ActionHash,
  AppAgentClient,
  Delete,
  Link,
  Record,
  SignedActionHashed,
} from '@holochain/client';

import {
  AssembleSignal,
  Assembly,
  CallToAction,
  Commitment,
  Satisfaction,
} from './types.js';

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

  async getLatestCallToAction(
    callToActionHash: ActionHash
  ): Promise<EntryRecord<CallToAction> | undefined> {
    const record: Record = await this.callZome(
      'get_latest_call_to_action',
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
  ): Promise<Array<Link>> {
    return this.callZome(
      'get_call_to_actions_for_call_to_action',
      callToActionHash
    );
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
  ): Promise<Array<Link>> {
    return this.callZome(
      'get_commitments_for_call_to_action',
      callToActionHash
    );
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

  async getLatestSatisfaction(
    satisfactionHash: ActionHash
  ): Promise<EntryRecord<Satisfaction>> {
    const record: Record = await this.callZome(
      'get_latest_satisfaction',
      satisfactionHash
    );
    return new EntryRecord(record);
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
  ): Promise<Array<Link>> {
    return this.callZome(
      'get_satisfactions_for_call_to_action',
      callToActionHash
    );
  }

  async getSatisfactionsForCommitment(
    commitmentHash: ActionHash
  ): Promise<Array<Link>> {
    return this.callZome('get_satisfactions_for_commitment', commitmentHash);
  }

  deleteSatisfaction(satisfactionHash: ActionHash): Promise<ActionHash> {
    return this.callZome('delete_satisfaction', satisfactionHash);
  }

  getSatisfactionDeletes(
    satisfactionHash: ActionHash
  ): Promise<Array<SignedActionHashed<Delete>>> {
    return this.callZome('get_satisfaction_deletes', satisfactionHash);
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
  ): Promise<Array<Link>> {
    return this.callZome('get_assemblies_for_call_to_action', callToActionHash);
  }

  async getAssembliesForSatisfaction(
    satisfactionHash: ActionHash
  ): Promise<Array<Link>> {
    return this.callZome('get_assemblies_for_satisfaction', satisfactionHash);
  }
}
