import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
import {
  AsyncReadable,
  StoreSubscriber,
  join,
} from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/relative-time/relative-time.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store';
import { assembleStoreContext } from '../context';
import {
  Commitment,
  CallToAction,
  Assembly,
  Satisfaction,
} from '../types';

/**
 * @element call-to-action-summary
 * @fires call-to-action-selected: detail will contain { callToActionHash }
 */
@localized()
@customElement('call-to-action-summary')
export class CallToActionSummary extends LitElement {
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
  _commitmentsAndSatisfactionsForCall = new StoreSubscriber(
    this,
    () =>
      join([
        this.assembleStore.commitmentsForCallToAction.get(this.callToActionHash),
        this.assembleStore.satisfactionsForCallToAction.get(
          this.callToActionHash
        ),
      ]) as AsyncReadable<
        [Array<EntryRecord<Commitment>>, Array<EntryRecord<Satisfaction>>]
      >
  );

  renderProgress(callToAction: EntryRecord<CallToAction>) {
    switch (this._commitmentsAndSatisfactionsForCall.value.status) {
      case 'pending':
        return html`<sl-skeleton></sl-skeleton>`;
      case 'complete':
        const commitments = this._commitmentsAndSatisfactionsForCall.value.value[0];
        const satisfactions =
          this._commitmentsAndSatisfactionsForCall.value.value[1];
        const needsCount = callToAction.entry.needs
          .filter(
            (_, index) => !satisfactions.find(s => s.entry.need_index === index)
          )
          .reduce((count, need) => count + need.min_necessary, 0);

        return html` <sl-progress-bar
          .value=${(100 *
            commitments.reduce(
              (count, commitment) => count + commitment.entry.amount,
              0
            )) /
          needsCount}
        ></sl-progress-bar>`;
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the progress of the call')}
          .error=${this._commitmentsAndSatisfactionsForCall.value.error.data.data}
        ></display-error>`;
    }
  }

  renderSummary(entryRecord: EntryRecord<CallToAction>) {
    return html`
      <div style="display: flex; flex-direction: column">
        <div class="row" style="align-items: center; margin-bottom: 8px">
          <span style="white-space: pre-line; flex: 1"
            >${entryRecord.entry.title}</span
          >
          <agent-avatar
            style="margin-left: 16px"
            .agentPubKey=${entryRecord.action.author}
          ></agent-avatar>
          <sl-relative-time
            class="placeholder"
            style="margin-left: 8px;"
            .date=${entryRecord.action.timestamp}
          ></sl-relative-time>
        </div>
        ${this.renderProgress(entryRecord)}
      </div>
    `;
  }

  renderCallToAction() {
    switch (this._callToAction.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        if (!this._callToAction.value.value)
          return html`<span
            >${msg("The requested call to action doesn't exist")}</span
          >`;

        return this.renderSummary(this._callToAction.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the call to action')}
          .error=${this._callToAction.value.error.data.data}
        ></display-error>`;
    }
  }

  render() {
    return html`<sl-card
      style="flex: 1; cursor: grab;"
      @click=${() =>
        this.dispatchEvent(
          new CustomEvent('call-to-action-selected', {
            composed: true,
            bubbles: true,
            detail: {
              callToActionHash: this.callToActionHash,
            },
          })
        )}
    >
      ${this.renderCallToAction()}
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
