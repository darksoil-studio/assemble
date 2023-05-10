import { html } from "lit-html";
import "@darksoil/assemble/elements/all-assemblies.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleAssembly } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const assembly = sampleAssembly();

const record = await mock.create_assembly(assembly);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/all-assemblies",
  tags: ["autodocs"],
  component: "all-assemblies",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <all-assemblies ></all-assemblies>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
