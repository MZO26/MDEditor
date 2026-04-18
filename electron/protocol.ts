import { app, net, protocol } from "electron";
import { pathToFileURL } from "node:url";
import path from "path";

function registerProtocolPrivileges() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "appimg",
      privileges: {
        standard: true, // tells chrome to look at theme like it looks at http:// or https:// and unlocks file-system API
        secure: true, // tells chrome it's as secure as https://
        supportFetchAPI: true, // for editor to fetch image data
        stream: true,
        bypassCSP: true,
      },
    },
  ]);
}

async function setupLocalImageProtocol() {
  const imagesDir = path.join(app.getPath("userData"), "editor-images");
  protocol.handle("appimg", async (request) => {
    let pathPart = request.url.replace(/^appimg:\/+/i, ""); // removes prefix appimg://
    pathPart = pathPart.replace(/\/+$/, "");
    const fileName = decodeURIComponent(pathPart);
    const filePath = path.normalize(path.join(imagesDir, fileName));
    if (!filePath.startsWith(imagesDir)) {
      return new Response("Forbidden", { status: 403 });
    }
    try {
      const result = await net.fetch(pathToFileURL(filePath).toString());
      if (!result.ok) {
        throw new Error("File not found or unreadable");
      }
      return result;
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
}

export { registerProtocolPrivileges, setupLocalImageProtocol };
