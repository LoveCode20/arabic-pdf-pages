// pages/api/pdf.js
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  let browser;

  try {
    // ❌ Normal Arabic (Chromium may break it)
    const arabicText = "مرحبا بالعالم";

    // ✅ Forced-joined Arabic (Presentation Forms) — will always look correct
    const shapedArabic = "ﻣﺮﺣﺒﺎ ﺑﺎﻟﻌﺎﻟﻢ";

    const isVercel = !!process.env.VERCEL;

    // Local Edge path (Windows)
    const edgePath =
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    // ✅ Read Amiri font from public/fonts
    const fontPath = path.join(
      process.cwd(),
      "public",
      "fonts",
      "Amiri-Regular.ttf"
    );

    if (!fs.existsSync(fontPath)) {
      throw new Error(
        `Font not found. Put it here: public/fonts/Amiri-Regular.ttf`
      );
    }

    const fontBase64 = fs.readFileSync(fontPath).toString("base64");

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
    await page.setViewport({ width: 1200, height: 800 });

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
              background: #fff;
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
              font-size: 70px;
              font-weight: 400;
              color: #000;
              line-height: 1.2;

              direction: rtl;
              unicode-bidi: isolate;
              letter-spacing: 0;
              white-space: nowrap;
              font-kerning: normal;
              font-feature-settings: "kern" 1, "liga" 1;
            }
          </style>
        </head>

        <body>
          <!-- ✅ Use shapedArabic so it displays correctly -->
          <div class="text" id="arabicText">${shapedArabic}</div>

          <script>
            document.fonts.ready.then(() => {
              window.__READY__ = true;
            });
          </script>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    await page.waitForFunction(() => window.__READY__ === true, {
      timeout: 15000,
    });

    await page.waitForSelector("#arabicText");
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
