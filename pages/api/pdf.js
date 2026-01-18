// pages/api/pdf.js
// Generates a PDF on the SERVER and returns it as a download.
// Hard-coded Arabic sentence: "مرحبا بالعالم"
// Works on Local (Edge) + Vercel (sparticuz/chromium)

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(req, res) {
  let browser;

  try {
    const arabicText = "مرحبا بالعالم";
    const isServerless = !!process.env.VERCEL;

    // Local Windows Edge path
    const edgePath =
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    // Launch browser (Vercel uses sparticuz chromium, local uses Edge)
    browser = await puppeteer.launch(
      isServerless
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

    // ✅ IMPORTANT: Use your font from /public/fonts/Amiri-Regular.ttf
    // This guarantees Arabic renders the same on Local + Vercel
    const html = `
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <style>
            @font-face {
              font-family: "Amiri";
              src: url("/fonts/Amiri-Regular.ttf") format("truetype");
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
          <div class="text">${arabicText}</div>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    // Return PDF
    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=arabic.pdf");
    res.end(pdfBuffer);
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
