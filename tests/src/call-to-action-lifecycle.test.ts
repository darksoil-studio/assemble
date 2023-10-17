import { test, assert } from 'vitest';

import { dhtSync, pause, runScenario } from '@holochain/tryorama';
import { toPromise } from '@holochain-open-dev/stores';
import { setup } from './utils.js';
import { sampleCallToAction } from '../../ui/src/mocks.js';

test('call to action: create and fulfill', async t => {
  await runScenario(
    async scenario => {
      const { alice, bob } = await setup(scenario);

      const callToAction = await alice.store.client.createCallToAction(
        await sampleCallToAction(alice.store.client, {
          needs: [
            {
              description: 'the first need',
              max_possible: undefined,
              min_necessary: 0,
            },
            {
              description: 'the second need',
              max_possible: undefined,
              min_necessary: 1,
            },
            {
              description: 'the third need',
              max_possible: undefined,
              min_necessary: 2,
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
        alice.store.satisfactionsForCallToAction.get(call_to_action_hash)
      );
      assert.equal(satisfactions.length, 0);

      await bob.store.client.createCommitment({
        call_to_action_hash,
        need_index: 1,
        amount: 1,
        comment: 'some comment',
      });

      await dhtSync(
        [alice.player, bob.player],
        alice.player.cells[0].cell_id[0]
      );

      satisfactions = await toPromise(
        alice.store.satisfactionsForCallToAction.get(call_to_action_hash)
      );
      assert.equal(satisfactions.length, 1);

      let assemblies = await toPromise(
        alice.store.assembliesForCallToAction.get(call_to_action_hash)
      );
      assert.equal(assemblies.length, 0);

      await bob.store.client.createCommitment({
        call_to_action_hash,
        need_index: 2,
        amount: 1,
        comment: 'some comment',
      });

      await dhtSync(
        [alice.player, bob.player],
        alice.player.cells[0].cell_id[0]
      );

      satisfactions = await toPromise(
        alice.store.satisfactionsForCallToAction.get(call_to_action_hash)
      );
      assert.equal(satisfactions.length, 1);

      await alice.store.client.createCommitment({
        call_to_action_hash,
        need_index: 2,
        amount: 1,
        comment: 'some comment',
      });

      await dhtSync(
        [alice.player, bob.player],
        alice.player.cells[0].cell_id[0]
      );

      satisfactions = await toPromise(
        alice.store.satisfactionsForCallToAction.get(call_to_action_hash)
      );
      assert.equal(satisfactions.length, 2);

      assemblies = await toPromise(
        alice.store.assembliesForCallToAction.get(call_to_action_hash)
      );
      assert.equal(assemblies.length, 1);
    },
    true,
    { timeout: 30_000 }
  );
});

test.only('call to action: create, cancel commitment and fulfill', async t => {
  await runScenario(
    async scenario => {
      const { alice, bob } = await setup(scenario);

      const callToAction = await alice.store.client.createCallToAction(
        await sampleCallToAction(alice.store.client, {
          needs: [
            {
              description: 'the first need',
              max_possible: undefined,
              min_necessary: 0,
            },
            {
              description: 'the second need',
              max_possible: undefined,
              min_necessary: 1,
            },
            {
              description: 'the third need',
              max_possible: undefined,
              min_necessary: 2,
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
        alice.store.satisfactionsForCallToAction.get(call_to_action_hash)
      );
      assert.equal(satisfactions.length, 0);

      const bobsCommitment = await bob.store.client.createCommitment({
        call_to_action_hash,
        need_index: 1,
        amount: 1,
        comment: 'some comment',
      });

      await dhtSync(
        [alice.player, bob.player],
        alice.player.cells[0].cell_id[0]
      );

      satisfactions = await toPromise(
        alice.store.satisfactionsForCallToAction.get(call_to_action_hash)
      );
      assert.equal(satisfactions.length, 1);

      await bob.store.cancellationsStore.client.createCancellation(
        bobsCommitment.actionHash,
        "Oh sorry can't bring this"
      );
      await pause(1000);

      await dhtSync(
        [alice.player, bob.player],
        alice.player.cells[0].cell_id[0]
      );
      satisfactions = await toPromise(
        alice.store.satisfactionsForCallToAction.get(call_to_action_hash)
      );
      assert.equal(satisfactions.length, 0);

      await alice.store.client.createCommitment({
        call_to_action_hash,
        need_index: 1,
        amount: 1,
        comment: 'some comment',
      });
      await dhtSync(
        [alice.player, bob.player],
        alice.player.cells[0].cell_id[0]
      );

      satisfactions = await toPromise(
        alice.store.satisfactionsForCallToAction.get(call_to_action_hash)
      );
      assert.equal(satisfactions.length, 1);

      await bob.store.client.createCommitment({
        call_to_action_hash,
        need_index: 2,
        amount: 2,
        comment: 'some comment',
      });

      await dhtSync(
        [alice.player, bob.player],
        alice.player.cells[0].cell_id[0]
      );

      satisfactions = await toPromise(
        alice.store.satisfactionsForCallToAction.get(call_to_action_hash)
      );
      assert.equal(satisfactions.length, 2);

      let assemblies = await toPromise(
        alice.store.assembliesForCallToAction.get(call_to_action_hash)
      );
      assert.equal(assemblies.length, 1);
    },
    true,
    { timeout: 30_000 }
  );
});
