// pages/api/pdf.js
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  let browser;

  try {
    const isVercel = !!process.env.VERCEL;

    // Local Edge path (Windows)
    const edgePath =
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    // ✅ IMPORTANT: Always read from /public
    const imgPath = path.join(process.cwd(), "public", "arabic.png");

    if (!fs.existsSync(imgPath)) {
      throw new Error(
        `arabic.png not found. Put it inside: public/arabic.png (current: ${imgPath})`
      );
    }

    const imgBase64 = fs.readFileSync(imgPath).toString("base64");

    const launchOptions = isVercel
      ? {
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        }
      : {
          headless: "new",
          executablePath: edgePath,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        };

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    // Make it stable in serverless
    await page.setViewport({ width: 1200, height: 800 });

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            img {
              width: 720px;
              height: auto;
            }
          </style>
        </head>
        <body>
          <img id="arabicImg" src="data:image/png;base64,${imgBase64}" />
          <script>
            const img = document.getElementById("arabicImg");
            img.onload = () => { window.__READY__ = true; };
            img.onerror = () => { window.__READY__ = "error"; };
          </script>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    // ✅ Wait until image is FULLY loaded
    await page.waitForFunction(() => window.__READY__ === true, {
      timeout: 15000,
    });

    // extra delay helps Vercel Chromium
    await new Promise((r) => setTimeout(r, 300));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="arabic.pdf"');

    res.status(200).end(pdfBuffer);
    return;
  } catch (err) {
    console.log("PDF error:", err);

    res.status(500).json({
      error: "Failed to generate PDF",
      message: err?.message || String(err),
    });
    return;
  } finally {
    try {
      if (browser) await browser.close();
    } catch (e) {}
  }
}
