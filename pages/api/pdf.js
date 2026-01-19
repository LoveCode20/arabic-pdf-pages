// pages/api/pdf.js
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export default async function handler(req, res) {
  let browser;

  try {
    const arabicText = "مرحبا بالعالم";
    const isVercel = !!process.env.VERCEL;

    const edgePath =
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    // ✅ Load font as base64
    const fontPath = path.join(
      process.cwd(),
      "public",
      "fonts",
      "Amiri-Regular.ttf"
    );
    const fontBase64 = fs.readFileSync(fontPath).toString("base64");

    // ✅ Build SVG (Arabic joins perfectly here)
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="500">
        <style>
          @font-face {
            font-family: "Amiri";
            src: url("data:font/ttf;base64,${fontBase64}") format("truetype");
          }
          body {
            margin: 0;
          }
          text {
            font-family: "Amiri";
            font-size: 120px;
            fill: #000;
            direction: rtl;
            unicode-bidi: plaintext;
          }
        </style>
        <text x="700" y="280" text-anchor="middle">${arabicText}</text>
      </svg>
    `;

    // ✅ Convert SVG → PNG (this is the magic)
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
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

    // ✅ Use PNG inside HTML (no broken Arabic anymore)
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
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#arabicImg");
    await new Promise((r) => setTimeout(r, 200));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
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
