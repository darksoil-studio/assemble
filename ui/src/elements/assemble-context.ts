import { css, html, LitElement } from 'lit';
import { provide } from '@lit-labs/context';
import { customElement, property } from 'lit/decorators.js';

import { assembleStoreContext } from '../context.js';
import { AssembleStore } from '../assemble-store.js';

@customElement('assemble-context')
export class AssembleContext extends LitElement {
  @provide({ context: assembleStoreContext })
  @property({ type: Object })
  store!: AssembleStore;

  render() {
    return html`<slot></slot>`;
  }

  static styles = css`
    :host {
      display: contents;
    }
  `;
}
