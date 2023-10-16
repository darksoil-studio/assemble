import { createContext } from '@lit-labs/context';

import { AssembleStore } from './assemble-store.js';

export const assembleStoreContext = createContext<AssembleStore>(
  'hc_zome_assemble/store'
);
