import { app } from "electron";
import * as fs from "fs";
import path from "path";

function loadPDFAssets(): { template: string; css: string } {
  const isDev = !app.isPackaged;
  const baseDir = isDev ? app.getAppPath() : process.resourcesPath;
  const pdfFolder = path.join(baseDir, "shared", "pdf");
  return {
    template: fs.readFileSync(path.join(pdfFolder, "pdf-export.html"), "utf8"),
    css: fs.readFileSync(path.join(pdfFolder, "pdf-export.css"), "utf8"),
  };
}

function renderPDFCanvas(
  safeData: string,
  assets: ReturnType<typeof loadPDFAssets>,
): string {
  return assets.template
    .replace("<!-- __CSS_PLACEHOLDER__ -->", `<style>${assets.css}</style>`)
    .replace(
      "<!-- __CONTENT_PLACEHOLDER__ -->",
      `<div class="ProseMirror" id="content-root">${safeData}</div>`,
    );
}
export { loadPDFAssets, renderPDFCanvas };
