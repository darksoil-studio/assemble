import { CollectiveCommitment } from './types.js';

import { Satisfaction } from './types.js';

import { Promise } from './types.js';

import { Call } from './types.js';

import {
  AgentPubKeyMap,
  decodeEntry,
  fakeEntry,
  fakeCreateAction,
  fakeUpdateEntry,
  fakeDeleteEntry,
  fakeRecord,
  fakeAgentPubKey,
  fakeDnaHash,
  fakeActionHash,
  fakeEntryHash,
  pickBy,
  ZomeMock,
  RecordBag,
  entryState,
  HoloHashMap,
  HashType,
  hash
} from "@holochain-open-dev/utils";
import {
  decodeHashFromBase64,
  AgentPubKey,
  ActionHash,
  EntryHash,
  AppAgentClient,
  Record,
} from "@holochain/client";

export class AssembleZomeMock extends ZomeMock implements AppAgentClient {
  constructor(
    myPubKey?: AgentPubKey
  ) {
    super("assemble_test", "assemble", myPubKey);
  }
  /** Call */
  call = new RecordBag<Call>();
  callsForCall = new HoloHashMap<ActionHash, ActionHash[]>();

  async create_call(call: Call): Promise<Record> {
    const record = fakeRecord(fakeCreateAction(hash(call, HashType.ENTRY)), fakeEntry(call));
    
    this.call.add([record]);
  
    if (call.parent_call_hash) {
      const existingParentCallHash = this.callsForCall.get(call.parent_call_hash) || [];
      this.callsForCall.set(call.parent_call_hash, [...existingParentCallHash, record.signed_action.hashed.hash]);
    }

    return record;
  }
  
  async get_call(callHash: ActionHash): Promise<Record | undefined> {
    const state = entryState(this.call, callHash);
    
    if (!state || state.deleted) return undefined;
    
    return state.lastUpdate?.record;
  }

  async delete_call(original_call_hash: ActionHash): Promise<ActionHash> {
    const record = fakeRecord(fakeDeleteEntry(original_call_hash));
    
    this.call.add([record]);
    
    return record.signed_action.hashed.hash;
  }

  async update_call(input: { previous_call_hash: ActionHash; updated_call: Call; }): Promise<Record> {
    const record = fakeRecord(fakeUpdateEntry(input.previous_call_hash, fakeEntry(input.updated_call)), fakeEntry(input.updated_call));
    
    this.call.add([record]);
    
    const call = input.updated_call;
    
    if (call.parent_call_hash) {
      const existingParentCallHash = this.callsForCall.get(call.parent_call_hash) || [];
      this.callsForCall.set(call.parent_call_hash, [...existingParentCallHash, record.signed_action.hashed.hash]);
    }
    
    return record;
  }
  
  async get_calls_for_call(callHash: ActionHash): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.callsForCall.get(callHash) || [];
    
    return actionHashes.map(actionHash => this.call.entryRecord(actionHash)?.record).filter(r => !!r) as Record[];
  }
  /** Promise */
  promise = new RecordBag<Promise>();
  promisesForCall = new HoloHashMap<ActionHash, ActionHash[]>();

  async create_promise(promise: Promise): Promise<Record> {
    const record = fakeRecord(fakeCreateAction(hash(promise, HashType.ENTRY)), fakeEntry(promise));
    
    this.promise.add([record]);
  
    const existingCallHash = this.promisesForCall.get(promise.call_hash) || [];
    this.promisesForCall.set(promise.call_hash, [...existingCallHash, record.signed_action.hashed.hash]);

    return record;
  }
  
  async get_promise(promiseHash: ActionHash): Promise<Record | undefined> {
    const state = entryState(this.promise, promiseHash);
    
    if (!state || state.deleted) return undefined;
    
    return state.lastUpdate?.record;
  }


  
  async get_promises_for_call(callHash: ActionHash): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.promisesForCall.get(callHash) || [];
    
    return actionHashes.map(actionHash => this.promise.entryRecord(actionHash)?.record).filter(r => !!r) as Record[];
  }
  /** Satisfaction */
  satisfaction = new RecordBag<Satisfaction>();
  satisfactionsForCall = new HoloHashMap<ActionHash, ActionHash[]>();
  satisfactionsForPromise = new HoloHashMap<ActionHash, ActionHash[]>();

  async create_satisfaction(satisfaction: Satisfaction): Promise<Record> {
    const record = fakeRecord(fakeCreateAction(hash(satisfaction, HashType.ENTRY)), fakeEntry(satisfaction));
    
    this.satisfaction.add([record]);
  
    const existingCallHash = this.satisfactionsForCall.get(satisfaction.call_hash) || [];
    this.satisfactionsForCall.set(satisfaction.call_hash, [...existingCallHash, record.signed_action.hashed.hash]);
    for (const promises_hashes of satisfaction.promises_hashes) {
      const existingPromisesHashes = this.satisfactionsForPromise.get(promises_hashes) || [];
      this.satisfactionsForPromise.set(promises_hashes, [...existingPromisesHashes, record.signed_action.hashed.hash]);
    }

    return record;
  }
  
  async get_satisfaction(satisfactionHash: ActionHash): Promise<Record | undefined> {
    const state = entryState(this.satisfaction, satisfactionHash);
    
    if (!state || state.deleted) return undefined;
    
    return state.lastUpdate?.record;
  }


  async update_satisfaction(input: { previous_satisfaction_hash: ActionHash; updated_satisfaction: Satisfaction; }): Promise<Record> {
    const record = fakeRecord(fakeUpdateEntry(input.previous_satisfaction_hash, fakeEntry(input.updated_satisfaction)), fakeEntry(input.updated_satisfaction));
    
    this.satisfaction.add([record]);
    
    const satisfaction = input.updated_satisfaction;
    
    const existingCallHash = this.satisfactionsForCall.get(satisfaction.call_hash) || [];
    this.satisfactionsForCall.set(satisfaction.call_hash, [...existingCallHash, record.signed_action.hashed.hash]);
    for (const promises_hashes of satisfaction.promises_hashes) {
      const existingPromisesHashes = this.satisfactionsForPromise.get(promises_hashes) || [];
      this.satisfactionsForPromise.set(promises_hashes, [...existingPromisesHashes, record.signed_action.hashed.hash]);
    }
    
    return record;
  }
  
  async get_satisfactions_for_call(callHash: ActionHash): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.satisfactionsForCall.get(callHash) || [];
    
    return actionHashes.map(actionHash => this.satisfaction.entryRecord(actionHash)?.record).filter(r => !!r) as Record[];
  }

  async get_satisfactions_for_promise(promiseHash: ActionHash): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.satisfactionsForPromise.get(promiseHash) || [];
    
    return actionHashes.map(actionHash => this.satisfaction.entryRecord(actionHash)?.record).filter(r => !!r) as Record[];
  }
  /** Collective Commitment */
  collectiveCommitment = new RecordBag<Collective Commitment>();
  collectiveCommitmentsForCall = new HoloHashMap<ActionHash, ActionHash[]>();
  collectiveCommitmentsForSatisfaction = new HoloHashMap<ActionHash, ActionHash[]>();

  async create_collective_commitment(collectiveCommitment: CollectiveCommitment): Promise<Record> {
    const record = fakeRecord(fakeCreateAction(hash(collectiveCommitment, HashType.ENTRY)), fakeEntry(collectiveCommitment));
    
    this.collectiveCommitment.add([record]);
  
    const existingCallHash = this.collectiveCommitmentsForCall.get(collectiveCommitment.call_hash) || [];
    this.collectiveCommitmentsForCall.set(collectiveCommitment.call_hash, [...existingCallHash, record.signed_action.hashed.hash]);
    for (const satisfactions_hashes of collectiveCommitment.satisfactions_hashes) {
      const existingSatisfactionsHashes = this.collectiveCommitmentsForSatisfaction.get(satisfactions_hashes) || [];
      this.collectiveCommitmentsForSatisfaction.set(satisfactions_hashes, [...existingSatisfactionsHashes, record.signed_action.hashed.hash]);
    }

    return record;
  }
  
  async get_collective_commitment(collectiveCommitmentHash: ActionHash): Promise<Record | undefined> {
    const state = entryState(this.collectiveCommitment, collectiveCommitmentHash);
    
    if (!state || state.deleted) return undefined;
    
    return state.lastUpdate?.record;
  }


  
  async get_collective_commitments_for_call(callHash: ActionHash): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.collectiveCommitmentsForCall.get(callHash) || [];
    
    return actionHashes.map(actionHash => this.collectiveCommitment.entryRecord(actionHash)?.record).filter(r => !!r) as Record[];
  }

  async get_collective_commitments_for_satisfaction(satisfactionHash: ActionHash): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.collectiveCommitmentsForSatisfaction.get(satisfactionHash) || [];
    
    return actionHashes.map(actionHash => this.collectiveCommitment.entryRecord(actionHash)?.record).filter(r => !!r) as Record[];
  }


}

export function sampleCall(): Call {
  return {
          parent_call_hash: undefined,
	  title: "Lorem ipsum 2",
	  custom_content: "Lorem ipsum 2",
	  needs: ["Lorem ipsum 2"],
    }
}


export function samplePromise(): Promise {
  return {
          call_hash: fakeActionHash(),
	  need_index: 3,
	  description: "Lorem ipsum 2",
    }
}


export function sampleSatisfaction(): Satisfaction {
  return {
          call_hash: fakeActionHash(),
	  need_index: 3,
          promises_hashes: [fakeActionHash()],
    }
}


export function sampleCollectiveCommitment(): CollectiveCommitment {
  return {
          call_hash: fakeActionHash(),
          satisfactions_hashes: [fakeActionHash()],
    }
}

