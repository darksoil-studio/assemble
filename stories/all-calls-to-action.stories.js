import { html } from "lit-html";
import "@holochain-open-dev/assemble/elements/all-calls-to-action.js";
import "@holochain-open-dev/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCallToAction } from "@holochain-open-dev/assemble/mocks";
import { AssembleStore, AssembleClient } from "@holochain-open-dev/assemble";

const mock = new AssembleZomeMock();

const callToAction = sampleCallToAction();

const record = await mock.create_call_to_action(callToAction);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/all-calls-to-action",
  tags: ["autodocs"],
  component: "all-calls-to-action",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <all-calls-to-action ></all-calls-to-action>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
