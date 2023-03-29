import {
  ActionHash,
  AgentPubKey,
  Create,
  CreateLink,
  Delete,
  DeleteLink,
  DnaHash,
  EntryHash,
  Record,
  SignedActionHashed,
  Update,
} from '@holochain/client';

export type AssembleSignal =
  | {
      type: 'EntryCreated';
      action: SignedActionHashed<Create>;
      app_entry: EntryTypes;
    }
  | {
      type: 'EntryUpdated';
      action: SignedActionHashed<Update>;
      app_entry: EntryTypes;
      original_app_entry: EntryTypes;
    }
  | {
      type: 'EntryDeleted';
      action: SignedActionHashed<Delete>;
      original_app_entry: EntryTypes;
    }
  | {
      type: 'LinkCreated';
      action: SignedActionHashed<CreateLink>;
      link_type: string;
    }
  | {
      type: 'LinkDeleted';
      action: SignedActionHashed<DeleteLink>;
      link_type: string;
    };

export type EntryTypes =
  | ({ type: 'CollectiveCommitment' } & CollectiveCommitment)
  | ({ type: 'Satisfaction' } & Satisfaction)
  | ({ type: 'Promise' } & CallPromise)
  | ({ type: 'CallToAction' } & CallToAction);

export interface CallToAction {
  parent_call_to_action_hash: ActionHash | undefined;

  title: string;

  custom_content: Uint8Array;

  needs: Array<string>;
}

export interface CallPromise {
  call_to_action_hash: ActionHash;

  description: string;

  need_index: number;
}

export interface Satisfaction {
  call_to_action_hash: ActionHash;

  need_index: number;

  promises_hashes: Array<ActionHash>;
}

export interface CollectiveCommitment {
  call_to_action_hash: ActionHash;

  satisfactions_hashes: Array<ActionHash>;
}
