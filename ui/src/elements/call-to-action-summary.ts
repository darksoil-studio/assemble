import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
import {
  AsyncReadable,
  StoreSubscriber,
  join,
} from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash } from '@holochain/client';
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
import { CallToAction, Commitment, Satisfaction } from '../types';
import './call-to-action-progress.js';

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
  _callToAction = new StoreSubscriber(
    this,
    () => this.assembleStore.callToActions.get(this.callToActionHash),
    () => [this.callToActionHash]
  );

  /**
   * @internal
   */
  _commitmentsAndSatisfactionsForCall = new StoreSubscriber(
    this,
    () =>
      join([
        this.assembleStore.commitmentsForCallToAction.get(
          this.callToActionHash
        ),
        this.assembleStore.satisfactionsForCallToAction.get(
          this.callToActionHash
        ),
      ]) as AsyncReadable<
        [Array<EntryRecord<Commitment>>, Array<EntryRecord<Satisfaction>>]
      >,
    () => [this.callToActionHash]
  );

  renderSummary(entryRecord: EntryRecord<CallToAction>) {
    return html`
      <div style="display: flex; flex-direction: column">
        <div class="row" style="align-items: center; margin-bottom: 8px">
          <agent-avatar
            style="margin-left: 16px"
            .agentPubKey=${entryRecord.action.author}
          ></agent-avatar>
          <sl-relative-time
            class="placeholder"
            style="margin-left: 8px;"
            .date=${entryRecord.action.timestamp}
          ></sl-relative-time>
          ${entryRecord.entry.expiration_time
            ? html`
                <sl-relative-time
                  class="placeholder"
                  style="margin-left: 8px;"
                  .date=${entryRecord.entry.expiration_time / 1000}
                ></sl-relative-time>
              `
            : html``}
        </div>
        <call-to-action-progress
          .callToActionHash=${this.callToActionHash}
        ></call-to-action-progress>
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
