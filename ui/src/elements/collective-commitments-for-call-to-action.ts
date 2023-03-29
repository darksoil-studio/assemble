
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
import { CollectiveCommitment } from '../types.js';

import './collective-commitment-summary.js';

/**
 * @element collective-commitments-for-call-to-action
 */
@localized()
@customElement('collective-commitments-for-call-to-action')
export class CollectiveCommitmentsForCallToAction extends LitElement {

  // REQUIRED. The CallToActionHash for which the CollectiveCommitments should be fetched
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
  _collectiveCommitments = new StoreSubscriber(this, () =>
    this.assembleStore.collectiveCommitmentsForCallToAction.get(this.callToActionHash)
  );

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0) 
      return html` <div class="column center-content">
        <sl-icon
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
          .src=${wrapPathInSvg(mdiInformationOutline)}
        ></sl-icon>
        <span class="placeholder">${msg("No collective commitments found for this call to action")}</span>
      </div>`;

    return html`
      <div style="display: flex; flex-direction: column">
        ${hashes.map(hash =>
          html`<collective-commitment-summary .collectiveCommitmentHash=${hash}></collective-commitment-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._collectiveCommitments.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete": 
        return this.renderList(this._collectiveCommitments.value.value);
      case "error":
        return html`<display-error 
          .headline=${msg("Error fetching the collective commitments")}
          .error=${this._collectiveCommitments.value.error.data.data}
        ></display-error>`;
    }
  }
  
  static styles = [sharedStyles];
}
