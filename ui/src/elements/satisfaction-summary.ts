import { LitElement, html } from 'lit';
import { state, property, customElement } from 'lit/decorators.js';
import { EntryHash, Record, ActionHash } from '@holochain/client';
import { EntryRecord } from '@holochain-open-dev/utils';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import { consume } from '@lit-labs/context';

import { localized, msg } from '@lit/localize';

import '@shoelace-style/shoelace/dist/components/card/card.js';

import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@holochain-open-dev/elements/elements/display-error.js';
import { AssembleStore } from '../assemble-store';
import { assembleStoreContext } from '../context';
import { Satisfaction } from '../types';

/**
 * @element satisfaction-summary
 * @fires satisfaction-selected: detail will contain { satisfactionHash }
 */
@localized()
@customElement('satisfaction-summary')
export class SatisfactionSummary extends LitElement {

  // REQUIRED. The hash of the Satisfaction to show
  @property(hashProperty('satisfaction-hash'))
  satisfactionHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  _satisfaction = new StoreSubscriber(this, () => this.assembleStore.satisfactions.get(this.satisfactionHash));

  renderSummary(entryRecord: EntryRecord<Satisfaction>) {
    return html`
      <div style="display: flex; flex-direction: column">

      </div>
    `;
  }
  
  renderSatisfaction() {
    switch (this._satisfaction.value.status) {
      case "pending":
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case "complete":
        if (!this._satisfaction.value.value) return html`<span>${msg("The requested satisfaction doesn't exist")}</span>`;

        return this.renderSummary(this._satisfaction.value.value);
      case "error":
        return html`<display-error
          .headline=${msg("Error fetching the satisfaction")}
          .error=${this._satisfaction.value.error.data.data}
        ></display-error>`;
    }
  }
  
  render() {
    return html`<sl-card style="flex: 1; cursor: grab;" @click=${() => this.dispatchEvent(new CustomEvent('satisfaction-selected', {
          composed: true,
          bubbles: true,
          detail: {
            satisfactionHash: this.satisfactionHash
          }
        }))}>
        ${this.renderSatisfaction()}
    </sl-card>`;
  }

  
  static styles = [sharedStyles];
}
