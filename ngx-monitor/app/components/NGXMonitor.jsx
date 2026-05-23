"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const TYPE_COLORS = {
  IPO: { bg: "#00C896", text: "#001a12" },
  "Rights Issue": { bg: "#3B82F6", text: "#fff" },
  "Public Offer": { bg: "#F59E0B", text: "#1a0f00" },
  Bond: { bg: "#8B5CF6", text: "#fff" },
  ETF: { bg: "#06B6D4", text: "#001a1f" },
  Other: { bg: "#6B7280", text: "#fff" },
};

const STATUS_CONFIG = {
  Open: { color: "#00C896", label: "● OPEN" },
  Upcoming: { color: "#F59E0B", label: "◆ UPCOMING" },
  Closed: { color: "#6B7280", label: "○ CLOSED" },
  "Recently Listed": { color: "#3B82F6", label: "★ NEW LISTING" },
};

const FILTERS = ["All", "IPO", "Rights Issue", "Public Offer", "Bond", "ETF", "Open", "Upcoming"];

const STORAGE_KEY = "ngx_monitor_data";

export default function NGXMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [newIds, setNewIds] = useState(new Set());
  const [seenIds, setSeenIds] = useState(new Set());
  const [notify, setNotify] = useState(false);
  const tickerRef = useRef(null);

  // Load cached data on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        setData(cached);
        setSeenIds(new Set((cached.offerings || []).map((o) => o.id)));
      }
    } catch {}
  }, []);

  // Request notification permission
  const requestNotify = useCallback(async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotify(perm === "granted");
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      setNotify(true);
    }
  }, []);

  const sendNotification = useCallback((offerings) => {
    if (!notify || !("Notification" in window)) return;
    const fresh = offerings.filter((o) => !seenIds.has(o.id));
    if (fresh.length === 0) return;
    new Notification("NGX Monitor — New Offerings!", {
      body: fresh.map((o) => `${o.company} (${o.type})`).join("\n"),
      icon: "/icon-192.png",
    });
  }, [notify, seenIds]);

  const fetchOfferings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scan");
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Scan failed");
      }
      const result = await res.json();
      const incoming = result.offerings || [];
      const incomingIds = new Set(incoming.map((o) => o.id));
      const freshIds = new Set([...incomingIds].filter((id) => !seenIds.has(id)));

      setNewIds(freshIds);
      setSeenIds(incomingIds);
      setData(result);

      // Cache to localStorage
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result)); } catch {}

      // Push notification if new
      sendNotification(incoming);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [seenIds, sendNotification]);

  const filtered = (data?.offerings || []).filter(
    (o) => filter === "All" || o.type === filter || o.status === filter
  );

  const openCount = (data?.offerings || []).filter((o) => o.status === "Open").length;
  const upcomingCount = (data?.offerings || []).filter((o) => o.status === "Upcoming").length;
  const lastScan = data?.scannedAt ? new Date(data.scannedAt) : null;

  const tickerText = data?.offerings?.length
    ? data.offerings.map((o) => `${o.company}  —  ${o.type}  —  ${o.status}`).join("     ◆     ")
    : "NGX MONITOR  —  CLICK SCAN TO FETCH LIVE OFFERINGS     ◆     IPOs · RIGHTS ISSUES · PUBLIC OFFERS · BONDS · ETFs";

  return (
    <div style={{ minHeight: "100vh", background: "#070C14" }}>
      {/* Scanline */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100,
        background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,200,150,0.012) 2px,rgba(0,200,150,0.012) 4px)",
      }} />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "linear-gradient(180deg,#0B1220 0%,#070C14 100%)",
        borderBottom: "1px solid #1E2D40",
        padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8, flexShrink: 0,
            background: "linear-gradient(135deg,#00C896,#00A37A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Bebas Neue',sans-serif", fontSize: 15,
            fontWeight: 700, color: "#001a12", letterSpacing: 1,
          }}>NGX</div>
          <div>
            <div style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(16px,4vw,22px)", letterSpacing: 3, color: "#fff",
            }}>OFFERINGS MONITOR</div>
            <div style={{ fontSize: 9, color: "#4A6582", letterSpacing: 2 }}>
              NIGERIAN EXCHANGE GROUP
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Notification bell */}
          <button
            onClick={requestNotify}
            title={notify ? "Notifications ON" : "Enable notifications"}
            style={{
              background: notify ? "#00C89622" : "#0B1220",
              border: `1px solid ${notify ? "#00C896" : "#1E2D40"}`,
              color: notify ? "#00C896" : "#4A6582",
              borderRadius: 6, padding: "8px 10px",
              fontSize: 14, cursor: "pointer",
            }}
          >🔔</button>

          {/* Last scan time */}
          {lastScan && (
            <div style={{ textAlign: "right", fontSize: 9, color: "#4A6582", lineHeight: 1.6 }}>
              <div>LAST SCAN</div>
              <div style={{ color: "#8BA5C0" }}>{lastScan.toLocaleTimeString()}</div>
            </div>
          )}

          <button
            className="scan-btn"
            onClick={fetchOfferings}
            disabled={loading}
            style={{
              background: loading ? "#0A3028" : "linear-gradient(135deg,#00C896,#00A37A)",
              color: loading ? "#00C896" : "#001a12",
              padding: "10px 16px", borderRadius: 6,
              fontSize: 10, fontWeight: 700, letterSpacing: 2,
              fontFamily: "'IBM Plex Mono',monospace",
              border: loading ? "1px solid #00C896" : "none",
            }}
          >
            {loading
              ? <span className="pulse-anim">⬤ SCANNING…</span>
              : "⟳ SCAN"}
          </button>
        </div>
      </header>

      {/* Ticker */}
      <div style={{
        background: "#00C896", color: "#001a12",
        padding: "5px 0", overflow: "hidden",
        fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
      }}>
        <div className="ticker-track" ref={tickerRef} style={{ width: "max-content" }}>
          <span style={{ paddingRight: 60 }}>{tickerText}</span>
          <span style={{ paddingRight: 60 }}>{tickerText}</span>
        </div>
      </div>

      <main style={{ padding: "20px 16px", maxWidth: 900, margin: "0 auto" }}>

        {/* Stats */}
        {data && (
          <div className="slide-in" style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 10, marginBottom: 20,
          }}>
            {[
              { label: "TOTAL", value: data.offerings?.length || 0, accent: "#8BA5C0" },
              { label: "OPEN", value: openCount, accent: "#00C896" },
              { label: "UPCOMING", value: upcomingCount, accent: "#F59E0B" },
              { label: "NEW", value: newIds.size, accent: newIds.size > 0 ? "#F59E0B" : "#3B82F6" },
            ].map((s) => (
              <div key={s.label} style={{
                background: "#0B1220", border: "1px solid #1E2D40",
                borderRadius: 8, padding: "12px 10px", textAlign: "center",
              }}>
                <div style={{ fontSize: 8, color: "#4A6582", letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                <div style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: "clamp(24px,6vw,36px)", color: s.accent, letterSpacing: 2,
                }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Market summary */}
        {data?.marketSummary && (
          <div className="slide-in" style={{
            background: "#0B1220", border: "1px solid #1E2D40",
            borderLeft: "3px solid #00C896", borderRadius: 8,
            padding: "12px 16px", marginBottom: 18,
            fontSize: 11, lineHeight: 1.7, color: "#8BA5C0",
          }}>
            <span style={{
              color: "#00C896", fontWeight: 700,
              fontSize: 9, letterSpacing: 2, marginRight: 8,
            }}>MARKET BRIEF</span>
            {data.marketSummary}
          </div>
        )}

        {/* Filters */}
        <div style={{
          display: "flex", gap: 6, marginBottom: 18,
          overflowX: "auto", paddingBottom: 4,
          scrollbarWidth: "none",
        }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              className="filter-btn"
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? "#00C896" : "#0B1220",
                color: filter === f ? "#001a12" : "#8BA5C0",
                border: `1px solid ${filter === f ? "#00C896" : "#1E2D40"}`,
                padding: "6px 12px", borderRadius: 4,
                fontSize: 9, fontWeight: 600, letterSpacing: 1.5,
                cursor: "pointer", fontFamily: "'IBM Plex Mono',monospace",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >{f}</button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#1A0A0A", border: "1px solid #7F1D1D",
            borderRadius: 8, padding: 14, marginBottom: 18,
            fontSize: 11, color: "#FCA5A5",
          }}>⚠ SCAN ERROR: {error}</div>
        )}

        {/* Empty state */}
        {!data && !loading && !error && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            border: "1px dashed #1E2D40", borderRadius: 12,
          }}>
            <div style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: "clamp(32px,10vw,56px)", color: "#1E2D40",
              letterSpacing: 4, marginBottom: 12,
            }}>NGX MONITOR</div>
            <div style={{ color: "#4A6582", fontSize: 11, lineHeight: 1.9 }}>
              Tap <strong style={{ color: "#00C896" }}>SCAN</strong> to fetch current offerings<br />
              IPOs · Rights Issues · Public Offers · Bonds · ETFs
            </div>
          </div>
        )}

        {/* Skeletons */}
        {loading && (
          <div style={{ display: "grid", gap: 10 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                background: "#0B1220", border: "1px solid #1E2D40",
                borderRadius: 10, padding: 18,
                animation: `pulse 1.4s ${i * 0.12}s infinite`,
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 64, height: 20, background: "#1E2D40", borderRadius: 4 }} />
                  <div style={{ width: 140, height: 16, background: "#1E2D40", borderRadius: 4 }} />
                  <div style={{ marginLeft: "auto", width: 70, height: 16, background: "#1E2D40", borderRadius: 4 }} />
                </div>
                <div style={{ marginTop: 10, width: "65%", height: 12, background: "#1E2D40", borderRadius: 4 }} />
              </div>
            ))}
          </div>
        )}

        {/* Cards */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map((o, i) => {
              const tc = TYPE_COLORS[o.type] || TYPE_COLORS.Other;
              const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.Closed;
              const isNew = newIds.has(o.id);

              return (
                <div
                  key={o.id || i}
                  className="card-hover"
                  style={{
                    background: "#0B1220",
                    border: `1px solid ${isNew ? "#F59E0B55" : "#1E2D40"}`,
                    borderRadius: 10, padding: "16px",
                    animation: `slideIn 0.35s ease ${i * 0.05}s both`,
                    position: "relative",
                  }}
                >
                  {isNew && (
                    <div className="new-badge" style={{
                      position: "absolute", top: 10, right: 10,
                      background: "#F59E0B", color: "#1a0f00",
                      fontSize: 8, fontWeight: 700, letterSpacing: 2,
                      padding: "3px 7px", borderRadius: 3,
                    }}>NEW</div>
                  )}

                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                    <div style={{
                      background: tc.bg, color: tc.text,
                      padding: "3px 9px", borderRadius: 4,
                      fontSize: 8, fontWeight: 700, letterSpacing: 1.5,
                      whiteSpace: "nowrap", marginTop: 2, flexShrink: 0,
                    }}>{o.type}</div>

                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#E2E8F0", marginBottom: 3 }}>
                        {o.company}
                      </div>
                      <div style={{ fontSize: 11, color: "#6B8099", lineHeight: 1.6 }}>
                        {o.description}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: sc.color, letterSpacing: 1, marginBottom: 4 }}>
                        {sc.label}
                      </div>
                      {o.price && (
                        <div style={{ fontSize: 13, color: "#00C896", fontWeight: 600 }}>{o.price}</div>
                      )}
                    </div>
                  </div>

                  {(o.openDate || o.closeDate || o.source) && (
                    <div style={{
                      marginTop: 12, paddingTop: 10, borderTop: "1px solid #1A2535",
                      display: "flex", gap: 16, fontSize: 9, color: "#4A6582", flexWrap: "wrap",
                    }}>
                      {o.openDate && <span>OPENS <span style={{ color: "#8BA5C0" }}>{o.openDate}</span></span>}
                      {o.closeDate && <span>CLOSES <span style={{ color: "#8BA5C0" }}>{o.closeDate}</span></span>}
                      {o.source && (
                        <span style={{ marginLeft: "auto" }}>
                          SRC: <span style={{ color: "#8BA5C0" }}>{o.source}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && data && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#4A6582", fontSize: 11 }}>
            No offerings for <strong style={{ color: "#8BA5C0" }}>{filter}</strong>
          </div>
        )}

        {/* Data note */}
        {data?.dataNote && (
          <div style={{
            marginTop: 18, padding: "10px 14px",
            background: "#0B1220", border: "1px solid #1E2D40",
            borderRadius: 8, fontSize: 9, color: "#4A6582", lineHeight: 1.8,
          }}>
            <span style={{ color: "#F59E0B", marginRight: 8 }}>ℹ</span>
            {data.dataNote}{" "}
            Verify at <span style={{ color: "#00C896" }}>invest.ngxgroup.com</span>
          </div>
        )}

        <div style={{
          marginTop: 20, paddingTop: 16, borderTop: "1px solid #1E2D40",
          fontSize: 9, color: "#2A4060", textAlign: "center", lineHeight: 1.8,
        }}>
          NGX OFFERINGS MONITOR · POWERED BY CLAUDE AI<br />
          Data sourced via AI web search · Always verify before investing
        </div>
      </main>
    </div>
  );
}
