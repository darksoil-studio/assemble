import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';

import { localized, msg } from '@lit/localize';


import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@holochain-open-dev/elements/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { AssembleStore } from '../assemble-store';
import { assembleStoreContext } from '../context';
import { CallToAction } from '../types';

/**
 * @element call-to-action-summary
 * @fires call-to-action-selected: detail will contain { callToActionHash }
 */
@localized()
@customElement('call-to-action-summary')
export class CallToActionSummary extends LitElement {

  // REQUIRED. The hash of the CallToAction to show
  @property(hashProperty('call-to-action-hash'))
  callToActionHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  _callToAction = new StoreSubscriber(this, () => this.assembleStore.callToActions.get(this.callToActionHash));

  renderSummary(entryRecord: EntryRecord<CallToAction>) {
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
  
  renderCallToAction() {
    switch (this._callToAction.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete":
        if (!this._callToAction.value.value) return html`<span>${msg("The requested call to action doesn't exist")}</span>`;

        return this.renderSummary(this._callToAction.value.value);
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the call to action")}
          .error=${this._callToAction.value.error.data.data}
        ></display-error>`;
    }
  }
  
  render() {
    return html`<sl-card style="flex: 1; cursor: grab;" @click=${() => this.dispatchEvent(new CustomEvent('call-to-action-selected', {
          composed: true,
          bubbles: true,
          detail: {
            callToActionHash: this.callToActionHash
          }
        }))}>
        ${this.renderCallToAction()}
    </sl-card>`;
  }

  
  static styles = [sharedStyles];
}
