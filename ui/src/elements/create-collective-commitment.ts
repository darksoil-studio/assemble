import { LitElement, html } from 'lit';
import { keyed } from "lit/directives/keyed.js";
import { state, property, query, customElement } from 'lit/decorators.js';
import { ActionHash, Record, DnaHash, AgentPubKey, EntryHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { hashProperty, notifyError, hashState, sharedStyles, onSubmit, wrapPathInSvg } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from "@mdi/js";

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@holochain-open-dev/elements/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CollectiveCommitment } from '../types.js';

/**
 * @element create-collective-commitment
 * @fires collective-commitment-created: detail will contain { collectiveCommitmentHash }
 */
@localized()
@customElement('create-collective-commitment')
export class CreateCollectiveCommitment extends LitElement {
  // REQUIRED. The call hash for this CollectiveCommitment
  @property(hashProperty('call-hash'))
  callHash!: ActionHash;

  // REQUIRED. The satisfactions hashes for this CollectiveCommitment
  @property()
  satisfactionsHashes!: Array<ActionHash>;


  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  @state()
  committing = false;

  /**
   * @internal
   */
  @query('#create-form')
  form!: HTMLFormElement;


  async createCollectiveCommitment(fields: any) {
    if (this.callHash === undefined) throw new Error('Cannot create a new Collective Commitment without its call_hash field');
    if (this.satisfactionsHashes === undefined) throw new Error('Cannot create a new Collective Commitment without its satisfactions_hashes field');
  
    const collectiveCommitment: CollectiveCommitment = {
      call_hash: this.callHash,
      satisfactions_hashes: this.satisfactionsHashes,
    };

    try {
      this.committing = true;
      const record: EntryRecord<CollectiveCommitment> = await this.assembleStore.client.createCollectiveCommitment(collectiveCommitment);

      this.dispatchEvent(new CustomEvent('collective-commitment-created', {
        composed: true,
        bubbles: true,
        detail: {
          collectiveCommitmentHash: record.actionHash
        }
      }));
      
      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg("Error creating the collective commitment"));
    }
    this.committing = false;
  }

  render() {
    return html`
      <sl-card style="flex: 1;">
        <span slot="header">${msg("Create Collective Commitment")}</span>

        <form 
          id="create-form"
          style="display: flex; flex: 1; flex-direction: column;"
          ${onSubmit(fields => this.createCollectiveCommitment(fields))}
        >  

          <sl-button
            variant="primary"
            type="submit"
            .loading=${this.committing}
          >${msg("Create Collective Commitment")}</sl-button>
        </form> 
      </sl-card>`;
  }
  
  static styles = [sharedStyles];
}
