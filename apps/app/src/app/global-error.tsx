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
    // Log the error to console in a structured way
    console.error("GLOBAL ERROR:", {
      message: error.message, 
      stack: error.stack,
      digest: error.digest,
      name: error.name,
    });
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ 
          padding: "2rem", 
          maxWidth: "800px", 
          margin: "0 auto", 
          fontFamily: "system-ui, sans-serif" 
        }}>
          <h1 style={{ color: "#d32f2f" }}>Something went wrong</h1>
          <p>The application encountered an unexpected error.</p>
          
          <details style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
              Technical Details (for developers)
            </summary>
            <div style={{ 
              background: "#f5f5f5", 
              padding: "1rem", 
              borderRadius: "0.5rem", 
              marginTop: "0.5rem" 
            }}>
              <p><strong>Error:</strong> {error.message}</p>
              {error.digest && (
                <p><strong>Digest:</strong> {error.digest}</p>
              )}
              <p><strong>Type:</strong> {error.name}</p>
              
              <details>
                <summary>Stack Trace</summary>
                <pre style={{ 
                  overflow: "auto", 
                  padding: "0.5rem", 
                  background: "#e0e0e0" 
                }}>
                  {error.stack}
                </pre>
              </details>
            </div>
          </details>

          <div>
            <p>Try the following:</p>
            <ul>
              <li>Refresh the page</li>
              <li>Clear your browser cache</li>
              <li>Check your network connection</li>
              <li>Try again later</li>
            </ul>
          </div>
          
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              background: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              marginTop: "1rem"
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
