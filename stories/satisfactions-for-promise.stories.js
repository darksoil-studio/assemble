
import { html } from "lit-html";
import "@darksoil/assemble/elements/satisfactions-for-promise.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleSatisfaction } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const satisfaction = sampleSatisfaction();

const record = await mock.create_satisfaction(satisfaction);

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/satisfactions-for-promise",
  tags: ["autodocs"],
  component: "satisfactions-for-promise",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <satisfactions-for-promise .promise=${ satisfaction.promises_hashes[0] }></satisfactions-for-promise>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
