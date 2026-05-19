import { loadPDFAssets, renderPDFCanvas } from "@electron/handler/pdf-handler";
import type { BrowserWindow, PrintToPDFOptions } from "electron";
import fs from "node:fs/promises";

async function exportPdfNote(params: {
  win: BrowserWindow;
  filePath: string;
  html: string;
  assets: ReturnType<typeof loadPDFAssets>;
}): Promise<string> {
  const { win, filePath, html, assets } = params;

  const pdfOptions: PrintToPDFOptions = {
    pageSize: "A4",
    printBackground: true,
    landscape: false,
  };

  const htmlString = renderPDFCanvas(html, assets);
  const encoded = Buffer.from(htmlString, "utf8").toString("base64");

  await win.loadURL(`data:text/html;base64,${encoded}`);
  const pdfBuffer = await win.webContents.printToPDF(pdfOptions);
  await fs.writeFile(filePath, pdfBuffer);

  return filePath;
}

export { exportPdfNote };
