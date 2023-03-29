
import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { Record, EntryHash, ActionHash, AgentPubKey } from '@holochain/client';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { RecordBag, EntryRecord } from '@holochain-open-dev/utils';
import { hashProperty, sharedStyles, wrapPathInSvg } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';

import '@holochain-open-dev/elements/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { Call } from '../types.js';

import './call-summary.js';

/**
 * @element calls-for-call
 */
@localized()
@customElement('calls-for-call')
export class CallsForCall extends LitElement {

  // REQUIRED. The CallHash for which the Calls should be fetched
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
  _calls = new StoreSubscriber(this, () =>
    this.assembleStore.callsForCall.get(this.callHash)
  );

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) 
      return html` <div class="column center-content">
        <sl-icon
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
          .src=${wrapPathInSvg(mdiInformationOutline)}
        ></sl-icon>
        <span class="placeholder">${msg("No calls found for this call")}</span>
      </div>`;

    return html`
      <div style="display: flex; flex-direction: column">
        ${hashes.map(hash =>
          html`<call-summary .callHash=${hash}></call-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._calls.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete": 
        return this.renderList(this._calls.value.value);
      case "error":
        return html`<display-error 
          .headline=${msg("Error fetching the calls")}
          .error=${this._calls.value.error.data.data}
        ></display-error>`;
    }
  }
  
  static styles = [sharedStyles];
}
