import { NextResponse } from "next/server";

const NCBI_EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const NCBI_API_KEY = process.env.NCBI_API_KEY;

async function fetchProteinSummary(term: string) {
  const searchUrl = `${NCBI_EUTILS_BASE}/esearch.fcgi?db=protein&retmode=json&retmax=1&term=${encodeURIComponent(
    term
  )}${NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : ""}`;

  const searchResp = await fetch(searchUrl, { method: "GET" });
  if (!searchResp.ok) {
    throw new Error(`NCBI search failed (${searchResp.status})`);
  }

  const searchJson = (await searchResp.json()) as {
    esearchresult?: { idlist?: string[] };
  };
  const uid = searchJson.esearchresult?.idlist?.[0];
  if (!uid) {
    return null;
  }

  const summaryUrl = `${NCBI_EUTILS_BASE}/esummary.fcgi?db=protein&retmode=json&id=${uid}${
    NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : ""
  }`;
  const summaryResp = await fetch(summaryUrl, { method: "GET" });
  if (!summaryResp.ok) {
    throw new Error(`NCBI summary failed (${summaryResp.status})`);
  }

  const summaryJson = (await summaryResp.json()) as {
    result?: Record<
      string,
      {
        title?: string;
        extra?: string;
        source?: string;
        accessionversion?: string;
      }
    >;
  };

  const doc = summaryJson.result?.[uid];
  if (!doc) return null;

  return {
    family: doc.title || "Protein entry",
    description: doc.extra || doc.source || "NCBI protein record",
    function: doc.source || "Function not provided",
    accession: doc.accessionversion,
    source: "ncbi" as const,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      accession?: string;
    };

    const query = body.accession || body.name;
    if (!query) {
      return NextResponse.json(
        { error: "name or accession is required" },
        { status: 400 }
      );
    }

    const result = await fetchProteinSummary(query);

    if (!result) {
      return NextResponse.json(
        {
          family: "Protein family not found",
          description: "No NCBI hit for the provided name/accession.",
          function: "Unknown function",
          accession: body.accession ?? null,
          source: "ncbi_no_hit",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("protein-info route error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        source: "ncbi_error",
      },
      { status: 500 }
    );
  }
}
