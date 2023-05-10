import {
  hashProperty,
  hashState,
  notifyError,
  onSubmit,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { EntryRecord } from '@holochain-open-dev/utils';
import {
  ActionHash,
  AgentPubKey,
  DnaHash,
  EntryHash,
  Record,
} from '@holochain/client';
import { consume } from '@lit-labs/context';
import { localized, msg } from '@lit/localize';
import { mdiAlertCircleOutline, mdiDelete } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { Assembly } from '../types.js';

/**
 * @element create-collective-commitment
 * @fires collective-commitment-created: detail will contain { collectiveCommitmentHash }
 */
@localized()
@customElement('create-collective-commitment')
export class CreateAssembly extends LitElement {
  // REQUIRED. The call to action hash for this Assembly
  @property(hashProperty('call-to-action-hash'))
  callToActionHash!: ActionHash;

  // REQUIRED. The satisfactions hashes for this Assembly
  @property()
  satisfactionsHashes!: Array<ActionHash>;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  /**
   * @internal
   */
  @state()
  committing = false;

  /**
   * @internal
   */
  @query('#create-form')
  form!: HTMLFormElement;

  async createAssembly(fields: any) {
    if (this.callToActionHash === undefined)
      throw new Error(
        'Cannot create a new Collective Commitment without its call_to_action_hash field'
      );
    if (this.satisfactionsHashes === undefined)
      throw new Error(
        'Cannot create a new Collective Commitment without its satisfactions_hashes field'
      );

    const collectiveCommitment: Assembly = {
      call_to_action_hash: this.callToActionHash,
      satisfactions_hashes: this.satisfactionsHashes,
    };

    try {
      this.committing = true;
      const record: EntryRecord<Assembly> =
        await this.assembleStore.client.createAssembly(
          collectiveCommitment
        );

      this.dispatchEvent(
        new CustomEvent('collective-commitment-created', {
          composed: true,
          bubbles: true,
          detail: {
            collectiveCommitmentHash: record.actionHash,
          },
        })
      );

      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the collective commitment'));
    }
    this.committing = false;
  }

  render() {
    return html` <sl-card style="flex: 1;">
      <span slot="header">${msg('Create Collective Commitment')}</span>

      <form
        id="create-form"
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.createAssembly(fields))}
      >
        <sl-button variant="primary" type="submit" .loading=${this.committing}
          >${msg('Create Collective Commitment')}</sl-button
        >
      </form>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
