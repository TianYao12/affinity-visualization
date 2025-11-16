export interface AnalysisJobRequest {
  sequence: string;
  bindingPocket?: string;
  metadata?: {
    accession?: string;
    title?: string;
  };
  nominatedCompounds?: DrugLibrarySelection[];
}

export type AnalysisStageId =
  | "esm_embedding"
  | "chemgan_generation"
  | "fusion_prediction";

export type AnalysisStageStatus = "pending" | "running" | "complete";

export interface AnalysisStage {
  id: AnalysisStageId;
  label: string;
  status: AnalysisStageStatus;
  startedAt: string;
  completedAt: string;
  details: string[];
}

export interface CandidatePrediction {
  id: number;
  name: string;
  smiles: string;
  structure: string;
  sourceCompoundId?: string;
  source?: string;
  pKd: number;
  rmse: number;
  r_squared: number;
  confidence: number;
  molecular_weight: number;
  logP: number;
  interactions: string[];
  dataset_source: string;
  binding_site: string;
}

export interface AnalysisJobResponse {
  jobId: string;
  status: "queued" | "processing" | "complete" | "failed";
  message?: string;
  stages: AnalysisStage[];
  candidates: CandidatePrediction[];
  metrics: {
    rmse: number;
    r_squared: number;
  };
  bindingPocket?: string;
  proteinLength: number;
  createdAt: string;
  completedAt: string;
  error?: string;
}

export interface DrugLibrarySelection {
  id: string;
  sourceCompoundId: string;
  name: string;
  smiles: string;
  source: string;
  molecularWeight?: number | null;
  alogp?: number | null;
  psa?: number | null;
  hba?: number | null;
  hbd?: number | null;
  ro5Violations?: number | null;
  maxPhase?: number | null;
  inchikey?: string | null;
  formula?: string | null;
  sourceUrl?: string;
  dataset: string;
}
