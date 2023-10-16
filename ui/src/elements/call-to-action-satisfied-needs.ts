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
  joinAsync,
} from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import { LitElement, TemplateResult, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CallToAction, Commitment, Need, Satisfaction } from '../types.js';
import './call-to-action-need-progress.js';
import './create-commitment.js';
import { CreateCommitment } from './create-commitment.js';
import './create-satisfaction.js';

/**
 * @element call-to-action-satisfied-needs
 */
@localized()
@customElement('call-to-action-satisfied-needs')
export class CallToActionSatisfiedNeeds extends LitElement {
  // REQUIRED. The hash of the CallToAction to show
  @property(hashProperty('call-to-action-hash'))
  callToActionHash!: ActionHash;

  @property()
  hideNeeds: Array<number> = [];

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
      joinAsync([
        this.assembleStore.callToActions.get(this.callToActionHash),
        this.assembleStore.commitmentsForCallToAction.get(
          this.callToActionHash
        ),
        this.assembleStore.satisfactionsForCallToAction.get(
          this.callToActionHash
        ),
      ]),
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
      <div class="class" style="gap: 8px">
        <div class="row" style="align-items: center; gap: 8px">
          <agent-avatar .agentPubKey=${commitment.action.author}></agent-avatar>
          <div class="column" style="gap: 8px">
            <span
              >${msg('committed to contribute')}${displayAmount
                ? html`&nbsp;${commitment.entry.amount}`
                : ''}</span
            >
            <span>${commitment.entry.comment || msg('No comment')}</span>
          </div>
        </div>
        <cancellations-for
          hide-no-cancellations-notice
          .cancelledHash=${commitment.actionHash}
        ></cancellations-for>
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
      return html`<span class="placeholder"
        >${msg('No one has contributed to this need yet.')}</span
      >`;

    return html`<div class="column" style="gap: 8px">
      ${commitmentsForThisNeed.map(commitment =>
        this.renderCommitment(
          commitment,
          !(
            callToAction.entry.needs[needIndex].min_necessary === 1 &&
            callToAction.entry.needs[needIndex].max_possible === 1
          )
        )
      )}
    </div>`;
  }

  renderMetNeeds(
    callToAction: EntryRecord<CallToAction>,
    needs: Array<[Need, number]>,
    commitments: Array<EntryRecord<Commitment>>,
    satisfactions: Array<EntryRecord<Satisfaction>>
  ) {
    if (needs.length === 0)
      return html`<span>${msg('There are no satisfied needs.')}</span>`;
    return needs.map(
      ([need, i]) => html`
        <sl-card style="flex: 1;">
          <div class="row " slot="header" style="align-items: center">
            <span class="title">${need.description} </span>
            ${need.min_necessary !== 1 || need.max_possible !== 1
              ? html`<call-to-action-need-progress
                  .callToActionHash=${this.callToActionHash}
                  .needIndex=${i}
                  style="flex: 1"
                ></call-to-action-need-progress>`
              : html``}
          </div>
          <div class="column" style="flex: 1; gap: 8px">
            <span>${msg('Commitments that satisfied the need:')}</span>
            ${commitments.filter(
              c =>
                c.entry.need_index === i &&
                satisfactions.find(
                  s =>
                    s.entry.need_index === i &&
                    s.entry.commitments_hashes.find(
                      ph => ph.toString() === c.actionHash.toString()
                    )
                )
            ).length > 0
              ? commitments
                  .filter(
                    c =>
                      c.entry.need_index === i &&
                      satisfactions.find(
                        s =>
                          s.entry.need_index === i &&
                          s.entry.commitments_hashes.find(
                            ph => ph.toString() === c.actionHash.toString()
                          )
                      )
                  )
                  .map(commitment =>
                    this.renderCommitment(
                      commitment,
                      callToAction.entry.needs[i].min_necessary !== 1 ||
                        callToAction.entry.needs[i].max_possible !== 1
                    )
                  )
              : html`<span class="placeholder"
                  >${msg('This need was satisfied with no commitments.')}</span
                >`}
            <span>${msg('Additional Commitments: ')}</span>
            ${commitments.filter(
              c =>
                c.entry.need_index === i &&
                !satisfactions.find(
                  s =>
                    s.entry.need_index === i &&
                    s.entry.commitments_hashes.find(
                      ph => ph.toString() === c.actionHash.toString()
                    )
                )
            ).length > 0
              ? commitments
                  .filter(
                    c =>
                      c.entry.need_index === i &&
                      !satisfactions.find(
                        s =>
                          s.entry.need_index === i &&
                          s.entry.commitments_hashes.find(
                            ph => ph.toString() === c.actionHash.toString()
                          )
                      )
                  )
                  .map(commitment =>
                    this.renderCommitment(
                      commitment,
                      callToAction.entry.needs[i].min_necessary !== 1 ||
                        callToAction.entry.needs[i].max_possible !== 1
                    )
                  )
              : html`<span class="placeholder"
                  >${msg('There are no additional commitments.')}</span
                >`}
            <sl-button
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
          <div class="column" style="gap: 8px">
            <sl-skeleton></sl-skeleton>
            <sl-skeleton></sl-skeleton>
            <sl-skeleton></sl-skeleton>
          </div>
        `;
      case 'complete':
        const callToAction = this._callToActionInfo.value.value[0];
        const commitments = this._callToActionInfo.value.value[1];
        const satisfactions = this._callToActionInfo.value.value[2];

        const metNeeds = callToAction.entry.needs
          .map((need, i) => [need, i])
          .filter(
            ([_need, i]) => !!satisfactions.find(s => s.entry.need_index === i)
          ) as Array<[Need, number]>;
        return html`
          <create-commitment .callToAction=${callToAction}></create-commitment>
          <div class="row" style="flex: 1; gap: 16px">
            <create-satisfaction
              .callToAction=${callToAction}
            ></create-satisfaction>
            ${this.renderMetNeeds(
              callToAction,
              metNeeds.filter(([need, i]) => !this.hideNeeds.includes(i)),
              commitments,
              satisfactions
            )}
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
