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
import { repeat } from 'lit/directives/repeat.js';
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
@localized()
@customElement('create-call-to-action')
export class CreateCallToAction extends LitElement {
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
    if (this.committing) return;
    let customContent = this.customContent;

    if (!this.customContent) {
      customContent = {
        ...fields,
      };
      delete customContent.title;
      delete customContent.needs;
    }

    const custom_content = encode(customContent);

    const needsDescriptions: string[] = Array.isArray(fields.needs_description)
      ? fields.needs_description
      : [fields.needs_description];
    const needsMins = (
      Array.isArray(fields.needs_min) ? fields.needs_min : [fields.needs_min]
    ).map((i: string) => parseInt(i));
    const needsMaxs = (
      Array.isArray(fields.needs_max) ? fields.needs_max : [fields.needs_max]
    ).map((i: string) => parseInt(i));

    const needs = needsDescriptions.map((description, i) => ({
      description,
      min_necessary: needsMins[i],
      max_possible: needsMaxs[i],
    }));

    const callToAction: CallToAction = {
      parent_call_to_action_hash: this.parentCallToActionHash,
      title: fields.title,
      custom_content,
      needs,
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

  renderNeedFields(index: number) {
    return html`<div class="row" style="align-items: center; margin-top: 8px">
      <sl-input
        name="needs_description"
        required
        .placeholder=${msg('Description')}
      ></sl-input>

      <sl-input
        name="needs_min"
        type="number"
        id="inputmin${index}"
        value="1"
        min="0"
        required
        style="width: 5rem; margin-left: 8px"
        .placeholder=${msg('Min.')}
        @input=${() => this.requestUpdate()}
      ></sl-input>

      <sl-input
        name="needs_max"
        type="number"
        .min=${(this.shadowRoot?.getElementById(`inputmin${index}`) as any)
          ?.value || 1}
        style="width: 5rem; margin-left: 8px"
        value="1"
        .placeholder=${msg('Max.')}
      ></sl-input>

      <sl-icon-button
        .src=${wrapPathInSvg(mdiDelete)}
        .disabled=${this._needsFields.length === 1}
        @click=${() => {
          this._needsFields = this._needsFields.filter(i => i !== index);
        }}
      ></sl-icon-button>
    </div>`;
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
            <span style="font-size: 18px">${msg('Needs')}</span>

            ${repeat(
              this._needsFields,
              i => i,
              index => this.renderNeedFields(index)
            )}
            <sl-button
              style="margin-top: 8px"
              @click=${() => {
                this._needsFields = [
                  ...this._needsFields,
                  Math.max(...this._needsFields) + 1,
                ];
              }}
              >${msg('Add Need')}</sl-button
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
