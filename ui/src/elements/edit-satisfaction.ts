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
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import { AssembleStore } from '../assemble-store';
import { assembleStoreContext } from '../context';
import { Satisfaction } from '../types';

/**
 * @element edit-satisfaction
 * @fires satisfaction-updated: detail will contain { previousSatisfactionHash, updatedSatisfactionHash }
 */
@localized()
@customElement('edit-satisfaction')
export class EditSatisfaction extends LitElement {

  
  // REQUIRED. The current Satisfaction record that should be updated
  @property()
  currentRecord!: EntryRecord<Satisfaction>;
  
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
   

  firstUpdated() {
    this.shadowRoot?.querySelector('form')!.reset();
  }

  async updateSatisfaction(fields: any) {  
    const satisfaction: Satisfaction = { 
      call_hash: this.currentRecord.entry.call_hash,
      need_index: this.currentRecord.entry.need_index,
      promises_hashes: this.currentRecord.entry.promises_hashes,
    };

    try {
      this.committing = true;
      const updateRecord = await this.assembleStore.client.updateSatisfaction(
        this.currentRecord.actionHash,
        satisfaction
      );
  
      this.dispatchEvent(new CustomEvent('satisfaction-updated', {
        composed: true,
        bubbles: true,
        detail: {
          previousSatisfactionHash: this.currentRecord.actionHash,
          updatedSatisfactionHash: updateRecord.actionHash
        }
      }));
    } catch (e: any) {
      console.error(e);
      notifyError(msg("Error creating the satisfaction"));
    }
    
    this.committing = false;
  }

  render() {
    return html`
      <sl-card>
        <span slot="header">${msg("Edit Satisfaction")}</span>

        <form 
          style="display: flex; flex: 1; flex-direction: column;"
          ${onSubmit(fields => this.updateSatisfaction(fields))}
        >  


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
