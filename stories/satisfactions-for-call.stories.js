
import { html } from "lit-html";
import "@darksoil/assemble/elements/satisfactions-for-call.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleSatisfaction } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const satisfaction = sampleSatisfaction();

const record = await mock.create_satisfaction(satisfaction);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/satisfactions-for-call",
  tags: ["autodocs"],
  component: "satisfactions-for-call",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <satisfactions-for-call .call=${ satisfaction.call_hash } ></satisfactions-for-call>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
