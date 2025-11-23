import { NextResponse } from "next/server";
import type {
  BindingPostProcessRequest,
  BindingPostProcessResult,
} from "@/types/prediction";

const MOCK_DRUG_NAME = "Mocked NCBI Ligand";

async function fetchDrugNameFromNCBI(sdf: string): Promise<{
  drugName: string | null;
  source: "live" | "mock" | "not_provided";
  note?: string;
}> {
  if (!sdf.trim()) {
    return { drugName: null, source: "not_provided", note: "No SDF supplied" };
  }

  try {
    // Placeholder for the real NCBI lit/chem structure search.
    // Replace with a live call when networked execution is allowed:
    // const response = await fetch(
    //   "https://api.ncbi.nlm.nih.gov/lit/chem/v1/structure/search",
    //   {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ structure: sdf, format: "sdf" }),
    //   }
    // );
    // const data = await response.json();
    // const hit = data?.hits?.[0];
    // return {
    //   drugName: hit?.preferredName ?? hit?.name ?? null,
    //   source: "live",
    // };

    return {
      drugName: `${MOCK_DRUG_NAME} (${sdf.substring(0, 8)}...)`,
      source: "mock",
      note: "Returned mock drug name because live NCBI access is disabled in this environment.",
    };
  } catch (error) {
    console.error("NCBI lookup failed", error);
    return {
      drugName: null,
      source: "mock",
      note: "NCBI lookup failed; no drug name resolved.",
    };
  }
}

function buildPromptTemplate(params: {
  drugName: string | null;
  proteinName: string;
  proteinAccession?: string;
  bindingAffinity: number;
  candidateName?: string;
}): { prompt: string; gptMessages: BindingPostProcessResult["gptMessages"] } {
  const title = params.drugName || params.candidateName || "Unknown ligand";
  const prompt = `
You are a cheminformatics assistant that summarizes a binding prediction.

Inputs:
- Protein: ${params.proteinName}${
    params.proteinAccession ? ` (${params.proteinAccession})` : ""
  }
- Ligand: ${title}
- Predicted pKd: ${params.bindingAffinity.toFixed(2)}
- Task: Confirm ligand identity via NCBI, cross-check against protein target, and produce a 3-bullet rationale of why this affinity is plausible.

Return JSON with fields: drug_name, protein_name, binding_affinity_pkd, rationale[]. Keep it concise and evidence-driven.
`;

  const gptMessages: BindingPostProcessResult["gptMessages"] = [
    {
      role: "system",
      content:
        "You are an expert in protein-ligand binding analysis. Always return JSON only.",
    },
    { role: "user", content: prompt.trim() },
  ];

  return { prompt: prompt.trim(), gptMessages };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BindingPostProcessRequest;

    if (!body?.bindingAffinity || !body?.proteinName) {
      return NextResponse.json(
        { error: "bindingAffinity and proteinName are required." },
        { status: 400 }
      );
    }

    const ncbiResult = await fetchDrugNameFromNCBI(body.sdf || "");
    const { prompt, gptMessages } = buildPromptTemplate({
      drugName: ncbiResult.drugName,
      proteinName: body.proteinName,
      proteinAccession: body.proteinAccession,
      bindingAffinity: body.bindingAffinity,
      candidateName: body.candidateName,
    });

    const response: BindingPostProcessResult = {
      drugName: ncbiResult.drugName,
      proteinName: body.proteinName,
      bindingAffinity: body.bindingAffinity,
      prompt,
      gptMessages,
      ncbiSource: ncbiResult.source,
      notes: ncbiResult.note,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("postprocess route error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
