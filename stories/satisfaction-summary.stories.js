import { html } from "lit-html";
import "@darksoil/assemble/elements/satisfaction-summary.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleSatisfaction } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const record = await mock.create_satisfaction(sampleSatisfaction());

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/satisfaction-summary",
  tags: ["autodocs"],
  component: "satisfaction-summary",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <satisfaction-summary .satisfactionHash=${record.signed_action.hashed.hash}></satisfaction-summary>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
