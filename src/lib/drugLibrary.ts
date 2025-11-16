import { cache } from "react";

export type DrugDatabaseSource = "chembl";

export interface DrugLibraryCompound {
  id: string;
  sourceCompoundId: string;
  name: string;
  smiles: string | null;
  inchikey?: string | null;
  formula?: string | null;
  maxPhase?: number | null;
  synonyms: string[];
  source: DrugDatabaseSource;
  dataset: string;
  molecularWeight?: number | null;
  alogp?: number | null;
  psa?: number | null;
  hba?: number | null;
  hbd?: number | null;
  ro5Violations?: number | null;
  sourceUrl?: string;
}

const CHEMBL_BASE_URL = "https://www.ebi.ac.uk/chembl/api/data";

interface ChemblMolecule {
  molecule_chembl_id: string;
  pref_name?: string;
  parenteral_ligand_id?: string;
  max_phase?: number;
  molecule_synonyms?: Array<{ synonyms: string }>;
  molecule_structures?: {
    canonical_smiles?: string;
    standard_inchi_key?: string;
  };
  molecule_properties?: {
    full_mwt?: string;
    alogp?: string;
    psa?: string;
    hba?: string;
    hbd?: string;
    ro5_violations?: string;
  };
  molecule_formula?: string;
}

interface ChemblSearchResponse {
  page_meta?: {
    total_count?: number;
  };
  molecules?: ChemblMolecule[];
}

const parseNumber = (value?: string): number | null => {
  if (value === undefined || value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeChemblMolecule = (molecule: ChemblMolecule): DrugLibraryCompound => {
  const synonyms =
    molecule.molecule_synonyms?.map((syn) => syn.synonyms).filter(Boolean) ?? [];

  const smiles = molecule.molecule_structures?.canonical_smiles ?? null;

  return {
    id: molecule.molecule_chembl_id,
    sourceCompoundId: molecule.molecule_chembl_id,
    name: molecule.pref_name || synonyms[0] || molecule.molecule_chembl_id,
    smiles,
    inchikey: molecule.molecule_structures?.standard_inchi_key ?? null,
    formula: molecule.molecule_formula || null,
    maxPhase: molecule.max_phase ?? null,
    synonyms,
    source: "chembl",
    dataset: "ChEMBL",
    molecularWeight: parseNumber(molecule.molecule_properties?.full_mwt),
    alogp: parseNumber(molecule.molecule_properties?.alogp),
    psa: parseNumber(molecule.molecule_properties?.psa),
    hba: parseNumber(molecule.molecule_properties?.hba),
    hbd: parseNumber(molecule.molecule_properties?.hbd),
    ro5Violations: parseNumber(molecule.molecule_properties?.ro5_violations),
    sourceUrl: `https://www.ebi.ac.uk/chembl/compound_report_card/${molecule.molecule_chembl_id}`,
  };
};

async function fetchChemblCompoundsInternal(
  query: string,
  limit: number
): Promise<{ compounds: DrugLibraryCompound[]; total: number }> {
  const url = `${CHEMBL_BASE_URL}/molecule/search.json?q=${encodeURIComponent(
    query
  )}&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ChEMBL request failed (${response.status}): ${errorText || "Unknown"}`
    );
  }

  const data = (await response.json()) as ChemblSearchResponse;
  const molecules = data.molecules ?? [];
  const compounds = molecules
    .filter((mol) => mol?.molecule_structures?.canonical_smiles)
    .map(normalizeChemblMolecule);

  return {
    compounds,
    total: data.page_meta?.total_count ?? compounds.length,
  };
}

export const fetchChemblCompounds = cache(fetchChemblCompoundsInternal);

export async function fetchDrugLibrary(options: {
  query: string;
  limit?: number;
  source?: DrugDatabaseSource;
}): Promise<{
  query: string;
  source: DrugDatabaseSource;
  total: number;
  compounds: DrugLibraryCompound[];
}> {
  const { query, limit = 25, source = "chembl" } = options;

  if (!query.trim()) {
    throw new Error("Query cannot be empty.");
  }

  switch (source) {
    case "chembl": {
      const result = await fetchChemblCompounds(query, limit);
      return {
        query,
        source,
        total: result.total,
        compounds: result.compounds,
      };
    }
    default:
      throw new Error(`Unsupported source: ${source}`);
  }
}
