import { AppBackendError } from "@electron/ipc/ipc-error-handler";
import { AppErrorCode } from "@shared/errors";
import type { ImagePayload } from "@shared/schemas/image-schema";
import { createHash } from "crypto";
import { app } from "electron";
import fs from "node:fs";
import path from "path";

async function handleImageWrite(validatedData: ImagePayload) {
  const userDataPath = app.getPath("userData");
  const imagesFolder = path.join(userDataPath, "editor-images");
  fs.mkdirSync(imagesFolder, { recursive: true });
  const imageBuffer = Buffer.from(validatedData.imageData);
  const hash = createHash("sha256").update(imageBuffer).digest("hex");
  const fileName = `${hash}.${validatedData.extension}`;
  const filePath = path.join(imagesFolder, fileName);
  try {
    fs.writeFileSync(filePath, imageBuffer, { flag: "wx" });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "EEXIST") {
      throw new AppBackendError(AppErrorCode.FileWriteError);
    }
  }
  return { imageSrc: `appimg:///${fileName}` };
}

export { handleImageWrite };
