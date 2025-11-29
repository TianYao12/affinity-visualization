import { NextResponse } from "next/server";

interface DrugInput {
  smiles: string;
  qed: number;
  mw: number | null;
  logP: number | null;
}

interface ScreeningRequest {
  pdb: string;
  drugs: DrugInput[];
  topN: number;
  minBindingAffinity: number;
}

interface ScreenedDrug {
  rank: number;
  smiles: string;
  qed: number;
  bindingAffinity: number;
  mw?: number;
  logP?: number;
}

interface ScreeningResult {
  totalScreened: number;
  passedThreshold: number;
  topCandidates: ScreenedDrug[];
  processingTimeMs: number;
}

/**
 * Mock binding affinity prediction.
 * Replace this with your actual ML model API call.
 * 
 * The mock uses a deterministic algorithm based on:
 * - QED score (higher = better predicted affinity)
 * - Molecular weight (optimal range 300-500)
 * - logP (optimal range 2-4)
 * - Some randomness seeded by SMILES for consistency
 */
function predictBindingAffinity(
  smiles: string,
  qed: number,
  mw: number | null,
  logP: number | null,
  _pdb: string // Would be used in real implementation
): number {
  // Seed pseudo-random from SMILES for consistent results
  let hash = 0;
  for (let i = 0; i < smiles.length; i++) {
    hash = (hash * 31 + smiles.charCodeAt(i)) % 10000;
  }
  const noise = (hash / 10000) * 0.8 - 0.4; // -0.4 to +0.4

  // Base affinity from QED (higher QED = higher affinity)
  let affinity = 4.0 + qed * 4.5;

  // MW contribution (optimal around 350-450)
  if (mw !== null) {
    const mwOptimal = 400;
    const mwDiff = Math.abs(mw - mwOptimal) / 150;
    affinity -= Math.min(mwDiff, 1.0) * 0.5;
  }

  // logP contribution (optimal around 2.5-3.5)
  if (logP !== null) {
    const logPOptimal = 3.0;
    const logPDiff = Math.abs(logP - logPOptimal) / 2;
    affinity -= Math.min(logPDiff, 1.0) * 0.3;
  }

  // Add noise for variability
  affinity += noise;

  // Clamp to reasonable range
  return Math.max(3.0, Math.min(12.0, affinity));
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = (await request.json()) as ScreeningRequest;

    if (!body.pdb?.trim()) {
      return NextResponse.json(
        { error: "PDB content is required." },
        { status: 400 }
      );
    }

    if (!body.drugs?.length) {
      return NextResponse.json(
        { error: "No drug candidates provided." },
        { status: 400 }
      );
    }

    const topN = Math.max(1, Math.min(100, body.topN || 10));
    const minAffinity = body.minBindingAffinity ?? 0;

    // Score all drugs
    const scoredDrugs: Array<{
      smiles: string;
      qed: number;
      mw: number | null;
      logP: number | null;
      bindingAffinity: number;
    }> = [];

    for (const drug of body.drugs) {
      const affinity = predictBindingAffinity(
        drug.smiles,
        drug.qed,
        drug.mw,
        drug.logP,
        body.pdb
      );

      scoredDrugs.push({
        ...drug,
        bindingAffinity: affinity,
      });
    }

    // Filter by minimum affinity
    const passed = scoredDrugs.filter(
      (d) => d.bindingAffinity >= minAffinity
    );

    // Sort by binding affinity descending
    passed.sort((a, b) => b.bindingAffinity - a.bindingAffinity);

    // Take top N
    const topCandidates: ScreenedDrug[] = passed
      .slice(0, topN)
      .map((drug, idx) => ({
        rank: idx + 1,
        smiles: drug.smiles,
        qed: drug.qed,
        bindingAffinity: Number(drug.bindingAffinity.toFixed(2)),
        mw: drug.mw ?? undefined,
        logP: drug.logP ?? undefined,
      }));

    const result: ScreeningResult = {
      totalScreened: body.drugs.length,
      passedThreshold: passed.length,
      topCandidates,
      processingTimeMs: Date.now() - startTime,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Binding screening error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Binding affinity screening failed.",
      },
      { status: 500 }
    );
  }
}
