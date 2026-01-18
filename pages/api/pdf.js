import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  let browser = null;

  try {
    // Your Arabic sentence (hard-coded)
    const arabicText = "مرحبا بالعالم";

    // Load the Arabic font from public/fonts
    const fontPath = path.join(
      process.cwd(),
      "public",
      "fonts",
      "Amiri-Regular.ttf"
    );

    const fontBase64 = fs.readFileSync(fontPath).toString("base64");

    // HTML template for PDF
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @font-face {
              font-family: "Amiri";
              src: url(data:font/ttf;base64,${fontBase64}) format("truetype");
            }

            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              font-family: "Amiri", serif;
              direction: rtl;
            }

            h1 {
              font-size: 48px;
              color: #000;
            }
          </style>
        </head>
        <body>
          <h1>${arabicText}</h1>
        </body>
      </html>
    `;

    // Detect environment
    const isVercel = !!process.env.VERCEL;

    // Launch browser
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
          }
    );

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    // Return as downloadable PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="arabic.pdf"');
    res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("PDF error:", error);
    res.status(500).json({ error: "Failed to generate PDF", message: error.message });
  } finally {
    if (browser) await browser.close();
  }
}
