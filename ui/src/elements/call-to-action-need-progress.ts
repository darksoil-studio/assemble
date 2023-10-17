import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
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
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CallToAction, Commitment, Need, Satisfaction } from '../types.js';

/**
 * @element call-to-action-need-progress
 */
@localized()
@customElement('call-to-action-need-progress')
export class CallToActionNeedProgress extends LitElement {
  // REQUIRED. The hash of the CallToAction to show
  @property(hashProperty('call-to-action-hash'))
  callToActionHash!: ActionHash;

  // REQUIRED. The index of the need to display the progress for
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
    () => [this.callToActionHash, this.needIndex]
  );

  showBar(callToAction: EntryRecord<CallToAction>): boolean {
    const need: Need = callToAction.entry.needs[this.needIndex];
    return (
      need.max_possible !== undefined &&
      !(need.min_necessary === 1 && need.max_possible)
    );
  }

  renderNeedProgress(
    callToAction: EntryRecord<CallToAction>,
    commitments: Array<EntryRecord<Commitment>>,
    satisfactions: Array<EntryRecord<Satisfaction>>
  ) {
    const need: Need = callToAction.entry.needs[this.needIndex];

    const satisfied = !!satisfactions.find(
      s => s.entry.need_index === this.needIndex
    );

    if (need.min_necessary === 1 && need.max_possible === 1)
      return html`<div class="row" style="flex: 1">
        <span style="flex: 1"></span><span>${msg('Only one.')}</span>
      </div>`;
    if (need.min_necessary === 0 && !need.max_possible)
      return html`<div class="row" style="flex: 1">
        <span style="flex: 1"></span><span>${msg('No min. or max.')}</span>
      </div>`;

    const amountContributed = commitments
      .filter(p => p.entry.need_index === this.needIndex)
      .reduce((count, p) => count + p.entry.amount, 0);
    return html`
      <div class="row" style="flex: 1; margin-left: 16px; position: relative">
        <sl-progress-bar
          style="flex: 1; --indicator-color: ${satisfied ||
          need.min_necessary === 0 ||
          amountContributed >= need.min_necessary
            ? 'green'
            : 'var(--sl-color-primary-700)'}"
          .value=${(100 * amountContributed) /
          (need.max_possible ? need.max_possible : need.min_necessary)}
        >
          ${commitments
            .filter(p => p.entry.need_index === this.needIndex)
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

  render() {
    switch (this._callToActionInfo.value.status) {
      case 'pending':
        return html` <sl-skeleton></sl-skeleton> `;
      case 'complete':
        const callToAction = this._callToActionInfo.value.value[0];
        const commitments = Array.from(
          this._callToActionInfo.value.value[1].values()
        );
        const satisfactions = Array.from(
          this._callToActionInfo.value.value[2].values()
        );

        if (!callToAction)
          return html`<span
            >${msg('The requested call to action was not found.')}</span
          >`;

        return this.renderNeedProgress(
          callToAction,
          commitments,
          satisfactions
        );
      case 'error':
        return html`<display-error
          tooltip
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
      sl-tooltip {
        --sl-z-index-tooltip: 0;
      }
    `,
  ];
}
