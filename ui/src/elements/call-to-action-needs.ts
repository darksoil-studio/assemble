import {
  hashProperty,
  notifyError,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
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
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, TemplateResult, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { Commitment, CallToAction, Need, Satisfaction } from '../types.js';
import './create-commitment.js';
import { CreateCommitment } from './create-commitment.js';
import './create-satisfaction.js';
import { CreateSatisfaction } from './create-satisfaction.js';

/**
 * @element call-to-action-needs
 */
@localized()
@customElement('call-to-action-needs')
export class CallToActionNeeds extends LitElement {
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
  _callToActionInfo = new StoreSubscriber(
    this,
    () =>
      join([
        this.assembleStore.callToActions.get(this.callToActionHash),
        this.assembleStore.commitmentsForCallToAction.get(
          this.callToActionHash
        ),
        this.assembleStore.satisfactionsForCallToAction.get(
          this.callToActionHash
        ),
      ]) as AsyncReadable<
        [
          EntryRecord<CallToAction> | undefined,
          Array<EntryRecord<Commitment>>,
          Array<EntryRecord<Satisfaction>>
        ]
      >,
    () => [this.callToActionHash]
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

  async createAssembly(satisfactions_hashes: Array<ActionHash>) {
    try {
      const assembly = await this.assembleStore.client.createAssembly({
        call_to_action_hash: this.callToActionHash,
        satisfactions_hashes,
      });
      this.dispatchEvent(
        new CustomEvent('assembly-created', {
          bubbles: true,
          composed: true,
          detail: {
            assemblyHash: assembly.actionHash,
          },
        })
      );
    } catch (e) {
      notifyError(msg('Error accepting the commitment'));
      console.error(e);
    }
  }

  renderCommitment(
    commitment: EntryRecord<Commitment>,
    displayAmount: boolean
  ) {
    return html`
      <div class="row" style="align-items: center; margin-bottom: 8px">
        <agent-avatar .agentPubKey=${commitment.action.author}></agent-avatar>
        <div class="column" style="margin-left: 8px">
          <span>${commitment.entry.comment || msg('No comment')}</span>
          ${displayAmount
            ? html`
                <span style="margin-top: 8px"
                  >${msg('Amount')}: ${commitment.entry.amount}</span
                >
              `
            : html``}
        </div>
      </div>
    `;
  }

  renderCommitmentsForNeed(
    callToAction: EntryRecord<CallToAction>,
    needIndex: number,
    commitments: Array<EntryRecord<Commitment>>
  ) {
    const commitmentsForThisNeed = commitments.filter(
      p => p.entry.need_index === needIndex
    );

    if (commitmentsForThisNeed.length === 0)
      return html`<span class="placeholder" style="margin-top: 8px"
        >${msg('No one has contributed to this need yet.')}</span
      >`;

    return html`<div class="column">
      ${commitmentsForThisNeed.map(commitment =>
        this.renderCommitment(
          commitment,
          !(
            callToAction.entry.needs[needIndex].min_necessary === 1 ||
            callToAction.entry.needs[needIndex].max_possible === 1
          )
        )
      )}
    </div>`;
  }

  renderUnmetNeeds(
    callToAction: EntryRecord<CallToAction>,
    needs: Array<[Need, number]>,
    commitments: Array<EntryRecord<Commitment>>
  ) {
    if (needs.length === 0)
      return html`<span
        >${msg(
          'There are no unmet needs! This call to action has succeeded.'
        )}</span
      >`;

    return needs.map(
      ([need, i]) => html`
        <sl-card style="margin-bottom: 16px">
          <div class="row " slot="header" style="align-items: center">
            <span class="title">${need.description} </span>
            ${need.min_necessary !== 1 || need.max_possible !== 1
              ? this.renderNeedProgress(i, need, commitments)
              : html``}
          </div>
          <div class="column" style="flex: 1">
            ${this.renderCommitmentsForNeed(callToAction, i, commitments)}
            <div class="row" style="flex: 1; margin-top: 16px">
              <sl-button
                style="flex: 1"
                @click=${() => {
                  const createCommitment = this.shadowRoot?.querySelector(
                    'create-commitment'
                  ) as CreateCommitment;
                  createCommitment.needIndex = i;
                  createCommitment.show();
                }}
                >${msg('Contribute')}</sl-button
              >

              ${this.amIAuthor(callToAction)
                ? html`
                    <sl-button
                      style="flex: 1; margin-left: 16px"
                      @click=${() => {
                        const createSatisfaction =
                          this.shadowRoot?.querySelector(
                            'create-satisfaction'
                          ) as CreateSatisfaction;
                        createSatisfaction.needIndex = i;
                        createSatisfaction.commitments = commitments.filter(
                          p => p.entry.need_index === i
                        );
                        createSatisfaction.show();
                      }}
                      >${msg('Need is satisfied')}</sl-button
                    >
                  `
                : html``}
            </div>
          </div>
        </sl-card>
      `
    );
  }

  renderNeedProgress(
    needIndex: number,
    need: Need,
    commitments: Array<EntryRecord<Commitment>>
  ) {
    const amountContributed = commitments
      .filter(p => p.entry.need_index === needIndex)
      .reduce((count, p) => count + p.entry.amount, 0);
    return html`
      <div class="row" style="flex: 1; margin-left: 16px; position: relative">
        <sl-progress-bar
          style="flex: 1; --indicator-color: ${need.min_necessary === 0 ||
          amountContributed >= need.min_necessary
            ? 'green'
            : 'var(--sl-color-primary-700)'}"
          .value=${(100 * amountContributed) /
          (need.max_possible ? need.max_possible : need.min_necessary)}
        >
          ${commitments
            .filter(p => p.entry.need_index === needIndex)
            .reduce((count, p) => count + p.entry.amount, 0)}
        </sl-progress-bar>

        ${need.min_necessary !== need.max_possible
          ? html`
              ${need.min_necessary !== 0
                ? html`
                    <sl-tooltip
                      open
                      trigger="manual"
                      .content=${`${msg('Min.')} ${need.min_necessary}`}
                    >
                      <span
                        style="position: absolute; top: 0; left: ${need.max_possible
                          ? (100 * need.min_necessary) / need.max_possible
                          : 100}%; background-color: grey; width: 1px; height: 100%"
                      ></span>
                    </sl-tooltip>
                  `
                : html``}
              ${need.max_possible
                ? html`
                    <sl-tooltip
                      open
                      trigger="manual"
                      .content=${`${msg('Max.')} ${need.max_possible}`}
                    >
                      <span
                        style="position: absolute; top: 0; left: 100%;"
                      ></span>
                    </sl-tooltip>
                  `
                : html``}
            `
          : html`
              <sl-tooltip
                open
                trigger="manual"
                .content=${`${msg('Min. and Max.')} ${need.max_possible}`}
              >
                <span style="position: absolute; top: 0; left: 100%;"></span>
              </sl-tooltip>
            `}
      </div>
    `;
  }

  renderMetNeeds(
    callToAction: EntryRecord<CallToAction>,
    needs: Array<[Need, number]>,
    commitments: Array<EntryRecord<Commitment>>,
    satisfactions: Array<EntryRecord<Satisfaction>>
  ) {
    if (needs.length === 0)
      return html`<span style="margin-top: 16px"
        >${msg('There are no satisfied needs yet.')}</span
      >`;
    return needs.map(
      ([need, i]) => html`
        <sl-card>
          <div class="row " slot="header" style="align-items: center">
            <span class="title">${need.description} </span>
            ${need.min_necessary !== 1 || need.max_possible !== 1
              ? this.renderNeedProgress(
                  i,
                  need,
                  commitments.filter(p =>
                    satisfactions.find(
                      s =>
                        s.entry.need_index === i &&
                        s.entry.commitments_hashes.find(
                          ph => ph.toString() === p.actionHash.toString()
                        )
                    )
                  )
                )
              : html``}
          </div>
          <div class="column" style="flex: 1">
            <span style="margin-bottom: 8px"
              >${msg('Commitments that satisfied the need:')}</span
            >
            ${commitments.filter(p =>
              satisfactions.find(
                s =>
                  s.entry.need_index === i &&
                  s.entry.commitments_hashes.find(
                    ph => ph.toString() === p.actionHash.toString()
                  )
              )
            ).length > 0
              ? commitments
                  .filter(p =>
                    satisfactions.find(
                      s =>
                        s.entry.need_index === i &&
                        s.entry.commitments_hashes.find(
                          ph => ph.toString() === p.actionHash.toString()
                        )
                    )
                  )
                  .map(commitment =>
                    this.renderCommitment(
                      commitment,
                      !(
                        callToAction.entry.needs[i].min_necessary === 1 ||
                        callToAction.entry.needs[i].max_possible === 1
                      )
                    )
                  )
              : html`<span class="placeholder"
                  >${msg('This need was satisfied with no commitments.')}</span
                >`}
            <span style="margin-top: 16px; margin-bottom: 8px"
              >${msg('Additional Commitments: ')}</span
            >
            ${commitments.filter(
              p =>
                !satisfactions.find(
                  s =>
                    s.entry.need_index === i &&
                    s.entry.commitments_hashes.find(
                      ph => ph.toString() === p.actionHash.toString()
                    )
                )
            ).length > 0
              ? commitments
                  .filter(
                    p =>
                      !satisfactions.find(
                        s =>
                          s.entry.need_index === i &&
                          s.entry.commitments_hashes.find(
                            ph => ph.toString() === p.actionHash.toString()
                          )
                      )
                  )
                  .map(commitment =>
                    this.renderCommitment(
                      commitment,
                      !(
                        callToAction.entry.needs[i].min_necessary === 1 ||
                        callToAction.entry.needs[i].max_possible === 1
                      )
                    )
                  )
              : html`<span class="placeholder" style="margin-top: 8px"
                  >${msg('There are no additional commitments.')}</span
                >`}
            <sl-button
              style="margin-top: 16px"
              @click=${() => {
                const createCommitment = this.shadowRoot?.querySelector(
                  'create-commitment'
                ) as CreateCommitment;
                createCommitment.needIndex = i;
                createCommitment.show();
              }}
              >${msg('Contribute')}</sl-button
            >
          </div></sl-card
        >
      `
    );
  }

  render() {
    switch (this._callToActionInfo.value.status) {
      case 'pending':
        return html`
          <div class="column">
            <sl-skeleton></sl-skeleton>
            <sl-skeleton style="margin-top: 8px"></sl-skeleton>
            <sl-skeleton style="margin-top: 8px"></sl-skeleton>
          </div>
        `;
      case 'complete':
        const callToAction = this._callToActionInfo.value.value[0];
        const commitments = this._callToActionInfo.value.value[1];
        const satisfactions = this._callToActionInfo.value.value[2];

        if (!callToAction)
          return html`<span
            >${msg('The requested call to action was not found.')}</span
          >`;

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
          <create-commitment .callToAction=${callToAction}></create-commitment>
          <div class="row" style="flex: 1">
            <create-satisfaction
              .callToAction=${callToAction}
              @satisfaction-created=${async (e: CustomEvent) => {
                if (unmetNeeds.length === 1) {
                  await this.createAssembly([
                    ...satisfactions.map(s => s.actionHash),
                    e.detail.satisfactionHash,
                  ]);
                }
              }}
            ></create-satisfaction>
            <div class="column" style="flex: 1">
              <span style="margin-top: 24px; margin-bottom: 16px"
                ><strong>${msg('Unmet Needs')}</strong></span
              >
              ${this.renderUnmetNeeds(callToAction, unmetNeeds, commitments)}
            </div>

            <div class="column" style="flex: 1; margin-left: 16px">
              <span style="margin-top: 24px; margin-bottom: 16px"
                ><strong>${msg('Satisfied Needs')}</strong></span
              >
              ${this.renderMetNeeds(
                callToAction,
                metNeeds,
                commitments,
                satisfactions
              )}
            </div>
          </div>
        `;
      case 'error':
        return html`<display-error
          .headline=${msg(
            'Error fetching the commitments for this call to action'
          )}
          .error=${this._callToActionInfo.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
