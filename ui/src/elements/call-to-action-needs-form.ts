import {
  FormField,
  FormFieldController,
  hashProperty,
  notifyError,
  onSubmit,
  serialize,
  sharedStyles,
  wrapPathInSvg,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { localized, msg } from '@lit/localize';
import { mdiDelete, mdiPlus } from '@mdi/js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import { LitElement, TemplateResult, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { Need } from '../types';
import './call-to-action-need-form.js';
import { CallToActionNeedForm } from './call-to-action-need-form.js';

/**
 * @element call-to-action-needs-form
 */
@localized()
@customElement('call-to-action-needs-form')
export class CallToActionNeedsForm extends LitElement {
  /**
   * The default value of the field if this element is used inside a form
   */
  @property()
  defaultValue: Array<Need> = [
    {
      description: '',
      min_necessary: 0,
      max_possible: undefined,
    },
  ];

  @property({ attribute: 'allow-empty' })
  allowEmpty = false;

  needForms(): CallToActionNeedForm[] {
    return Array.from(
      this.shadowRoot?.querySelectorAll('call-to-action-need-form')!
    );
  }

  firstUpdated() {
    this._needsIds = this.defaultValue.map((_, i) => i);
  }

  reset() {
    this.needForms().forEach(f => {
      f.reset();
    });
    this._needsIds = this.defaultValue.map((_, i) => i);
  }

  /**
   * @internal
   */
  @state()
  _needsIds: Array<number> = [0];

  renderNeedForm(id: number) {
    const index = this._needsIds.findIndex(i => i === id);
    return html`
      <call-to-action-need-form
        .defaultValue=${this.defaultValue
          ? this.defaultValue[index]
          : undefined}
      >
        <sl-icon-button
          slot="action"
          .src=${wrapPathInSvg(mdiDelete)}
          .disabled=${!this.allowEmpty && this._needsIds.length === 1}
          @click=${() => {
            this._needsIds = this._needsIds.filter(i => i !== id);
          }}
        ></sl-icon-button>
      </call-to-action-need-form>

      ${index < this._needsIds.length - 1
        ? html`<sl-divider></sl-divider>`
        : html``}
    `;
  }

  render() {
    return html`
      <div id="needs-form">
        <div style="display: flex; flex-direction: column">
          <div class="row" style="align-items: center;">
            <span class="title">${msg('Needs')}</span>
            <sl-tooltip .content=${msg('Add need')}>
              <sl-icon-button
                style="margin-left: 4px"
                @click=${() => {
                  const nextId =
                    this._needsIds.length === 0
                      ? 0
                      : Math.max(...this._needsIds.map(i => i)) + 1;
                  this._needsIds = [...this._needsIds, nextId];
                }}
                .src=${wrapPathInSvg(mdiPlus)}
              ></sl-icon-button
            ></sl-tooltip>
          </div>

          ${this._needsIds.length > 0
            ? repeat(
                this._needsIds,
                i => i,
                id => this.renderNeedForm(id)
              )
            : html`<span class="placeholder" style="margin-top: 8px"
                >${msg('There are no needs yet.')}</span
              >`}
        </div>
      </div>
    `;
  }

  static styles = [sharedStyles];
}
