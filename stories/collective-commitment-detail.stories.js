import { html } from "lit-html";
import "@darksoil/assemble/elements/collective-commitment-detail.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCollectiveCommitment } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const record = await mock.create_collective_commitment(sampleCollectiveCommitment());

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/collective-commitment-detail",
  tags: ["autodocs"],
  component: "collective-commitment-detail",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <collective-commitment-detail .collectiveCommitmentHash=${record.signed_action.hashed.hash}></collective-commitment-detail>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
