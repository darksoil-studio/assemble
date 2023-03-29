import { html } from "lit-html";
import "@holochain-open-dev/assemble/elements/promise-detail.js";
import "@holochain-open-dev/assemble/elements/assemble-context.js";
import { AssembleZomeMock, samplePromise } from "@holochain-open-dev/assemble/mocks";
import { AssembleStore, AssembleClient } from "@holochain-open-dev/assemble";

const mock = new AssembleZomeMock();

const record = await mock.create_promise(samplePromise());

const store = new AssembleStore(new AssembleClient(mock));

// More on how to set up stories at: https://storybook.js.org/docs/7.0/web-components/writing-stories/introduction
export default {
  title: "Frontend/Elements/promise-detail",
  tags: ["autodocs"],
  component: "promise-detail",
  render: (args) =>
    html` <assemble-context
      .store=${store}
    >
      <promise-detail .promiseHash=${record.signed_action.hashed.hash}></promise-detail>
    </assemble-context>`,
};

// More on writing stories with args: https://storybook.js.org/docs/7.0/web-components/writing-stories/args
export const Demo = {};
