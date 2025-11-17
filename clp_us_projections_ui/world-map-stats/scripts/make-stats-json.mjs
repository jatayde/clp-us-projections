// make-estimates-json.mjs
import xlsx from "xlsx";
import fs from "fs";

const INPUT = "public/National Cleft Maps_Nov2.xlsx";
const OUTPUT = "src/data/estimatedStats.json";

const wb = xlsx.readFile(INPUT);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

const years = ["2030", "2040", "2050"];
const stats = {};

function parseFirstNumber(value) {
  if (!value) return null;
  const match = String(value)
    .replace(/,/g, "")
    .match(/[\d.]+/);
  return match ? Number(match[0]) : null;
}

for (const row of rows) {
  const state = String(row["State"] ?? "").trim();
  if (!state) continue;

  stats[state] = {};
  for (const year of years) {
    const incidenceCol = `${year} Predicted Clefts`;

    const incidence = row[incidenceCol];

    const incidenceNum = parseFirstNumber(incidence);

    stats[state][year] = {
      incidence: incidence,
      incidence_number: incidenceNum, // numeric-only value
    };
  }
}

fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(stats, null, 2));
console.log(`✅ Wrote ${OUTPUT}`);
