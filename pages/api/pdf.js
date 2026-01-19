// pages/api/pdf.js
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  let browser;

  try {
    const isVercel = !!process.env.VERCEL;

    // ✅ Machine-readable Arabic (REAL unicode text)
    const unicodeArabic = "مرحبا بالعالم";

    // ✅ Perfect-looking Arabic (Presentation Forms)
    // This forces joined letters exactly as expected
    const shapedArabic = "ﻣﺮﺣﺒﺎ ﺑﺎﻟﻌﺎﻟﻢ";

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
              font-family: "Amiri", serif;
              direction: rtl;
              text-align: center;
            }

            /* Wrapper */
            .wrap {
              position: relative;
              display: inline-block;
            }

            /* ✅ Visible text: forced perfect shaping */
            .visibleArabic {
              font-size: 70px;
              font-weight: 400;
              color: #000;
              line-height: 1.2;
              white-space: nowrap;
              direction: rtl;
              unicode-bidi: isolate;
              letter-spacing: 0 !important;
              word-spacing: 0 !important;
              font-kerning: normal;
              text-rendering: geometricPrecision;
            }

            /* ✅ Invisible machine-readable layer (real unicode) */
            .hiddenUnicode {
              position: absolute;
              inset: 0;
              font-size: 70px;
              font-weight: 400;
              line-height: 1.2;
              white-space: nowrap;
              direction: rtl;

              /* invisible but selectable/searchable */
              color: transparent;
              -webkit-text-fill-color: transparent;

              /* keep it in text layer */
              opacity: 0.01;

              pointer-events: none;
              user-select: text;
            }
          </style>
        </head>

        <body>
          <div class="wrap">
            <!-- ✅ Perfect-looking Arabic -->
            <div class="visibleArabic" id="arabicText">${shapedArabic}</div>

            <!-- ✅ Machine-readable Unicode Arabic (invisible overlay) -->
            <div class="hiddenUnicode">${unicodeArabic}</div>
          </div>

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
