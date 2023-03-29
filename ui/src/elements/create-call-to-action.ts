import {
  hashProperty,
  notifyError,
  onSubmit,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/elements/display-error.js';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiDelete } from '@mdi/js';
import { encode } from '@msgpack/msgpack';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CallToAction } from '../types.js';

/**
 * @element create-call-to-action
 * @fires call-to-action-created: detail will contain { callToActionHash }
 */
export abstract class CreateCallToAction extends LitElement {
  // REQUIRED. The parent call to action hash for this CallToAction
  @property(hashProperty('parent-call-to-action-hash'))
  parentCallToActionHash!: ActionHash;

  // The custom content for this call to action
  @property()
  customContent: any | undefined;

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
    let customContent = this.customContent;

    if (!this.customContent) {
      customContent = {
        ...fields,
      };
      delete customContent.title;
      delete customContent.needs;
    }

    const custom_content = encode(customContent);

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
      this._needsFields = [0];
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the call to action'));
    }
    this.committing = false;
  }

  renderCustomContentFormFields(): TemplateResult {
    return html``;
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

        ${this.renderCustomContentFormFields()}

        <div style="margin-bottom: 16px; margin-top: 16px;">
          <div style="display: flex; flex-direction: column">
            <span>${msg('Needs')}</span>

            ${this._needsFields.map(index =>
              keyed(
                index,
                html`<div
                  id="div${index}"
                  class="row"
                  style="align-items: center; margin-top: 8px"
                >
                  <sl-input
                    id="input${index}"
                    name="needs"
                    .label=${msg('')}
                  ></sl-input>
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
              style="margin-top: 8px"
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
