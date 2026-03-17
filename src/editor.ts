import { Crepe } from "@milkdown/crepe";
import "@milkdown/crepe/theme/common/style.css";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { setupZoomBar, updateStats } from "./helpers.js";

const initEditor = async () => {
  const el = document.getElementById("editor");
  if (el) {
    const crepe = new Crepe({
      root: el,
      features: {
        [Crepe.Feature.Toolbar]: true,
        [Crepe.Feature.Placeholder]: true,
      },
    });
    crepe.editor.use(listener).config((ctx) => {
      ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
        updateStats(markdown);
      });
    });
    setupZoomBar();
    await crepe.create();
  }
};

export { initEditor };
