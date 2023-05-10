import { html } from "lit-html";
import "@darksoil/assemble/elements/commitment-summary.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCommitment } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const record = await mock.create_commitment(sampleCommitment());

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/commitment-summary",
  tags: ["autodocs"],
  component: "commitment-summary",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <commitment-summary .commitmentHash=${record.signed_action.hashed.hash}></commitment-summary>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
