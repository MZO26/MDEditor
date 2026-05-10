import { importNote } from "@/api/fileAPI";
import { sanitize } from "@/utils/sanitize";
import { showToast } from "@/utils/toast";

async function handleImportFile() {
  const response = await importNote();

  if (!response.success) {
    console.error(response.message);
    showToast(response.message);
    return response;
  }
  try {
    let content;
    switch (response.data.extension) {
      case "html":
        content = sanitize(response.data.content);
        break;
      case "json":
        content = JSON.parse(response.data.content);
        break;
      default:
        content = response.data.content;
    }
    return { success: true, ...response.data, content };
  } catch (error) {
    console.error(error);
    showToast("Failed to set editor content");
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export { handleImportFile };
