import { provide } from '@lit/context';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { AssembleStore } from '../assemble-store.js';
import { assembleStoreContext } from '../context.js';

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
