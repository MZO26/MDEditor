import fs from "fs";
import path from "path";

function sanitizeExportString(
  rawContent: string,
  exportDir: string,
  internalImgDir: string,
) {
  const assetsDir = path.join(exportDir, "assets");
  const universalRegex = /appimg:\/\/\/([^"' )>\s]+)/g;
  const portableContent = rawContent.replace(
    universalRegex,
    (_fullMatch, fileName) => {
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      const internalPath = path.join(internalImgDir, fileName);
      const exportPath = path.join(assetsDir, fileName);
      if (fs.existsSync(internalPath)) {
        fs.copyFileSync(internalPath, exportPath);
      }
      return `assets/${fileName}`;
    },
  );
  return portableContent;
}

function sanitizeImportString(
  importedContent: string,
  importedFileDir: string,
  internalImgDir: string,
) {
  const universalRegex = /(?:\.\/)?assets\/([^"' )>\s]+)/g;
  const internalContent = importedContent.replace(
    universalRegex,
    (_fullMatch, fileName) => {
      const sourceImagePath = path.join(importedFileDir, "assets", fileName);
      const destImagePath = path.join(internalImgDir, fileName);
      if (!fs.existsSync(internalImgDir)) {
        fs.mkdirSync(internalImgDir, { recursive: true });
      }
      if (fs.existsSync(sourceImagePath)) {
        fs.copyFileSync(sourceImagePath, destImagePath);
      }
      return `appimg:///${fileName}`;
    },
  );

  return internalContent;
}

export { sanitizeExportString, sanitizeImportString };
