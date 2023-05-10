
import { html } from "lit-html";
import "@darksoil/assemble/elements/commitments-for-call-to-action.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCommitment } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const commitment = sampleCommitment();

const record = await mock.create_commitment(commitment);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/commitments-for-call-to-action",
  tags: ["autodocs"],
  component: "commitments-for-call-to-action",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <commitments-for-call-to-action .callToAction=${ commitment.call_to_action_hash } ></commitments-for-call-to-action>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
