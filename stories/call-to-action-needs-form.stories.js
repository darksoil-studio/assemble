import { html } from "lit-html";
import "@darksoil/assemble/elements/call-to-action-needs-form.js";
import "@darksoil/assemble/elements/assemble-context.js";
import { AssembleZomeMock } from "@darksoil/assemble/mocks";
import { AssembleStore, AssembleClient } from "@darksoil/assemble";

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/call-to-action-needs-form",
  tags: ["autodocs"],
  component: "call-to-action-needs-form",
  render: (args) =>
    html` <assemble-context
      .store=${new AssembleStore(new AssembleClient(new AssembleZomeMock()))}
    >
      <call-to-action-needs-form></call-to-action-needs-form>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
