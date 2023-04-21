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
import { CollectiveCommitment } from '../types';

/**
 * @element collective-commitment-summary
 * @fires collective-commitment-selected: detail will contain { collectiveCommitmentHash }
 */
@localized()
@customElement('collective-commitment-summary')
export class CollectiveCommitmentSummary extends LitElement {
  // REQUIRED. The hash of the CollectiveCommitment to show
  @property(hashProperty('collective-commitment-hash'))
  collectiveCommitmentHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  _collectiveCommitment = new StoreSubscriber(this, () =>
    this.assembleStore.collectiveCommitments.get(this.collectiveCommitmentHash)
  );

  renderSummary(entryRecord: EntryRecord<CollectiveCommitment>) {
    return html`
      <div style="display: flex; flex-direction: column">
        <call-to-action-summary
          .callToActionHash=${entryRecord.entry.call_to_action_hash}
          @call-to-action-selected=${(e: CustomEvent) => {
            e.stopPropagation();
            this.dispatchEvent(
              new CustomEvent('collective-commitment-selected', {
                composed: true,
                bubbles: true,
                detail: {
                  collectiveCommitmentHash: this.collectiveCommitmentHash,
                },
              })
            );
          }}
        ></call-to-action-summary>
      </div>
    `;
  }

  render() {
    switch (this._collectiveCommitment.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        if (!this._collectiveCommitment.value.value)
          return html`<span
            >${msg("The requested collective commitment doesn't exist")}</span
          >`;

        return this.renderSummary(this._collectiveCommitment.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the collective commitment')}
          .error=${this._collectiveCommitment.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
