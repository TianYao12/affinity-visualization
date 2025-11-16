"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Atom,
  Dna,
  Beaker,
  Zap,
  Search,
  Target,
  Microscope,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import ProteinInput from "@/components/ProteinInput";
import DrugCandidates from "@/components/DrugCandidates";
import AffinityVisualization from "@/components/AffinityVisualization";
import MolecularViewer from "@/components/MolecularViewer";
import AnalysisPipeline from "@/components/AnalysisPipeline";
import DrugLibraryBrowser from "@/components/DrugLibraryBrowser";
import type {
  AnalysisJobRequest,
  AnalysisJobResponse,
  AnalysisStage,
  CandidatePrediction,
  DrugLibrarySelection,
} from "@/types/prediction";

export default function Home() {
  const [proteinSequence, setProteinSequence] = useState("");
  const [bindingPocket, setBindingPocket] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [drugCandidates, setDrugCandidates] = useState<CandidatePrediction[]>(
    []
  );
  const [currentStep, setCurrentStep] = useState<
    "input" | "analysis" | "prediction" | "complete"
  >("input");
  const [analysisStages, setAnalysisStages] = useState<AnalysisStage[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);
  const [modelMetrics, setModelMetrics] = useState({
    rmse: 0.69,
    rSquared: 0.5,
  });
  const [nominatedCompounds, setNominatedCompounds] = useState<
    DrugLibrarySelection[]
  >([]);

  const handleNominateCompound = (compound: DrugLibrarySelection) => {
    setNominatedCompounds((prev) => {
      if (prev.some((existing) => existing.id === compound.id)) {
        return prev;
      }
      return [...prev, compound];
    });
  };

  const handleRemoveNomination = (compoundId: string) => {
    setNominatedCompounds((prev) =>
      prev.filter((compound) => compound.id !== compoundId)
    );
  };

  const mapStatusToStep = (
    status: AnalysisJobResponse["status"]
  ): "input" | "analysis" | "prediction" | "complete" => {
    if (status === "complete") return "complete";
    if (status === "processing") return "prediction";
    return "analysis";
  };

  const handleAnalyze = async (sequence: string, pocket?: string) => {
    const cleanedSequence = sequence.trim();
    const cleanedPocket = pocket?.trim() ?? "";

    setProteinSequence(cleanedSequence);
    setBindingPocket(cleanedPocket);
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setCurrentStep("analysis");
    setDrugCandidates([]);
    setAnalysisStages([]);
    setAnalysisError(null);
    setAnalysisMessage(null);
    setAnalysisJobId(null);

    const payload: AnalysisJobRequest = {
      sequence: cleanedSequence,
      ...(cleanedPocket ? { bindingPocket: cleanedPocket } : {}),
      ...(nominatedCompounds.length
        ? { nominatedCompounds }
        : {}),
    };

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as AnalysisJobResponse;

      if (!response.ok) {
        throw new Error(data.error || "Analysis request failed.");
      }

      setAnalysisStages(data.stages || []);
      setAnalysisMessage(data.message ?? null);
      setAnalysisJobId(data.jobId);
      setDrugCandidates(data.candidates || []);

      if (data.metrics) {
        setModelMetrics((prev) => ({
          rmse: data.metrics?.rmse ?? prev.rmse,
          rSquared: data.metrics?.r_squared ?? prev.rSquared,
        }));
      }

      const nextStep = mapStatusToStep(data.status);
      setCurrentStep(nextStep);
      setAnalysisComplete(data.status === "complete");
    } catch (error) {
      console.error("handleAnalyze error", error);
      const message =
        error instanceof Error
          ? error.message
          : "Unexpected error during analysis.";
      setAnalysisError(message);
      setCurrentStep("input");
      setAnalysisComplete(false);
      setDrugCandidates([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900" />
      <div className="absolute inset-0 bg-molecular-pattern opacity-20" />

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          {/* Main Title Section */}
          <div className="relative mb-8">
            <div className="flex justify-center items-center mb-4">
              <div className="text-center">
                <h1 className="text-7xl font-black bg-gradient-to-r from-slate-200 via-blue-200 to-slate-200 bg-clip-text text-transparent mb-4 tracking-tight">
                  Affi-NN-ity
                </h1>
                <p className="text-xl font-medium text-slate-300 tracking-wide">
                  Protein-Drug Binding Affinity Predictor
                </p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-5xl mx-auto mb-8"
          >
            <p className="text-xl leading-relaxed text-slate-300 mb-6 font-light">
              Dual-stream architecture combining{" "}
              <span className="font-semibold text-blue-300">
                Graph Neural Networks
              </span>{" "}
              for molecules with{" "}
              <span className="font-semibold text-indigo-300">
                ESM-2 protein language models
              </span>
              . Trained on{" "}
              <span className="font-semibold text-emerald-300">
                PDBBind v2019 dataset
              </span>{" "}
              with <span className="font-semibold text-amber-300">ChemGAN</span>{" "}
              molecular generation pipeline.
            </p>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex justify-center space-x-8"
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              className="bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-xl px-6 py-4 shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <div>
                  <div className="text-sm font-medium text-slate-400">
                    Root Mean Square Error
                  </div>
                  <div className="text-lg font-semibold text-slate-200">
                    RMSE: {modelMetrics.rmse.toFixed(2)}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              className="bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-xl px-6 py-4 shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-300 rounded-full"></div>
                <div>
                  <div className="text-sm font-medium text-slate-400">
                    Coefficient of Determination
                  </div>
                  <div className="text-lg font-semibold text-slate-200">
                    R²: {modelMetrics.rSquared.toFixed(2)}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, y: -1 }}
              className="bg-slate-800/40 backdrop-blur-sm border border-slate-600/30 rounded-xl px-6 py-4 shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-indigo-300 rounded-full"></div>
                <div>
                  <div className="text-sm font-medium text-slate-400">
                    Training Dataset
                  </div>
                  <div className="text-lg font-semibold text-slate-200">
                    PDBBind v2019
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Subtitle with University Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-slate-500 font-medium">
              University of Waterloo | WAT.ai Research Initiative | Borealis AI
              Let&apos;s SOLVE It Program
            </p>
          </motion.div>
        </motion.div>

        <div className="mb-16 flex justify-center">
          <Link
            href="/benchmarks"
            className="inline-flex items-center space-x-2 rounded-full border border-slate-600/60 bg-slate-900/40 px-6 py-3 text-sm font-semibold text-slate-100 shadow-lg shadow-blue-500/10 transition hover:-translate-y-0.5 hover:border-slate-400/80 hover:bg-slate-800/60"
          >
            <Target className="w-4 h-4 text-emerald-300" />
            <span>View Full Benchmark Report</span>
          </Link>
        </div>

        {/* Enhanced Analysis Pipeline Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16"
        >
          <div className="relative">
            {/* Pipeline Background */}
            <div className="absolute inset-0 bg-slate-800/40 rounded-2xl backdrop-blur-sm border border-slate-600/40"></div>

            {/* Pipeline Steps */}
            <div className="relative flex justify-center items-center space-x-12 py-8 px-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex flex-col items-center space-y-3 transition-all duration-300 ${
                  proteinSequence ? "opacity-100" : "opacity-60"
                }`}
              >
                <div
                  className={`relative p-4 rounded-xl transition-all duration-500 ${
                    proteinSequence
                      ? "bg-slate-700/30 border border-emerald-400/30 shadow-lg"
                      : "bg-slate-800/20 border border-slate-600/30"
                  }`}
                >
                  <Microscope
                    className={`w-8 h-8 relative z-10 transition-colors duration-300 ${
                      proteinSequence ? "text-emerald-300" : "text-slate-400"
                    }`}
                  />
                </div>
                <div className="text-center">
                  <div
                    className={`font-medium transition-colors duration-300 ${
                      proteinSequence ? "text-white" : "text-slate-400"
                    }`}
                  >
                    Protein Input
                  </div>
                  <div
                    className={`text-xs mt-1 transition-colors duration-300 ${
                      proteinSequence ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    ESM-2 Embedding
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ x: [0, 8, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex items-center space-x-2"
              >
                <ArrowRight className="w-5 h-5 text-slate-300/80" />
                <div className="w-8 h-px bg-slate-400/60"></div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex flex-col items-center space-y-3 transition-all duration-300 ${
                  isAnalyzing
                    ? "opacity-100"
                    : analysisComplete
                    ? "opacity-100"
                    : "opacity-60"
                }`}
              >
                <div
                  className={`relative p-4 rounded-xl transition-all duration-500 ${
                    isAnalyzing
                      ? "bg-slate-700/30 border border-amber-400/30 shadow-lg"
                      : analysisComplete
                      ? "bg-slate-700/30 border border-blue-400/30 shadow-lg"
                      : "bg-slate-800/20 border border-slate-600/30"
                  }`}
                >
                  <Activity
                    className={`w-8 h-8 relative z-10 transition-colors duration-300 ${
                      isAnalyzing
                        ? "text-amber-300"
                        : analysisComplete
                        ? "text-blue-300"
                        : "text-slate-400"
                    }`}
                  />
                </div>
                <div className="text-center">
                  <div
                    className={`font-medium transition-colors duration-300 ${
                      isAnalyzing
                        ? "text-amber-300"
                        : analysisComplete
                        ? "text-white"
                        : "text-slate-400"
                    }`}
                  >
                    ML Analysis
                  </div>
                  <div
                    className={`text-xs mt-1 transition-colors duration-300 ${
                      isAnalyzing
                        ? "text-amber-200"
                        : analysisComplete
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    GNN + ChemGAN
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ x: [0, 8, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="flex items-center space-x-2"
              >
                <ArrowRight className="w-5 h-5 text-slate-300/80" />
                <div className="w-8 h-px bg-slate-400/60"></div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex flex-col items-center space-y-3 transition-all duration-300 ${
                  analysisComplete ? "opacity-100" : "opacity-60"
                }`}
              >
                <div
                  className={`relative p-4 rounded-xl transition-all duration-500 ${
                    analysisComplete
                      ? "bg-slate-700/30 border border-emerald-400/30 shadow-lg"
                      : "bg-slate-800/20 border border-slate-600/30"
                  }`}
                >
                  <Zap
                    className={`w-8 h-8 relative z-10 transition-colors duration-300 ${
                      analysisComplete ? "text-emerald-300" : "text-slate-400"
                    }`}
                  />
                </div>
                <div className="text-center">
                  <div
                    className={`font-medium transition-colors duration-300 ${
                      analysisComplete ? "text-white" : "text-slate-400"
                    }`}
                  >
                    Results
                  </div>
                  <div
                    className={`text-xs mt-1 transition-colors duration-300 ${
                      analysisComplete ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    pKd Predictions
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 mx-8">
              <div className="h-1 bg-slate-700/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-300 to-emerald-300 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: proteinSequence
                      ? isAnalyzing
                        ? "50%"
                        : analysisComplete
                        ? "100%"
                        : "33%"
                      : "0%",
                  }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic Layout - Full width input, then 3-column when analysis starts */}
        {!proteinSequence && !isAnalyzing ? (
          // Full width protein input when no analysis is running
          <div className="w-full">
            <ProteinInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          </div>
        ) : (
          // 3-column layout when analysis is running or complete
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Input and Pipeline */}
            <div className="space-y-8">
              <ProteinInput
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
              />

              {(proteinSequence || isAnalyzing) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <AnalysisPipeline
                    currentStep={currentStep}
                    stages={analysisStages}
                  />
                </motion.div>
              )}
            </div>

            {/* Middle Column - Drug Candidates */}
            <div className="space-y-8">
              <DrugLibraryBrowser
                selectedCompounds={nominatedCompounds}
                onSelectCompound={handleNominateCompound}
                onRemoveCompound={handleRemoveNomination}
              />

              {(analysisJobId || analysisMessage || analysisError) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div
                    className={`rounded-2xl border p-4 ${
                      analysisError
                        ? "border-red-500/40 bg-red-500/10"
                        : "border-emerald-400/40 bg-emerald-500/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-white">
                        {analysisError ? "Analysis Error" : "Inference Job"}
                      </p>
                      {analysisJobId && !analysisError && (
                        <span className="text-xs text-emerald-100">
                          {analysisComplete ? "Complete" : "Processing"}
                        </span>
                      )}
                    </div>
                    {analysisError ? (
                      <p className="text-sm text-red-100">{analysisError}</p>
                    ) : (
                      <>
                        {analysisMessage && (
                          <p className="text-sm text-emerald-50">
                            {analysisMessage}
                          </p>
                        )}
                        {analysisJobId && (
                          <p className="text-xs text-emerald-100/80 font-mono break-all mt-2">
                            Job ID: {analysisJobId}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {analysisComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  <DrugCandidates candidates={drugCandidates} />
                </motion.div>
              )}
            </div>

            {/* Right Column - Visualizations */}
            <div className="space-y-8">
              {proteinSequence && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <MolecularViewer
                    protein={proteinSequence}
                    bindingPocket={bindingPocket}
                  />
                </motion.div>
              )}

              {analysisComplete && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <AffinityVisualization candidates={drugCandidates} />
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
