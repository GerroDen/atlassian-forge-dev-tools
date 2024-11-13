<script setup lang="ts">
import { get } from "lodash-es";
import { onMounted, onUnmounted, type Ref, ref, watch } from "vue";

type Request = chrome.devtools.network.Request;

interface Entry {
  request: Request;
  functionKey: string;
  environmentType: string;
  environmentId: string;
  extensionType: string;
  payload: unknown;
}

const requests = ref<Entry[]>([]) as Ref<Entry[]>;
const selectedEntry = ref<Entry>() as Ref<Entry>;
const selectedResponse = ref<unknown>();

const addRequest = (request: Request) => {
  if (!request.request.url.endsWith(".atlassian.net/gateway/api/graphql")) return;
  const requestBody = JSON.parse(request.request.postData?.text ?? "null");
  const operationName = get(requestBody, "operationName");
  if (operationName !== "forge_ui_invokeExtension") return;
  const payload = get(requestBody, "variables.input.payload");
  requests.value.push({
    request,
    functionKey: get(payload, "call.functionKey"),
    environmentType: get(payload, "context.environmentType"),
    environmentId: get(payload, "context.environmentId"),
    extensionType: get(payload, "context.extension.type"),
    payload: get(payload, "call.payload"),
  });
};

watch(selectedEntry, () => {
  selectedResponse.value = undefined;
  selectedEntry.value?.request?.getContent((content) => {
    let responseBody = JSON.parse(content);
    selectedResponse.value = get(responseBody, "data.invokeExtension.response.body");
  });
});

onMounted(() => {
  chrome.devtools.network.onRequestFinished.addListener(addRequest);
});

onUnmounted(() => {
  chrome.devtools.network.onRequestFinished.removeListener(addRequest);
});
</script>

<template>
  <div class="shadow-split-widget">
    <div class="shadow-split-widget-contents shadow-split-widget-main vbox">
      <div class="wrapping-container striped">
        <table>
          <thead>
            <tr>
              <th>functionKey</th>
              <th>environmentType</th>
              <th>environmentId</th>
              <th>extension.type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in requests" :class="{ selected: request === selectedEntry }" @click="selectedEntry = request">
              <td :title="request.functionKey">{{ request.functionKey }}</td>
              <td :title="request.environmentType">{{ request.environmentType }}</td>
              <td :title="request.environmentId">{{ request.environmentId }}</td>
              <td :title="request.extensionType">{{ request.extensionType }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-if="selectedEntry" class="shadow-split-widget-contents shadow-split-widget-sidebar vbox">
      <div class="scroll">
        <label>Request</label>
        <div class="json-view">
          <json-pretty :data="selectedEntry.payload" theme="dark" show-icon />
        </div>
        <label>Response</label>
        <div class="json-view">
          <json-pretty v-if="selectedResponse" :data="selectedResponse" theme="dark" show-icon />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "chrome-devtools-frontend/front_end/ui/components/data_grid/dataGrid.css";
@import "chrome-devtools-frontend/front_end/ui/legacy/splitWidget.css";

table {
  height: auto;
}

.shadow-split-widget {
  height: 100%;
}

.shadow-split-widget-sidebar {
  width: 50%;

  > div {
    min-height: auto;
  }
}

label {
  width: 100%;
  display: block;
  font: var(--sys-typescale-monospace-bold);
  background: var(--color-background-highlight);
  z-index: 1;
  position: sticky;
  top: 0;
  left: 0;
}

.scroll {
  overflow: auto;
}

.json-view {
  width: max-content;
}
</style>
