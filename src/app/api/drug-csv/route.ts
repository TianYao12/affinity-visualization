import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface DrugRow {
  smiles: string;
  qed: number;
  mw: number | null;
  logP: number | null;
}

let cachedDrugs: DrugRow[] | null = null;

async function loadDrugsFromCSV(): Promise<DrugRow[]> {
  if (cachedDrugs) {
    return cachedDrugs;
  }

  const csvPath = path.join(process.cwd(), "kaggle_zinc_filtered.csv");
  const content = await fs.readFile(csvPath, "utf-8");
  const lines = content.split("\n");

  // Skip header
  const header = lines[0].split(",");
  const smilesIdx = header.indexOf("smiles");
  const qedIdx = header.indexOf("qed");
  const mwIdx = header.indexOf("mw");
  const logPIdx = header.indexOf("logP");

  const drugs: DrugRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted CSV fields
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const smiles = values[smilesIdx]?.replace(/[\n\r]/g, "").trim();
    const qed = parseFloat(values[qedIdx]);
    const mw = mwIdx >= 0 ? parseFloat(values[mwIdx]) : null;
    const logP = logPIdx >= 0 ? parseFloat(values[logPIdx]) : null;

    if (smiles && !isNaN(qed)) {
      drugs.push({
        smiles,
        qed,
        mw: mw && !isNaN(mw) ? mw : null,
        logP: logP && !isNaN(logP) ? logP : null,
      });
    }
  }

  // Sort by QED descending (highest quality first)
  drugs.sort((a, b) => b.qed - a.qed);

  cachedDrugs = drugs;
  return drugs;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam), 227000) : 50000;

  try {
    const allDrugs = await loadDrugsFromCSV();
    const selectedDrugs = allDrugs.slice(0, limit);

    return NextResponse.json({
      count: selectedDrugs.length,
      totalAvailable: allDrugs.length,
      drugs: selectedDrugs,
    });
  } catch (error) {
    console.error("Drug CSV loading error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load drug candidates from CSV.",
      },
      { status: 500 }
    );
  }
}
