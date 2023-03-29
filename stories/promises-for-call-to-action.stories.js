
import { html } from "lit-html";
import "@holochain-open-dev/assemble/elements/promises-for-call-to-action.js";
import "@holochain-open-dev/assemble/elements/assemble-context.js";
import { AssembleZomeMock, samplePromise } from "@holochain-open-dev/assemble/mocks";
import { AssembleStore, AssembleClient } from "@holochain-open-dev/assemble";

const mock = new AssembleZomeMock();

const promise = samplePromise();

const record = await mock.create_promise(promise);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/promises-for-call-to-action",
  tags: ["autodocs"],
  component: "promises-for-call-to-action",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <promises-for-call-to-action .callToAction=${ promise.call_to_action_hash } ></promises-for-call-to-action>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
