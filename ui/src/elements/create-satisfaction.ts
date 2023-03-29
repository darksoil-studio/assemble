import {
  hashProperty,
  hashState,
  notifyError,
  onSubmit,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/elements/display-error.js';
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
import SlAlert from '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import { Satisfaction } from '../types.js';

/**
 * @element create-satisfaction
 * @fires satisfaction-created: detail will contain { satisfactionHash }
 */
@localized()
@customElement('create-satisfaction')
export class CreateSatisfaction extends LitElement {
  // REQUIRED. The call to action hash for this Satisfaction
  @property(hashProperty('call-to-action-hash'))
  callToActionHash!: ActionHash;

  // REQUIRED. The need index for this Satisfaction
  @property()
  needIndex!: number;

  // REQUIRED. The promises hashes for this Satisfaction
  @property()
  promisesHashes!: Array<ActionHash>;

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

  async createSatisfaction(fields: any) {
    if (this.callToActionHash === undefined)
      throw new Error(
        'Cannot create a new Satisfaction without its call_to_action_hash field'
      );
    if (this.needIndex === undefined)
      throw new Error(
        'Cannot create a new Satisfaction without its need_index field'
      );
    if (this.promisesHashes === undefined)
      throw new Error(
        'Cannot create a new Satisfaction without its promises_hashes field'
      );

    const satisfaction: Satisfaction = {
      call_to_action_hash: this.callToActionHash,
      need_index: this.needIndex,
      promises_hashes: this.promisesHashes,
    };

    try {
      this.committing = true;
      const record: EntryRecord<Satisfaction> =
        await this.assembleStore.client.createSatisfaction(satisfaction);

      this.dispatchEvent(
        new CustomEvent('satisfaction-created', {
          composed: true,
          bubbles: true,
          detail: {
            satisfactionHash: record.actionHash,
          },
        })
      );

      this.form.reset();
    } catch (e: any) {
      console.error(e);
      notifyError(msg('Error creating the satisfaction'));
    }
    this.committing = false;
  }

  render() {
    return html` <sl-card style="flex: 1;">
      <span slot="header">${msg('Create Satisfaction')}</span>

      <form
        id="create-form"
        style="display: flex; flex: 1; flex-direction: column;"
        ${onSubmit(fields => this.createSatisfaction(fields))}
      >
        <sl-button variant="primary" type="submit" .loading=${this.committing}
          >${msg('Create Satisfaction')}</sl-button
        >
      </form>
    </sl-card>`;
  }

  static styles = [sharedStyles];
}
