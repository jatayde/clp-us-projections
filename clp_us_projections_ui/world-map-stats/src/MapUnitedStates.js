import React, { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

// TopoJSON for US states
const GEO_URL_US = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

/**
 * Props:
 * - year: "2030" | "2040" | "2050"
 * - data: {
 *     [state: string]: {
 *       [year: string]: {
 *         incidence: number | string | null,
 *       }
 *     }
 *   }
 */
export default function MapUS({ year, data, cat }) {
  console.log(cat);
  const [tip, setTip] = useState(null);

  // Flatten data by year and apply simple aliasing
  const perYear = useMemo(() => {
    const flat = {};
    for (const [region, years] of Object.entries(data || {})) {
      if (years && years[year]) flat[region] = years[year];
    }
    return flat;
  }, [data, year]);

  // Get min/max incidence (numeric) for color scale
  const [minVal, maxVal] = useMemo(() => {
    const vals = Object.values(perYear)
      .map((row) => {
        if (cat === "Percent Change") return row.percent_change;
        if (cat === "Number of Providers") return row.num_providers;
        if (cat === "Cases per Provider") return row.num_cases_per_provider; // includes your existing typo
        return row.incidence_number; // default: total incidence
      })
      .filter((v) => Number.isFinite(v));

    if (!vals.length) return [0, 0];
    return [Math.min(...vals), Math.max(...vals)];
  }, [perYear, cat]);

  function getColor(val) {
    if (!Number.isFinite(val)) return "#e5e5e5"; // gray for missing
    if (maxVal === minVal) return "#9AC5B7"; // midpoint fallback

    // Log-scale normalization
    const safeVal = Math.max(val, 1);
    const safeMin = Math.max(minVal, 1);
    const safeMax = Math.max(maxVal, 1);
    const ratio = Math.log10(safeVal / safeMin) / Math.log10(safeMax / safeMin);

    // light→dark blue-green gradient
    if (ratio < 0.1) return "#EEF5F0";
    if (ratio < 0.2) return "#DBEDE4";
    if (ratio < 0.3) return "#C7E1D5";
    if (ratio < 0.4) return "#B1D3C6";
    if (ratio < 0.5) return "#9AC5B7";
    if (ratio < 0.6) return "#82B4A8";
    if (ratio < 0.7) return "#6AA19A";
    if (ratio < 0.8) return "#538A90";
    if (ratio < 0.9) return "#3E708A";
    return "#2B4F82";
  }

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 850, center: [10, 0] }}
        style={{ width: "100%", height: "auto" }}
        preserveAspectRatio="xMidYMin meet"
        viewBox="0 100 790 500"
      >
        <Geographies geography={GEO_URL_US}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const p = geo.properties;
              // us-atlas states use "name" for state name (e.g., "California")
              const name = p.name;

              const row = perYear[name];

              const color = getColor(
                cat === "Number of Providers"
                  ? row?.num_providers
                  : cat === "Cases per Provider"
                    ? row?.num_cases_per_provider
                    : row?.incidence_number,
              );

              console.log(row);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) =>
                    setTip({
                      x: e.clientX,
                      y: e.clientY,
                      name,
                      incidence: row?.incidence,
                      percentChange: row?.percent_change,
                      numProviders: row?.num_providers,
                      numCasesPerProvider: row?.num_cases_per_provider,
                    })
                  }
                  onMouseMove={(e) =>
                    setTip((t) => t && { ...t, x: e.clientX, y: e.clientY })
                  }
                  onMouseLeave={() => setTip(null)}
                  style={{
                    default: { fill: color, stroke: "#666", strokeWidth: 0.5 },
                    hover: { fill: color, stroke: "#dcff00", strokeWidth: 1 },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tip && (
        <div
          style={{
            position: "fixed",
            left: tip.x + 10,
            top: tip.y + 10,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: "6px 10px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            fontSize: 13,
            pointerEvents: "none",
            minWidth: 220,
            zIndex: 9999,
          }}
        >
          <strong>{tip.name}</strong>
          <div style={{ marginTop: 4 }}>
            {tip.incidence && cat === "Total" && (
              <div>
                <em>CL/P Estimate:</em> {tip.incidence}
              </div>
            )}

            {tip.percentChange != null && cat === "Total" && (
              <div>
                <em>Percent Change:</em> {Math.round(tip.percentChange * 100)}%
              </div>
            )}

            {tip.numProviders != null && cat === "Number of Providers" && (
              <div>
                <em>Providers:</em> {tip.numProviders}
              </div>
            )}

            {tip.numCasesPerProvider != null &&
              cat === "Cases per Provider" && (
                <div>
                  <em>Cases per Provider:</em> {tip.numCasesPerProvider}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
