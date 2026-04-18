import React, { useState, useCallback, useEffect, type ChangeEvent } from "react";

// ─── Utility ────────────────────────────────────────────────────────────────
function formatUSD(val: number) {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(2)}K`;
  return `$${val.toFixed(2)}`;
}

function formatSOL(val: number) {
  if (val < 0.0001) return `◎${val.toFixed(6)}`;
  if (val < 1) return `◎${val.toFixed(4)}`;
  return `◎${val.toFixed(3)}`;
}

function parseMC(raw: string): number {
  const s = raw.trim().toUpperCase().replace(/,/g, "");
  if (s.endsWith("B")) return parseFloat(s) * 1_000_000_000;
  if (s.endsWith("M")) return parseFloat(s) * 1_000_000;
  if (s.endsWith("K")) return parseFloat(s) * 1_000;
  return parseFloat(s);
}

// ─── Sub-components ─────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest text-[#5a6a7a] mb-1">
      {children}
    </p>
  );
}

function InputField({
  value,
  onChange,
  placeholder,
  prefix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  prefix?: string;
}) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-3 text-[#4ade80] font-mono text-sm select-none z-10">
          {prefix}
        </span>
      )}
      <input
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[#0d1117] border border-[#1e2d3d] rounded text-sm font-mono text-[#e2e8f0] placeholder-[#2a3a4a] py-2 pr-3 focus:outline-none focus:border-[#4ade80] transition-colors ${prefix ? "pl-8" : "pl-3"}`}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent?: "green" | "red" | "blue" | "yellow" | "default";
  sub?: string;
}) {
  const colorMap: Record<string, string> = {
    green: "text-[#4ade80]",
    red: "text-[#f87171]",
    blue: "text-[#38bdf8]",
    yellow: "text-[#fbbf24]",
    default: "text-[#e2e8f0]",
  };
  return (
    <div className="bg-[#0a0f16] border border-[#1e2d3d] rounded p-3">
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#5a6a7a] mb-1">
        {label}
      </p>
      <p className={`text-base font-mono font-bold leading-tight ${colorMap[accent ?? "default"]}`}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] font-mono text-[#3a4a5a] mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function SimRow({
  label,
  multiplier,
  investmentUSD,
  solPrice,
  baseMultiplier,
}: {
  label: string;
  multiplier: number;
  investmentUSD: number;
  solPrice: number;
  baseMultiplier: number;
}) {
  // Scale sim multiplier relative to actual MC movement
  const scaledMx = baseMultiplier === 0 ? multiplier : multiplier * baseMultiplier;
  const resultUSD = investmentUSD * scaledMx;
  const profitUSD = resultUSD - investmentUSD;
  const resultSOL = solPrice > 0 ? resultUSD / solPrice : 0;
  const pct = investmentUSD > 0 ? ((profitUSD / investmentUSD) * 100).toFixed(0) : "0";
  const isNeg = profitUSD < 0;
  const isZero = profitUSD === 0;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[#111a24] last:border-0">
      <span className="text-[11px] font-mono text-[#4a6a8a] w-12">{label}</span>
      <span className={`text-[11px] font-mono w-16 text-right ${isNeg ? "text-[#f87171]" : "text-[#e2e8f0]"}`}>{formatUSD(resultUSD)}</span>
      <span className={`text-[11px] font-mono w-20 text-right ${isNeg ? "text-[#f87171]" : "text-[#a78bfa]"}`}>{formatSOL(resultSOL)}</span>
      <span className={`text-[11px] font-mono w-14 text-right ${isZero ? "text-[#5a6a7a]" : isNeg ? "text-[#f87171]" : "text-[#4ade80]"}`}>
        {isZero ? "0%" : isNeg ? `${pct}%` : `+${pct}%`}
      </span>
    </div>
  );
}

// ─── SOL ↔ USD Converter ─────────────────────────────────────────────────────
function SolConverter({ solPrice, solLoading }: { solPrice: number; solLoading: boolean }) {
  const [solVal, setSolVal] = useState("1");
  const [usdVal, setUsdVal] = useState("");
  const [lastEdited, setLastEdited] = useState<"sol" | "usd">("sol");

  // Sync the other field whenever inputs or price changes
  useEffect(() => {
    if (solPrice <= 0) return;
    if (lastEdited === "sol") {
      const n = parseFloat(solVal);
      setUsdVal(isNaN(n) ? "" : (n * solPrice).toFixed(2));
    } else {
      const n = parseFloat(usdVal);
      setSolVal(isNaN(n) ? "" : (n / solPrice).toFixed(6));
    }
  }, [solVal, usdVal, solPrice, lastEdited]);

  const handleSol = (v: string) => { setLastEdited("sol"); setSolVal(v); };
  const handleUsd = (v: string) => { setLastEdited("usd"); setUsdVal(v); };

  const swap = () => {
    setLastEdited(lastEdited === "sol" ? "usd" : "sol");
    setSolVal(usdVal ? (parseFloat(usdVal) / (solPrice || 1)).toFixed(6) : "");
    setUsdVal(solVal ? (parseFloat(solVal) * (solPrice || 1)).toFixed(2) : "");
  };

  return (
    <div className="mt-3 bg-[#0d1117] border border-[#1e2d3d] rounded-lg overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e2d3d] bg-[#080e14]">
        <div className="flex items-center gap-2">
          <img src="https://plisio.net/img/psys-icon/SOL.svg" className="w-3 h-3" alt="SOL" />
          <span className="text-[10px] font-mono text-[#a78bfa] tracking-widest uppercase">
            SOL / USD Converter
          </span>
        </div>
        {solLoading && (
          <span className="text-[9px] font-mono text-[#3a4a5a]">fetching price…</span>
        )}
        {!solLoading && solPrice > 0 && (
          <span className="text-[9px] font-mono text-[#3a4a5a]">
            1 SOL = <span className="text-[#a78bfa]">${solPrice.toFixed(2)}</span>
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2">
          {/* SOL input */}
          <div className="flex-1 bg-[#0a0f16] border border-[#1e2d3d] rounded-lg px-3 py-3 focus-within:border-[#a78bfa] transition-colors">
            <p className="text-[9px] font-mono text-[#3a5a7a] mb-1 uppercase tracking-widest">SOL</p>
            <div className="flex items-center gap-2">
              <img src="https://plisio.net/img/psys-icon/SOL.svg" className="w-4 h-4 flex-shrink-0" alt="" />
              <input
                type="number"
                min="0"
                value={solVal}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleSol(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent font-mono text-base text-[#e2e8f0] placeholder-[#2a3a4a] focus:outline-none"
              />
            </div>
          </div>

          {/* Swap button */}
          <button
            onClick={swap}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center border border-[#1e2d3d] rounded-full text-[#3a5a7a] hover:border-[#a78bfa] hover:text-[#a78bfa] transition-all text-sm"
            title="Swap"
          >
            ⇄
          </button>

          {/* USD input */}
          <div className="flex-1 bg-[#0a0f16] border border-[#1e2d3d] rounded-lg px-3 py-3 focus-within:border-[#4ade80] transition-colors">
            <p className="text-[9px] font-mono text-[#3a5a7a] mb-1 uppercase tracking-widest">USD</p>
            <div className="flex items-center gap-2">
              <span className="text-[#4ade80] font-mono text-sm flex-shrink-0">$</span>
              <input
                type="number"
                min="0"
                value={usdVal}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleUsd(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent font-mono text-base text-[#e2e8f0] placeholder-[#2a3a4a] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mt-3">
          {[0.01, 0.05, 0.1, 0.5, 1, 5].map((amt) => (
            <button
              key={amt}
              onClick={() => handleSol(String(amt))}
              className="flex-1 py-1 text-[9px] font-mono border border-[#1e2d3d] rounded text-[#3a5a7a] hover:border-[#a78bfa] hover:text-[#a78bfa] transition-all"
            >
              {amt}
            </button>
          ))}
        </div>

        {/* Result summary */}
        {solVal && usdVal && solPrice > 0 && (
          <div className="mt-3 bg-[#080e14] border border-[#1e2d3d] rounded px-3 py-2 flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#3a5a7a]">
              {parseFloat(solVal) >= 0 ? parseFloat(solVal).toLocaleString("en-US", { maximumFractionDigits: 6 }) : "0"} SOL
            </span>
            <span className="text-[10px] font-mono text-[#3a4a5a]">=</span>
            <span className="text-[11px] font-mono font-bold text-[#4ade80]">
              ${parseFloat(usdVal) >= 0 ? parseFloat(usdVal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
type InputMode = "usd" | "sol";

export default function PnlCalculator() {
  const [mcEntry, setMcEntry] = useState("467K");
  const [mcTarget, setMcTarget] = useState("1.08M");
  const [investment, setInvestment] = useState("2");
  const [inputMode, setInputMode] = useState<InputMode>("usd");

  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [solLoading, setSolLoading] = useState(true);
  const [solError, setSolError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchSolPrice = useCallback(async () => {
    try {
      setSolLoading(true);
      setSolError(null);
      // Fetch via Next.js API route (server-side proxy → no CORS issue)
      const res = await fetch("/api/sol-price");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.price_usd) throw new Error("price_usd missing");
      setSolPrice(data.price_usd);
      setLastUpdated(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err: any) {
      setSolError(err?.message ?? "Gagal fetch harga SOL");
    } finally {
      setSolLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolPrice();
    const id = setInterval(fetchSolPrice, 30_000);
    return () => clearInterval(id);
  }, [fetchSolPrice]);

  // Derived
  const mcEntryNum = parseMC(mcEntry);
  const mcTargetNum = parseMC(mcTarget);
  const investRaw = parseFloat(investment) || 0;
  const effectiveSolPrice = solPrice ?? 0;

  const investmentUSD =
    inputMode === "sol" ? investRaw * effectiveSolPrice : investRaw;
  const investmentSOL =
    inputMode === "usd"
      ? effectiveSolPrice > 0
        ? investRaw / effectiveSolPrice
        : 0
      : investRaw;

  const multiplier = mcTargetNum / mcEntryNum;
  const resultUSD = investmentUSD * multiplier;
  const resultSOL = effectiveSolPrice > 0 ? resultUSD / effectiveSolPrice : 0;
  const profitUSD = resultUSD - investmentUSD;
  const profitSOL = resultSOL - investmentSOL;

  // "zero" jika MC sama, "negative" jika target < entry, "positive" jika naik
  const pnlState: "zero" | "positive" | "negative" =
    mcTargetNum === mcEntryNum || profitUSD === 0
      ? "zero"
      : profitUSD > 0
      ? "positive"
      : "negative";

  const profitPct = investmentUSD > 0
    ? ((profitUSD / investmentUSD) * 100).toFixed(2)
    : "0.00";

  // Format PnL label dengan tanda yang benar
  const fmtProfit = (usd: number, sol: number) => {
    if (pnlState === "zero") return `$0.00 / \u25ce0.000000`;
    const sign = usd >= 0 ? "+" : "";
    return `${sign}${formatUSD(usd)} / ${sign}${formatSOL(sol)}`;
  };

  const isValid =
    !isNaN(multiplier) && isFinite(multiplier) && investmentUSD > 0 && effectiveSolPrice > 0;

  const simTargets = [2, 5, 10, 25, 50, 100];

  const applyMultiplier = useCallback(
    (mx: number) => {
      const base = parseMC(mcEntry);
      if (!isNaN(base) && isFinite(base)) {
        const target = base * mx;
        if (target >= 1_000_000_000)
          setMcTarget((target / 1_000_000_000).toFixed(2) + "B");
        else if (target >= 1_000_000)
          setMcTarget((target / 1_000_000).toFixed(2) + "M");
        else if (target >= 1_000)
          setMcTarget((target / 1_000).toFixed(2) + "K");
        else setMcTarget(target.toFixed(0));
      }
    },
    [mcEntry]
  );

  return (
    <div
      className="min-h-screen bg-[#060b10] flex items-center justify-center p-4"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        .scanlines::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px
          );
          pointer-events: none;
          z-index: 1;
          border-radius: inherit;
        }
        .blink { animation: blink 1.2s step-end infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .spin { animation: spin 1s linear infinite; display:inline-block; }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      <div className="w-full max-w-md">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="text-[10px] font-mono text-[#4ade80] tracking-widest uppercase">
              PnL Calculator
            </span>
          </div>

          {/* SOL price badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 border rounded px-2 py-1 ${
                solError
                  ? "border-[#f87171]/40 bg-[#f87171]/5"
                  : "border-[#a78bfa]/30 bg-[#a78bfa]/5"
              }`}
            >
              <img
                src="https://plisio.net/img/psys-icon/SOL.svg"
                className="w-3 h-3"
                alt="SOL"
              />
              {solLoading ? (
                <span className="spin text-[#a78bfa] text-[10px]">◌</span>
              ) : solError ? (
                <span className="text-[#f87171] text-[10px]">ERR</span>
              ) : (
                <span className="text-[#a78bfa] font-bold text-[11px]">
                  ${solPrice?.toFixed(2)}
                </span>
              )}
              <span className="text-[#3a4a5a] text-[10px]">/SOL</span>
            </div>
            <button
              onClick={fetchSolPrice}
              disabled={solLoading}
              className="text-[#3a5a7a] hover:text-[#a78bfa] transition-colors text-sm disabled:opacity-40"
              title="Refresh"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Last updated / error info */}
        <div className="flex justify-between items-center mb-2 min-h-[14px]">
          {solError ? (
            <p className="text-[9px] font-mono text-[#f87171]">
              ⚠ {solError} — pastikan /api/sol-price aktif
            </p>
          ) : lastUpdated ? (
            <p className="text-[9px] font-mono text-[#2a3a4a]">
              via plisio · updated {lastUpdated}
            </p>
          ) : (
            <span />
          )}
        </div>

        {/* ── Main card ── */}
        <div className="relative bg-[#0d1117] border border-[#1e2d3d] rounded-lg overflow-hidden scanlines">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#1e2d3d] bg-[#080e14]">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-[#3a5a7a]">MODE</span>
              <span className="text-[10px] font-mono text-[#4ade80]">MC RATIO</span>
            </div>
            <div className="flex gap-3">
              {["P1", "P2", "P3"].map((p, i) => (
                <span
                  key={p}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    i === 1 ? "bg-[#4ade80] text-[#060b10]" : "text-[#3a4a5a]"
                  }`}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 space-y-4 relative z-10">
            {/* MC inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>MC Entry</Label>
                <InputField value={mcEntry} onChange={setMcEntry} placeholder="e.g. 467K" />
              </div>
              <div>
                <Label>MC Target</Label>
                <InputField value={mcTarget} onChange={setMcTarget} placeholder="e.g. 1.08M" />
              </div>
            </div>

            {/* Quick multiplier */}
            <div>
              <Label>Quick Target (dari entry)</Label>
              <div className="grid grid-cols-4 gap-2">
                {[2, 5, 10, 100].map((mx) => (
                  <button
                    key={mx}
                    onClick={() => applyMultiplier(mx)}
                    className="py-1.5 text-[11px] font-mono border border-[#1e2d3d] rounded text-[#38bdf8] hover:border-[#38bdf8] hover:bg-[#38bdf8]/10 transition-all"
                  >
                    {mx}x
                  </button>
                ))}
              </div>
            </div>

            {/* Modal input + toggle USD/SOL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Modal Masuk</Label>
                <div className="flex items-center gap-0.5 bg-[#080e14] border border-[#1e2d3d] rounded p-0.5">
                  <button
                    onClick={() => setInputMode("usd")}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all ${
                      inputMode === "usd"
                        ? "bg-[#4ade80] text-[#060b10]"
                        : "text-[#3a4a5a] hover:text-[#4ade80]"
                    }`}
                  >
                    USD
                  </button>
                  <button
                    onClick={() => setInputMode("sol")}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                      inputMode === "sol"
                        ? "bg-[#a78bfa] text-[#060b10]"
                        : "text-[#3a4a5a] hover:text-[#a78bfa]"
                    }`}
                  >
                    <img src="https://plisio.net/img/psys-icon/SOL.svg" className="w-2.5 h-2.5" alt="" />
                    SOL
                  </button>
                </div>
              </div>

              <InputField
                value={investment}
                onChange={setInvestment}
                placeholder={inputMode === "usd" ? "e.g. 2" : "e.g. 0.03"}
                prefix={inputMode === "usd" ? "$" : "◎"}
              />

              {/* Conversion hint */}
              {investRaw > 0 && effectiveSolPrice > 0 && (
                <p className="text-[10px] font-mono text-[#4a6a8a] mt-1 pl-1">
                  {inputMode === "usd"
                    ? `≈ ${formatSOL(investRaw / effectiveSolPrice)}`
                    : `≈ ${formatUSD(investRaw * effectiveSolPrice)}`}
                </p>
              )}
            </div>

            <div className="border-t border-[#1e2d3d]" />

            {/* Results */}
            {isValid ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <StatBox
                    label="Multiplier"
                    value={`${multiplier.toFixed(2)}x`}
                    accent={pnlState === "zero" ? "default" : pnlState === "positive" ? "blue" : "red"}
                    sub={`${formatUSD(mcEntryNum)} → ${formatUSD(mcTargetNum)}`}
                  />
                  <StatBox
                    label="Hasil USD"
                    value={
                      pnlState === "zero"
                        ? "$0.00"
                        : pnlState === "positive"
                        ? `+${formatUSD(profitUSD)}`
                        : formatUSD(profitUSD)
                    }
                    accent={pnlState === "zero" ? "default" : pnlState === "positive" ? "green" : "red"}
                    sub={`modal ${formatUSD(investmentUSD)}`}
                  />
                  <StatBox
                    label="Hasil SOL"
                    value={
                      pnlState === "zero"
                        ? "◎0.000000"
                        : pnlState === "positive"
                        ? `+${formatSOL(profitSOL)}`
                        : formatSOL(profitSOL)
                    }
                    accent={pnlState === "zero" ? "default" : pnlState === "positive" ? "yellow" : "red"}
                    sub={`modal ${formatSOL(investmentSOL)}`}
                  />
                  <StatBox
                    label="PnL %"
                    value={
                      pnlState === "zero"
                        ? "0.00%"
                        : pnlState === "positive"
                        ? `+${profitPct}%`
                        : `${profitPct}%`
                    }
                    accent={pnlState === "zero" ? "default" : pnlState === "positive" ? "green" : "red"}
                    sub={fmtProfit(profitUSD, profitSOL)}
                  />
                </div>

                {/* Simulation table */}
                <div className="bg-[#080e14] border border-[#1e2d3d] rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#5a6a7a]">
                      Simulasi Modal{" "}
                      {inputMode === "usd"
                        ? formatUSD(investmentUSD)
                        : formatSOL(investmentSOL)}
                    </p>
                    <span className="text-[10px] font-mono text-[#3a4a5a]">
                      supply tetap
                    </span>
                  </div>
                  <div className="flex text-[9px] font-mono text-[#3a4a5a] pb-1 border-b border-[#111a24] mb-1">
                    <span className="w-12">MC ×</span>
                    <span className="w-16 text-right">USD</span>
                    <span className="flex-1 text-right">SOL</span>
                    <span className="w-14 text-right">%</span>
                  </div>
                  {simTargets.map((mx) => (
                    <SimRow
                      key={mx}
                      label={`${mx}x`}
                      multiplier={mx}
                      investmentUSD={investmentUSD}
                      solPrice={effectiveSolPrice}
                      baseMultiplier={multiplier}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-[#0a1a0a] border border-[#1a3a1a] rounded px-3 py-2">
                  <span className="text-[10px] font-mono text-[#4ade80]">
                    ▶ Harga ∝ Market Cap jika supply konstan
                  </span>
                  <span className="blink text-[#4ade80] text-xs">|</span>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                {solLoading ? (
                  <p className="text-[11px] font-mono text-[#a78bfa]">
                    <span className="spin inline-block mr-2">◌</span>
                    Mengambil harga SOL dari Plisio...
                  </p>
                ) : solError ? (
                  <div>
                    <p className="text-[11px] font-mono text-[#f87171] mb-1">
                      Gagal ambil harga SOL
                    </p>
                    <button
                      onClick={fetchSolPrice}
                      className="text-[10px] font-mono text-[#38bdf8] border border-[#1e2d3d] px-3 py-1 rounded hover:border-[#38bdf8] transition-all"
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] font-mono text-[#3a4a5a]">
                      Masukkan MC Entry, MC Target &amp; Modal
                    </p>
                    <p className="text-[10px] font-mono text-[#2a3a4a] mt-1">
                      Format: 467K · 1.08M · 2.5B
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-4 py-1.5 border-t border-[#1e2d3d] bg-[#080e14]">
            <span className="text-[9px] font-mono text-[#2a3a4a]">
              AXIOM-STYLE PNL CALC v2.0
            </span>
            <span className="text-[9px] font-mono text-[#3a5a3a]">
              ● CONNECTION STABLE
            </span>
          </div>
        </div>

        {/* ── SOL ↔ USD Converter ── */}
        <SolConverter solPrice={effectiveSolPrice} solLoading={solLoading} />

        <p className="text-center text-[9px] font-mono text-[#2a3a4a] mt-3">
          BUKAN FINANCIAL ADVICE · DYOR · CRYPTO BERISIKO TINGGI
        </p>
      </div>
    </div>
  );
}