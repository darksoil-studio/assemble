import { html } from "lit-html";
import "@darksoil/assemble/elements/call-to-action-detail.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock, sampleCallToAction } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

const mock = new AssembleZomeMock();

const record = await mock.create_call_to_action(sampleCallToAction());

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/call-to-action-detail",
  tags: ["autodocs"],
  component: "call-to-action-detail",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <call-to-action-detail .callToActionHash=${record.signed_action.hashed.hash}></call-to-action-detail>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
