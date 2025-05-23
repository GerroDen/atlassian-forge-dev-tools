<script setup lang="ts">
import IconButton from "./IconButton.vue";
import TextInput from "./TextInput.vue";
import type { Har } from "har-format";
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

function formatTiming(timing: number = 0): string {
  return Math.max(timing, 0).toFixed() + "ms";
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
    <div class="flex gap-col-1 items-center">
      <IconButton @click="clear()" title="Clear Calls"><div class="i-mdi:cancel" /></IconButton>
      <TextInput v-model.trim="filterInput" placeholder="Filter" />
      <IconButton @click="harFileRef?.click" title="Import HAR"><div class="i-mdi:upload" /></IconButton>
      <input ref="harFile" class="hidden" type="file" accept=".har" @change="analyzeHar" />
    </div>
    <div class="h-full pos-relative flex-1 grid" :class="{ 'grid-cols-2': selectedEntry }">
      <div class="overflow-auto">
        <table class="striped">
          <thead>
            <tr>
              <th>functionKey</th>
              <th>time</th>
              <th>environmentType</th>
              <th>environmentId</th>
              <th>extension.type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in filteredRequests" class="revealed" :class="{ 'bg-surface5!': request === selectedEntry }" @click="toggleSelectedEntry(request)">
              <td :title="request.functionKey">{{ request.functionKey }}</td>
              <td>{{ formatTiming(request.request.time) }}</td>
              <td :title="request.environmentType">{{ request.environmentType }}</td>
              <td :title="request.environmentId">{{ request.environmentId }}</td>
              <td :title="request.extensionType">{{ request.extensionType }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="border border-l-solid border-l-divider border-t-solid border-t-divider overflow-auto" v-if="selectedEntry">
        <IconButton class="pos-absolute top-0 z-2" title="Close Details" @click="selectedEntry = undefined"><div class="i-mdi:close" /></IconButton>
        <details>
          <summary>Details</summary>
          <section>
            <table>
              <tr>
                <td>functionKey</td>
                <td>{{ selectedEntry.functionKey }}</td>
              </tr>
              <tr>
                <td>time</td>
                <td>{{ formatTiming(selectedEntry.request.time) }}</td>
              </tr>
              <tr>
                <td>environmentType</td>
                <td>{{ selectedEntry.environmentType }}</td>
              </tr>
              <tr>
                <td>environmentId</td>
                <td>{{ selectedEntry.environmentId }}</td>
              </tr>
              <tr>
                <td>extensionType</td>
                <td>{{ selectedEntry.extensionType }}</td>
              </tr>
              <tr>
                <td colspan="2" class="border-t border-t-solid border-t-divider">Timings</td>
              </tr>
              <tr>
                <td>blocked</td>
                <td>{{ formatTiming(selectedEntry.request.timings.blocked) }}</td>
              </tr>
              <tr>
                <td>dns</td>
                <td>{{ formatTiming(selectedEntry.request.timings.dns) }}</td>
              </tr>
              <tr>
                <td>connect</td>
                <td>{{ formatTiming(selectedEntry.request.timings.connect) }}</td>
              </tr>
              <tr>
                <td>send</td>
                <td>{{ formatTiming(selectedEntry.request.timings.send) }}</td>
              </tr>
              <tr>
                <td>wait</td>
                <td>{{ formatTiming(selectedEntry.request.timings.wait) }}</td>
              </tr>
              <tr>
                <td>receive</td>
                <td>{{ formatTiming(selectedEntry.request.timings.receive) }}</td>
              </tr>
              <tr>
                <td>ssl</td>
                <td>{{ formatTiming(selectedEntry.request.timings.ssl) }}</td>
              </tr>
            </table>
          </section>
        </details>
        <details open>
          <summary>Request</summary>
          <div class="json">
            <json-pretty :data="selectedEntry?.payload" theme="dark" show-icon />
          </div>
        </details>
        <details open>
          <summary class="head" v-if="!selectedResponse?.errors">Response</summary>
          <summary class="head error" v-if="selectedResponse?.errors">[Error]</summary>
          <div class="json">
            <json-pretty v-if="selectedResponse?.response" :data="selectedResponse.response?.body" theme="dark" show-icon />
            <pre v-if="selectedResponse?.errors" v-for="error in selectedResponse?.errors">{{ error.message }}</pre>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
summary {
  position: sticky;
  top: 0;
  z-index: 1;
  background: theme("colors.surface");
  text-align: right;

  .error {
    background: theme("colors.surface.error");
    color: theme("colors.on.surface.error");
  }
}

summary,
details > section {
  padding: 1px 5px;
}

td {
  white-space: nowrap;
}

.json {
  min-width: 100%;
  max-width: max-content;
}
</style>
