export interface AnalysisJobRequest {
  sequence: string;
  bindingPocket?: string;
  metadata?: {
    accession?: string;
    title?: string;
  };
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
