import { render } from "./modules/render.js";
import { load } from "./modules/storage.js";
import { attachUIEvents } from "./modules/ui.js";

load();
render();
attachUIEvents();
