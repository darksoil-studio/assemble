
import { html } from "lit-html";
import "@darksoil/assemble/elements/calls-for-call.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCall } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const call = sampleCall();

const record = await mock.create_call(call);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/calls-for-call",
  tags: ["autodocs"],
  component: "calls-for-call",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <calls-for-call .call=${ call.parent_call_hash } ></calls-for-call>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
