import { html } from "lit-html";
import "@darksoil/assemble/elements/open-calls-to-action.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCallToAction } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const callToAction = sampleCallToAction();

const record = await mock.create_call_to_action(callToAction);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/open-calls-to-action",
  tags: ["autodocs"],
  component: "open-calls-to-action",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <open-calls-to-action ></open-calls-to-action>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
