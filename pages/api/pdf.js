// pages/api/pdf.js
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { getChromiumExecutablePath } from "../../lib/getChromiumPath";

export default async function handler(req, res) {
  let browser;

  try {
    const arabicText = "مرحبا بالعالم";

    const executablePath = await getChromiumExecutablePath();

    // Read font file from public/fonts
    const fontPath = path.join(process.cwd(), "public", "fonts", "Amiri-Regular.ttf");
    const fontBase64 = fs.readFileSync(fontPath).toString("base64");

    browser = await puppeteer.launch({
      args: process.env.VERCEL ? chromium.args : ["--no-sandbox"],
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <style>
            @font-face {
              font-family: "AmiriCustom";
              src: url(data:font/ttf;base64,${fontBase64}) format("truetype");
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
            }

            .text {
              font-family: "AmiriCustom";
              font-size: 70px;
              font-weight: normal;
              line-height: 1;
              color: black;
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
      preferCSSPageSize: true,
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
