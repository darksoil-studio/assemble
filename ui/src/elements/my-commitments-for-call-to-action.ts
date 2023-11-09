import {
  hashProperty,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import {
  StoreSubscriber,
  joinAsync,
  mapAndJoin,
  pipe,
} from '@holochain-open-dev/stores';
import { ActionHash } from '@holochain/client';
import { consume } from '@lit/context';
import { localized, msg } from '@lit/localize';
import { mdiInformationOutline } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';
import './commitment-detail.js';

/**
 * @element my-commitments-for-call-to-action
 * Renders a list of all the commitments that I need to fulfill for the given call-to-action
 */
@localized()
@customElement('my-commitments-for-call-to-action')
export class MyCommitmentsForCallToAction extends LitElement {
  // REQUIRED. The CallToActionHash for which the commitments should be fetched
  @property(hashProperty('call-to-action-hash'))
  callToActionHash!: ActionHash;

  /**
   * @internal
   */
  @consume({ context: assembleStoreContext, subscribe: true })
  assembleStore!: AssembleStore;

  @property()
  hideNeeds: Array<number> = [];

  /**
   * @internal
   */
  _myCommitments = new StoreSubscriber(
    this,
    () =>
      pipe(
        this.assembleStore.callToActions.get(this.callToActionHash).commitments
          .uncancelled,
        commitments => mapAndJoin(commitments, c => c.entry),
        commitments =>
          Array.from(commitments.values()).filter(
            c =>
              c.action.author.toString() ===
              this.assembleStore.client.client.myPubKey.toString()
          ),
        myCommitments =>
          joinAsync(
            myCommitments.map(c =>
              pipe(
                this.assembleStore.commitments.get(c.actionHash).satisfactions,
                satisfaction => mapAndJoin(satisfaction, s => s.latestVersion)
              )
            )
          ),
        _ =>
          this.assembleStore.callToActions.get(this.callToActionHash)
            .latestVersion,
        (callToAction, satisfactions, commitments) =>
          commitments
            .filter(c => !this.hideNeeds.includes(c.entry.need_index))
            .filter(
              (c, i) =>
                !callToAction.entry.needs[c.entry.need_index]
                  .requires_admin_approval ||
                Array.from(satisfactions[i].values()).length > 0
            )
            .map(c => c.actionHash)
      ),
    () => [this.callToActionHash]
  );

  renderList(hashes: Array<ActionHash>) {
    if (hashes.length === 0)
      return html` <div
        class="column center-content"
        style="flex: 1; margin: 48px; gap: 16px"
      >
        <sl-icon
          style="color: grey; height: 64px; width: 64px;"
          .src=${wrapPathInSvg(mdiInformationOutline)}
        ></sl-icon>
        <span class="placeholder"
          >${msg("You don't have any contributions.")}</span
        >
      </div>`;

    return html`
      <div style="display: flex; flex-direction: column">
        ${hashes.map(
          hash =>
            html`<commitment-detail
              .hideAvatar=${true}
              .showNeed=${true}
              .commitmentHash=${hash}
            ></commitment-detail>`
        )}
      </div>
    `;
  }

  render() {
    switch (this._myCommitments.value.status) {
      case 'pending':
        return html`<div
          style="display: flex; flex: 1; align-items: center; justify-content: center"
        >
          <sl-spinner style="font-size: 2rem;"></sl-spinner>
        </div>`;
      case 'complete':
        return this.renderList(this._myCommitments.value.value);
      case 'error':
        return html`<display-error
          .headline=${msg('Error fetching the commitments')}
          .error=${this._myCommitments.value.error}
        ></display-error>`;
    }
  }

  static styles = [sharedStyles];
}
