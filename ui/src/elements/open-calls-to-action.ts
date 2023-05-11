import {
  hashProperty,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { StoreSubscriber } from '@holochain-open-dev/stores';
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
import './call-to-action-summary.js';

/**
 * @element open-calls-to-action
 */
@localized()
@customElement('open-calls-to-action')
export class OpenCallsToAction extends LitElement {
  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  _openCallsToAction = new StoreSubscriber(
    this,
    () => this.assembleStore.openCallsToAction
  );

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0)
      return html` <div class="column center-content">
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
        ></sl-icon>
        <span class="placeholder">${msg('No open call to actions found')}</span>
      </div>`;

    return html`
      <div style="display: flex; flex-direction: column; flex: 1">
        ${hashes.map(
          hash =>
            html`<call-to-action-summary
              .callToActionHash=${hash}
              style="margin-bottom: 16px;"
            ></call-to-action-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._openCallsToAction.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        return this.renderList(this._openCallsToAction.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the call to actions')}
          .error=${this._openCallsToAction.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
