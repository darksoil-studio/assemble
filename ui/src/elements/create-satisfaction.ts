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
  decodeHashFromBase64,
  encodeHashToBase64,
} from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CallPromise, CallToAction, Satisfaction } from '../types.js';
import { SlDialog } from '@shoelace-style/shoelace';

/**
 * @element create-satisfaction
 * @fires satisfaction-created: detail will contain { satisfactionHash }
 */
@localized()
@customElement('create-satisfaction')
export class CreateSatisfaction extends LitElement {
  // REQUIRED. The call to action hash for this Satisfaction
  @property()
  callToAction!: EntryRecord<CallToAction>;

  // REQUIRED. The need index for this Satisfaction
  @property()
  needIndex!: number;

  // REQUIRED. The promises hashes for this Satisfaction
  @property()
  promises: Array<EntryRecord<CallPromise>> | undefined;

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

  async createSatisfaction(fields: any) {
    if (this.callToAction === undefined)
      throw new Error(
        'Cannot create a new Satisfaction without its call_to_action_hash field'
      );
    if (this.needIndex === undefined)
      throw new Error(
        'Cannot create a new Satisfaction without its need_index field'
      );
    if (this.promises === undefined)
      throw new Error(
        'Cannot create a new Satisfaction without its promises_hashes field'
      );

    const promises_hashes = Object.entries(fields)
      .filter(([_key, value]) => value === 'on')
      .map(([key, _value]) => decodeHashFromBase64(key));

    const satisfaction: Satisfaction = {
      call_to_action_hash: this.callToAction.actionHash,
      need_index: this.needIndex,
      promises_hashes,
    };

    try {
      this.committing = true;
      const record: EntryRecord<Satisfaction> =
        await this.assembleStore.client.createSatisfaction(satisfaction);

      this.dispatchEvent(
        new CustomEvent('satisfaction-created', {
          composed: true,
          bubbles: true,
          detail: {
            satisfactionHash: record.actionHash,
          },
        })
      );

      this.form.reset();
      this.dialog.hide();
      this.promises = undefined;
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the satisfaction'));
    }
    this.committing = false;
  }

  renderAmount(promise: EntryRecord<CallPromise>) {
    if (
      this.callToAction.entry.needs[this.needIndex].min_necessary === 1 &&
      this.callToAction.entry.needs[this.needIndex].max_possible === 1
    )
      return html``;

    return html`${msg('Amount')}: ${promise.entry.amount}`;
  }

  render() {
    return html` <sl-dialog .label=${msg('Satisfy Need')}>
      ${this.promises
        ? html`
            <form
              id="create-form"
              style="display: flex; flex: 1; flex-direction: column;"
              ${onSubmit(fields => this.createSatisfaction(fields))}
            >
              ${this.promises.length === 0
                ? html`
                    <span style="margin-bottom: 16px"
                      >${msg(
                        'Are you sure? There are no promises to contribute to this need yet.'
                      )}</span
                    >
                  `
                : html`
                    <span style="margin-bottom: 16px"
                      >${msg(
                        'Select the promises that satisfy this need.'
                      )}</span
                    >
                  `}
              ${this.promises.map(
                p =>
                  html`<sl-checkbox
                    style="margin-bottom: 16px"
                    name="${encodeHashToBase64(p.actionHash)}"
                    .checked=${true}
                  >
                    <div class="column">
                      <div
                        class="row"
                        style="align-items: center; margin-bottom: 16px"
                      >
                        <agent-avatar
                          .agentPubKey=${p.action.author}
                          style="margin-right: 8px"
                        ></agent-avatar>
                        ${p.entry.comment || msg('No comment')}.
                      </div>
                      ${this.renderAmount(p)}
                    </div>
                  </sl-checkbox>`
              )}

              <sl-button
                variant="primary"
                type="submit"
                .loading=${this.committing}
                >${msg('Satisfy Need')}</sl-button
              >
            </form>
          `
        : html``}
    </sl-dialog>`;
  }

  static styles = [sharedStyles];
}
