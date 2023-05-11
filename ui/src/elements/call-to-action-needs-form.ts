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
import { LitElement, TemplateResult, html } from 'lit';
import { localized, msg } from '@lit/localize';
import { mdiDelete, mdiPlus } from '@mdi/js';

import '@holochain-open-dev/elements/dist/elements/display-error.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/switch/switch.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';

import { customElement, property, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { Need } from '../types';

/**
 * @element call-to-action-needs-form
 */
@localized()
@customElement('call-to-action-needs-form')
export class CallToActionNeedsForm extends LitElement implements FormField {
  name = 'needs';

  /**
   * The default value of the field if this element is used inside a form
   */
  @property(hashProperty('default-value'))
  defaultValue: Array<Need> = [];

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

    const needsDescriptions: string[] = Array.isArray(fields.needs_description)
      ? fields.needs_description
      : [fields.needs_description];

    const needsMins = (
      Array.isArray(fields.needs_min) ? fields.needs_min : [fields.needs_min]
    ).map((i: string) => parseInt(i, 10));
    const needsMaxs = (
      Array.isArray(fields.needs_max) ? fields.needs_max : [fields.needs_max]
    ).map((i: string) => parseInt(i, 10));

    const needs: Array<Need> = [];
    let minNecessaryIndex = 0;
    let maxPossibleIndex = 0;

    for (const [i, description] of needsDescriptions.entries()) {
      let min_necessary = 0;
      if (this._needsFields[i][1]) {
        min_necessary = needsMins[minNecessaryIndex];
        minNecessaryIndex += 1;
      }
      let max_possible: number | undefined = undefined;
      if (this._needsFields[i][2]) {
        max_possible = needsMaxs[maxPossibleIndex];
        maxPossibleIndex += 1;
      }

      needs.push({
        description,
        min_necessary,
        max_possible,
      });
    }

    return JSON.stringify(needs);
  }

  reportValidity() {
    return this.form.reportValidity();
  }

  async reset() {
    this.form.reset();
    this._needsFields = [[0, false, false]];
  }

  /**
   * @internal
   */
  @query('#needs-form')
  form!: HTMLFormElement;

  /**
   * @internal
   */
  @state()
  _needsFields: Array<[number, boolean, boolean]> = [[0, false, false]];

  renderNeedFields(id: number, minrequired: boolean, maxpossible: boolean) {
    const index = this._needsFields.findIndex(([i, _r]) => i === id);
    return html`
      <div class="column">
        <div class="row" style="align-items: center; margin-top: 8px">
          <sl-input
            name="needs_description"
            required
            style="flex: 1"
            .placeholder=${msg('Need description*')}
          ></sl-input>

          <sl-icon-button
            .src=${wrapPathInSvg(mdiDelete)}
            .disabled=${this._needsFields.length === 1}
            @click=${() => {
              this._needsFields = this._needsFields.filter(
                ([i, _r]) => i !== id
              );
            }}
          ></sl-icon-button>
        </div>
        <div class="row" style="align-items: center; margin-top: 8px">
          <sl-switch
            @sl-change=${() => {
              this._needsFields[index][1] = !this._needsFields[index][1];
              this.requestUpdate();
            }}
            style="flex: 1"
            >${msg('Min. required')}</sl-switch
          >

          <sl-input
            name="needs_min"
            type="number"
            id="inputmin${id}"
            value="0"
            min="1"
            .disabled=${!minrequired}
            required
            style="width: 5rem; margin-left: 8px"
            @input=${() => this.requestUpdate()}
          ></sl-input>
        </div>
        <div class="row" style="align-items: center; margin-top: 8px">
          <sl-switch
            @sl-change=${() => {
              this._needsFields[index][2] = !this._needsFields[index][2];
              this.requestUpdate();
            }}
            style="flex: 1"
            >${msg('Max. possible')}</sl-switch
          >

          <sl-input
            name="needs_max"
            type="number"
            .min=${(this.shadowRoot?.getElementById(`inputmin${id}`) as any)
              ?.value || 1}
            .disabled=${!maxpossible}
            style="width: 5rem; margin-left: 8px"
            value="1"
          ></sl-input>
        </div>
      </div>

      ${index < this._needsFields.length - 1
        ? html`<sl-divider></sl-divider>`
        : html``}
    `;
  }

  render() {
    return html`
      <form id="needs-form" style="margin-bottom: 16px; margin-top: 16px;">
        <div style="display: flex; flex-direction: column">
          <div class="row" style="align-items: center;">
            <span style="font-size: 18px">${msg('Needs')}</span>
            <sl-tooltip .content=${msg('Add need')}>
              <sl-icon-button
                style="margin-left: 4px"
                @click=${() => {
                  this._needsFields = [
                    ...this._needsFields,
                    [
                      Math.max(...this._needsFields.map(([i, _r]) => i)) + 1,
                      false,
                      false,
                    ],
                  ];
                }}
                .src=${wrapPathInSvg(mdiPlus)}
              ></sl-icon-button
            ></sl-tooltip>
          </div>

          ${repeat(
            this._needsFields,
            ([i, r]) => i,
            ([id, minrequired, maxpossible]) =>
              this.renderNeedFields(id, minrequired, maxpossible)
          )}
        </div>
      </form>
    `;
  }

  static styles = [sharedStyles];
}
