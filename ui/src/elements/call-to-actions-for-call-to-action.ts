import {
  hashProperty,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
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
import { CallToAction } from '../types.js';
import './call-to-action-summary.js';

/**
 * @element call-to-actions-for-call-to-action
 */
@localized()
@customElement('call-to-actions-for-call-to-action')
export class CallToActionsForCallToAction extends LitElement {
  // REQUIRED. The CallToActionHash for which the CallToActions should be fetched
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
  _callToActions = new StoreSubscriber(
    this,
    () =>
      this.assembleStore.callToActionsForCallToAction.get(
        this.callToActionHash
      ),
    () => [this.callToActionHash]
  );

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0)
      return html` <div class="column center-content">
        <sl-icon
          style="color: grey; height: 64px; width: 64px; margin-bottom: 16px"
          .src=${wrapPathInSvg(mdiInformationOutline)}
        ></sl-icon>
        <span class="placeholder"
          >${msg('No call to actions found for this call to action')}</span
        >
      </div>`;

    return html`
      <div style="display: flex; flex-direction: column">
        ${hashes.map(
          hash =>
            html`<call-to-action-summary
              .callToActionHash=${hash}
            ></call-to-action-summary>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._callToActions.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        return this.renderList(this._callToActions.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the call to actions')}
          .error=${this._callToActions.value.error}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
