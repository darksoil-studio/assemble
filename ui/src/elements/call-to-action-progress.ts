import { hashProperty, sharedStyles } from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@holochain-open-dev/profiles/dist/elements/agent-avatar.js';
import {
  AsyncReadable,
  StoreSubscriber,
  joinAsync,
  pipe,
  sliceAndJoin,
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
      joinAsync([
        this.assembleStore.callToActions.get(this.callToActionHash),
        pipe(
          this.assembleStore.uncancelledCommitmentsForCallToAction.get(
            this.callToActionHash
          ),
          hashes => sliceAndJoin(this.assembleStore.commitments, hashes)
        ),
        pipe(
          this.assembleStore.satisfactionsForCallToAction.get(
            this.callToActionHash
          ),
          hashes => sliceAndJoin(this.assembleStore.satisfactions, hashes)
        ),
      ]),
    () => [this.callToActionHash]
  );

  render() {
    switch (this._callToActionInfo.value.status) {
      case 'pending':
        return html`<sl-skeleton></sl-skeleton>`;
      case 'complete':
        const callToAction = this._callToActionInfo.value.value[0];
        const commitments = Array.from(
          this._callToActionInfo.value.value[1].values()
        );
        const satisfactions = Array.from(
          this._callToActionInfo.value.value[2].values()
        );
        const needsCount = callToAction.entry.needs.reduce(
          (count, need) => count + need.min_necessary,
          0
        );

        if (needsCount === 0)
          return html`<span class="placeholder"
            >${msg("This call to action doesn't have required needs.")}</span
          >`;

        let amountSatisfied = 0;
        let satisfied = true;

        for (
          let needIndex = 0;
          needIndex < callToAction.entry.needs.length;
          needIndex++
        ) {
          const need = callToAction.entry.needs[needIndex];

          if (need.min_necessary === 0) continue;

          if (satisfactions.find(s => s.entry.need_index === needIndex)) {
            amountSatisfied += need.min_necessary;
          } else {
            satisfied = false;
            const commitmentsForThisNeed = commitments.filter(
              c => c.entry.need_index === needIndex
            );

            const amountContributed = commitmentsForThisNeed.reduce(
              (acc, next) => acc + next.entry.amount,
              0
            );

            if (amountContributed > need.min_necessary) {
              amountSatisfied += need.min_necessary;
            } else {
              amountSatisfied += amountContributed;
            }
          }
        }
        return html` <sl-progress-bar
          .value=${(100 * amountSatisfied) / needsCount}
          style="--indicator-color: ${satisfied
            ? 'green'
            : 'var(--sl-color-primary-700)'}"
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
