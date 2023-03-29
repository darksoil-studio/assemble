import { CollectiveCommitment } from './types';

import { Satisfaction } from './types';

import { Promise } from './types';

import { Call } from './types';

import { 
  AppAgentClient, 
  Record, 
  ActionHash, 
  EntryHash, 
  AgentPubKey,
} from '@holochain/client';
import { isSignalFromCellWithRole, EntryRecord, ZomeClient } from '@holochain-open-dev/utils';

import { AssembleSignal } from './types';

export class AssembleClient extends ZomeClient<AssembleSignal> {
  constructor(public client: AppAgentClient, public roleName: string, public zomeName = 'assemble') {
    super(client, roleName, zomeName);
  }
  /** Call */

  async createCall(call: Call): Promise<EntryRecord<Call>> {
    const record: Record = await this.callZome('create_call', call);
    return new EntryRecord(record);
  }
  
  async getCall(callHash: ActionHash): Promise<EntryRecord<Call> | undefined> {
    const record: Record = await this.callZome('get_call', callHash);
    return record ? new EntryRecord(record) : undefined;
  }

  deleteCall(originalCallHash: ActionHash): Promise<ActionHash> {
    return this.callZome('delete_call', originalCallHash);
  }

  async updateCall(previousCallHash: ActionHash, updatedCall: Call): Promise<EntryRecord<Call>> {
    const record: Record = await this.callZome('update_call', {
      previous_call_hash: previousCallHash,
      updated_call: updatedCall
    });
    return new EntryRecord(record);
  }
  
  async getCallsForCall(callHash: ActionHash): Promise<Array<EntryRecord<Call>>> {
    const records: Record[] = await this.callZome('get_calls_for_call', callHash);
    return records.map(r => new EntryRecord(r));
  }
  /** Promise */

  async createPromise(promise: Promise): Promise<EntryRecord<Promise>> {
    const record: Record = await this.callZome('create_promise', promise);
    return new EntryRecord(record);
  }
  
  async getPromise(promiseHash: ActionHash): Promise<EntryRecord<Promise> | undefined> {
    const record: Record = await this.callZome('get_promise', promiseHash);
    return record ? new EntryRecord(record) : undefined;
  }


  
  async getPromisesForCall(callHash: ActionHash): Promise<Array<EntryRecord<Promise>>> {
    const records: Record[] = await this.callZome('get_promises_for_call', callHash);
    return records.map(r => new EntryRecord(r));
  }
  /** Satisfaction */

  async createSatisfaction(satisfaction: Satisfaction): Promise<EntryRecord<Satisfaction>> {
    const record: Record = await this.callZome('create_satisfaction', satisfaction);
    return new EntryRecord(record);
  }
  
  async getSatisfaction(satisfactionHash: ActionHash): Promise<EntryRecord<Satisfaction> | undefined> {
    const record: Record = await this.callZome('get_satisfaction', satisfactionHash);
    return record ? new EntryRecord(record) : undefined;
  }


  async updateSatisfaction(previousSatisfactionHash: ActionHash, updatedSatisfaction: Satisfaction): Promise<EntryRecord<Satisfaction>> {
    const record: Record = await this.callZome('update_satisfaction', {
      previous_satisfaction_hash: previousSatisfactionHash,
      updated_satisfaction: updatedSatisfaction
    });
    return new EntryRecord(record);
  }
  
  async getSatisfactionsForCall(callHash: ActionHash): Promise<Array<EntryRecord<Satisfaction>>> {
    const records: Record[] = await this.callZome('get_satisfactions_for_call', callHash);
    return records.map(r => new EntryRecord(r));
  }

  async getSatisfactionsForPromise(promiseHash: ActionHash): Promise<Array<EntryRecord<Satisfaction>>> {
    const records: Record[] = await this.callZome('get_satisfactions_for_promise', promiseHash);
    return records.map(r => new EntryRecord(r));
  }
  /** Collective Commitment */

  async createCollectiveCommitment(collectiveCommitment: CollectiveCommitment): Promise<EntryRecord<CollectiveCommitment>> {
    const record: Record = await this.callZome('create_collective_commitment', collectiveCommitment);
    return new EntryRecord(record);
  }
  
  async getCollectiveCommitment(collectiveCommitmentHash: ActionHash): Promise<EntryRecord<CollectiveCommitment> | undefined> {
    const record: Record = await this.callZome('get_collective_commitment', collectiveCommitmentHash);
    return record ? new EntryRecord(record) : undefined;
  }


  
  async getCollectiveCommitmentsForCall(callHash: ActionHash): Promise<Array<EntryRecord<CollectiveCommitment>>> {
    const records: Record[] = await this.callZome('get_collective_commitments_for_call', callHash);
    return records.map(r => new EntryRecord(r));
  }

  async getCollectiveCommitmentsForSatisfaction(satisfactionHash: ActionHash): Promise<Array<EntryRecord<CollectiveCommitment>>> {
    const records: Record[] = await this.callZome('get_collective_commitments_for_satisfaction', satisfactionHash);
    return records.map(r => new EntryRecord(r));
  }


}
