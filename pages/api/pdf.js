// pages/api/pdf.js
// Generates a PDF server-side with Arabic text (works locally + Vercel)

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(req, res) {
  let browser;

  try {
    const arabicText = "مرحبا بالعالم";

    // Vercel sets these env vars automatically
    const isVercel =
      process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;

    // ✅ Correct executable path for each environment
    const executablePath = isVercel
      ? await chromium.executablePath()
      : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"; // Local Edge

    browser = await puppeteer.launch({
      args: isVercel
        ? chromium.args
        : ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath,
      headless: isVercel ? chromium.headless : true,
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
              background: #fff;
              direction: rtl;
            }
            .text {
              font-size: 60px;
              font-family: Arial, sans-serif;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="text">${arabicText}</div>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="arabic.pdf"');

    return res.status(200).end(pdfBuffer);
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
