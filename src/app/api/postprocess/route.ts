import { NextResponse } from "next/server";
import type {
  BindingPostProcessRequest,
  BindingPostProcessResult,
} from "@/types/prediction";

const MOCK_DRUG_NAME = "Mocked NCBI Ligand";
const NCBI_STRUCTURE_ENDPOINT =
  "https://api.ncbi.nlm.nih.gov/lit/chem/v1/structure/search";
const NCBI_API_KEY = process.env.NCBI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

async function fetchDrugNameFromNCBI(sdf: string): Promise<{
  drugName: string | null;
  source: "live" | "mock" | "not_provided";
  note?: string;
}> {
  if (!sdf.trim()) {
    return { drugName: null, source: "not_provided", note: "No SDF supplied" };
  }

  const allowLiveLookup = Boolean(NCBI_API_KEY);

  try {
    if (allowLiveLookup) {
      const response = await fetch(NCBI_STRUCTURE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": NCBI_API_KEY as string,
        },
        body: JSON.stringify({ structure: sdf, format: "sdf" }),
      });

      if (!response.ok) {
        throw new Error(`NCBI lookup failed (${response.status})`);
      }

      const data = await response.json();
      const hit = data?.hits?.[0];
      const liveName = hit?.preferredName ?? hit?.name ?? null;

      return {
        drugName: liveName,
        source: "live",
        note: liveName
          ? "Resolved via live NCBI structure search."
          : "NCBI search returned no preferred name.",
      };
    }

    return {
      drugName: `${MOCK_DRUG_NAME} (${sdf.substring(0, 8)}...)`,
      source: "mock",
      note: "Returned mock drug name because live NCBI access or API key is unavailable.",
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

async function runOpenAILlm(
  messages: BindingPostProcessResult["gptMessages"]
): Promise<{
  content: string | null;
  model: string | undefined;
  source: "openai" | "mock" | "not_provided";
  error?: string;
}> {
  if (!OPENAI_API_KEY) {
    return {
      content: null,
      model: undefined,
      source: "not_provided",
      error: "OPENAI_API_KEY not set; skipping live LLM call.",
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed (${response.status})`);
    }

    const data = await response.json();
    const content =
      data?.choices?.[0]?.message?.content?.trim() ??
      data?.choices?.[0]?.message?.content ??
      null;

    return { content, model: data?.model, source: "openai" };
  } catch (error) {
    console.error("OpenAI call failed", error);
    return {
      content: null,
      model: OPENAI_MODEL,
      source: "mock",
      error:
        error instanceof Error
          ? error.message
          : "Unknown OpenAI error; falling back to mock.",
    };
  }
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

    const llmResult = await runOpenAILlm(gptMessages);

    const response: BindingPostProcessResult = {
      drugName: ncbiResult.drugName,
      proteinName: body.proteinName,
      bindingAffinity: body.bindingAffinity,
      prompt,
      gptMessages,
      ncbiSource: ncbiResult.source,
      notes: ncbiResult.note,
      llmOutput: llmResult.content,
      llmModel: llmResult.model,
      llmSource: llmResult.source,
      llmError: llmResult.error,
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
