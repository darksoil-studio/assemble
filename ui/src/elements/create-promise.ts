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
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CallPromise } from '../types.js';

/**
 * @element create-promise
 * @fires promise-created: detail will contain { promiseHash }
 */
@localized()
@customElement('create-promise')
export class CreatePromise extends LitElement {
  // REQUIRED. The call to action hash for this Promise
  @property(hashProperty('call-to-action-hash'))
  callToActionHash!: ActionHash;

  // REQUIRED. The need index for this Promise
  @property()
  needIndex!: number;

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

  show() {
    this.form.reset();
    this.dialog.show();
  }

  /**
   * @internal
   */
  @query('#create-form')
  form!: HTMLFormElement;

  /**
   * @internal
   */
  @query('sl-dialog')
  dialog!: SlDialog;

  async createPromise(fields: any) {
    if (this.committing) return;

    if (this.callToActionHash === undefined)
      throw new Error(
        'Cannot create a new Promise without its call_to_action_hash field'
      );
    if (this.needIndex === undefined)
      throw new Error(
        'Cannot create a new Promise without its need_index field'
      );

    const promise: CallPromise = {
      call_to_action_hash: this.callToActionHash,
      description: fields.description,
      need_index: this.needIndex,
    };

    try {
      this.committing = true;
      const record: EntryRecord<CallPromise> =
        await this.assembleStore.client.createPromise(promise);

      this.dispatchEvent(
        new CustomEvent('promise-created', {
          composed: true,
          bubbles: true,
          detail: {
            promiseHash: record.actionHash,
          },
        })
      );

      this.dialog.hide();
      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the promise'));
    }
    this.committing = false;
  }

  render() {
    return html` <sl-dialog style="flex: 1;" .label=${msg('Create Promise')}>
      <form
        id="create-form"
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.createPromise(fields))}
      >
        <div style="margin-bottom: 16px;">
          <sl-textarea
            name="description"
            .label=${msg('Description')}
            required
          ></sl-textarea>
        </div>

        <sl-button variant="primary" type="submit" .loading=${this.committing}
          >${msg('Create Promise')}</sl-button
        >
      </form>
    </sl-dialog>`;
  }

  static styles = [sharedStyles];
}
