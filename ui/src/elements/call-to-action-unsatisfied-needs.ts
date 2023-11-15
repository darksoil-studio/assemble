import {
  hashProperty,
  notifyError,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import {
  StoreSubscriber,
  joinAsync,
  mapAndJoin,
  pipe,
} from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash } from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CallToAction, Commitment, Need } from '../types.js';
import './call-to-action-need-progress.js';
import './commitment-detail.js';
import './create-commitment.js';
import { CreateCommitment } from './create-commitment.js';
import './create-satisfaction.js';
import { CreateSatisfaction } from './create-satisfaction.js';

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
        this.assembleStore.callToActions.get(this.callToActionHash)
          .latestVersion,
        this.assembleStore.callToActions.get(this.callToActionHash).needs
          .unsatisfied,
        pipe(
          this.assembleStore.callToActions.get(this.callToActionHash)
            .commitments.uncancelled,
          m => mapAndJoin(m, c => c.entry)
        ),
        pipe(
          this.assembleStore.callToActions.get(this.callToActionHash)
            .commitments.cancelled,
          m => mapAndJoin(m, c => c.entry)
        ),
      ]),
    () => [this.callToActionHash]
  );

  /**
   * @internal
   */
  @state()
  _editing = false;

  canICreateSatisfactions(callToAction: EntryRecord<CallToAction>) {
    return (
      callToAction.action.author.toString() ===
        this.assembleStore.client.client.myPubKey.toString() ||
      !!callToAction.entry.admins.find(
        admin =>
          admin.toString() ===
          this.assembleStore.client.client.myPubKey.toString()
      )
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
          style="font-size: 64px; color: grey"
        ></sl-icon>
        <span class="placeholder"
          >${msg('There are no unsatisfied needs.')}</span
        >
      </div>`;

    return needs.map(
      ([need, i]) => html`
        <sl-card style="flex: 1;">
          <div
            class="row "
            slot="header"
            style="align-items: center; gap: 16px"
          >
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
                <div class="row" style="flex: 1; gap: 16px">
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
                  ${need.requires_admin_approval &&
                  this.canICreateSatisfactions(callToAction)
                    ? html`
                        <sl-button
                          style="flex: 1"
                          @click=${() => {
                            const createSatisfaction =
                              this.shadowRoot?.querySelector(
                                'create-satisfaction'
                              ) as CreateSatisfaction;
                            createSatisfaction.needIndex = i;
                            createSatisfaction.commitments = commitments.filter(
                              c => c.entry.need_index === i
                            );
                            createSatisfaction.show();
                          }}
                          >${msg('Satisfy Need')}</sl-button
                        >
                      `
                    : html``}
                </div>
              </div>
            </sl-details>
            <sl-details
              .summary=${`${msg('Cancelled Commitments')} (${
                cancelledCommitments.length
              })`}
            >
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
          <div class="column" style="gap: 16px">
            ${Array(3)
              .fill(0)
              .map(
                () =>
                  html`
                    <sl-skeleton
                      style="height: 200px; --border-radius: 8px"
                    ></sl-skeleton>
                  `
              )}
          </div>
        `;
      case 'complete':
        const callToAction = this._callToActionInfo.value.value[0];
        const unsatisfiedNeeds = this._callToActionInfo.value.value[1];
        const commitments = this._callToActionInfo.value.value[2];
        const cancelledCommitments = this._callToActionInfo.value.value[3];

        return html`
          <create-commitment .callToAction=${callToAction}></create-commitment>
          <create-satisfaction
            .callToAction=${callToAction}
          ></create-satisfaction>
          <div class="column" style="flex: 1; gap: 16px">
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
          .error=${this._callToActionInfo.value.error}
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
