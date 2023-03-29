import { CollectiveCommitment } from './types.js';

import { Satisfaction } from './types.js';

import { Promise } from './types.js';

import { CallToAction } from './types.js';

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
  /** Call To Action */
  callToAction = new RecordBag<Call To Action>();
  callToActionsForCallToAction = new HoloHashMap<ActionHash, ActionHash[]>();

  async create_call_to_action(callToAction: CallToAction): Promise<Record> {
    const record = fakeRecord(fakeCreateAction(hash(callToAction, HashType.ENTRY)), fakeEntry(callToAction));
    
    this.callToAction.add([record]);
  
    if (callToAction.parent_call_to_action_hash) {
      const existingParentCallToActionHash = this.callToActionsForCallToAction.get(callToAction.parent_call_to_action_hash) || [];
      this.callToActionsForCallToAction.set(callToAction.parent_call_to_action_hash, [...existingParentCallToActionHash, record.signed_action.hashed.hash]);
    }

    return record;
  }
  
  async get_call_to_action(callToActionHash: ActionHash): Promise<Record | undefined> {
    const state = entryState(this.callToAction, callToActionHash);
    
    if (!state || state.deleted) return undefined;
    
    return state.lastUpdate?.record;
  }

  async delete_call_to_action(original_call_to_action_hash: ActionHash): Promise<ActionHash> {
    const record = fakeRecord(fakeDeleteEntry(original_call_to_action_hash));
    
    this.callToAction.add([record]);
    
    return record.signed_action.hashed.hash;
  }

  async update_call_to_action(input: { previous_call_to_action_hash: ActionHash; updated_call_to_action: CallToAction; }): Promise<Record> {
    const record = fakeRecord(fakeUpdateEntry(input.previous_call_to_action_hash, fakeEntry(input.updated_call_to_action)), fakeEntry(input.updated_call_to_action));
    
    this.callToAction.add([record]);
    
    const callToAction = input.updated_call_to_action;
    
    if (callToAction.parent_call_to_action_hash) {
      const existingParentCallToActionHash = this.callToActionsForCallToAction.get(callToAction.parent_call_to_action_hash) || [];
      this.callToActionsForCallToAction.set(callToAction.parent_call_to_action_hash, [...existingParentCallToActionHash, record.signed_action.hashed.hash]);
    }
    
    return record;
  }
  
  async get_call_to_actions_for_call_to_action(callToActionHash: ActionHash): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.callToActionsForCallToAction.get(callToActionHash) || [];
    
    return actionHashes.map(actionHash => this.callToAction.entryRecord(actionHash)?.record).filter(r => !!r) as Record[];
  }
  /** Promise */
  promise = new RecordBag<Promise>();
  promisesForCallToAction = new HoloHashMap<ActionHash, ActionHash[]>();

  async create_promise(promise: Promise): Promise<Record> {
    const record = fakeRecord(fakeCreateAction(hash(promise, HashType.ENTRY)), fakeEntry(promise));
    
    this.promise.add([record]);
  
    const existingCallToActionHash = this.promisesForCallToAction.get(promise.call_to_action_hash) || [];
    this.promisesForCallToAction.set(promise.call_to_action_hash, [...existingCallToActionHash, record.signed_action.hashed.hash]);

    return record;
  }
  
  async get_promise(promiseHash: ActionHash): Promise<Record | undefined> {
    const state = entryState(this.promise, promiseHash);
    
    if (!state || state.deleted) return undefined;
    
    return state.lastUpdate?.record;
  }


  
  async get_promises_for_call_to_action(callToActionHash: ActionHash): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.promisesForCallToAction.get(callToActionHash) || [];
    
    return actionHashes.map(actionHash => this.promise.entryRecord(actionHash)?.record).filter(r => !!r) as Record[];
  }
  /** Satisfaction */
  satisfaction = new RecordBag<Satisfaction>();
  satisfactionsForCallToAction = new HoloHashMap<ActionHash, ActionHash[]>();
  satisfactionsForPromise = new HoloHashMap<ActionHash, ActionHash[]>();

  async create_satisfaction(satisfaction: Satisfaction): Promise<Record> {
    const record = fakeRecord(fakeCreateAction(hash(satisfaction, HashType.ENTRY)), fakeEntry(satisfaction));
    
    this.satisfaction.add([record]);
  
    const existingCallToActionHash = this.satisfactionsForCallToAction.get(satisfaction.call_to_action_hash) || [];
    this.satisfactionsForCallToAction.set(satisfaction.call_to_action_hash, [...existingCallToActionHash, record.signed_action.hashed.hash]);
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
    
    const existingCallToActionHash = this.satisfactionsForCallToAction.get(satisfaction.call_to_action_hash) || [];
    this.satisfactionsForCallToAction.set(satisfaction.call_to_action_hash, [...existingCallToActionHash, record.signed_action.hashed.hash]);
    for (const promises_hashes of satisfaction.promises_hashes) {
      const existingPromisesHashes = this.satisfactionsForPromise.get(promises_hashes) || [];
      this.satisfactionsForPromise.set(promises_hashes, [...existingPromisesHashes, record.signed_action.hashed.hash]);
    }
    
    return record;
  }
  
  async get_satisfactions_for_call_to_action(callToActionHash: ActionHash): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.satisfactionsForCallToAction.get(callToActionHash) || [];
    
    return actionHashes.map(actionHash => this.satisfaction.entryRecord(actionHash)?.record).filter(r => !!r) as Record[];
  }

  async get_satisfactions_for_promise(promiseHash: ActionHash): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.satisfactionsForPromise.get(promiseHash) || [];
    
    return actionHashes.map(actionHash => this.satisfaction.entryRecord(actionHash)?.record).filter(r => !!r) as Record[];
  }
  /** Collective Commitment */
  collectiveCommitment = new RecordBag<Collective Commitment>();
  collectiveCommitmentsForCallToAction = new HoloHashMap<ActionHash, ActionHash[]>();
  collectiveCommitmentsForSatisfaction = new HoloHashMap<ActionHash, ActionHash[]>();

  async create_collective_commitment(collectiveCommitment: CollectiveCommitment): Promise<Record> {
    const record = fakeRecord(fakeCreateAction(hash(collectiveCommitment, HashType.ENTRY)), fakeEntry(collectiveCommitment));
    
    this.collectiveCommitment.add([record]);
  
    const existingCallToActionHash = this.collectiveCommitmentsForCallToAction.get(collectiveCommitment.call_to_action_hash) || [];
    this.collectiveCommitmentsForCallToAction.set(collectiveCommitment.call_to_action_hash, [...existingCallToActionHash, record.signed_action.hashed.hash]);
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


  
  async get_collective_commitments_for_call_to_action(callToActionHash: ActionHash): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.collectiveCommitmentsForCallToAction.get(callToActionHash) || [];
    
    return actionHashes.map(actionHash => this.collectiveCommitment.entryRecord(actionHash)?.record).filter(r => !!r) as Record[];
  }

  async get_collective_commitments_for_satisfaction(satisfactionHash: ActionHash): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.collectiveCommitmentsForSatisfaction.get(satisfactionHash) || [];
    
    return actionHashes.map(actionHash => this.collectiveCommitment.entryRecord(actionHash)?.record).filter(r => !!r) as Record[];
  }
  
  async get_all_calls_to_action(_: any): Promise<Array<Record>> {
    return this.callToAction.entryRecords.map(er => er?.record).filter(r => !!r) as Record[];   
  }
  
  async get_all_collective_commitments(_: any): Promise<Array<Record>> {
    return this.collectiveCommitment.entryRecords.map(er => er?.record).filter(r => !!r) as Record[];   
  }

}

export function sampleCallToAction(): CallToAction {
  return {
          parent_call_to_action_hash: undefined,
	  title: "Lorem ipsum 2",
	  custom_content: "Lorem ipsum 2",
	  needs: ["Lorem ipsum 2"],
    }
}


export function samplePromise(): Promise {
  return {
          call_to_action_hash: fakeActionHash(),
	  description: "Lorem ipsum 2",
	  need_index: 3,
    }
}


export function sampleSatisfaction(): Satisfaction {
  return {
          call_to_action_hash: fakeActionHash(),
	  need_index: 3,
          promises_hashes: [fakeActionHash()],
    }
}


export function sampleCollectiveCommitment(): CollectiveCommitment {
  return {
          call_to_action_hash: fakeActionHash(),
          satisfactions_hashes: [fakeActionHash()],
    }
}

