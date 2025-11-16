import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  AnalysisJobRequest,
  AnalysisJobResponse,
  AnalysisStage,
  CandidatePrediction,
  DrugLibrarySelection,
} from "@/types/prediction";
import { validateProteinSequence } from "@/lib/ncbi";

const baseCandidates: CandidatePrediction[] = [
  {
    id: 1,
    name: "ChemGAN-Generated Compound 1",
    smiles: "CC1=C(C=CC(=C1)C(=O)NC2=CC=C(C=C2)CN3CCN(CC3)C)OC",
    structure: "C22H26N4O3",
    pKd: 8.7,
    rmse: 0.69,
    r_squared: 0.5,
    confidence: 94,
    molecular_weight: 394.47,
    logP: 3.2,
    interactions: [
      "π-π stacking",
      "H-bond (Asp181)",
      "Hydrophobic (Leu83)",
      "Van der Waals",
    ],
    dataset_source: "PDBBind v2019",
    binding_site: "Site 1 (residues 78-95, 180-195)",
  },
  {
    id: 2,
    name: "ChemGAN-Generated Compound 2",
    smiles: "COC1=CC=C(C=C1)C2=NC(=NC=C2)NC3=CC=C(C=C3)N4CCN(CC4)C",
    structure: "C21H24N4O2",
    pKd: 7.3,
    rmse: 0.72,
    r_squared: 0.48,
    confidence: 87,
    molecular_weight: 364.44,
    logP: 2.8,
    interactions: [
      "H-bond (Ser195)",
      "Electrostatic (Arg145)",
      "Hydrophobic pocket",
    ],
    dataset_source: "PDBBind v2019",
    binding_site: "Site 2 (residues 140-160)",
  },
  {
    id: 3,
    name: "ChemGAN-Generated Compound 3",
    smiles: "CN1CCN(CC1)C2=CC=C(C=C2)NC(=O)C3=CC=C(C=C3)F",
    structure: "C18H20FN3O",
    pKd: 6.9,
    rmse: 0.75,
    r_squared: 0.45,
    confidence: 82,
    molecular_weight: 313.37,
    logP: 2.1,
    interactions: [
      "H-bond network",
      "Fluorine interaction",
      "Aromatic stacking",
    ],
    dataset_source: "PDBBind refined set",
    binding_site: "Site 1 (alternative pose)",
  },
  {
    id: 4,
    name: "ChemGAN-Generated Compound 4",
    smiles: "CC(C)NCC(C1=CC(=C(C=C1)O)CO)O",
    structure: "C12H19NO3",
    pKd: 6.2,
    rmse: 0.81,
    r_squared: 0.42,
    confidence: 78,
    molecular_weight: 225.29,
    logP: 1.4,
    interactions: ["H-bond (Tyr264)", "OH-π interaction", "Weak hydrophobic"],
    dataset_source: "PDBBind general set",
    binding_site: "Allosteric site",
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const seededNoise = (smiles: string, salt: number) => {
  let hash = salt + 131;
  for (let i = 0; i < smiles.length; i += 1) {
    hash = (hash * 31 + smiles.charCodeAt(i)) % 1000;
  }
  return hash / 1000;
};

const interactionTemplates = [
  ["π-π stacking", "H-bond network", "Hydrophobic core"],
  ["Halogen bond", "Backbone contacts", "Electrostatic bridge"],
  ["Hydrogen bond triad", "CH/π interaction", "Van der Waals"],
  ["Salt bridge", "Hydrophobic clamp", "π-cation contact"],
];

const deriveNominatedCandidates = (
  compounds: DrugLibrarySelection[],
  startingId: number = 100
): CandidatePrediction[] => {
  return compounds.map((compound, index) => {
    const noise = seededNoise(compound.smiles, index + 1);
    const mwNorm = clamp((compound.molecularWeight ?? 420) / 700, 0.2, 1.5);
    const lipNorm = clamp(((compound.alogp ?? 2.4) + 5) / 10, 0.1, 1.2);
    const phaseBoost = (compound.maxPhase ?? 0) * 0.18;

    const pkdBase = 5.8 + mwNorm * 1.1 + lipNorm * 0.9 + phaseBoost;
    const pkd = clamp(pkdBase + noise * 0.8, 5.2, 9.6);

    const confidence = Math.round(
      clamp(68 + phaseBoost * 10 + noise * 20, 55, 97)
    );
    const rmse = Number(
      clamp(0.62 - phaseBoost * 0.05 + (1 - noise) * 0.08, 0.45, 0.9).toFixed(
        2
      )
    );
    const rSquared = Number(
      clamp(0.46 + phaseBoost * 0.04 + noise * 0.25, 0.4, 0.91).toFixed(2)
    );
    const logP = Number(
      clamp(compound.alogp ?? 2.4, -1, 6).toFixed(1)
    );

    const template =
      interactionTemplates[index % interactionTemplates.length];

    return {
      id: startingId + index,
      name: `${compound.name} (${compound.dataset})`,
      smiles: compound.smiles,
      structure: compound.formula || compound.name,
      source: compound.dataset,
      sourceCompoundId: compound.sourceCompoundId,
      pKd: Number(pkd.toFixed(2)),
      rmse,
      r_squared: rSquared,
      confidence,
      molecular_weight: Number(
        (compound.molecularWeight ?? 0).toFixed(1)
      ),
      logP,
      interactions: template,
      dataset_source: compound.dataset,
      binding_site: "Nomination library pocket",
    };
  });
};

const getMockStages = (): AnalysisStage[] => {
  const now = Date.now();

  const stageBlueprint: Array<{
    id: AnalysisStage["id"];
    label: string;
    details: string[];
    durationMs: number;
  }> = [
    {
      id: "esm_embedding",
      label: "ESM-2 Protein Embedding",
      durationMs: 800,
      details: [
        "Full protein sequence processed through ESM-2",
        "Binding pocket optionally embedded separately",
        "Embeddings concatenated into 640-dim vector",
      ],
    },
    {
      id: "chemgan_generation",
      label: "ChemGAN Molecule Generation",
      durationMs: 1500,
      details: [
        "ChemGAN explored chemical space",
        "GIN layers extracted molecular embeddings",
        "Drug-likeness filters applied",
      ],
    },
    {
      id: "fusion_prediction",
      label: "Dual-Stream Affinity Prediction",
      durationMs: 1200,
      details: [
        "Protein + molecule embeddings fused",
        "Fully connected layers predicted pKd",
        "Confidence and ADMET metrics estimated",
      ],
    },
  ];

  let offset = 0;

  return stageBlueprint.map((stage) => {
    const startedAt = new Date(now + offset);
    offset += stage.durationMs;
    const completedAt = new Date(now + offset);
    return {
      id: stage.id,
      label: stage.label,
      status: "complete" as const,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      details: stage.details,
    };
  });
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalysisJobRequest;

    if (!body?.sequence?.trim()) {
      return NextResponse.json(
        {
          status: "failed",
          error: "Protein sequence is required.",
        },
        { status: 400 }
      );
    }

    const validation = validateProteinSequence(body.sequence);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          status: "failed",
          error: validation.errors.join(", "),
        },
        { status: 400 }
      );
    }

    const cleanSequence = body.sequence.replace(/\s|\n/g, "");
    const bindingPocket = body.bindingPocket?.trim();
    const jobId = randomUUID();
    const nominatedCompounds =
      Array.isArray(body.nominatedCompounds) && body.nominatedCompounds.length
        ? body.nominatedCompounds.filter(
            (compound): compound is DrugLibrarySelection =>
              Boolean(compound?.smiles && compound?.id)
          )
        : [];
    const nominatedCandidates = nominatedCompounds.length
      ? deriveNominatedCandidates(nominatedCompounds)
      : [];
    const combinedCandidates = nominatedCandidates.length
      ? [...nominatedCandidates, ...baseCandidates]
      : baseCandidates;
    const nominationDatasets = nominatedCompounds.length
      ? Array.from(new Set(nominatedCompounds.map((compound) => compound.dataset))).join(", ")
      : "";

    const responsePayload: AnalysisJobResponse = {
      jobId,
      status: "complete",
      message: nominatedCandidates.length
        ? `Mock inference complete. Integrated ${nominatedCandidates.length} nominated ${
            nominatedCandidates.length === 1 ? "compound" : "compounds"
          } from ${nominationDatasets || "external libraries"}.`
        : "Mock inference complete. Replace this route with your ML inference service call.",
      stages: getMockStages(),
      candidates: combinedCandidates.map((candidate) => ({
        ...candidate,
        binding_site: bindingPocket ? "Custom pocket" : candidate.binding_site,
      })),
      metrics: {
        rmse: 0.69,
        r_squared: 0.5,
      },
      bindingPocket,
      proteinLength: cleanSequence.length,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Analysis route error", error);
    return NextResponse.json(
      {
        status: "failed",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during analysis request.",
      },
      { status: 500 }
    );
  }
}
