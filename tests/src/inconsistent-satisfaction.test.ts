import { test, assert } from 'vitest';

import { dhtSync, pause, runScenario } from '@holochain/tryorama';
import { toPromise } from '@holochain-open-dev/stores';
import { setup } from './utils.js';
import { sampleCallToAction } from '../../ui/src/mocks.js';

test('satisfaction gets created after a minute when there is a race condition between commitments', async t => {
  await runScenario(
    async scenario => {
      const { alice, bob } = await setup(scenario);

      const callToAction = await alice.store.client.createCallToAction(
        await sampleCallToAction(alice.store.client, {
          needs: [
            {
              description: 'the third need',
              max_possible: undefined,
              min_necessary: 2,
              requires_admin_approval: false,
            },
          ],
        })
      );
      assert.ok(callToAction);
      const call_to_action_hash = callToAction.actionHash;

      await dhtSync(
        [alice.player, bob.player],
        alice.player.cells[0].cell_id[0]
      );

      let satisfactions = await toPromise(
        alice.store.callToActions.get(call_to_action_hash).satisfactions
      );
      assert.equal(satisfactions.size, 0);
      let unsatisfiedNeeds = await toPromise(
        alice.store.callToActions.get(call_to_action_hash).needs.unsatisfied
      );
      assert.equal(unsatisfiedNeeds.length, 1);

      await bob.store.client.createCommitment({
        call_to_action_hash,
        need_index: 0,
        amount: 1,
        comment: 'some comment',
      });

      await alice.store.client.createCommitment({
        call_to_action_hash,
        need_index: 0,
        amount: 1,
        comment: 'some comment',
      });

      satisfactions = await toPromise(
        alice.store.callToActions.get(call_to_action_hash).satisfactions
      );
      assert.equal(satisfactions.size, 0); // This is expected since they haven't had time to gossip

      await dhtSync(
        [alice.player, bob.player],
        alice.player.cells[0].cell_id[0]
      );
      await pause(1.5 * 60 * 1000);

      satisfactions = await toPromise(
        alice.store.callToActions.get(call_to_action_hash).satisfactions
      );
      assert.equal(satisfactions.size, 1);
    },
    true,
    { timeout: 30_000 }
  );
});
