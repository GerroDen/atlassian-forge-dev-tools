<script setup lang="ts">
import type { Har, Request as HarRequest } from "har-format";
import { get, isString } from "lodash-es";
import { computed, onMounted, onUnmounted, type Ref, ref, useTemplateRef, watch } from "vue";

type RequestEntry = chrome.devtools.network.Request | chrome.devtools.network.HAREntry;

interface Entry {
  request: RequestEntry;
  functionKey: string;
  environmentType: string;
  environmentId: string;
  extensionType: string;
  payload: unknown;
}

interface ForgeFunctionError {
  message: string;
}

interface ForgeFunctionResponse {
  response?: {
    body?: unknown;
  };
  errors?: ForgeFunctionError[];
}

// type inferrence is erronous
const requests = ref<Entry[]>([]) as Ref<Entry[]>;
// type inferrence is erronous
const selectedEntry = ref<Entry>() as Ref<Entry | undefined>;
const filterInput = ref<string>();
const selectedResponse = ref<ForgeFunctionResponse>();
const harFileRef = useTemplateRef<HTMLInputElement>("harFile");

function addRequest(request: RequestEntry) {
  const url = new URL(request.request.url);
  if (!url.pathname.endsWith("/gateway/api/graphql")) return;
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
}

watch(selectedEntry, () => {
  selectedResponse.value = undefined;
  const request = selectedEntry.value?.request;
  if (!request) return;
  if ("getContent" in request) {
    request.getContent((content) => {
      const responseBody = JSON.parse(content);
      selectedResponse.value = get(responseBody, "data.invokeExtension");
    });
  }
  const content = request.response.content.text;
  if (!content) return;
  const responseBody = JSON.parse(content);
  selectedResponse.value = get(responseBody, "data.invokeExtension");
});

const filteredRequests = computed(() => {
  const searchTerm = filterInput.value;
  if (!searchTerm) {
    return requests.value;
  }
  return requests.value.filter((request) => {
    const filterFields = [request.functionKey, request.environmentType, request.environmentId, request.extensionType];
    return filterFields.some((value) => value.toLowerCase().includes(searchTerm.toLowerCase()));
  });
});

function toggleSelectedEntry(request: Entry) {
  if (selectedEntry.value === request) {
    selectedEntry.value = undefined;
  } else {
    selectedEntry.value = request;
  }
}

function clear() {
  requests.value.splice(0);
  selectedEntry.value = undefined;
}

function analyzeHar() {
  const inputValue = harFileRef.value;
  const fileReader = new FileReader();
  const file = inputValue?.files?.[0];
  if (!file) return;
  fileReader.readAsText(file);
  fileReader.addEventListener("load", () => {
    requests.value = [];
    if (!isString(fileReader.result)) return;
    const har = JSON.parse(fileReader.result) as Har;
    har.log.entries.forEach(addRequest);
  });
}

onMounted(() => {
  chrome.devtools.network.onRequestFinished.addListener(addRequest);
  chrome.devtools.network.onNavigated.addListener(clear);
});

onUnmounted(() => {
  chrome.devtools.network.onRequestFinished.removeListener(addRequest);
  chrome.devtools.network.onNavigated.removeListener(clear);
});
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="search-drawer-header gap-col-1">
      <button class="icon" @click="clear()" title="Clear Calls"><devtools-icon class="i-mdi:cancel" /></button>
      <div class="toolbar-item-search m-0!">
        <input v-model.trim="filterInput" class="search-toolbar-input" type="text" placeholder="Filter" />
      </div>
      <button class="icon" @click="harFileRef?.click" title="Import HAR"><devtools-icon class="i-mdi:upload" /></button>
      <input ref="harFile" type="file" accept=".har" @change="analyzeHar" class="hidden" />
    </div>
    <div class="flex-1 grid" :class="{ 'grid-cols-2': selectedEntry }">
      <div class="data-grid striped">
        <table class="h-auto!">
          <thead>
            <tr>
              <th>functionKey</th>
              <th>environmentType</th>
              <th>environmentId</th>
              <th>extension.type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in filteredRequests" class="revealed" :class="{ selected: request === selectedEntry }" @click="toggleSelectedEntry(request)">
              <td :title="request.functionKey">{{ request.functionKey }}</td>
              <td :title="request.environmentType">{{ request.environmentType }}</td>
              <td :title="request.environmentId">{{ request.environmentId }}</td>
              <td :title="request.extensionType">{{ request.extensionType }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pos-relative border border-l-solid border-l-divider-line border-t-solid border-t-divider-line" v-if="selectedEntry">
        <div class="h-full overflow-auto">
          <button class="icon" @click="selectedEntry = undefined" title="Close Details"><devtools-icon class="i-mdi:close" /></button>
          <label>Request</label>
          <div class="w-max">
            <json-pretty :data="selectedEntry?.payload" theme="dark" show-icon />
          </div>
          <label v-if="!selectedResponse?.errors">Response</label>
          <label v-if="selectedResponse?.errors" class="error">[Error]</label>
          <div class="w-max">
            <json-pretty v-if="selectedResponse?.response" :data="selectedResponse.response?.body" theme="dark" show-icon />
            <pre v-if="selectedResponse?.errors" v-for="error in selectedResponse?.errors">{{ error.message }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "chrome-devtools-frontend/front_end/ui/legacy/components/data_grid/dataGrid.css";
@import "chrome-devtools-frontend/front_end/ui/components/buttons/button.css";
@import "chrome-devtools-frontend/front_end/ui/components/buttons/textButton.css";
@import "chrome-devtools-frontend/front_end/ui/components/input/textInput.css";
@import "chrome-devtools-frontend/front_end/panels/search/searchView.css";

label {
  display: block;
  position: sticky;
  top: 0;
  left: 0;
  align-content: center;
  z-index: 1;
  background: var(--color-grid-selected);
  padding-inline: 0.25rem;
  width: 100%;
  height: 1rem;
  font: var(--sys-typescale-monospace-bold);

  &.error {
    background: var(--color-red);
  }
}
</style>
