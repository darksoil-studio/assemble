import { html } from "lit-html";
import "@darksoil/assemble/elements/collective-commitment-summary.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleAssembly } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const record = await mock.create_assembly(sampleAssembly());

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
