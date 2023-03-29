
import { html } from "lit-html";
import "@darksoil/assemble/elements/collective-commitments-for-call.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCollectiveCommitment } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const collectiveCommitment = sampleCollectiveCommitment();

const record = await mock.create_collective_commitment(collectiveCommitment);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/collective-commitments-for-call",
  tags: ["autodocs"],
  component: "collective-commitments-for-call",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <collective-commitments-for-call .call=${ collectiveCommitment.call_hash } ></collective-commitments-for-call>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
