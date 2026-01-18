// pages/index.js
// Generates + downloads PDF from /api/pdf

import { useEffect, useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);

  // ✅ Add spinner animation safely (runs only in browser after page mounts)
  useEffect(() => {
    const styleId = "spinner-keyframes-style";

    // Prevent duplicates
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const generatePdf = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/pdf");

      if (!res.ok) {
        const errText = await res.text();
        console.log("PDF API error response:", errText);
        alert("PDF generation failed. Check console for details.");
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/pdf")) {
        const errText = await res.text();
        console.log("Not a PDF response:", errText);
        alert("Server did not return a PDF. Check console.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "arabic.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.log("Download error:", err);
      alert("Something went wrong while generating the PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      {/* Background decorations */}
      <div style={styles.bgGlowOne} />
      <div style={styles.bgGlowTwo} />

      <div style={styles.wrapper}>
        {/* Top badge */}
        <div style={styles.badge}>Server-side PDF Generator</div>

        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Arabic PDF Generator</h1>
            <p style={styles.subtitle}>
              Generate and download a PDF instantly containing a hard-coded
              Arabic sentence rendered correctly in RTL format.
            </p>
          </div>

          <div style={styles.previewBox}>
            <p style={styles.previewLabel}>Preview text</p>
            <div style={styles.previewText} dir="rtl">
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
            {loading ? (
              <span style={styles.buttonRow}>
                <span style={styles.spinner} />
                Generating PDF...
              </span>
            ) : (
              "Generate PDF"
            )}
          </button>

          <div style={styles.footerRow}>
            <div style={styles.meta}>
              API Route: <span style={styles.mono}>/api/pdf</span>
            </div>

            <div style={styles.tip}>
              Tip: Works locally & on Vercel deployment.
            </div>
          </div>
        </div>

        <p style={styles.bottomNote}>
          Built with Next.js Pages Router • PDF generated on demand
        </p>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b1020",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "28px",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    position: "relative",
    overflow: "hidden",
  },

  bgGlowOne: {
    position: "absolute",
    width: "550px",
    height: "550px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle at center, rgba(90, 140, 255, 0.45), rgba(90, 140, 255, 0) 60%)",
    top: "-180px",
    left: "-180px",
    filter: "blur(12px)",
  },

  bgGlowTwo: {
    position: "absolute",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle at center, rgba(0, 255, 179, 0.35), rgba(0, 255, 179, 0) 60%)",
    bottom: "-220px",
    right: "-220px",
    filter: "blur(12px)",
  },

  wrapper: {
    width: "100%",
    maxWidth: "720px",
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px",
  },

  badge: {
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.85)",
    fontSize: "12px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },

  card: {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "22px",
    padding: "26px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
    backdropFilter: "blur(12px)",
  },

  header: {
    marginBottom: "18px",
  },

  title: {
    margin: 0,
    fontSize: "34px",
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.4px",
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    fontSize: "15px",
    lineHeight: "1.6",
    color: "rgba(255,255,255,0.75)",
    maxWidth: "620px",
  },

  previewBox: {
    marginTop: "18px",
    marginBottom: "18px",
    padding: "16px 18px",
    borderRadius: "16px",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  previewLabel: {
    margin: 0,
    fontSize: "12px",
    color: "rgba(255,255,255,0.6)",
    marginBottom: "8px",
  },

  previewText: {
    fontSize: "28px",
    fontWeight: 600,
    color: "#ffffff",
    textAlign: "center",
    padding: "8px 0",
    letterSpacing: "0.2px",
  },

  button: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(90deg, #4f8cff, #00ffb3)",
    color: "#0b1020",
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    transition: "transform 0.08s ease",
  },

  buttonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },

  buttonRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },

  spinner: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "2px solid rgba(11,16,32,0.25)",
    borderTop: "2px solid rgba(11,16,32,0.95)",
    animation: "spin 0.8s linear infinite",
  },

  footerRow: {
    marginTop: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  meta: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.7)",
  },

  tip: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.55)",
  },

  mono: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    background: "rgba(255,255,255,0.10)",
    padding: "2px 8px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.85)",
  },

  bottomNote: {
    marginTop: "6px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },
};
