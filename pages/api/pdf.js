// pages/api/pdf.js
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  let browser;

  try {
    const arabicText = "مرحبا بالعالم";
    const isVercel = !!process.env.VERCEL;

    const edgePath =
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

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

    // ✅ read font from public/fonts
    const fontPath = path.join(
      process.cwd(),
      "public",
      "fonts",
      "Amiri-Regular.ttf"
    );

    const fontBase64 = fs.readFileSync(fontPath).toString("base64");

    const html = `
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <style>
            @font-face {
              font-family: "Amiri";
              src: url("data:font/ttf;base64,${fontBase64}") format("truetype");
              font-weight: normal;
              font-style: normal;
            }

            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              background: #ffffff;
            }

            body {
              display: flex;
              align-items: center;
              justify-content: center;
              direction: rtl;
              text-align: center;
              font-family: "Amiri", serif;
            }

            .text {
              font-size: 60px;
              font-weight: 400;
              color: #000;
              line-height: 1.2;
            }
          </style>
        </head>

        <body>
          <div class="text" id="arabicText">${arabicText}</div>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="arabic.pdf"');

    return res.status(200).end(pdfBuffer);
  } catch (err) {
    console.log("PDF error:", err);
    return res.status(500).json({
      error: "Failed to generate PDF",
      message: err?.message || String(err),
    });
  } finally {
    if (browser) await browser.close();
  }
}
