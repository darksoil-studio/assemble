import { html } from "lit-html";
import "@holochain-open-dev/assemble/elements/create-satisfaction.js";
import "@holochain-open-dev/assemble/elements/assemble-context.js";
import { AssembleZomeMock } from "@holochain-open-dev/assemble/mocks";
import { AssembleStore, AssembleClient } from "@holochain-open-dev/assemble";

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/create-satisfaction",
  tags: ["autodocs"],
  component: "create-satisfaction",
  render: (args) =>
    html` <assemble-context
      .store=${new AssembleStore(new AssembleClient(new AssembleZomeMock()))}
    >
      <create-satisfaction></create-satisfaction>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
