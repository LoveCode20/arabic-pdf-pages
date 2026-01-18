// pages/api/pdf.js
// Server-side PDF generation (Local + Vercel)
// Uses puppeteer-core + @sparticuz/chromium for Vercel, and local Edge for localhost.

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(req, res) {
  let browser;

  try {
    const arabicText = "مرحبا بالعالم";
    const isVercel = !!process.env.VERCEL;

    // Use Vercel-compatible Chromium path on Vercel
    // Use Edge path on localhost
    const executablePath = isVercel
      ? await chromium.executablePath()
      : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    browser = await puppeteer.launch({
      args: isVercel
        ? chromium.args
        : ["--no-sandbox", "--disable-setuid-sandbox"],

      executablePath,

      // ✅ IMPORTANT: Vercel requires chromium.headless
      headless: isVercel ? chromium.headless : true,
    });

    const page = await browser.newPage();

    // Arabic direction + center alignment
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
              align-items: center;
              justify-content: center;
              background: white;
              direction: rtl;
              font-family: Arial, sans-serif;
            }
            .text {
              font-size: 60px;
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

    // ✅ Always set headers BEFORE sending PDF
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="arabic.pdf"');
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("PDF error:", error);

    return res.status(500).json({
      error: "Failed to generate PDF",
      message: error.message,
    });
  } finally {
    if (browser) await browser.close();
  }
}
