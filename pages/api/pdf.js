// pages/api/pdf.js
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(req, res) {
  let browser;

  try {
    const arabicText = "مرحبا بالعالم";
    const isVercel = !!process.env.VERCEL;

    // Local Edge path
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

    const html = `
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <style>
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

              /* ✅ IMPORTANT:
                 Don't force Amiri.
                 Use system fonts that shape Arabic properly like localhost Edge.
              */
              font-family: "Segoe UI", "Tahoma", "Arial", sans-serif;
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

          <script>
            // Ensure layout is ready before PDF
            window.__READY__ = false;
            window.onload = () => { window.__READY__ = true; };
          </script>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    // Wait for the page to be ready
    await page.waitForFunction(() => window.__READY__ === true, {
      timeout: 5000,
    });

    await page.waitForSelector("#arabicText");

    // small delay to stabilize rendering
    await new Promise((resolve) => setTimeout(resolve, 300));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="arabic.pdf"');

    res.status(200).end(pdfBuffer);
  } catch (err) {
    console.log("PDF error:", err);

    res.status(500).json({
      error: "Failed to generate PDF",
      message: err?.message || String(err),
    });
  } finally {
    try {
      if (browser) await browser.close();
    } catch (e) {}
  }
}
