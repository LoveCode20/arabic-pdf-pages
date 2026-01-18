import chromium from "@sparticuz/chromium";

export async function getChromiumExecutablePath() {
  return await chromium.executablePath();
}
