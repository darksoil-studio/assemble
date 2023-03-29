import { LitElement, html } from 'lit';
import { keyed } from "lit/directives/keyed.js";
import { state, customElement, property } from 'lit/decorators.js';
import { ActionHash, Record, EntryHash, AgentPubKey } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { hashState, notifyError, sharedStyles, hashProperty, wrapPathInSvg, onSubmit } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';

import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import { AssembleStore } from '../assemble-store';
import { assembleStoreContext } from '../context';
import { Call } from '../types';

/**
 * @element edit-call
 * @fires call-updated: detail will contain { previousCallHash, updatedCallHash }
 */
@localized()
@customElement('edit-call')
export class EditCall extends LitElement {

  
  // REQUIRED. The current Call record that should be updated
  @property()
  currentRecord!: EntryRecord<Call>;
  
  /**
   * @internal
   */
  @consume({ context: assembleStoreContext })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  @state()
  committing = false;
   
  /**
   * @internal
   */
  @state()
  _needsFields = this.currentRecord.entry.needs.map((_, index) => index);

  firstUpdated() {
    this.shadowRoot?.querySelector('form')!.reset();
  }

  async updateCall(fields: any) {  
    const call: Call = { 
      parent_call_hash: this.currentRecord.entry.parent_call_hash,
      title: fields.title,
      custom_content: this.currentRecord.entry.custom_content,
      needs: (Array.isArray(fields.needs) ? fields.needs : [fields.needs]).map((el: any) => el),
    };

    try {
      this.committing = true;
      const updateRecord = await this.assembleStore.client.updateCall(
        this.currentRecord.actionHash,
        call
      );
  
      this.dispatchEvent(new CustomEvent('call-updated', {
        composed: true,
        bubbles: true,
        detail: {
          previousCallHash: this.currentRecord.actionHash,
          updatedCallHash: updateRecord.actionHash
        }
      }));
    } catch (e: any) {
      console.error(e);
      notifyError(msg("Error creating the call"));
    }
    
    this.committing = false;
  }

  render() {
    return html`
      <sl-card>
        <span slot="header">${msg("Edit Call")}</span>

        <form 
          style="display: flex; flex: 1; flex-direction: column;"
          ${onSubmit(fields => this.updateCall(fields))}
        >  
          <div style="margin-bottom: 16px">
        <sl-input name="title" .label=${msg("Title")}  required .defaultValue=${ this.currentRecord.entry.title }></sl-input>          </div>

          <div style="margin-bottom: 16px">
        <div style="display: flex; flex-direction: column">
          <span>${msg("Needs")}</span>
        
          ${this._needsFields.map((index) => keyed(index, html`<div class="row" style="align-items: center; margin-top: 8px"><sl-input name="needs" .label=${msg("")}  .defaultValue=${ this.currentRecord.entry.needs[index] }></sl-input> <sl-icon-button .src=${wrapPathInSvg(mdiDelete)} @click=${() => { this._needsFields = this._needsFields.filter(i => i !== index) } }></sl-icon-button></div>`))}
          <sl-button @click=${() => { this._needsFields = [...this._needsFields, Math.max(...this._needsFields) + 1]; } }>${msg("Add Needs")}</sl-button>
        </div>          </div>



          <div style="display: flex; flex-direction: row">
            <sl-button
              @click=${() => this.dispatchEvent(new CustomEvent('edit-canceled', {
                bubbles: true,
                composed: true
              }))}
              style="flex: 1;"
            >${msg("Cancel")}</sl-button>
            <sl-button
              type="submit"
              variant="primary"
              style="flex: 1;"
              .loading=${this.committing}
            >${msg("Save")}</sl-button>

          </div>
        </form>
      </sl-card>`;
  }

  static styles = [sharedStyles];
}
