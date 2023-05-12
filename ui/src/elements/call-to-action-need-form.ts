import {
  FormField,
  FormFieldController,
  serialize,
  sharedStyles,
} from '@holochain-open-dev/elements';
import '@holochain-open-dev/elements/dist/elements/display-error.js';
import { localized, msg } from '@lit/localize';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import { LitElement, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

import { Need } from '../types';

/**
 * @element call-to-action-needs-form
 */
@localized()
@customElement('call-to-action-need-form')
export class CallToActionNeedForm extends LitElement implements FormField {
  @property()
  name = 'need';

  @property()
  description: string | undefined;

  /**
   * The default value of the field if this element is used inside a form
   */
  @property()
  defaultValue: Need | undefined;

  /**
   * Whether this field is disabled if this element is used inside a form
   */
  disabled = false;

  /**
   * @internal
   */
  _controller = new FormFieldController(this);

  get value(): string {
    const fields = serialize(this.form);

    const min_necessary: number = this._minRequired
      ? (parseInt(fields.min_required as string, 10) as number)
      : 0;
    const max_possible: number | undefined = this._maxPossible
      ? parseInt(fields.max_possible as string, 10)
      : undefined;

    const need: Need = {
      description: this.description
        ? this.description
        : (fields.description as string),
      min_necessary,
      max_possible,
    };

    return JSON.stringify(need);
  }

  reportValidity() {
    return this.form.reportValidity();
  }

  firstUpdated() {
    this.reset();
  }

  reset() {
    this.form.reset();
    this._minRequired = this.defaultValue
      ? this.defaultValue.min_necessary > 0
      : false;
    this._maxPossible = this.defaultValue
      ? this.defaultValue.max_possible !== undefined
      : false;
  }

  /**
   * @internal
   */
  @query('#need-form')
  form!: HTMLFormElement;

  /**
   * @internal
   */
  @state()
  _minRequired = false;

  /**
   * @internal
   */
  @state()
  _maxPossible = false;

  render() {
    return html`
      <form id="need-form" class="column">
        <div class="row" style="align-items: center; margin-top: 8px">
          ${this.description
            ? html``
            : html`
                <sl-input
                  name="description"
                  required
                  style="flex: 1"
                  .placeholder=${msg('Need description*')}
                  .defaultValue=${this.defaultValue?.description || ''}
                ></sl-input>
              `}

          <slot name="action"></slot>
        </div>
        <div class="row" style="align-items: center; margin-top: 8px">
          <sl-switch
            .defaultChecked=${this.defaultValue
              ? this.defaultValue.min_necessary > 0
              : false}
            @sl-change=${() => {
              this._minRequired = !this._minRequired;
            }}
            style="flex: 1"
            >${msg('Min. required')}</sl-switch
          >

          <sl-input
            name="min_required"
            type="number"
            id="inputmin"
            min="1"
            .defaultValue=${this.defaultValue?.min_necessary || 1}
            .disabled=${!this._minRequired}
            required
            style="width: 5rem; margin-left: 8px"
            @input=${() => this.requestUpdate()}
          ></sl-input>
        </div>
        <div class="row" style="align-items: center; margin-top: 8px">
          <sl-switch
            .defaultChecked=${this.defaultValue
              ? this.defaultValue.max_possible !== undefined
              : false}
            @sl-change=${() => {
              this._maxPossible = !this._maxPossible;
            }}
            style="flex: 1"
            >${msg('Max. possible')}</sl-switch
          >

          <sl-input
            name="max_possible"
            type="number"
            .defaultValue=${this.defaultValue?.max_possible || 1}
            .min=${(this.shadowRoot?.getElementById(`inputmin`) as any)
              ?.value || 1}
            .disabled=${!this._maxPossible}
            style="width: 5rem; margin-left: 8px"
          ></sl-input>
        </div>
      </form>
    `;
  }

  static styles = [sharedStyles];
}
