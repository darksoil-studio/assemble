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

import './collective-commitment-summary.js';
import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';

/**
 * @element all-collective-commitments
 */
@localized()
@customElement('all-collective-commitments')
export class AllCollectiveCommitments extends LitElement {
  
  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  _allCollectiveCommitments = new StoreSubscriber(this, 
    () => this.assembleStore.allCollectiveCommitments  );


  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) 
      return html` <div class="column center-content">
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
          ></sl-icon
        >
        <span class="placeholder">${msg("No collective commitments found")}</span>
      </div>`;

    return html`
      <div style="display: flex; flex-direction: column; flex: 1">
        ${hashes.map(hash => 
          html`<collective-commitment-summary .collectiveCommitmentHash=${hash} style="margin-bottom: 16px;"></collective-commitment-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._allCollectiveCommitments.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete":
        return this.renderList(this._allCollectiveCommitments.value.value);
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the collective commitments")}
          .error=${this._allCollectiveCommitments.value.error.data.data}
        ></display-error>`;
    }
  }
  
  static styles = [sharedStyles];
}
