// pages/api/pdf.js
// Server-side PDF generation (Local + Vercel)
// Uses puppeteer-core + @sparticuz/chromium on Vercel
// Uses local Edge on localhost
// FIX: Proper Arabic shaping using arabic-persian-reshaper + bidi-js

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import reshape from "arabic-persian-reshaper";
import bidi from "bidi-js";

export default async function handler(req, res) {
  let browser;

  try {
    const rawArabicText = "مرحبا بالعالم";
    const isVercel = !!process.env.VERCEL;

    // ✅ 1) Shape Arabic letters properly (joins letters)
    const reshaped = reshape(rawArabicText);

    // ✅ 2) Convert to RTL visual order (so it displays correctly)
    const bidiEngine = bidi();
    const finalArabicText = bidiEngine.getDisplay(reshaped);

    const executablePath = isVercel
      ? await chromium.executablePath()
      : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    browser = await puppeteer.launch({
      args: isVercel
        ? chromium.args
        : ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath,
      headless: isVercel ? chromium.headless : true,
    });

    const page = await browser.newPage();

    // ✅ Load font from your public folder (works on local + vercel)
    const host = req.headers.host;
    const protocol = host?.includes("localhost") ? "http" : "https";
    const fontUrl = `${protocol}://${host}/fonts/Amiri-Regular.ttf`;

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <style>
            @font-face {
              font-family: "Amiri";
              src: url("${fontUrl}") format("truetype");
              font-weight: normal;
              font-style: normal;
            }

            body {
              margin: 0;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: white;
            }

            .text {
              font-family: "Amiri", serif;
              font-size: 60px;
              font-weight: 400;
            }
          </style>
        </head>
        <body>
          <div class="text">${finalArabicText}</div>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    res.status(200);
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
