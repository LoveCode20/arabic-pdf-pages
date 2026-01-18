// pages/api/pdf.js
// Server-side PDF generation (Local + Vercel)
// Uses Puppeteer to render HTML -> PDF (Arabic renders correctly)

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(req, res) {
  let browser;

  try {
    const arabicText = "مرحبا بالعالم";
    const isVercel = !!process.env.VERCEL;

    // Local Edge path (since you use Edge)
    const localEdgePath =
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    browser = await puppeteer.launch({
      args: isVercel
        ? chromium.args
        : ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: isVercel ? await chromium.executablePath() : localEdgePath,
      headless: true,
    });

    const page = await browser.newPage();

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              margin: 0;
              height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              background: white;
              direction: rtl;
              font-family: Arial, sans-serif;
            }
            .text {
              font-size: 48px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="text">${arabicText}</div>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    // VERY IMPORTANT: send correct headers + end response properly
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="arabic.pdf"');
    res.setHeader("Content-Length", pdfBuffer.length);

    res.end(pdfBuffer);
  } catch (error) {
    console.error("PDF error:", error);

    // Return JSON so we can see the real error
    res.status(500).json({
      error: "Failed to generate PDF",
      message: error.message,
    });
  } finally {
    if (browser) await browser.close();
  }
}
