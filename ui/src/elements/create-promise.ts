import {
  notifyError,
  onSubmit,
  sharedStyles,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { EntryRecord } from '@holochain-open-dev/utils';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { Commitment, CallToAction } from '../types.js';

/**
 * @element create-commitment
 * @fires commitment-created: detail will contain { commitmentHash }
 */
@localized()
@customElement('create-commitment')
export class CreateCommitment extends LitElement {
  // REQUIRED. The call to action hash for this Commitment
  @property()
  callToAction!: EntryRecord<CallToAction>;

  // REQUIRED. The need index for this Commitment
  @property()
  needIndex: number | undefined;

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
  @query('sl-dialog')
  dialog!: SlDialog;

  show() {
    this.dialog.show();
  }

  async createCommitment(fields: any) {
    if (this.committing) return;

    if (this.callToAction.actionHash === undefined)
      throw new Error(
        'Cannot create a new Commitment without its call_to_action_hash field'
      );
    if (this.needIndex === undefined)
      throw new Error(
        'Cannot create a new Commitment without its need_index field'
      );

    const commitment: Commitment = {
      call_to_action_hash: this.callToAction.actionHash,
      comment: fields.comment,
      amount: fields.amount ? parseInt(fields.amount, 10) : 1,
      need_index: this.needIndex,
    };

    try {
      this.committing = true;
      const record: EntryRecord<Commitment> =
        await this.assembleStore.client.createCommitment(commitment);

      this.dispatchEvent(
        new CustomEvent('commitment-created', {
          composed: true,
          bubbles: true,
          detail: {
            commitmentHash: record.actionHash,
          },
        })
      );

      this.dialog.hide();
      this.form.reset();
      this.needIndex = undefined;
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the commitment'));
    }
    this.committing = false;
  }

  render() {
    return html` <sl-dialog
      style="flex: 1;"
      .label=${msg('Commitment to Contribute')}
    >
      ${this.needIndex !== undefined
        ? html`
            <form
              id="create-form"
              style="display: flex; flex: 1; flex-direction: column;"
              ${onSubmit(fields => this.createCommitment(fields))}
            >
              ${this.callToAction.entry.needs[this.needIndex].min_necessary !==
                1 &&
              this.callToAction.entry.needs[this.needIndex].max_possible !== 1
                ? html`
                    <sl-input
                      name="amount"
                      type="number"
                      .label=${msg('Amount')}
                      value="1"
                      min="1"
                      .max=${this.callToAction.entry.needs[this.needIndex]
                        .max_possible}
                      style="margin-bottom: 16px;"
                      required
                    ></sl-input>
                  `
                : html``}
              <sl-textarea
                style="margin-bottom: 16px;"
                name="comment"
                required
                .label=${msg('Comment')}
              ></sl-textarea>

              <sl-button
                variant="primary"
                type="submit"
                .loading=${this.committing}
                >${msg('Commitment')}</sl-button
              >
            </form>
          `
        : html``}
    </sl-dialog>`;
  }

  static styles = [sharedStyles];
}
