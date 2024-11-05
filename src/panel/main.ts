import Devtools from "./Devtools.vue";
import "beercss";
import "material-dynamic-colors";
import { createApp } from "vue";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";

createApp(Devtools).component("json-pretty", VueJsonPretty).mount("#app");
