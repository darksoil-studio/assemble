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
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@holochain-open-dev/elements/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { Call } from '../types.js';

/**
 * @element create-call
 * @fires call-created: detail will contain { callHash }
 */
@localized()
@customElement('create-call')
export class CreateCall extends LitElement {
  // REQUIRED. The parent call hash for this Call
  @property(hashProperty('parent-call-hash'))
  parentCallHash!: ActionHash;

  // REQUIRED. The custom content for this Call
  @property()
  customContent!: string;


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

  /**
   * @internal
   */
  @state()
  _needsFields = [0];

  async createCall(fields: any) {
    if (this.customContent === undefined) throw new Error('Cannot create a new Call without its custom_content field');
  
    const call: Call = {
      parent_call_hash: this.parentCallHash,
      title: fields.title,
      custom_content: this.customContent,
      needs: (Array.isArray(fields.needs) ? fields.needs : [fields.needs]).map((el: any) => el),
    };

    try {
      this.committing = true;
      const record: EntryRecord<Call> = await this.assembleStore.client.createCall(call);

      this.dispatchEvent(new CustomEvent('call-created', {
        composed: true,
        bubbles: true,
        detail: {
          callHash: record.actionHash
        }
      }));
      
      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg("Error creating the call"));
    }
    this.committing = false;
  }

  render() {
    return html`
      <sl-card style="flex: 1;">
        <span slot="header">${msg("Create Call")}</span>

        <form 
          id="create-form"
          style="display: flex; flex: 1; flex-direction: column;"
          ${onSubmit(fields => this.createCall(fields))}
        >  
          <div style="margin-bottom: 16px;">
          <sl-input name="title" .label=${msg("Title")}  required></sl-input>          </div>

          <div style="margin-bottom: 16px;">
          <div style="display: flex; flex-direction: column">
            <span>${msg("Needs")}</span>
          
            ${this._needsFields.map((index) => keyed(index, html`<div class="row" style="align-items: center; margin-top: 8px"><sl-input name="needs" .label=${msg("")} ></sl-input> <sl-icon-button .src=${wrapPathInSvg(mdiDelete)} @click=${() => { this._needsFields = this._needsFields.filter(i => i !== index) } }></sl-icon-button></div>`))}
            <sl-button @click=${() => { this._needsFields = [...this._needsFields, Math.max(...this._needsFields) + 1]; } }>${msg("Add Needs")}</sl-button>
          </div>          </div>


          <sl-button
            variant="primary"
            type="submit"
            .loading=${this.committing}
          >${msg("Create Call")}</sl-button>
        </form> 
      </sl-card>`;
  }
  
  static styles = [sharedStyles];
}
