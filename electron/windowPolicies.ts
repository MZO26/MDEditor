import { shell, type BrowserWindow } from "electron";

function navigationHandler(win: BrowserWindow) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsedUrl = new URL(url);
      const isSafeProtocol =
        parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
      if (isSafeProtocol) {
        shell.openExternal(url);
      } else {
        console.warn(
          `Blocked attempt to open dangerous protocol: ${parsedUrl.protocol}`,
        );
      }
    } catch (error) {
      console.error(`Blocked URL: ${url}`);
    }
    return { action: "deny" };
  });
}

export { navigationHandler };
