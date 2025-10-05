import { render } from "./modules/render.js";
import { load, save } from "./modules/storage.js";
import { attachUIEvents } from "./modules/ui.js";

load();
render();
attachUIEvents();
