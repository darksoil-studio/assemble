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
  pipe,
  sliceAndJoin,
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
import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import { LitElement, TemplateResult, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CallToAction, Commitment, Need, Satisfaction } from '../types.js';
import './call-to-action-need-progress.js';
import './create-commitment.js';
import './commitment-detail.js';
import { CreateCommitment } from './create-commitment.js';
import './create-satisfaction.js';
import { CreateSatisfaction } from './create-satisfaction.js';
import { mdiInformationOutline } from '@mdi/js';

/**
 * @element call-to-action-unsatisfied-needs
 */
@localized()
@customElement('call-to-action-unsatisfied-needs')
export class CallToActionUnsatisfiedNeeds extends LitElement {
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
        pipe(
          this.assembleStore.uncancelledCommitmentsForCallToAction.get(
            this.callToActionHash
          ),
          hashes => sliceAndJoin(this.assembleStore.commitments, hashes)
        ),
        pipe(
          this.assembleStore.cancelledCommitmentsForCallToAction.get(
            this.callToActionHash
          ),
          hashes => sliceAndJoin(this.assembleStore.commitments, hashes)
        ),
        pipe(
          this.assembleStore.satisfactionsForCallToAction.get(
            this.callToActionHash
          ),
          hashes => sliceAndJoin(this.assembleStore.satisfactions, hashes)
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

  renderCommitmentsForNeed(
    needIndex: number,
    commitments: Array<EntryRecord<Commitment>>,
    emptyPlaceholder = msg('No one has contributed to this need yet.')
  ) {
    const commitmentsForThisNeed = commitments.filter(
      p => p.entry.need_index === needIndex
    );

    if (commitmentsForThisNeed.length === 0)
      return html` <span class="placeholder">${emptyPlaceholder}</span>`;

    return html`<div class="column" style="flex: 1">
      ${commitmentsForThisNeed.map(
        (commitment, i) =>
          html`<commitment-detail
              .commitmentHash=${commitment.actionHash}
            ></commitment-detail>
            ${i === commitmentsForThisNeed.length - 1
              ? html``
              : html` <sl-divider></sl-divider> `} `
      )}
    </div>`;
  }

  renderUnsatisfiedNeeds(
    callToAction: EntryRecord<CallToAction>,
    needs: Array<[Need, number]>,
    commitments: Array<EntryRecord<Commitment>>,
    cancelledCommitments: Array<EntryRecord<Commitment>>
  ) {
    if (needs.length === 0)
      return html` <div
        style="flex: 1; display: flex; align-items: center; flex-direction: column; margin: 48px; gap: 16px"
      >
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="font-size: 96px;"
          class="placeholder"
        ></sl-icon>
        <span class="placeholder"
          >${msg('There are no unsatisfied needs.')}</span
        >
      </div>`;

    return needs.map(
      ([need, i]) => html`
        <sl-card style="flex: 1;">
          <div class="row " slot="header" style="align-items: center">
            <span class="title">${need.description} </span>
            <call-to-action-need-progress
              .callToActionHash=${this.callToActionHash}
              .needIndex=${i}
              style="flex: 1"
            ></call-to-action-need-progress>
          </div>
          <div class="column" style="flex: 1">
            <sl-details .summary=${msg('Contributions')} open>
              <div class="column" style="flex: 1; gap: 8px">
                ${this.renderCommitmentsForNeed(i, commitments)}
                <div class="row" style="flex: 1; gap: 16px;">
                  ${this.amIAuthor(callToAction)
                    ? html`
                        <sl-button
                          style="flex: 1;"
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
                  <sl-button
                    style="flex: 1"
                    variant="primary"
                    @click=${() => {
                      const createCommitment = this.shadowRoot?.querySelector(
                        'create-commitment'
                      ) as CreateCommitment;
                      createCommitment.needIndex = i;
                      createCommitment.show();
                    }}
                    >${msg('Contribute')}</sl-button
                  >
                </div>
              </div>
            </sl-details>
            <sl-details .summary=${msg('Cancelled Commitments')}>
              <div class="column" style="flex: 1; gap: 8px">
                ${this.renderCommitmentsForNeed(
                  i,
                  cancelledCommitments,
                  msg('There are no cancelled commitments.')
                )}
              </div>
            </sl-details>
          </div>
        </sl-card>
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
        const cancelledCommitments = this._callToActionInfo.value.value[2];
        const satisfactions = this._callToActionInfo.value.value[3];

        const unsatisfiedNeeds = callToAction.entry.needs
          .map((need, i) => [need, i])
          .filter(
            ([_need, i]) =>
              !Array.from(satisfactions.values()).find(
                s => s.entry.need_index === i
              )
          ) as Array<[Need, number]>;
        return html`
          <create-commitment .callToAction=${callToAction}></create-commitment>
          <div class="row" style="flex: 1">
            <create-satisfaction
              .callToAction=${callToAction}
              @satisfaction-created=${async (e: CustomEvent) => {
                if (unsatisfiedNeeds.length === 1) {
                  await this.createAssembly([
                    ...Array.from(satisfactions.values()).map(
                      s => s.actionHash
                    ),
                    e.detail.satisfactionHash,
                  ]);
                }
              }}
            ></create-satisfaction>
            ${this.renderUnsatisfiedNeeds(
              callToAction,
              unsatisfiedNeeds.filter(
                ([need, i]) => !this.hideNeeds.includes(i)
              ),
              Array.from(commitments.values()),
              Array.from(cancelledCommitments.values())
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

  static styles = [
    sharedStyles,
    css`
      sl-card::part(body) {
        padding: 0 !important;
      }
      sl-details::part(base) {
        border-radius: 0px !important;
      }
    `,
  ];
}
