// pages/api/pdf.js
// Server-side PDF generation (Local + Vercel)
// Fix: embed Amiri font so Arabic renders correctly on Vercel

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  let browser;

  try {
    const arabicText = "مرحبا بالعالم";
    const isVercel = !!process.env.VERCEL;

    // ✅ Load the Arabic font from /public/fonts
    const fontPath = path.join(process.cwd(), "public", "fonts", "Amiri-Regular.ttf");
    const fontBase64 = fs.readFileSync(fontPath).toString("base64");

    browser = await puppeteer.launch({
      args: isVercel ? chromium.args : ["--no-sandbox"],
      executablePath: isVercel
        ? await chromium.executablePath()
        : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      headless: true,
    });

    const page = await browser.newPage();

    // ✅ Embed font directly in HTML so Vercel can render Arabic
    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <style>
            @font-face {
              font-family: "Amiri";
              src: url("data:font/ttf;base64,${fontBase64}") format("truetype");
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
              font-family: "Amiri";
            }

            .text {
              font-size: 60px;
              font-weight: normal;
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

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="arabic.pdf"');
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("PDF error:", error);
    res.status(500).json({
      error: "Failed to generate PDF",
      message: error.message,
    });
  } finally {
    if (browser) await browser.close();
  }
}
