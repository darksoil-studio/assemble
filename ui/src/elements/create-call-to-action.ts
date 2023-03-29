import { LitElement, html } from 'lit';
import { keyed } from "lit/directives/keyed.js";
import { state, property, query, customElement } from 'lit/decorators.js';
import { ActionHash, Record, DnaHash, AgentPubKey, EntryHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { hashProperty, notifyError, hashState, sharedStyles, onSubmit, wrapPathInSvg } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from "@mdi/js";

import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@holochain-open-dev/elements/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CallToAction } from '../types.js';

/**
 * @element create-call-to-action
 * @fires call-to-action-created: detail will contain { callToActionHash }
 */
@localized()
@customElement('create-call-to-action')
export class CreateCallToAction extends LitElement {
  // REQUIRED. The parent call to action hash for this CallToAction
  @property(hashProperty('parent-call-to-action-hash'))
  parentCallToActionHash!: ActionHash;

  // REQUIRED. The custom content for this CallToAction
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

  async createCallToAction(fields: any) {
    if (this.customContent === undefined) throw new Error('Cannot create a new Call To Action without its custom_content field');
  
    const callToAction: CallToAction = {
      parent_call_to_action_hash: this.parentCallToActionHash,
      title: fields.title,
      custom_content: this.customContent,
      needs: (Array.isArray(fields.needs) ? fields.needs : [fields.needs]).map((el: any) => el),
    };

    try {
      this.committing = true;
      const record: EntryRecord<CallToAction> = await this.assembleStore.client.createCallToAction(callToAction);

      this.dispatchEvent(new CustomEvent('call-to-action-created', {
        composed: true,
        bubbles: true,
        detail: {
          callToActionHash: record.actionHash
        }
      }));
      
      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg("Error creating the call to action"));
    }
    this.committing = false;
  }

  render() {
    return html`
      <sl-card style="flex: 1;">
        <span slot="header">${msg("Create Call To Action")}</span>

        <form 
          id="create-form"
          style="display: flex; flex: 1; flex-direction: column;"
          ${onSubmit(fields => this.createCallToAction(fields))}
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
          >${msg("Create Call To Action")}</sl-button>
        </form> 
      </sl-card>`;
  }
  
  static styles = [sharedStyles];
}
