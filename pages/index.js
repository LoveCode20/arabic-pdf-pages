// pages/index.js
// Single public page.
// Clicking the button calls /api/pdf which generates the PDF server-side.

import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);

  // Calls the API route and triggers PDF download in the browser
  const generatePdf = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/pdf");

      if (!res.ok) {
        alert("PDF generation failed.");
        return;
      }

      // Convert response to Blob (PDF file)
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary download link
      const a = document.createElement("a");
      a.href = url;
      a.download = "arabic.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.log(err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>Server-side PDF Generator</div>

        <h1 style={styles.title}>Arabic PDF Proof of Concept</h1>
        <p style={styles.subtitle}>
          Click the button below to generate a PDF containing a hard-coded Arabic
          sentence.
        </p>

        <div style={styles.preview}>
          <span style={styles.previewLabel}>Preview text:</span>
          <div style={styles.arabicText} dir="rtl">
            مرحبا بالعالم
          </div>
        </div>

        <button
          onClick={generatePdf}
          disabled={loading}
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? "Generating..." : "Generate PDF"}
        </button>

        <p style={styles.footerText}>
          PDF is generated on the server via <b>/api/pdf</b>
        </p>
      </div>
    </div>
  );
}

// Minimal inline styling (keeps the project lightweight)
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    background:
      "radial-gradient(circle at top, rgba(99,102,241,0.25), transparent 55%), linear-gradient(135deg, #0b1220, #05070d)",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  card: {
    width: "100%",
    maxWidth: "620px",
    padding: "28px",
    borderRadius: "18px",
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
    backdropFilter: "blur(10px)",
    color: "#fff",
  },
  badge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    letterSpacing: "0.3px",
    background: "rgba(99, 102, 241, 0.22)",
    border: "1px solid rgba(99, 102, 241, 0.35)",
    marginBottom: "14px",
  },
  title: {
    margin: "0 0 10px",
    fontSize: "34px",
    fontWeight: 800,
    lineHeight: 1.2,
  },
  subtitle: {
    margin: "0 0 18px",
    color: "rgba(255,255,255,0.78)",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  preview: {
    marginTop: "10px",
    marginBottom: "18px",
    padding: "16px",
    borderRadius: "14px",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  previewLabel: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.65)",
    display: "block",
    marginBottom: "10px",
  },
  arabicText: {
    fontSize: "32px",
    textAlign: "center",
    direction: "rtl",
    letterSpacing: "0.2px",
  },
  button: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "none",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    background: "linear-gradient(135deg, #6366f1, #22c55e)",
    color: "#fff",
    transition: "0.2s",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  footerText: {
    marginTop: "14px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
};
