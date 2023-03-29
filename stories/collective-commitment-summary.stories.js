import { html } from "lit-html";
import "@holochain-open-dev/assemble/elements/collective-commitment-summary.js";
import "@holochain-open-dev/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCollectiveCommitment } from "@holochain-open-dev/assemble/mocks";
import { AssembleStore, AssembleClient } from "@holochain-open-dev/assemble";

const mock = new AssembleZomeMock();

const record = await mock.create_collective_commitment(sampleCollectiveCommitment());

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/collective-commitment-summary",
  tags: ["autodocs"],
  component: "collective-commitment-summary",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <collective-commitment-summary .collectiveCommitmentHash=${record.signed_action.hashed.hash}></collective-commitment-summary>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
