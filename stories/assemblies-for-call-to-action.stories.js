
import { html } from "lit-html";
import "@darksoil/assemble/elements/collective-commitments-for-call-to-action.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleAssembly } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const collectiveCommitment = sampleAssembly();

const record = await mock.create_assembly(collectiveCommitment);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/collective-commitments-for-call-to-action",
  tags: ["autodocs"],
  component: "collective-commitments-for-call-to-action",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <collective-commitments-for-call-to-action .callToAction=${ collectiveCommitment.call_to_action_hash } ></collective-commitments-for-call-to-action>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
