import { html } from "lit-html";
import "@darksoil/assemble/elements/create-assembly.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/create-assembly",
  tags: ["autodocs"],
  component: "create-assembly",
  render: (args) =>
    html` <assemble-context
      .store=${new AssembleStore(new AssembleClient(new AssembleZomeMock()))}
    >
      <create-assembly></create-assembly>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
