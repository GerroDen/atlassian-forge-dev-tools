<script setup lang="ts">
import { get } from "lodash-es";
import { computed, onMounted, onUnmounted, type Ref, ref, watch } from "vue";

type Request = chrome.devtools.network.Request;

interface Entry {
  request: Request;
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

function addRequest(request: Request) {
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
}

watch(selectedEntry, () => {
  selectedResponse.value = undefined;
  selectedEntry.value?.request?.getContent((content) => {
    let responseBody = JSON.parse(content);
    selectedResponse.value = get(responseBody, "data.invokeExtension");
  });
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
  console.log("clear");
  requests.value.splice(0);
  selectedEntry.value = undefined;
}

onMounted(() => {
  chrome.devtools.network.onRequestFinished.addListener(addRequest);
});

onUnmounted(() => {
  chrome.devtools.network.onRequestFinished.removeListener(addRequest);
});
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-none search-drawer-header">
      <button class="toolbar-button" @click="clear()">Clear</button>
      <div class="toolbar-item-search">
        <input v-model.trim="filterInput" class="search-toolbar-input" type="text" placeholder="Filter" />
      </div>
      <button v-if="selectedEntry" @click="selectedEntry = undefined">close</button>
    </div>
    <div class="flex-1 grid" :class="{ 'grid-cols-2': selectedEntry }">
      <div class="striped">
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
            <tr v-for="request in filteredRequests" :class="{ selected: request === selectedEntry }" @click="toggleSelectedEntry(request)">
              <td :title="request.functionKey">{{ request.functionKey }}</td>
              <td :title="request.environmentType">{{ request.environmentType }}</td>
              <td :title="request.environmentId">{{ request.environmentId }}</td>
              <td :title="request.extensionType">{{ request.extensionType }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pos-relative border border-l-solid border-l-divider-line" v-if="selectedEntry">
        <div class="h-full overflow-auto">
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
@import "chrome-devtools-frontend/front_end/ui/components/data_grid/dataGrid.css";
@import "chrome-devtools-frontend/front_end/ui/components/input/textInput.css";
@import "chrome-devtools-frontend/front_end/panels/search/searchView.css";

label {
  display: block;
  position: sticky;
  top: 0;
  left: 0;
  align-content: center;
  z-index: 1;
  background: var(--color-background-highlight);
  padding-inline: 0.25rem;
  width: 100%;
  height: 1rem;
  font: var(--sys-typescale-monospace-bold);

  &.error {
    background: var(--color-red);
  }
}
</style>
