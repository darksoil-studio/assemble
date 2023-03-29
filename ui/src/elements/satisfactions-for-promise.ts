import {
  hashProperty,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/elements/display-error.js';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { EntryRecord, RecordBag } from '@holochain-open-dev/utils';
import { ActionHash, AgentPubKey, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { Satisfaction } from '../types.js';
import './satisfaction-summary.js';

/**
 * @element satisfactions-for-promise
 */
@localized()
@customElement('satisfactions-for-promise')
export class SatisfactionsForPromise extends LitElement {
  // REQUIRED. The PromiseHash for which the Satisfactions should be fetched
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
  _satisfactions = new StoreSubscriber(this, () =>
    this.assembleStore.satisfactionsForPromise.get(this.promiseHash)
  );

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0)
      return html` <div class="column center-content">
        <sl-icon
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
          .src=${wrapPathInSvg(mdiInformationOutline)}
        ></sl-icon>
        <span class="placeholder"
          >${msg('No satisfactions found for this promise')}</span
        >
      </div>`;

    return html`
      <div style="display: flex; flex-direction: column">
        ${hashes.map(
          hash =>
            html`<satisfaction-summary
              .satisfactionHash=${hash}
            ></satisfaction-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._satisfactions.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        return this.renderList(this._satisfactions.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the satisfactions')}
          .error=${this._satisfactions.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
