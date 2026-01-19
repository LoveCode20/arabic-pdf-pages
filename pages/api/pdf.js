// pages/api/pdf.js
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  let browser;

  try {
    const isVercel = !!process.env.VERCEL;

    const edgePath =
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

    // ✅ Load the image you created from the perfect PDF
    const imgPath = path.resolve("./public/arabic.png");

    if (!fs.existsSync(imgPath)) {
      throw new Error(
        "arabic.png not found. Put it inside: public/arabic.png"
      );
    }

    const imgBase64 = fs.readFileSync(imgPath).toString("base64");

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
            executablePath: edgePath,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          }
    );

    const page = await browser.newPage();

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            img {
              width: 700px;
              height: auto;
            }
          </style>
        </head>
        <body>
          <img id="arabicImg" src="data:image/png;base64,${imgBase64}" />
          <script>
            const img = document.getElementById("arabicImg");
            img.onload = () => { window.__READY__ = true; };
          </script>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__READY__ === true, {
      timeout: 10000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="arabic.pdf"');

    res.status(200).end(pdfBuffer);
    return;
  } catch (err) {
    console.log("PDF error:", err);

    res.status(500).json({
      error: "Failed to generate PDF",
      message: err?.message || String(err),
    });
    return;
  } finally {
    try {
      if (browser) await browser.close();
    } catch (e) {}
  }
}
