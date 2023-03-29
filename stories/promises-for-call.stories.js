
import { html } from "lit-html";
import "@darksoil/assemble/elements/promises-for-call.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, samplePromise } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const promise = samplePromise();

const record = await mock.create_promise(promise);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/promises-for-call",
  tags: ["autodocs"],
  component: "promises-for-call",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <promises-for-call .call=${ promise.call_hash } ></promises-for-call>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
