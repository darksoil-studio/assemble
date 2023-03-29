import { html } from "lit-html";
import "@darksoil/assemble/elements/edit-call.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCall } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const record = await mock.create_call(sampleCall());

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/edit-assemble",
  tags: ["autodocs"],
  component: "edit-assemble",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <edit-assemble .originalCallHash=${record.signed_action.hashed.hash} .currentRecord=${record}></edit-assemble>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
