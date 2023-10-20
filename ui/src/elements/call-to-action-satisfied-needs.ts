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
import { mdiInformationOutline } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import { LitElement, PropertyValueMap, TemplateResult, css, html } from 'lit';
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
        pipe(
          this.assembleStore.uncancelledCommitmentsForCallToAction.get(
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

  renderContributeButton(
    needIndex: number,
    disabledReason: string | undefined
  ) {
    const button = html`
      <sl-button
        .disabled=${!!disabledReason}
        @click=${() => {
          const createCommitment = this.shadowRoot?.querySelector(
            'create-commitment'
          ) as CreateCommitment;
          createCommitment.needIndex = needIndex;
          createCommitment.show();
        }}
        >${msg('Contribute')}</sl-button
      >
    `;

    if (disabledReason)
      return html`<sl-tooltip .content=${disabledReason}
        >${button}</sl-tooltip
      >`;
    return button;
  }

  renderSatisfiedNeeds(
    needs: Array<[Need, number]>,
    commitments: Array<EntryRecord<Commitment>>,
    satisfactions: Array<EntryRecord<Satisfaction>>
  ) {
    if (needs.length === 0)
      return html` <div
        style="display: flex; align-items: center; flex: 1; flex-direction: column; margin: 48px; gap: 16px"
      >
        <sl-icon
          .src=${wrapPathInSvg(mdiInformationOutline)}
          style="font-size: 64px; color: grey"
        ></sl-icon>
        <span class="placeholder">${msg('There are no satisfied needs.')}</span>
      </div>`;

    return needs.map(
      ([need, i]) => html`
        <sl-card class="column" style="flex: 1;">
          <div
            class="row "
            slot="header"
            style="align-items: center; gap: 16px"
          >
            <span class="title">${need.description} </span>
            ${need.min_necessary === 1 && need.max_possible === 1
              ? html`<span style="flex: 1"></span
                  ><span>${msg('Only one.')}</span>`
              : html`
                  <call-to-action-need-progress
                    .callToActionHash=${this.callToActionHash}
                    .needIndex=${i}
                    style="flex: 1"
                  ></call-to-action-need-progress>
                `}
          </div>
          <div class="column" style="flex: 1">
            ${need.requires_admin_approval
              ? html`
                  <sl-details .summary=${msg('Satisfied By')} open>
                    <div class="column" style="flex: 1; gap: 8px">
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
                                      ph =>
                                        ph.toString() ===
                                        c.actionHash.toString()
                                    )
                                )
                            )
                            .map(
                              commitment =>
                                html`<commitment-detail
                                  .commitmentHash=${commitment.actionHash}
                                ></commitment-detail>`
                            )
                        : html`<span class="placeholder"
                            >${msg(
                              'This need was satisfied with no contributions.'
                            )}</span
                          >`}
                    </div>
                  </sl-details>
                  <sl-details .summary=${msg('Additional Contributions')}>
                    <div class="column" style="flex: 1; gap: 8px">
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
                                      ph =>
                                        ph.toString() ===
                                        c.actionHash.toString()
                                    )
                                )
                            )
                            .map(
                              commitment =>
                                html`<commitment-detail
                                  .commitmentHash=${commitment.actionHash}
                                ></commitment-detail>`
                            )
                        : html`<span class="placeholder"
                            >${msg(
                              'There are no additional contributions.'
                            )}</span
                          >`}
                      <sl-button
                        @click=${() => {
                          const createCommitment =
                            this.shadowRoot?.querySelector(
                              'create-commitment'
                            ) as CreateCommitment;
                          createCommitment.needIndex = i;
                          createCommitment.show();
                        }}
                        >${msg('Contribute')}</sl-button
                      >
                    </div></sl-details
                  >
                `
              : html`
                  <div class="column" style="flex: 1; gap: 8px; margin: 16px">
                    ${commitments.filter(c => c.entry.need_index === i).length >
                    0
                      ? commitments
                          .filter(c => c.entry.need_index === i)
                          .map(
                            commitment =>
                              html`<commitment-detail
                                .commitmentHash=${commitment.actionHash}
                              ></commitment-detail>`
                          )
                      : html`<span class="placeholder"
                          >${msg('There are no contributions yet.')}</span
                        >`}
                    ${this.renderContributeButton(
                      i,
                      !!need.max_possible &&
                        commitments
                          .filter(c => c.entry.need_index === i)
                          .reduce((acc, next) => acc + next.entry.amount, 0) >=
                          need.max_possible
                        ? msg('Max. possible contributions reached')
                        : undefined
                    )}
                  </div>
                `}
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
        const satisfactions = this._callToActionInfo.value.value[2];

        const satisfiedNeeds = callToAction.entry.needs
          .map((need, i) => [need, i] as [Need, number])
          .filter(
            ([need, i]) =>
              need.min_necessary === 0 ||
              !!Array.from(satisfactions.values()).find(
                s => s.entry.need_index === i
              )
          ) as Array<[Need, number]>;
        return html`
          <create-commitment .callToAction=${callToAction}></create-commitment>
          <create-satisfaction
            .callToAction=${callToAction}
          ></create-satisfaction>
          <div class="column" style="flex: 1; gap: 16px">
            ${this.renderSatisfiedNeeds(
              satisfiedNeeds.filter(([need, i]) => !this.hideNeeds.includes(i)),
              Array.from(commitments.values()),
              Array.from(satisfactions.values())
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
