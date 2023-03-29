import { html } from "lit-html";
import "@holochain-open-dev/assemble/elements/create-collective-commitment.js";
import "@holochain-open-dev/assemble/elements/assemble-context.js";
import { AssembleZomeMock } from "@holochain-open-dev/assemble/mocks";
import { AssembleStore, AssembleClient } from "@holochain-open-dev/assemble";

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/create-collective-commitment",
  tags: ["autodocs"],
  component: "create-collective-commitment",
  render: (args) =>
    html` <assemble-context
      .store=${new AssembleStore(new AssembleClient(new AssembleZomeMock()))}
    >
      <create-collective-commitment></create-collective-commitment>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
