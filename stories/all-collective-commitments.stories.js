import { html } from "lit-html";
import "@darksoil/assemble/elements/all-collective-commitments.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCollectiveCommitment } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const collectiveCommitment = sampleCollectiveCommitment();

const record = await mock.create_collective_commitment(collectiveCommitment);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/all-collective-commitments",
  tags: ["autodocs"],
  component: "all-collective-commitments",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <all-collective-commitments ></all-collective-commitments>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
