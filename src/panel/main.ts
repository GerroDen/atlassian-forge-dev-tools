import Devtools from "./Devtools.vue";
import "./main.css";
import "virtual:uno.css";
import { createApp } from "vue";
import VueJsonPretty from "vue-json-pretty";

createApp(Devtools).component("json-pretty", VueJsonPretty).mount("#app");
