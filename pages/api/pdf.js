// pages/api/pdf.js
// Generates a PDF on the SERVER and returns it as a download.
// Contains one hard-coded Arabic sentence: "مرحبا بالعالم"

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(req, res) {
  let browser;

  try {
    const arabicText = "مرحبا بالعالم";

    // Detect local vs production (Vercel/Netlify)
    const isProduction = process.env.NODE_ENV === "production";

    // Local Windows (Microsoft Edge)
    const edgePath =
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    // Launch browser
    browser = await puppeteer.launch(
      isProduction
        ? {
            // Production (serverless) config
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
          }
        : {
            // Local config
            headless: "new",
            executablePath: edgePath,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          }
    );

    const page = await browser.newPage();

    // Minimal HTML with Arabic RTL support
    const html = `
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              direction: rtl;
              text-align: center;
              margin-top: 250px;
              font-size: 48px;
            }
          </style>
        </head>
        <body>${arabicText}</body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    // Return raw PDF bytes
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=arabic.pdf");
    res.end(pdfBuffer);
  } catch (err) {
    console.log("PDF error:", err);

    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Failed to generate PDF",
        message: err?.message || String(err),
      })
    );
  } finally {
    if (browser) await browser.close();
  }
}
