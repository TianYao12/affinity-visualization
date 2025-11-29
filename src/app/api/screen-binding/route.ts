import { Client, type Client as GradioClient } from "@gradio/client";
import { NextResponse } from "next/server";

interface DrugInput {
  smiles: string;
  qed: number;
  mw: number | null;
  logP: number | null;
}

interface ScreeningRequest {
  pdb: string;
  fasta_full: string;
  fasta_pocket?: string;
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

const DEFAULT_SPACE_URL = "https://sharanyabasu-affinnity.hf.space";
const DEFAULT_ENDPOINT = "/predict";
const MAX_CONCURRENCY = 5;

function buildBaseUrl(): string {
  return process.env.HF_SPACE_URL?.replace(/\/$/, "") ?? DEFAULT_SPACE_URL;
}

function buildEndpoint(): string {
  return process.env.HF_PREDICT_ENDPOINT?.startsWith("/")
    ? process.env.HF_PREDICT_ENDPOINT
    : `/${process.env.HF_PREDICT_ENDPOINT ?? DEFAULT_ENDPOINT}`;
}

let clientPromise: Promise<GradioClient> | null = null;

async function getGradioClient(): Promise<GradioClient> {
  if (!clientPromise) {
    clientPromise = Client.connect(buildBaseUrl());
  }
  return clientPromise;
}

async function predictPkD(
  smiles: string,
  fastaFull: string,
  fastaPocket: string
): Promise<number> {
  const client = await getGradioClient();
  const endpoint = buildEndpoint();

  try {
    const result = await client.predict(endpoint, {
      smiles,
      fasta_full: fastaFull,
      fasta_pocket: fastaPocket,
    });

    const predictedValue = Array.isArray(result.data)
      ? result.data[0]
      : (result.data as unknown);

    const predictedPkD =
      typeof predictedValue === "number"
        ? predictedValue
        : Number(predictedValue ?? NaN);

    if (Number.isNaN(predictedPkD)) {
      throw new Error("Unexpected response from prediction endpoint.");
    }

    return predictedPkD;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "HF predict request failed."
    );
  }
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

    if (!body.fasta_full?.trim()) {
      return NextResponse.json(
        { error: "Full protein FASTA is required." },
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
    const fastaFull = body.fasta_full.trim();
    const fastaPocket = body.fasta_pocket?.trim() ?? "";

    const results: Array<ScreenedDrug | null> = new Array(body.drugs.length).fill(
      null
    );

    let index = 0;
    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENCY, body.drugs.length) },
      () => index
    ).map(async () => {
      while (true) {
        const current = index;
        index += 1;
        if (current >= body.drugs.length) break;

        const drug = body.drugs[current];

        try {
          const pkd = await predictPkD(drug.smiles, fastaFull, fastaPocket);

          results[current] = {
            rank: current + 1,
            smiles: drug.smiles,
            qed: drug.qed,
            bindingAffinity: Number(pkd.toFixed(2)),
            mw: drug.mw ?? undefined,
            logP: drug.logP ?? undefined,
          };
        } catch (err) {
          console.error("Prediction failed for", drug.smiles, err);
          results[current] = null;
        }
      }
    });

    await Promise.all(workers);

    const completed = results.filter(
      (item): item is ScreenedDrug => item !== null
    );

    const passed = completed.filter(
      (d) => d.bindingAffinity >= minAffinity
    );

    passed.sort((a, b) => b.bindingAffinity - a.bindingAffinity);

    const topCandidates: ScreenedDrug[] = passed
      .slice(0, topN)
      .map((drug, idx) => ({
        ...drug,
        rank: idx + 1,
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
