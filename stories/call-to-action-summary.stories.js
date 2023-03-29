import { html } from "lit-html";
import "@holochain-open-dev/assemble/elements/call-to-action-summary.js";
import "@holochain-open-dev/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCallToAction } from "@holochain-open-dev/assemble/mocks";
import { AssembleStore, AssembleClient } from "@holochain-open-dev/assemble";

const mock = new AssembleZomeMock();

const record = await mock.create_call_to_action(sampleCallToAction());

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/call-to-action-summary",
  tags: ["autodocs"],
  component: "call-to-action-summary",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <call-to-action-summary .callToActionHash=${record.signed_action.hashed.hash}></call-to-action-summary>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
