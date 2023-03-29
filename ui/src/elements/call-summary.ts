import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';

import { localized, msg } from '@lit/localize';

import '@holochain-open-dev/elements/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { AssembleStore } from '../assemble-store';
import { assembleStoreContext } from '../context';
import { Call } from '../types';

/**
 * @element call-summary
 * @fires call-selected: detail will contain { callHash }
 */
@localized()
@customElement('call-summary')
export class CallSummary extends LitElement {

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

  renderSummary(entryRecord: EntryRecord<Call>) {
    return html`
      <div style="display: flex; flex-direction: column">

          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Title")}:</strong></span>
 	    <span style="white-space: pre-line">${ entryRecord.entry.title }</span>
	  </div>

          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Needs")}:</strong></span>
              ${ entryRecord.entry.needs.map(el => html`<span style="white-space: pre-line">${ el }</span>`)}	  </div>

      </div>
    `;
  }
  
  renderCall() {
    switch (this._call.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete":
        if (!this._call.value.value) return html`<span>${msg("The requested call doesn't exist")}</span>`;

        return this.renderSummary(this._call.value.value);
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the call")}
          .error=${this._call.value.error.data.data}
        ></display-error>`;
    }
  }
  
  render() {
    return html`<sl-card style="flex: 1; cursor: grab;" @click=${() => this.dispatchEvent(new CustomEvent('call-selected', {
          composed: true,
          bubbles: true,
          detail: {
            callHash: this.callHash
          }
        }))}>
        ${this.renderCall()}
    </sl-card>`;
  }

  
  static styles = [sharedStyles];
}
