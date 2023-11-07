import { ActionCommittedSignal } from '@holochain-open-dev/utils';
import { ActionHash, AgentPubKey } from '@holochain/client';

export type AssembleSignal = ActionCommittedSignal<EntryTypes, any>;

export type EntryTypes =
  | ({ type: 'Assembly' } & Assembly)
  | ({ type: 'Satisfaction' } & Satisfaction)
  | ({ type: 'Commitment' } & Commitment)
  | ({ type: 'CallToAction' } & CallToAction);

export interface CallToAction {
  admins: AgentPubKey[];
  parent_call_to_action_hash: ActionHash | undefined;
  expiration_time: number | undefined;
  needs: Array<Need>;
}

export interface Need {
  min_necessary: number;
  max_possible: number | undefined;
  description: string;
  requires_admin_approval: boolean;
}

export interface Commitment {
  call_to_action_hash: ActionHash;

  need_index: number;

  comment: string;
  amount: number;
}

export interface Satisfaction {
  call_to_action_hash: ActionHash;

  need_index: number;

  commitments_hashes: Array<ActionHash>;
}

export interface Assembly {
  call_to_action_hash: ActionHash;

  satisfactions_hashes: Array<ActionHash>;
}
