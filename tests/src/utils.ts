import { Player, Scenario, dhtSync, pause } from '@holochain/tryorama';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  CancellationsClient,
  CancellationsStore,
} from '@holochain-open-dev/cancellations';
import { AssembleStore } from '../../ui/src/assemble-store.js';
import { AssembleClient } from '../../ui/src/assemble-client.js';

export async function waitAndDhtSync(players: Player[]) {
  await pause(4000); // Wait for postcommit things to happen
  await dhtSync(players, players[0].namedCells.get('assemble_test').cell_id[0]);
  await pause(4000); // Wait for postcommit things to happen
}

export async function setup(scenario: Scenario) {
  const testHappUrl =
    dirname(fileURLToPath(import.meta.url)) + '/../../workdir/assemble.happ';

  // Add 2 players with the test hApp to the Scenario. The returned players
  // can be destructured.
  const [alice, bob] = await scenario.addPlayersWithApps([
    { appBundleSource: { path: testHappUrl } },
    { appBundleSource: { path: testHappUrl } },
  ]);

  // Shortcut peer discovery through gossip and register all agents in every
  // conductor of the scenario.
  await scenario.shareAllAgents();

  // console.log(alice.appAgentWs);
  // installLogger(alice.appAgentWs as any);
  // installLogger(bob.appAgentWs as any);

  const aliceAssemble = new AssembleStore(
    new AssembleClient(alice.appAgentWs as any, 'assemble_test', 'assemble'),
    new CancellationsStore(
      new CancellationsClient(
        alice.appAgentWs as any,
        'assemble_test',
        'cancellations'
      )
    )
  );

  const bobAssemble = new AssembleStore(
    new AssembleClient(bob.appAgentWs as any, 'assemble_test', 'assemble'),
    new CancellationsStore(
      new CancellationsClient(
        alice.appAgentWs as any,
        'assemble_test',
        'cancellations'
      )
    )
  );

  return {
    alice: {
      player: alice,
      store: aliceAssemble,
    },
    bob: {
      player: bob,
      store: bobAssemble,
    },
  };
}
