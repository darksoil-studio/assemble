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
import { Promise } from '../types';

/**
 * @element promise-summary
 * @fires promise-selected: detail will contain { promiseHash }
 */
@localized()
@customElement('promise-summary')
export class PromiseSummary extends LitElement {

  // REQUIRED. The hash of the Promise to show
  @property(hashProperty('promise-hash'))
  promiseHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  _promise = new StoreSubscriber(this, () => this.assembleStore.promises.get(this.promiseHash));

  renderSummary(entryRecord: EntryRecord<Promise>) {
    return html`
      <div style="display: flex; flex-direction: column">

          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Description")}:</strong></span>
 	    <span style="white-space: pre-line">${ entryRecord.entry.description }</span>
	  </div>

      </div>
    `;
  }
  
  renderPromise() {
    switch (this._promise.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete":
        if (!this._promise.value.value) return html`<span>${msg("The requested promise doesn't exist")}</span>`;

        return this.renderSummary(this._promise.value.value);
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the promise")}
          .error=${this._promise.value.error.data.data}
        ></display-error>`;
    }
  }
  
  render() {
    return html`<sl-card style="flex: 1; cursor: grab;" @click=${() => this.dispatchEvent(new CustomEvent('promise-selected', {
          composed: true,
          bubbles: true,
          detail: {
            promiseHash: this.promiseHash
          }
        }))}>
        ${this.renderPromise()}
    </sl-card>`;
  }

  
  static styles = [sharedStyles];
}
