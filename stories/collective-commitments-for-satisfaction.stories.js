
import { html } from "lit-html";
import "@darksoil/assemble/elements/collective-commitments-for-satisfaction.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCollectiveCommitment } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const collectiveCommitment = sampleCollectiveCommitment();

const record = await mock.create_collective_commitment(collectiveCommitment);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/collective-commitments-for-satisfaction",
  tags: ["autodocs"],
  component: "collective-commitments-for-satisfaction",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <collective-commitments-for-satisfaction .satisfaction=${ collectiveCommitment.satisfactions_hashes[0] }></collective-commitments-for-satisfaction>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
