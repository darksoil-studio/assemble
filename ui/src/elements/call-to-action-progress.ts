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
import { Commitment, CallToAction, Satisfaction } from '../types';

/**
 * @element call-to-action-progress
 * @fires call-to-action-selected: detail will contain { callToActionHash }
 */
@localized()
@customElement('call-to-action-progress')
export class CallToActionProgress extends LitElement {
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
  _callToActionInfo = new StoreSubscriber(
    this,
    () =>
      join([
        this.assembleStore.callToActions.get(this.callToActionHash),
        this.assembleStore.commitmentsForCallToAction.get(
          this.callToActionHash
        ),
        this.assembleStore.satisfactionsForCallToAction.get(
          this.callToActionHash
        ),
      ]) as AsyncReadable<
        [
          EntryRecord<CallToAction>,
          Array<EntryRecord<Commitment>>,
          Array<EntryRecord<Satisfaction>>
        ]
      >,
    () => [this.callToActionHash]
  );

  render() {
    switch (this._callToActionInfo.value.status) {
      case 'pending':
        return html`<sl-skeleton></sl-skeleton>`;
      case 'complete':
        const callToAction = this._callToActionInfo.value.value[0];
        const commitments = this._callToActionInfo.value.value[1];
        const satisfactions = this._callToActionInfo.value.value[2];
        const needsCount = callToAction.entry.needs
          .filter(
            (_, index) => !satisfactions.find(s => s.entry.need_index === index)
          )
          .reduce((count, need) => count + need.min_necessary, 0);

        const amountContributed = commitments.reduce(
          (count, commitment) => count + commitment.entry.amount,
          0
        );
        return html` <sl-progress-bar
          .value=${needsCount > 0
            ? (100 * amountContributed) / needsCount
            : 100}
        ></sl-progress-bar>`;
      case 'error':
        return html`<display-error
          tooltip
          .headline=${msg('Error fetching the progress of the call')}
          .error=${this._callToActionInfo.value.error.data.data}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
