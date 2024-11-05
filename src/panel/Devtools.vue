<script setup lang="ts">
import { get } from "lodash-es";
import { onMounted, onUnmounted, ref } from "vue";

type Request = chrome.devtools.network.Request;

interface Entry {
  functionName: string;
  payload?: unknown;
  response?: unknown;
}

const requests = ref<Entry[]>([]);

const addRequest = (request: Request) => {
  if (!request.request.url.endsWith(".atlassian.net/gateway/api/graphql")) return;
  const requestBody = JSON.parse(request.request.postData?.text ?? "null");
  const responseBody = JSON.parse(request.response.content.text ?? "null");
  const operationName = get(requestBody, "operationName");
  if (operationName !== "forge_ui_invokeExtension") return;
  const functionName = get(requestBody, "variables.input.payload.call.functionKey");
  if (!functionName) return;
  const payload = get(requestBody, "variables.input.payload.call.payload");
  const response = get(responseBody, "data.invokeExtension.response.body");
  requests.value.push({ functionName, payload, response });
};

onMounted(() => {
  chrome.devtools.network.onRequestFinished.addListener(addRequest);
});

onUnmounted(() => {
  chrome.devtools.network.onRequestFinished.removeListener(addRequest);
});
</script>

<template>
  <article class="row" v-for="request in requests">
    <details class="max">
      <summary class="none">{{ request.functionName }}</summary>
      <label>Request</label>
      <div class="scroll">
        <json-pretty :data="request.payload" theme="dark" show-icon />
      </div>
      <label>Response</label>
      <div class="scroll">
        <json-pretty :data="request.response" theme="dark" show-icon />
      </div>
    </details>
  </article>
</template>

<style scoped></style>
