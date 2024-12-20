import Devtools from "./Devtools.vue";
import "./main.css";
import "virtual:uno.css";
import { createApp } from "vue";
import VueJsonPretty from "vue-json-pretty";

document.body.classList.toggle("theme-with-dark-background", document.body.classList.contains("dark"));
createApp(Devtools).component("json-pretty", VueJsonPretty).mount("#app");
