import {
  hashProperty,
  notifyError,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/elements/display-error.js';
import {
  AsyncReadable,
  StoreSubscriber,
  join,
} from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiDelete, mdiPencil } from '@mdi/js';
import { decode } from '@msgpack/msgpack';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, TemplateResult, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CallPromise, CallToAction, Need, Satisfaction } from '../types.js';
import './create-promise.js';
import { CreatePromise } from './create-promise.js';
import './create-satisfaction.js';
import { CreateSatisfaction } from './create-satisfaction.js';
import './edit-call-to-action.js';

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
  _promisesAndSatisfactionsForCall = new StoreSubscriber(
    this,
    () =>
      join([
        this.assembleStore.promisesForCallToAction.get(this.callToActionHash),
        this.assembleStore.satisfactionsForCallToAction.get(
          this.callToActionHash
        ),
      ]) as AsyncReadable<
        [Array<EntryRecord<CallPromise>>, Array<EntryRecord<Satisfaction>>]
      >
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

  async createCollectiveCommitment(satisfactions_hashes: Array<ActionHash>) {
    try {
      await this.assembleStore.client.createCollectiveCommitment({
        call_to_action_hash: this.callToActionHash,
        satisfactions_hashes,
      });
    } catch (e) {
      notifyError(msg('Error accepting the promise'));
      console.error(e);
    }
  }

  renderPromisesForNeed(
    callToAction: EntryRecord<CallToAction>,
    needIndex: number,
    promises: Array<EntryRecord<CallPromise>>
  ) {
    const promisesForThisNeed = promises.filter(
      p => p.entry.need_index === needIndex
    );

    if (promisesForThisNeed.length === 0)
      return html`<span class="placeholder" style="margin-top: 8px"
        >${msg('No one has contributed to this need yet')}</span
      >`;

    return html`<div class="column">
      ${promisesForThisNeed.map(
        promise => html`
          <div class="row" style="align-items: center; margin-top: 8px">
            <agent-avatar .agentPubKey=${promise.action.author}></agent-avatar>
            <div class="column" style="margin-left: 8px">
              <span>${promise.entry.comment || msg('No comment')}</span>
              ${callToAction.entry.needs[needIndex].min_necessary === 1 &&
              callToAction.entry.needs[needIndex].max_possible === 1
                ? html``
                : html`
                    <span style="margin-top: 8px"
                      >${msg('Amount')}: ${promise.entry.amount}</span
                    >
                  `}
            </div>
          </div>
        `
      )}
    </div>`;
  }

  renderUnmetNeeds(
    callToAction: EntryRecord<CallToAction>,
    needs: Array<[Need, number]>,
    promises: Array<EntryRecord<CallPromise>>
  ) {
    if (needs.length === 0)
      return html`<span
        >${msg(
          'There are no unmet needs! This call to action has succeeded.'
        )}</span
      >`;

    return needs.map(
      ([need, i]) => html`
        <div class="column" style="margin-bottom: 16px;">
          <span style="white-space: pre-line; margin-bottom: 8px"
            >${need.description}</span
          >
          ${need.min_necessary !== 1 && need.max_possible !== 1
            ? html`<div class="row">
                <sl-progress-bar
                  style="flex: 1"
                  .value=${(100 *
                    promises
                      .filter(p => p.entry.need_index === i)
                      .reduce((count, p) => count + p.entry.amount, 0)) /
                  need.min_necessary}
                >
                </sl-progress-bar
                ><span style="margin-left: 8px">
                  ${promises
                    .filter(p => p.entry.need_index === i)
                    .reduce((count, p) => count + p.entry.amount, 0)}
                  ${msg('of')} ${need.min_necessary}
                </span>
              </div>`
            : html``}
          ${this.renderPromisesForNeed(callToAction, i, promises)}
          <sl-button
            style="margin-top: 16px"
            @click=${() => {
              const createPromise = this.shadowRoot?.querySelector(
                'create-promise'
              ) as CreatePromise;
              createPromise.needIndex = i;
              createPromise.show();
            }}
            >${msg('Contribute')}</sl-button
          >

          ${this.amIAuthor(callToAction)
            ? html`
                <sl-button
                  style="margin-top: 8px"
                  @click=${() => {
                    const createSatisfaction = this.shadowRoot?.querySelector(
                      'create-satisfaction'
                    ) as CreateSatisfaction;
                    createSatisfaction.needIndex = i;
                    createSatisfaction.promises = promises.filter(
                      p => p.entry.need_index === i
                    );
                    createSatisfaction.show();
                  }}
                  >${msg('Need is satisfied')}</sl-button
                >
              `
            : html``}
        </div>
        ${i < needs.length - 1 ? html` <sl-divider></sl-divider> ` : html``}
      `
    );
  }

  renderMetNeeds(
    callToAction: EntryRecord<CallToAction>,
    needs: Array<[Need, number]>,
    promises: Array<EntryRecord<CallPromise>>,
    satisfactions: Array<EntryRecord<Satisfaction>>
  ) {
    if (needs.length === 0)
      return html`<span>${msg('There are no satisfied needs yet.')}</span>`;
    return needs.map(
      ([need, i]) => html`
        <div class="column">
          <span style="white-space: pre-line; margin-bottom: 8px"
            >${need.description}</span
          >
          ${promises
            .filter(p =>
              satisfactions.find(
                s =>
                  s.entry.need_index === i &&
                  s.entry.promises_hashes.find(
                    ph => ph.toString() === p.actionHash.toString()
                  )
              )
            )
            .map(
              promise => html` <div class="row" style="align-items: center">
                <agent-avatar
                  .agentPubKey=${promise.action.author}
                ></agent-avatar>
                ${promise.entry.comment
                  ? html`
                      <span style="margin-left: 8px"
                        >${promise.entry.comment}</span
                      >
                    `
                  : html`
                      <span class="placeholder" style="margin-left: 8px"
                        >${msg('No comment')}</span
                      >
                    `}
              </div>`
            )}
          <sl-button
            style="margin-top: 16px"
            @click=${() => {
              const createPromise = this.shadowRoot?.querySelector(
                'create-promise'
              ) as CreatePromise;
              createPromise.needIndex = i;
              createPromise.show();
            }}
            >${msg('Contribute')}</sl-button
          >
        </div>

        ${i < needs.length - 1 ? html` <sl-divider></sl-divider> ` : html``}
      `
    );
  }

  renderNeeds(callToAction: EntryRecord<CallToAction>) {
    switch (this._promisesAndSatisfactionsForCall.value.status) {
      case 'pending':
        return html`
          <div class="column">
            <sl-skeleton></sl-skeleton>
            <sl-skeleton style="margin-top: 8px"></sl-skeleton>
            <sl-skeleton style="margin-top: 8px"></sl-skeleton>
          </div>
        `;
      case 'complete':
        const promises = this._promisesAndSatisfactionsForCall.value.value[0];
        const satisfactions =
          this._promisesAndSatisfactionsForCall.value.value[1];

        const unmetNeeds = callToAction.entry.needs
          .map((need, i) => [need, i])
          .filter(
            ([_need, i]) => !satisfactions.find(s => s.entry.need_index === i)
          ) as Array<[Need, number]>;
        const metNeeds = callToAction.entry.needs
          .map((need, i) => [need, i])
          .filter(
            ([_need, i]) => !!satisfactions.find(s => s.entry.need_index === i)
          ) as Array<[Need, number]>;
        return html`
          <div class="row" style="flex: 1">
            <create-satisfaction
              .callToAction=${callToAction}
              @satisfaction-created=${async (e: CustomEvent) => {
                if (unmetNeeds.length === 1) {
                  await this.createCollectiveCommitment([
                    ...satisfactions.map(s => s.actionHash),
                    e.detail.satisfactionHash,
                  ]);
                }
              }}
            ></create-satisfaction>
            <div class="column" style="flex: 1">
              <span style="margin-bottom: 8px"
                ><strong>${msg('Unmet Needs')}</strong></span
              >
              ${this.renderUnmetNeeds(callToAction, unmetNeeds, promises)}
            </div>
            <sl-divider vertical></sl-divider>

            <div class="column" style="flex: 1; margin-left: 16px">
              <span style="margin-bottom: 8px; "
                ><strong>${msg('Satisfied Needs')}</strong></span
              >
              ${this.renderMetNeeds(
                callToAction,
                metNeeds,
                promises,
                satisfactions
              )}
            </div>
          </div>
        `;
      case 'error':
        return html`<display-error
          .headline=${msg(
            'Error fetching the promises for this call to action'
          )}
          .error=${this._promisesAndSatisfactionsForCall.value.error.data.data}
        ></display-error>`;
    }
  }

  renderDetail(entryRecord: EntryRecord<CallToAction>) {
    return html`
      <create-promise .callToAction=${entryRecord}></create-promise>

      <sl-card>
        <div
          slot="header"
          style="display: flex; flex-direction: row; align-items: center"
        >
          <span style="font-size: 18px; flex: 1;"
            >${entryRecord.entry.title}</span
          >

          ${this.amIAuthor(entryRecord)
            ? html`
                <sl-icon-button
                  style="margin-left: 8px; display: none;"
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
          <div class="row" style="align-items: center; margin-bottom: 16px">
            <span>${msg('Created by')}</span>
            <agent-avatar
              .agentPubKey=${entryRecord.action.author}
              style="margin-left: 8px;"
            ></agent-avatar>
            <sl-relative-time
              style="margin-left: 8px;"
              .date=${entryRecord.action.timestamp}
            ></sl-relative-time>
          </div>
          ${this.renderCustomContent(decode(entryRecord.entry.custom_content))}

          <div
            style="display: flex; flex-direction: column; margin-bottom: 16px"
          >
            ${this.renderNeeds(entryRecord)}
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
