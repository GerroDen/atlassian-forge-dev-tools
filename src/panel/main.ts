import Devtools from "./Devtools.vue";
import "chrome-devtools-frontend/front_end/ui/legacy/applicationColorTokens.css";
import "chrome-devtools-frontend/front_end/ui/legacy/designTokens.css";
import "chrome-devtools-frontend/front_end/ui/legacy/inspectorCommon.css";
import "chrome-devtools-frontend/front_end/ui/legacy/themeColors.css";
import "chrome-devtools-frontend/front_end/ui/legacy/tokens.css";
import { createApp } from "vue";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";

document.body.classList.toggle("theme-with-dark-background", document.body.classList.contains("dark"));
createApp(Devtools).component("json-pretty", VueJsonPretty).mount("#app");
