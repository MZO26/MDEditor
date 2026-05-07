import { getPlatform } from "@/api/electronAPI";

async function getPlatformData() {
  console.log("getPlatformData started...");
  const response = await getPlatform();
  console.log("Response received:", response);
  if (!response.success) {
    console.log("no success");
    return;
  }
  const platform = response.data as string;
  console.log(platform);
  document.body.classList.add(platform);
  console.log(`OS Class applied: ${platform}`);
}

export { getPlatformData };
