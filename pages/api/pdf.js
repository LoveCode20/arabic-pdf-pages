// pages/api/pdf.js
// Server-side PDF generation (Local + Vercel)
// Ensures Arabic text is visible before generating PDF (fixes blank PDF on Vercel)

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

    // Build full URL (works on both local + Vercel)
    const host = req.headers.host;
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const fontUrl = `${baseUrl}/fonts/Amiri-Regular.ttf`;

    const html = `
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <style>
            @font-face {
              font-family: "Amiri";
              src: url("${fontUrl}") format("truetype");
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

    await page.setContent(html, { waitUntil: "networkidle0" });

    // ✅ Wait for fonts to load fully
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    // ✅ Ensure the Arabic text element exists + has visible text
    await page.waitForSelector("#arabicText");

    // Extra safe delay (works everywhere)
    await new Promise((resolve) => setTimeout(resolve, 300));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="arabic.pdf"');
    return res.end(pdfBuffer);
  } catch (err) {
    console.log("PDF error:", err);

    return res.status(500).json({
      error: "Failed to generate PDF",
      message: err?.message || String(err),
    });
  } finally {
    try {
      if (browser) await browser.close();
    } catch (e) {}
  }
}
