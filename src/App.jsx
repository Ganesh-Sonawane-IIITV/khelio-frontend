import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function ImageBase64({ b64, alt, mime = "image/png" }) {
  if (!b64) return <div className="small">No image</div>;
  return <img src={`data:${mime};base64,${b64}`} alt={alt} />;
}

export default function App() {
  const [url, setUrl] = useState("");
  const [save, setSave] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setData(null);
    if (!url) {
      setError("Please paste a YouTube URL.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: url, save }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `Request failed: ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <header className="container header">
        <h1>AI Product Imagery</h1>
        <div className="small">YouTube → products → segmentation → enhanced shots</div>
      </header>

      <main className="container">
        <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 16 }}>
          <div className="row" style={{ gridTemplateColumns: "1fr auto" }}>
            <input
              className="input"
              placeholder="Paste a YouTube URL (review, unboxing, demo)…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Processing…" : "Process"}
            </button>
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <input id="save" type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
            <label htmlFor="save" className="small">Save artifacts on backend disk (out/...)</label>
          </div>
          <div className="small" style={{ marginTop: 6 }}>Tip: It may take 20–90s depending on the video and API speed.</div>
        </form>

        {error && <div className="error">{error}</div>}

        {loading && (
          <div className="card" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 10, height: 10, background: "var(--brand)", borderRadius: 999, animation: "ping 1s infinite" }} />
            <div>Processing…</div>
          </div>
        )}

        {data && (
          <div className="card">
            <div className="row" style={{ gridTemplateColumns: "1fr auto" }}>
              <div>
                <div className="small">Video:</div>
                <a href={data.youtube_url} target="_blank" rel="noreferrer" style={{ color: "var(--brand)" }}>
                  {data.youtube_url}
                </a>
                {data.save_dir && <div className="small" style={{ marginTop: 4 }}>Saved to: {data.save_dir}</div>}
              </div>
              <div>
                <button
                  className="btn secondary"
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
                >
                  Copy JSON
                </button>
              </div>
            </div>

            <div style={{ height: 12 }} />

            <div className="row" style={{ gridTemplateColumns: "1fr" }}>
              {data.products?.length === 0 && <div className="small">No products found.</div>}
              {data.products?.map((p, idx) => (
                <div key={idx} className="card">
                  <div className="row" style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: 18 }}>
                      {idx + 1}. {p.name || "Product"}
                    </h3>
                    {typeof p.confidence === "number" && (
                      <span className="badge">conf: {p.confidence.toFixed(2)}</span>
                    )}
                  </div>
                  {p.reason && <div className="small" style={{ marginTop: 4 }}>{p.reason}</div>}

                  <div style={{ height: 12 }} />

                  <div className="row row-3">
                    <div>
                      <div className="label">Best frame</div>
                      <div className="asq">
                        <ImageBase64 b64={p.frame_b64} alt="Best frame" mime="image/jpeg" />
                      </div>
                    </div>

                    <div>
                      <div className="label">Segmented product</div>
                      <div className="asq">
                        <ImageBase64 b64={p.segmentation?.cropped_b64} alt="Cropped product" mime="image/png" />
                      </div>
                      <div className="small" style={{ marginTop: 6 }}>Mask also available (not shown)</div>
                    </div>

                    <div>
                      <div className="label">Enhanced shots</div>
                      <div className="row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                        {p.enhanced?.map((b64, i) => (
                          <div key={i} className="asq">
                            <ImageBase64 b64={b64} alt={`Enhanced ${i + 1}`} mime="image/png" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </main>

      <footer className="footer">
        Frontend: React (Vite) • Backend: FastAPI + LangGraph + Gemini
      </footer>
    </div>
  );
}