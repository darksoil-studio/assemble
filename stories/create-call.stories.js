import { html } from "lit-html";
import "@darksoil/assemble/elements/create-call.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/create-call",
  tags: ["autodocs"],
  component: "create-call",
  render: (args) =>
    html` <assemble-context
      .store=${new AssembleStore(new AssembleClient(new AssembleZomeMock()))}
    >
      <create-call></create-call>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
