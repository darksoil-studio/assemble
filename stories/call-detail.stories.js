import { html } from "lit-html";
import "@darksoil/assemble/elements/call-detail.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCall } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const record = await mock.create_call(sampleCall());

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/call-detail",
  tags: ["autodocs"],
  component: "call-detail",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <call-detail .callHash=${record.signed_action.hashed.hash}></call-detail>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
