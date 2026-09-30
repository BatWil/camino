"use client";

/** Last-resort boundary (root layout failed). Inline styles: globals.css may not be loaded. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#0D0A26", color: "#F4F2EC", fontFamily: "system-ui, sans-serif" }}>
        <main
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 16,
            padding: 24,
            maxWidth: 480,
            margin: "0 auto",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, textTransform: "uppercase" }}>Algo no salió bien</h1>
          <p style={{ margin: 0, opacity: 0.75 }}>No es tu culpa. Inténtalo de nuevo.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              height: 56,
              borderRadius: 99,
              border: 0,
              background: "#C6F432",
              color: "#0D0A26",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
