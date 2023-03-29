import {
  hashProperty,
  notifyError,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/elements/display-error.js';
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
import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { decode } from '@msgpack/msgpack';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CallToAction } from '../types.js';
import './edit-call-to-action.js';
import './create-promise.js';
import { CreatePromise } from './create-promise.js';

/**
 * @element call-to-action-detail
 * @fires call-to-action-deleted: detail will contain { callToActionHash }
 */
@localized()
@customElement('call-to-action-detail')
export class CallToActionDetail extends LitElement {
  // REQUIRED. The hash of the CallToAction to show
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
  _callToAction = new StoreSubscriber(this, () =>
    this.assembleStore.callToActions.get(this.callToActionHash)
  );

  /**
   * @internal
   */
  @state()
  _editing = false;

  amIAuthor(callToAction: EntryRecord<CallToAction>) {
    return (
      callToAction.action.author.toString() ===
      this.assembleStore.client.client.myPubKey.toString()
    );
  }
  async deleteCallToAction() {
    try {
      await this.assembleStore.client.deleteCallToAction(this.callToActionHash);

      this.dispatchEvent(
        new CustomEvent('call-to-action-deleted', {
          bubbles: true,
          composed: true,
          detail: {
            callToActionHash: this.callToActionHash,
          },
        })
      );
    } catch (e: any) {
      notifyError(msg('Error deleting the call to action'));
      console.error(e);
    }
  }

  renderCustomContent(customContent: any): TemplateResult {
    return html``;
  }

  renderDetail(entryRecord: EntryRecord<CallToAction>) {
    return html`
      <create-promise
        .callToActionHash=${this.callToActionHash}
      ></create-promise>

      <sl-card>
        <div slot="header" style="display: flex; flex-direction: row">
          <span style="font-size: 18px; flex: 1;"
            >${msg('Call To Action')}</span
          >

          ${this.amIAuthor(entryRecord)
            ? html`
                <sl-icon-button
                  style="margin-left: 8px"
                  .src=${wrapPathInSvg(mdiPencil)}
                  @click=${() => {
                    this._editing = true;
                  }}
                ></sl-icon-button>
                <sl-icon-button
                  style="margin-left: 8px"
                  .src=${wrapPathInSvg(mdiDelete)}
                  @click=${() => this.deleteCallToAction()}
                ></sl-icon-button>
              `
            : html``}
        </div>

        <div style="display: flex; flex-direction: column">
          <div
            style="display: flex; flex-direction: column; margin-bottom: 16px"
          >
            <span style="margin-bottom: 8px"
              ><strong>${msg('Title')}:</strong></span
            >
            <span style="white-space: pre-line"
              >${entryRecord.entry.title}</span
            >
          </div>

          ${this.renderCustomContent(decode(entryRecord.entry.custom_content))}

          <div
            style="display: flex; flex-direction: column; margin-bottom: 16px"
          >
            <span style="margin-bottom: 8px"
              ><strong>${msg('Needs')}:</strong></span
            >
            ${entryRecord.entry.needs.map(
              (el, i) => html` <div class="row">
                <span style="white-space: pre-line">${el}</span>
                ${this.amIAuthor(entryRecord)
                  ? html``
                  : html`
                      <sl-button
                        @click=${() => {
                          const createPromise = this.shadowRoot?.querySelector(
                            'create-promise'
                          ) as CreatePromise;
                          createPromise.needIndex = i;
                          createPromise.show();
                        }}
                        >${msg('Promise to Help')}</sl-button
                      >
                    `}
              </div>`
            )}
          </div>
        </div>
      </sl-card>
    `;
  }

  render() {
    switch (this._callToAction.value.status) {
      case 'pending':
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case 'complete':
        const callToAction = this._callToAction.value.value;

        if (!callToAction)
          return html`<span
            >${msg("The requested call to action doesn't exist")}</span
          >`;

        if (this._editing) {
          return html`<edit-call-to-action
            .currentRecord=${callToAction}
            @call-to-action-updated=${async () => {
              this._editing = false;
            }}
            @edit-canceled=${() => {
              this._editing = false;
            }}
            style="display: flex; flex: 1;"
          ></edit-call-to-action>`;
        }

        return this.renderDetail(callToAction);
      case 'error':
        return html`<sl-card>
          <display-error
            .headline=${msg('Error fetching the call to action')}
            .error=${this._callToAction.value.error.data.data}
          ></display-error>
        </sl-card>`;
    }
  }

  static styles = [sharedStyles];
}
