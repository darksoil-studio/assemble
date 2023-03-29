import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { sharedStyles, hashProperty, wrapPathInSvg } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiPencil, mdiDelete } from '@mdi/js';

import '@shoelace-style/shoelace/dist/components/card/card.js';

import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@holochain-open-dev/elements/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CollectiveCommitment } from '../types.js';

/**
 * @element collective-commitment-detail
 * @fires collective-commitment-deleted: detail will contain { collectiveCommitmentHash }
 */
@localized()
@customElement('collective-commitment-detail')
export class CollectiveCommitmentDetail extends LitElement {

  // REQUIRED. The hash of the CollectiveCommitment to show
  @property(hashProperty('collective-commitment-hash'))
  collectiveCommitmentHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
   _collectiveCommitment = new StoreSubscriber(this, () => this.assembleStore.collectiveCommitments.get(this.collectiveCommitmentHash));



  renderDetail(entryRecord: EntryRecord<CollectiveCommitment>) {
    return html`
      <sl-card>
      	<div slot="header" style="display: flex; flex-direction: row">
          <span style="font-size: 18px; flex: 1;">${msg("Collective Commitment")}</span>

        </div>

        <div style="display: flex; flex-direction: column">
  
      </div>
      </sl-card>
    `;
  }
  
  render() {
    switch (this._collectiveCommitment.value.status) {
      case "pending":
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case "complete":
        const collectiveCommitment = this._collectiveCommitment.value.value;
        
        if (!collectiveCommitment) return html`<span>${msg("The requested collective commitment doesn't exist")}</span>`;
    
        return this.renderDetail(collectiveCommitment);
      case "error":
        return html`<sl-card>
          <display-error
            .headline=${msg("Error fetching the collective commitment")}
            .error=${this._collectiveCommitment.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }
  
  static styles = [sharedStyles];
}
