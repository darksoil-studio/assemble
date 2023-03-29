import {
  hashProperty,
  hashState,
  notifyError,
  onSubmit,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/elements/display-error.js';
import { EntryRecord } from '@holochain-open-dev/utils';
import {
  ActionHash,
  AgentPubKey,
  DnaHash,
  EntryHash,
  Record,
} from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';
import { encode } from '@msgpack/msgpack';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CallToAction } from '../types.js';

/**
 * @element create-call-to-action
 * @fires call-to-action-created: detail will contain { callToActionHash }
 */
@localized()
@customElement('create-call-to-action')
export class CreateCallToAction extends LitElement {
  // REQUIRED. The parent call to action hash for this CallToAction
  @property(hashProperty('parent-call-to-action-hash'))
  parentCallToActionHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  @state()
  committing = false;

  /**
   * @internal
   */
  @query('#create-form')
  form!: HTMLFormElement;

  /**
   * @internal
   */
  @state()
  _needsFields = [0];

  async createCallToAction(fields: any) {
    const customContentFields = {
      ...fields,
    };
    delete customContentFields.title;
    delete customContentFields.needs;

    const custom_content = encode(customContentFields);

    const callToAction: CallToAction = {
      parent_call_to_action_hash: this.parentCallToActionHash,
      title: fields.title,
      custom_content,
      needs: (Array.isArray(fields.needs) ? fields.needs : [fields.needs]).map(
        (el: any) => el
      ),
    };

    try {
      this.committing = true;
      const record: EntryRecord<CallToAction> =
        await this.assembleStore.client.createCallToAction(callToAction);

      this.dispatchEvent(
        new CustomEvent('call-to-action-created', {
          composed: true,
          bubbles: true,
          detail: {
            callToActionHash: record.actionHash,
          },
        })
      );

      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the call to action'));
    }
    this.committing = false;
  }

  render() {
    return html` <sl-card style="flex: 1;">
      <span slot="header">${msg('Create Call To Action')}</span>

      <form
        id="create-form"
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.createCallToAction(fields))}
      >
        <div style="margin-bottom: 16px;">
          <sl-input name="title" .label=${msg('Title')} required></sl-input>
        </div>

        <slot></slot>

        <div style="margin-bottom: 16px;">
          <div style="display: flex; flex-direction: column">
            <span>${msg('Needs')}</span>

            ${this._needsFields.map(index =>
              keyed(
                index,
                html`<div
                  class="row"
                  style="align-items: center; margin-top: 8px"
                >
                  <sl-input name="needs" .label=${msg('')}></sl-input>
                  <sl-icon-button
                    .src=${wrapPathInSvg(mdiDelete)}
                    @click=${() => {
                      this._needsFields = this._needsFields.filter(
                        i => i !== index
                      );
                    }}
                  ></sl-icon-button>
                </div>`
              )
            )}
            <sl-button
              @click=${() => {
                this._needsFields = [
                  ...this._needsFields,
                  Math.max(...this._needsFields) + 1,
                ];
              }}
              >${msg('Add Needs')}</sl-button
            >
          </div>
        </div>

        <sl-button variant="primary" type="submit" .loading=${this.committing}
          >${msg('Create Call To Action')}</sl-button
        >
      </form>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
