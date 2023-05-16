import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash, EntryHash, Record } from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store';
import { assembleStoreContext } from '../context';
import { Commitment } from '../types';

/**
 * @element commitment-summary
 * @fires commitment-selected: detail will contain { commitmentHash }
 */
@localized()
@customElement('commitment-summary')
export class CommitmentSummary extends LitElement {
  // REQUIRED. The hash of the Commitment to show
  @property(hashProperty('commitment-hash'))
  commitmentHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  _commitment = new StoreSubscriber(
    this,
    () => this.assembleStore.commitments.get(this.commitmentHash),
    () => [this.commitmentHash]
  );

  renderSummary(entryRecord: EntryRecord<Commitment>) {
    return html`
      <div style="display: flex; flex-direction: column">
        <div style="display: flex; flex-direction: column; margin-bottom: 16px">
          <span style="margin-bottom: 8px"
            ><strong>${msg('Description')}:</strong></span
          >
          <span style="white-space: pre-line"
            >${entryRecord.entry.comment}</span
          >
        </div>
      </div>
    `;
  }

  renderCommitment() {
    switch (this._commitment.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        if (!this._commitment.value.value)
          return html`<span
            >${msg("The requested commitment doesn't exist")}</span
          >`;

        return this.renderSummary(this._commitment.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the commitment')}
          .error=${this._commitment.value.error.data.data}
        ></display-error>`;
    }
  }

  render() {
    return html`<sl-card
      style="flex: 1; cursor: grab;"
      @click=${() =>
        this.dispatchEvent(
          new CustomEvent('commitment-selected', {
            composed: true,
            bubbles: true,
            detail: {
              commitmentHash: this.commitmentHash,
            },
          })
        )}
    >
      ${this.renderCommitment()}
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
