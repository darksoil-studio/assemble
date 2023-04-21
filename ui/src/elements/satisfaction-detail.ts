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
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { Satisfaction } from '../types.js';
import './edit-satisfaction.js';

/**
 * @element satisfaction-detail
 * @fires satisfaction-deleted: detail will contain { satisfactionHash }
 */
@localized()
@customElement('satisfaction-detail')
export class SatisfactionDetail extends LitElement {
  // REQUIRED. The hash of the Satisfaction to show
  @property(hashProperty('satisfaction-hash'))
  satisfactionHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  _satisfaction = new StoreSubscriber(this, () =>
    this.assembleStore.satisfactions.get(this.satisfactionHash)
  );

  /**
   * @internal
   */
  @state()
  _editing = false;

  renderDetail(entryRecord: EntryRecord<Satisfaction>) {
    return html`
      <sl-card>
        <div slot="header" style="display: flex; flex-direction: row">
          <span style="font-size: 18px; flex: 1;">${msg('Satisfaction')}</span>

          <sl-icon-button
            style="margin-left: 8px"
            .src=${wrapPathInSvg(mdiPencil)}
            @click=${() => {
              this._editing = true;
            }}
          ></sl-icon-button>
        </div>

        <div style="display: flex; flex-direction: column"></div>
      </sl-card>
    `;
  }

  render() {
    switch (this._satisfaction.value.status) {
      case 'pending':
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case 'complete':
        const satisfaction = this._satisfaction.value.value;

        if (!satisfaction)
          return html`<span
            >${msg("The requested satisfaction doesn't exist")}</span
          >`;

        if (this._editing) {
          return html`<edit-satisfaction
            .currentRecord=${satisfaction}
            @satisfaction-updated=${async () => {
              this._editing = false;
            }}
            @edit-canceled=${() => {
              this._editing = false;
            }}
            style="display: flex; flex: 1;"
          ></edit-satisfaction>`;
        }

        return this.renderDetail(satisfaction);
      case 'error':
        return html`<sl-card>
          <display-error
            .headline=${msg('Error fetching the satisfaction')}
            .error=${this._satisfaction.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }

  static styles = [sharedStyles];
}
