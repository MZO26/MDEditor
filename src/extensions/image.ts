import type { Editor } from "@tiptap/core";
import type { ImagePayload } from "../shared/types";
import { showToast } from "../utils/toast";

async function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.8,
): Promise<Uint8Array> {
  const img = new Image();
  const objectUrl = URL.createObjectURL(file); // creates tiny reference-url
  return new Promise((resolve, reject) => {
    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // frees ram space
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const buffer = await blob.arrayBuffer();
            resolve(new Uint8Array(buffer));
          } else {
            reject(new Error("Compression failed"));
          }
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };
    img.src = objectUrl;
  });
}

function promptImageUpload(editor: Editor) {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg, image/png, image/gif, image/webp";
  input.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      if (!allowedTypes.includes(file.type)) {
        console.error("Invalid file type.");
        showToast("Security Error: Only JPG, PNG, GIF, and WebP are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        showToast("Error: Image must be under 5MB.");
        return;
      }
      try {
        const compressedImage = await compressImage(file);
        const extension = file.type.split("/")[1];
        if (!extension) return;
        const result = await window.electronAPI.saveImage({
          imageData: compressedImage,
          extension: extension as ImagePayload["extension"],
        });
        if (!result.success) {
          showToast("Error: Could not save image to disk.");
          return;
        }
        editor.chain().focus().setImage({ src: result.data.imageSrc }).run();
      } catch (error) {
        console.error("Failed to process and insert image:", error);
      }
    }
  };
  input.click();
}

export { promptImageUpload };
