import {
  hashProperty,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete, mdiPencil } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { Commitment } from '../types.js';

/**
 * @element commitment-detail
 * @fires commitment-deleted: detail will contain { commitmentHash }
 */
@localized()
@customElement('commitment-detail')
export class CommitmentDetail extends LitElement {
  // REQUIRED. The hash of the Commitment to show
  @property(hashProperty('commitment-hash'))
  commitmentHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  _commitment = new StoreSubscriber(
    this,
    () => this.assembleStore.commitments.get(this.commitmentHash),
    () => [this.commitmentHash]
  );

  renderDetail(entryRecord: EntryRecord<Commitment>) {
    return html`
      <sl-card>
        <div slot="header" style="display: flex; flex-direction: row">
          <span style="font-size: 18px; flex: 1;">${msg('Commitment')}</span>
        </div>

        <div style="display: flex; flex-direction: column">
          <div
            style="display: flex; flex-direction: column; margin-bottom: 16px"
          >
            <span style="margin-bottom: 8px"
              ><strong>${msg('Description')}:</strong></span
            >
            <span style="white-space: pre-line"
              >${entryRecord.entry.comment}</span
            >
          </div>
        </div>
      </sl-card>
    `;
  }

  render() {
    switch (this._commitment.value.status) {
      case 'pending':
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case 'complete':
        const commitment = this._commitment.value.value;

        if (!commitment)
          return html`<span
            >${msg("The requested commitment doesn't exist")}</span
          >`;

        return this.renderDetail(commitment);
      case 'error':
        return html`<sl-card>
          <display-error
            .headline=${msg('Error fetching the commitment')}
            .error=${this._commitment.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }

  static styles = [sharedStyles];
}
