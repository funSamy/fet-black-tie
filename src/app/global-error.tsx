"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#0A0A0E", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 1rem",
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>This page didn't load</h1>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", opacity: 0.7 }}>
              Something went wrong on our end. You can try again or head back home.
            </p>
            <div
              style={{
                marginTop: "1.5rem",
                display: "flex",
                gap: "0.5rem",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => reset()}
                style={{
                  borderRadius: "0.375rem",
                  background: "#E8AF0F",
                  color: "#0A0A0E",
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  borderRadius: "0.375rem",
                  border: "1px solid #2A2A3A",
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
