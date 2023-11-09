import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { StoreSubscriber } from '@holochain-open-dev/stores';
import { EntryRecord } from '@holochain-open-dev/utils';
import { ActionHash } from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { Assembly } from '../types.js';

/**
 * @element assembly-detail
 * @fires assembly-deleted: detail will contain { assemblyHash }
 */
@localized()
@customElement('assembly-detail')
export class AssemblyDetail extends LitElement {
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

  renderDetail(entryRecord: EntryRecord<Assembly>) {
    return html`
      <sl-card>
        <div slot="header" style="display: flex; flex-direction: row">
          <span style="font-size: 18px; flex: 1;">${msg('Assembly')}</span>
        </div>

        <div style="display: flex; flex-direction: column"></div>
      </sl-card>
    `;
  }

  render() {
    switch (this._assembly.value.status) {
      case 'pending':
        return html`<sl-card>
          <div
            style="display: flex; flex: 1; align-items: center; justify-content: center"
          >
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
          </div>
        </sl-card>`;
      case 'complete':
        const assembly = this._assembly.value.value;

        if (!assembly)
          return html`<span
            >${msg("The requested assembly doesn't exist")}</span
          >`;

        return this.renderDetail(assembly);
      case 'error':
        return html`<sl-card>
          <display-error
            .headline=${msg('Error fetching the assembly')}
            .error=${this._assembly.value.error}
          ></display-error>
        </sl-card>`;
    }
  }

  static styles = [sharedStyles];
}
