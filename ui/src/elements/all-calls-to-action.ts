import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { AgentPubKey, EntryHash, ActionHash, Record } from '@holochain/client';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { hashProperty, sharedStyles, wrapPathInSvg } from '@holochain-open-dev/elements';
import { mdiInformationOutline } from '@mdi/js';

import '@holochain-open-dev/elements/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import './call-to-action-summary.js';
import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';

/**
 * @element all-calls-to-action
 */
@localized()
@customElement('all-calls-to-action')
export class AllCallsToAction extends LitElement {
  
  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  _allCallsToAction = new StoreSubscriber(this, 
    () => this.assembleStore.allCallsToAction  );


  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) 
      return html` <div class="column center-content">
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
          ></sl-icon
        >
        <span class="placeholder">${msg("No call to actions found")}</span>
      </div>`;

    return html`
      <div style="display: flex; flex-direction: column; flex: 1">
        ${hashes.map(hash => 
          html`<call-to-action-summary .callToActionHash=${hash} style="margin-bottom: 16px;"></call-to-action-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._allCallsToAction.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete":
        return this.renderList(this._allCallsToAction.value.value);
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the call to actions")}
          .error=${this._allCallsToAction.value.error.data.data}
        ></display-error>`;
    }
  }
  
  static styles = [sharedStyles];
}
