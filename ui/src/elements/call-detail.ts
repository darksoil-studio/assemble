import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { sharedStyles, hashProperty, wrapPathInSvg } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiPencil, mdiDelete } from '@mdi/js';

import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@holochain-open-dev/elements/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';

import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import './edit-call.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { Call } from '../types.js';

/**
 * @element call-detail
 * @fires call-deleted: detail will contain { callHash }
 */
@localized()
@customElement('call-detail')
export class CallDetail extends LitElement {

  // REQUIRED. The hash of the Call to show
  @property(hashProperty('call-hash'))
  callHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
   _call = new StoreSubscriber(this, () => this.assembleStore.calls.get(this.callHash));

  /**
   * @internal
   */
  @state()
  _editing = false;

  async deleteCall() {
    try {
      await this.assembleStore.client.deleteCall(this.callHash);
 
      this.dispatchEvent(new CustomEvent('call-deleted', {
        bubbles: true,
        composed: true,
        detail: {
          callHash: this.callHash
        }
      }));
    } catch (e: any) {
      console.error(e);
      const errorAlert = this.shadowRoot?.getElementById('update-error') as SlAlert;
      errorAlert.toast();
    }
  }

  renderDetail(entryRecord: EntryRecord<Call>) {
    return html`
      <sl-alert id="update-error" variant="danger" duration="3000">
        <sl-icon slot="icon" .src=${wrapPathInSvg(mdiAlertCircleOutline)} style="color: red"></sl-icon>
        <strong>${msg("Error deleting the call")}</strong><br />
      </sl-alert>

      <sl-card>
      	<div slot="header" style="display: flex; flex-direction: row">
          <span style="font-size: 18px; flex: 1;">${msg("Call")}</span>

          <sl-icon-button style="margin-left: 8px" .src=${wrapPathInSvg(mdiPencil)} @click=${() => { this._editing = true; } }></sl-icon-button>
          <sl-icon-button style="margin-left: 8px" .src=${wrapPathInSvg(mdiDelete)} @click=${() => this.deleteCall()}></sl-icon-button>
        </div>

        <div style="display: flex; flex-direction: column">
  
          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Title")}:</strong></span>
 	    <span style="white-space: pre-line">${ entryRecord.entry.title }</span>
	  </div>

          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Needs")}:</strong></span>
              ${ entryRecord.entry.needs.map(el => html`<span style="white-space: pre-line">${ el }</span>`)}	  </div>

      </div>
      </sl-card>
    `;
  }
  
  render() {
    switch (this._call.value.status) {
      case "pending":
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case "complete":
        const call = this._call.value.value;
        
        if (!call) return html`<span>${msg("The requested call doesn't exist")}</span>`;
    
        if (this._editing) {
    	  return html`<edit-call
    	    .currentRecord=${ call }
            @call-updated=${async () => { this._editing = false; } }
      	    @edit-canceled=${() => { this._editing = false; } }
    	    style="display: flex; flex: 1;"
    	  ></edit-call>`;
      }

        return this.renderDetail(call);
      case "error":
        return html`<sl-card>
          <display-error
            .headline=${msg("Error fetching the call")}
            .error=${this._call.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }
  
  static styles = [sharedStyles];
}
