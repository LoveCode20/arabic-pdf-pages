// pages/api/pdf.js
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  let browser;

  try {
    const arabicText = "مرحبا بالعالم";
    const isVercel = !!process.env.VERCEL;

    const edgePath =
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    // ✅ Read font locally (works on localhost + Vercel if committed)
    const fontPath = path.resolve("./public/fonts/Amiri-Regular.ttf");

    if (!fs.existsSync(fontPath)) {
      throw new Error(`Font not found at: ${fontPath}`);
    }

    const fontBase64 = fs.readFileSync(fontPath).toString("base64");

    // ✅ SVG -> PNG (Arabic should look correct)
    // IMPORTANT: add xml header + use unicode-bidi: plaintext (more stable)
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="500">
        <style>
          @font-face {
            font-family: "Amiri";
            src: url("data:font/ttf;base64,${fontBase64}") format("truetype");
          }
          text {
            font-family: "Amiri";
            font-size: 120px;
            fill: #000;
            direction: rtl;
            unicode-bidi: plaintext;
          }
        </style>

        <rect width="100%" height="100%" fill="#ffffff" />
        <text x="700" y="280" text-anchor="middle">${arabicText}</text>
      </svg>
    `;

    // ✅ MAIN FIX: Sharp needs density for clean SVG rendering (especially on Vercel)
    // Without density, SVG fonts can fail or render as boxes.
    const pngBuffer = await sharp(Buffer.from(svg), { density: 300 })
      .png()
      .toBuffer();

    const pngBase64 = pngBuffer.toString("base64");

    browser = await puppeteer.launch(
      isVercel
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
          }
    );

    const page = await browser.newPage();

    // ✅ Make page stable for serverless
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
          <img id="arabicImg" src="data:image/png;base64,${pngBase64}" />
          <script>
            const img = document.getElementById("arabicImg");
            img.onload = () => { window.__IMG_READY__ = true; };
            img.onerror = () => { window.__IMG_ERROR__ = true; };
          </script>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    // ✅ Wait until image is loaded (avoid blank pdf)
    await page.waitForFunction(
      () => window.__IMG_READY__ === true || window.__IMG_ERROR__ === true,
      { timeout: 10000 }
    );

    // If image failed to load, throw error
    const imgError = await page.evaluate(() => window.__IMG_ERROR__ === true);
    if (imgError) {
      throw new Error("PNG image failed to load inside Puppeteer page");
    }

    // extra tiny delay for Vercel Chromium stability
    await new Promise((r) => setTimeout(r, 200));

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
