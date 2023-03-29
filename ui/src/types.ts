import { 
  Record, 
  ActionHash, 
  DnaHash,
  SignedActionHashed,
  EntryHash, 
  AgentPubKey,
  Create,
  Update,
  Delete,
  CreateLink,
  DeleteLink
} from '@holochain/client';

export type AssembleSignal = {
  type: 'EntryCreated';
  action: SignedActionHashed<Create>;
  app_entry: EntryTypes;
} | {
  type: 'EntryUpdated';
  action: SignedActionHashed<Update>;
  app_entry: EntryTypes;
  original_app_entry: EntryTypes;
} | {
  type: 'EntryDeleted';
  action: SignedActionHashed<Delete>;
  original_app_entry: EntryTypes;
} | {
  type: 'LinkCreated';
  action: SignedActionHashed<CreateLink>;
  link_type: string;
} | {
  type: 'LinkDeleted';
  action: SignedActionHashed<DeleteLink>;
  link_type: string;
};

export type EntryTypes =
 | ({ type: 'CollectiveCommitment'; } & CollectiveCommitment)
 | ({ type: 'Satisfaction'; } & Satisfaction)
 | ({ type: 'Promise'; } & Promise)
 | ({  type: 'Call'; } & Call);



export interface Call { 
  parent_call_hash: ActionHash | undefined;

  title: string;

  custom_content: string;

  needs: Array<string>;
}




export interface Promise { 
  call_hash: ActionHash;

  need_index: number;

  description: string;
}




export interface Satisfaction { 
  call_hash: ActionHash;

  need_index: number;

  promises_hashes: Array<ActionHash>;
}




export interface CollectiveCommitment { 
  call_hash: ActionHash;

  satisfactions_hashes: Array<ActionHash>;
}

