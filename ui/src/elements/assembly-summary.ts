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
import { Assembly } from '../types';

/**
 * @element assembly-summary
 * @fires assembly-selected: detail will contain { assemblyHash }
 */
@localized()
@customElement('assembly-summary')
export class AssemblySummary extends LitElement {
  // REQUIRED. The hash of the Assembly to show
  @property(hashProperty('assembly-hash'))
  assemblyHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  _assembly = new StoreSubscriber(
    this,
    () => this.assembleStore.assemblies.get(this.assemblyHash),
    () => [this.assemblyHash]
  );

  renderSummary(entryRecord: EntryRecord<Assembly>) {
    return html`
      <div style="display: flex; flex-direction: column">
        <call-to-action-summary
          .callToActionHash=${entryRecord.entry.call_to_action_hash}
          @call-to-action-selected=${(e: CustomEvent) => {
            e.stopPropagation();
            this.dispatchEvent(
              new CustomEvent('assembly-selected', {
                composed: true,
                bubbles: true,
                detail: {
                  assemblyHash: this.assemblyHash,
                },
              })
            );
          }}
        ></call-to-action-summary>
      </div>
    `;
  }

  render() {
    switch (this._assembly.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        if (!this._assembly.value.value)
          return html`<span
            >${msg("The requested collective commitment doesn't exist")}</span
          >`;

        return this.renderSummary(this._assembly.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the collective commitment')}
          .error=${this._assembly.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
