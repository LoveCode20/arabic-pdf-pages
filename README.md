# Arabic PDF Proof of Concept (Next.js Pages Router)

Tiny Next.js Pages Router app deployed serverlessly that generates and returns a PDF containing one hard-coded Arabic sentence.

## What it does
- Home page (`/`) shows a button
- Clicking **Generate PDF** calls the API route
- API route generates the PDF server-side and returns it as a download

Arabic text used in PDF:
**مرحبا بالعالم**

## Tech Used
- Next.js (Pages Router)
- puppeteer-core
- @sparticuz/chromium (for serverless deployment)

## Run Locally

Install dependencies:
```bash
npm install
