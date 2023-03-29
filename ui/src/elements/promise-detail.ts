import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { sharedStyles, hashProperty, wrapPathInSvg } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiPencil, mdiDelete } from '@mdi/js';

import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@holochain-open-dev/elements/elements/display-error.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { Promise } from '../types.js';

/**
 * @element promise-detail
 * @fires promise-deleted: detail will contain { promiseHash }
 */
@localized()
@customElement('promise-detail')
export class PromiseDetail extends LitElement {

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



  renderDetail(entryRecord: EntryRecord<Promise>) {
    return html`
      <sl-card>
      	<div slot="header" style="display: flex; flex-direction: row">
          <span style="font-size: 18px; flex: 1;">${msg("Promise")}</span>

        </div>

        <div style="display: flex; flex-direction: column">
  
          <div style="display: flex; flex-direction: column; margin-bottom: 16px">
	    <span style="margin-bottom: 8px"><strong>${msg("Description")}:</strong></span>
 	    <span style="white-space: pre-line">${ entryRecord.entry.description }</span>
	  </div>

      </div>
      </sl-card>
    `;
  }
  
  render() {
    switch (this._promise.value.status) {
      case "pending":
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case "complete":
        const promise = this._promise.value.value;
        
        if (!promise) return html`<span>${msg("The requested promise doesn't exist")}</span>`;
    
        return this.renderDetail(promise);
      case "error":
        return html`<sl-card>
          <display-error
            .headline=${msg("Error fetching the promise")}
            .error=${this._promise.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }
  
  static styles = [sharedStyles];
}
