import {
  AgentPubKeyMap,
  HashType,
  HoloHashMap,
  RecordBag,
  ZomeMock,
  decodeEntry,
  entryState,
  fakeActionHash,
  fakeAgentPubKey,
  fakeCreateAction,
  fakeDeleteEntry,
  fakeDnaHash,
  fakeEntry,
  fakeEntryHash,
  fakeRecord,
  fakeUpdateEntry,
  hash,
  pickBy,
} from '@holochain-open-dev/utils';
import {
  ActionHash,
  AgentPubKey,
  AppAgentClient,
  EntryHash,
  Record,
  decodeHashFromBase64,
} from '@holochain/client';
import { encode } from '@msgpack/msgpack';

import { Assembly } from './types.js';
import { Satisfaction } from './types.js';
import { Commitment } from './types.js';
import { CallToAction } from './types.js';

export class AssembleZomeMock extends ZomeMock implements AppAgentClient {
  constructor(myPubKey?: AgentPubKey) {
    super('assemble_test', 'assemble', myPubKey);
  }

  /** Call To Action */
  callToAction = new RecordBag<CallToAction>();

  callToActionsForCallToAction = new HoloHashMap<ActionHash, ActionHash[]>();

  async create_call_to_action(callToAction: CallToAction): Promise<Record> {
    const record = fakeRecord(
      fakeCreateAction(hash(callToAction, HashType.ENTRY)),
      fakeEntry(callToAction)
    );

    this.callToAction.add([record]);

    if (callToAction.parent_call_to_action_hash) {
      const existingParentCallToActionHash =
        this.callToActionsForCallToAction.get(
          callToAction.parent_call_to_action_hash
        ) || [];
      this.callToActionsForCallToAction.set(
        callToAction.parent_call_to_action_hash,
        [...existingParentCallToActionHash, record.signed_action.hashed.hash]
      );
    }

    return record;
  }

  async get_call_to_action(
    callToActionHash: ActionHash
  ): Promise<Record | undefined> {
    const state = entryState(this.callToAction, callToActionHash);

    if (!state || state.deleted) return undefined;

    return state.lastUpdate?.record;
  }

  async delete_call_to_action(
    original_call_to_action_hash: ActionHash
  ): Promise<ActionHash> {
    const record = fakeRecord(fakeDeleteEntry(original_call_to_action_hash));

    this.callToAction.add([record]);

    return record.signed_action.hashed.hash;
  }

  async update_call_to_action(input: {
    previous_call_to_action_hash: ActionHash;
    updated_call_to_action: CallToAction;
  }): Promise<Record> {
    const record = fakeRecord(
      fakeUpdateEntry(
        input.previous_call_to_action_hash,
        fakeEntry(input.updated_call_to_action)
      ),
      fakeEntry(input.updated_call_to_action)
    );

    this.callToAction.add([record]);

    const callToAction = input.updated_call_to_action;

    if (callToAction.parent_call_to_action_hash) {
      const existingParentCallToActionHash =
        this.callToActionsForCallToAction.get(
          callToAction.parent_call_to_action_hash
        ) || [];
      this.callToActionsForCallToAction.set(
        callToAction.parent_call_to_action_hash,
        [...existingParentCallToActionHash, record.signed_action.hashed.hash]
      );
    }

    return record;
  }

  async get_call_to_actions_for_call_to_action(
    callToActionHash: ActionHash
  ): Promise<Array<Record>> {
    const actionHashes: ActionHash[] =
      this.callToActionsForCallToAction.get(callToActionHash) || [];

    return actionHashes
      .map(actionHash => this.callToAction.entryRecord(actionHash)?.record)
      .filter(r => !!r) as Record[];
  }

  /** Promise */
  commitment = new RecordBag<Commitment>();

  commitmentsForCallToAction = new HoloHashMap<ActionHash, ActionHash[]>();

  async create_commitment(commitment: Commitment): Promise<Record> {
    const record = fakeRecord(
      fakeCreateAction(hash(commitment, HashType.ENTRY)),
      fakeEntry(commitment)
    );

    this.commitment.add([record]);

    const existingCallToActionHash =
      this.commitmentsForCallToAction.get(commitment.call_to_action_hash) || [];
    this.commitmentsForCallToAction.set(commitment.call_to_action_hash, [
      ...existingCallToActionHash,
      record.signed_action.hashed.hash,
    ]);

    return record;
  }

  async get_commitment(
    commitmentHash: ActionHash
  ): Promise<Record | undefined> {
    const state = entryState(this.commitment, commitmentHash);

    if (!state || state.deleted) return undefined;

    return state.lastUpdate?.record;
  }

  async get_commitments_for_call_to_action(
    callToActionHash: ActionHash
  ): Promise<Array<Record>> {
    const actionHashes: ActionHash[] =
      this.commitmentsForCallToAction.get(callToActionHash) || [];

    return actionHashes
      .map(actionHash => this.commitment.entryRecord(actionHash)?.record)
      .filter(r => !!r) as Record[];
  }

  /** Satisfaction */
  satisfaction = new RecordBag<Satisfaction>();

  satisfactionsForCallToAction = new HoloHashMap<ActionHash, ActionHash[]>();

  satisfactionsForCommitment = new HoloHashMap<ActionHash, ActionHash[]>();

  async create_satisfaction(satisfaction: Satisfaction): Promise<Record> {
    const record = fakeRecord(
      fakeCreateAction(hash(satisfaction, HashType.ENTRY)),
      fakeEntry(satisfaction)
    );

    this.satisfaction.add([record]);

    const existingCallToActionHash =
      this.satisfactionsForCallToAction.get(satisfaction.call_to_action_hash) ||
      [];
    this.satisfactionsForCallToAction.set(satisfaction.call_to_action_hash, [
      ...existingCallToActionHash,
      record.signed_action.hashed.hash,
    ]);
    for (const commitments_hashes of satisfaction.commitments_hashes) {
      const existingPromisesHashes =
        this.satisfactionsForCommitment.get(commitments_hashes) || [];
      this.satisfactionsForCommitment.set(commitments_hashes, [
        ...existingPromisesHashes,
        record.signed_action.hashed.hash,
      ]);
    }

    return record;
  }

  async get_satisfaction(
    satisfactionHash: ActionHash
  ): Promise<Record | undefined> {
    const state = entryState(this.satisfaction, satisfactionHash);

    if (!state || state.deleted) return undefined;

    return state.lastUpdate?.record;
  }

  async update_satisfaction(input: {
    previous_satisfaction_hash: ActionHash;
    updated_satisfaction: Satisfaction;
  }): Promise<Record> {
    const record = fakeRecord(
      fakeUpdateEntry(
        input.previous_satisfaction_hash,
        fakeEntry(input.updated_satisfaction)
      ),
      fakeEntry(input.updated_satisfaction)
    );

    this.satisfaction.add([record]);

    const satisfaction = input.updated_satisfaction;

    const existingCallToActionHash =
      this.satisfactionsForCallToAction.get(satisfaction.call_to_action_hash) ||
      [];
    this.satisfactionsForCallToAction.set(satisfaction.call_to_action_hash, [
      ...existingCallToActionHash,
      record.signed_action.hashed.hash,
    ]);
    for (const commitments_hashes of satisfaction.commitments_hashes) {
      const existingPromisesHashes =
        this.satisfactionsForCommitment.get(commitments_hashes) || [];
      this.satisfactionsForCommitment.set(commitments_hashes, [
        ...existingPromisesHashes,
        record.signed_action.hashed.hash,
      ]);
    }

    return record;
  }

  async get_satisfactions_for_call_to_action(
    callToActionHash: ActionHash
  ): Promise<Array<Record>> {
    const actionHashes: ActionHash[] =
      this.satisfactionsForCallToAction.get(callToActionHash) || [];

    return actionHashes
      .map(actionHash => this.satisfaction.entryRecord(actionHash)?.record)
      .filter(r => !!r) as Record[];
  }

  async get_satisfactions_for_commitment(
    commitmentHash: ActionHash
  ): Promise<Array<Record>> {
    const actionHashes: ActionHash[] =
      this.satisfactionsForCommitment.get(commitmentHash) || [];

    return actionHashes
      .map(actionHash => this.satisfaction.entryRecord(actionHash)?.record)
      .filter(r => !!r) as Record[];
  }

  /** Assembly */
  assembly = new RecordBag<Assembly>();

  assembliesForCallToAction = new HoloHashMap<ActionHash, ActionHash[]>();

  assembliesForSatisfaction = new HoloHashMap<ActionHash, ActionHash[]>();

  async create_assembly(assembly: Assembly): Promise<Record> {
    const record = fakeRecord(
      fakeCreateAction(hash(assembly, HashType.ENTRY)),
      fakeEntry(assembly)
    );

    this.assembly.add([record]);

    const existingCallToActionHash =
      this.assembliesForCallToAction.get(assembly.call_to_action_hash) || [];
    this.assembliesForCallToAction.set(assembly.call_to_action_hash, [
      ...existingCallToActionHash,
      record.signed_action.hashed.hash,
    ]);
    for (const satisfactions_hashes of assembly.satisfactions_hashes) {
      const existingSatisfactionsHashes =
        this.assembliesForSatisfaction.get(satisfactions_hashes) || [];
      this.assembliesForSatisfaction.set(satisfactions_hashes, [
        ...existingSatisfactionsHashes,
        record.signed_action.hashed.hash,
      ]);
    }

    return record;
  }

  async get_assembly(assemblyHash: ActionHash): Promise<Record | undefined> {
    const state = entryState(this.assembly, assemblyHash);

    if (!state || state.deleted) return undefined;

    return state.lastUpdate?.record;
  }

  async get_assemblies_for_call_to_action(
    callToActionHash: ActionHash
  ): Promise<Array<Record>> {
    const actionHashes: ActionHash[] =
      this.assembliesForCallToAction.get(callToActionHash) || [];

    return actionHashes
      .map(actionHash => this.assembly.entryRecord(actionHash)?.record)
      .filter(r => !!r) as Record[];
  }

  async get_assemblies_for_satisfaction(
    satisfactionHash: ActionHash
  ): Promise<Array<Record>> {
    const actionHashes: ActionHash[] =
      this.assembliesForSatisfaction.get(satisfactionHash) || [];

    return actionHashes
      .map(actionHash => this.assembly.entryRecord(actionHash)?.record)
      .filter(r => !!r) as Record[];
  }

  async get_open_calls_to_action(_: any): Promise<Array<Record>> {
    return this.callToAction.entryRecords
      .map(er => er?.record)
      .filter(r => !!r) as Record[];
  }

  async get_all_assemblies(_: any): Promise<Array<Record>> {
    return this.assembly.entryRecords
      .map(er => er?.record)
      .filter(r => !!r) as Record[];
  }
  
  async get_my_calls_to_action(author: AgentPubKey): Promise<Array<Record>> {
    const actionHashes: ActionHash[] = this.callToAction.authorMap.get(author);
    return actionHashes.map(actionHash => this.callToAction.entryRecord(actionHash)).map(er => er?.record).filter(r => !!r) as Record[];
  }


}

export function sampleCallToAction(): CallToAction {
  return {
    parent_call_to_action_hash: undefined,
    expiration_time: undefined,
    custom_content: encode({}),
    needs: [
      {
        description: 'Lorem ipsum 2',
        min_necessary: 1,
        max_possible: 5,
      },
    ],
  };
}

export function sampleCommitment(): Commitment {
  return {
    call_to_action_hash: fakeActionHash(),
    comment: 'Lorem ipsum 2',
    need_index: 3,
    amount: 1,
  };
}

export function sampleSatisfaction(): Satisfaction {
  return {
    call_to_action_hash: fakeActionHash(),
    need_index: 3,
    commitments_hashes: [fakeActionHash()],
  };
}

export function sampleAssembly(): Assembly {
  return {
    call_to_action_hash: fakeActionHash(),
    satisfactions_hashes: [fakeActionHash()],
  };
}
