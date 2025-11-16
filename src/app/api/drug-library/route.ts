import { NextResponse } from "next/server";
import {
  fetchDrugLibrary,
  type DrugDatabaseSource,
} from "@/lib/drugLibrary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";
  const limitParam = searchParams.get("limit");
  const sourceParam = searchParams.get("source") as DrugDatabaseSource | null;

  if (!query.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'query' is required." },
      { status: 400 }
    );
  }

  const limit = limitParam ? Math.min(Number(limitParam), 100) : 25;
  const source = sourceParam ?? "chembl";

  try {
    const result = await fetchDrugLibrary({ query, limit, source });
    return NextResponse.json({
      ...result,
      count: result.compounds.length,
    });
  } catch (error) {
    console.error("Drug library fetch failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to fetch drug library compounds.",
      },
      { status: 500 }
    );
  }
}
