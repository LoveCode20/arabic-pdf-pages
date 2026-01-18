// pages/api/pdf.js
// Server-side PDF generation (Local + Vercel)
// Uses puppeteer-core + @sparticuz/chromium for Vercel, and local Edge for localhost.
// IMPORTANT: We embed Amiri font so Arabic renders correctly on Vercel too.

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

      // Vercel needs chromium.headless, local can be true
      headless: isVercel ? chromium.headless : true,
    });

    const page = await browser.newPage();

    // ✅ Use absolute URL so it works on Vercel + Local
    const host = req.headers.host;
    const protocol = host?.includes("localhost") ? "http" : "https";
    const fontUrl = `${protocol}://${host}/fonts/Amiri-Regular.ttf`;

    // ✅ Embed Arabic font so Vercel PDF won't be blank
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
              direction: rtl;
              font-family: "Amiri", Arial, sans-serif;
            }

            .text {
              font-size: 60px;
              font-weight: 400;
            }
          </style>
        </head>
        <body>
          <div class="text">${arabicText}</div>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "networkidle0" });

    // ✅ Ensure the font loads before PDF is printed
    await page.evaluateHandle("document.fonts.ready");

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

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
