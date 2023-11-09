import '@holochain-open-dev/cancellations/dist/elements/cancellation-detail.js';
import '@holochain-open-dev/cancellations/dist/elements/cancellations-for.js';
import '@holochain-open-dev/cancellations/dist/elements/create-cancellation-dialog.js';
import { CreateCancellationDialog } from '@holochain-open-dev/cancellations/dist/elements/create-cancellation-dialog.js';
import {
  hashProperty,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { StoreSubscriber, joinAsync, pipe } from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiCancel } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { CallToAction, Commitment } from '../types.js';

/**
 * @element commitment-detail
 * @fires commitment-deleted: detail will contain { commitmentHash }
 */
@localized()
@customElement('commitment-detail')
export class CommitmentDetail extends LitElement {
  // REQUIRED. The hash of the Commitment to show
  @property(hashProperty('commitment-hash'))
  commitmentHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  @property()
  hideAvatar: boolean = false;

  @property()
  showNeed: boolean = false;

  /**
   * @internal
   */
  _commitment = new StoreSubscriber(
    this,
    () =>
      joinAsync([
        pipe(
          this.assembleStore.commitments.get(this.commitmentHash).entry,
          commitment =>
            this.assembleStore.callToActions.get(
              commitment.entry.call_to_action_hash
            ).latestVersion,
          (callToAction, commitment) =>
            [callToAction, commitment] as [
              EntryRecord<CallToAction>,
              EntryRecord<Commitment>
            ]
        ),
        this.assembleStore.cancellationsStore.cancellationsFor.get(
          this.commitmentHash
        ).live,
      ]),
    () => [this.commitmentHash]
  );

  renderDetail(
    commitment: EntryRecord<Commitment>,
    callToAction: EntryRecord<CallToAction>,
    cancellations: ActionHash[]
  ) {
    const need = callToAction.entry.needs[commitment.entry.need_index];
    const displayAmount = !(
      need.max_possible === 1 && need.min_necessary === 1
    );
    return html`
      <create-cancellation-dialog
        .label=${msg('Cancel Contribution')}
        .warning=${msg('This will notify all event participants.')}
        .cancelledHash=${commitment.actionHash}
      >
      </create-cancellation-dialog>
      <div class="column" style="gap: 16px">
        <div class="row" style="align-items: center; gap: 16px; ">
          ${this.hideAvatar
            ? html``
            : html`
                <agent-avatar
                  .agentPubKey=${commitment.action.author}
                ></agent-avatar>
              `}
          <div class="column" style="gap: 8px; flex: 1">
            <span
              >${msg('Committed to contribute')}${displayAmount
                ? html`&nbsp;${commitment.entry.amount}`
                : ''}${this.showNeed ? ` "${need.description}"` : ``}</span
            >
            <span class="placeholder"
              >${commitment.entry.comment || msg('No comment')}</span
            >
          </div>
          ${commitment.action.author.toString() ===
            this.assembleStore.client.client.myPubKey.toString() &&
          cancellations.length === 0
            ? html`
                <sl-button
                  variant="warning"
                  @click=${() =>
                    (
                      this.shadowRoot?.querySelector(
                        'create-cancellation-dialog'
                      ) as CreateCancellationDialog
                    ).show()}
                >
                  <sl-icon
                    slot="prefix"
                    .src=${wrapPathInSvg(mdiCancel)}
                  ></sl-icon
                  >${msg('Cancel')}</sl-button
                >
              `
            : html``}
        </div>
        <cancellations-for
          .label=${msg('Contribution was cancelled')}
          hide-no-cancellations-notice="true"
          .cancelledHash=${commitment.actionHash}
        ></cancellations-for>
      </div>
    `;
  }

  render() {
    switch (this._commitment.value.status) {
      case 'pending':
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case 'complete':
        const callToAction = this._commitment.value.value[0][0];
        const commitment = this._commitment.value.value[0][1];
        const cancellations = this._commitment.value.value[1];

        return this.renderDetail(commitment, callToAction, cancellations);
      case 'error':
        return html`<sl-card>
          <display-error
            tooltip
            .headline=${msg('Error fetching the commitment')}
            .error=${this._commitment.value.error}
          ></display-error>
        </sl-card>`;
    }
  }

  static styles = [sharedStyles];
}
