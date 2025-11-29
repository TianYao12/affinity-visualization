"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Play,
  Settings2,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  FileText,
  Beaker,
} from "lucide-react";
import type { ScreeningConfig, ScreenedDrug, ScreeningResult } from "@/types/prediction";

interface DrugScreeningProps {
  pdbContent: string;
  onScreeningComplete: (result: ScreeningResult) => void;
  disabled?: boolean;
}

const CANDIDATE_OPTIONS = [
  { value: 50000, label: "50K", description: "Fast screening" },
  { value: 100000, label: "100K", description: "Balanced" },
  { value: 200000, label: "200K", description: "Comprehensive" },
] as const;

export default function DrugScreening({
  pdbContent,
  onScreeningComplete,
  disabled = false,
}: DrugScreeningProps) {
  const [config, setConfig] = useState<ScreeningConfig>({
    candidateCount: 50000,
    topN: 10,
    minBindingAffinity: 6.0,
  });
  const [isScreening, setIsScreening] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleStartScreening = useCallback(async () => {
    if (!pdbContent.trim()) {
      setError("Please upload a PDB file first.");
      return;
    }

    setIsScreening(true);
    setProgress(0);
    setError(null);
    setResult(null);
    setProgressMessage("Loading drug candidates from database...");

    try {
      // Step 1: Load drugs from CSV
      setProgress(10);
      const drugsResponse = await fetch(
        `/api/drug-csv?limit=${config.candidateCount}`
      );
      
      if (!drugsResponse.ok) {
        const errData = await drugsResponse.json();
        throw new Error(errData.error || "Failed to load drug candidates.");
      }

      const drugsData = await drugsResponse.json();
      setProgressMessage(
        `Loaded ${drugsData.count.toLocaleString()} candidates. Starting binding affinity screening...`
      );
      setProgress(30);

      // Step 2: Screen drugs against protein
      setProgressMessage("Running binding affinity predictions...");
      const screenResponse = await fetch("/api/screen-binding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdb: pdbContent,
          drugs: drugsData.drugs,
          topN: config.topN,
          minBindingAffinity: config.minBindingAffinity,
        }),
      });

      setProgress(80);

      if (!screenResponse.ok) {
        const errData = await screenResponse.json();
        throw new Error(errData.error || "Binding affinity screening failed.");
      }

      const screenData = await screenResponse.json() as ScreeningResult;
      setProgress(100);
      setProgressMessage("Screening complete!");
      setResult(screenData);
      onScreeningComplete(screenData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Screening failed.");
    } finally {
      setIsScreening(false);
    }
  }, [pdbContent, config, onScreeningComplete]);

  const hasPdb = pdbContent.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
          <Database className="w-6 h-6 text-purple-200" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">
            Drug Candidate Screening
          </h2>
          <p className="text-sm text-gray-400">
            Screen ~227K ZINC compounds ranked by QED against your protein
          </p>
        </div>
      </div>

      {/* PDB Status */}
      <div className="mb-6">
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border ${
            hasPdb
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-amber-500/40 bg-amber-500/10"
          }`}
        >
          <FileText
            className={`w-4 h-4 ${
              hasPdb ? "text-emerald-300" : "text-amber-300"
            }`}
          />
          <span
            className={`text-sm ${
              hasPdb ? "text-emerald-100" : "text-amber-100"
            }`}
          >
            {hasPdb
              ? `PDB loaded (${pdbContent.split("\n").length} lines)`
              : "Upload PDB file in left panel to begin screening"}
          </span>
        </div>
      </div>

      {/* Candidate Count Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Drug Candidates to Screen
        </label>
        <div className="grid grid-cols-3 gap-3">
          {CANDIDATE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() =>
                setConfig((prev) => ({ ...prev, candidateCount: option.value }))
              }
              disabled={isScreening}
              className={`p-3 rounded-xl border text-center transition-all ${
                config.candidateCount === option.value
                  ? "border-purple-400/60 bg-purple-500/20 text-purple-100"
                  : "border-gray-600/50 bg-gray-800/30 text-gray-400 hover:border-gray-500/60 hover:text-gray-300"
              } ${isScreening ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="text-lg font-bold">{option.label}</div>
              <div className="text-xs opacity-80">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-4"
      >
        <Settings2 className="w-4 h-4" />
        <span>Advanced Settings</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            showAdvanced ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Advanced Settings Panel */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 space-y-4 overflow-hidden"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Top N Results to Return
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={config.topN}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    topN: Math.max(1, Math.min(100, Number(e.target.value) || 10)),
                  }))
                }
                disabled={isScreening}
                className="w-full px-4 py-2 rounded-xl bg-black/30 border border-gray-700/60 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of top-ranked drug candidates to display (1-100)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Minimum Binding Affinity (pKd)
              </label>
              <input
                type="number"
                min={0}
                max={15}
                step={0.1}
                value={config.minBindingAffinity}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    minBindingAffinity: Math.max(
                      0,
                      Math.min(15, Number(e.target.value) || 6)
                    ),
                  }))
                }
                disabled={isScreening}
                className="w-full px-4 py-2 rounded-xl bg-black/30 border border-gray-700/60 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
              <p className="text-xs text-gray-500 mt-1">
                Only show candidates with pKd ≥ this threshold (0-15)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      {isScreening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">{progressMessage}</span>
            <span className="text-sm text-purple-300">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 p-3 flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-red-100">{error}</span>
        </motion.div>
      )}

      {/* Start Button */}
      <button
        onClick={handleStartScreening}
        disabled={isScreening || disabled || !hasPdb}
        className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
          isScreening || disabled || !hasPdb
            ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg shadow-purple-500/20"
        }`}
      >
        {isScreening ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Screening in Progress...</span>
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            <span>Start Drug Screening</span>
          </>
        )}
      </button>

      {/* Results Display */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 border-t border-gray-700/50 pt-6"
        >
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-800/40 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">
                {result.totalScreened.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Total Screened</div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-emerald-300">
                {result.passedThreshold.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Passed Threshold</div>
            </div>
            <div className="bg-slate-800/40 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-purple-300">
                {(result.processingTimeMs / 1000).toFixed(1)}s
              </div>
              <div className="text-xs text-gray-400">Processing Time</div>
            </div>
          </div>

          {/* Top Candidates List */}
          <div className="flex items-center gap-2 mb-3">
            <Beaker className="w-4 h-4 text-emerald-300" />
            <span className="text-sm font-medium text-gray-300">
              Top {result.topCandidates.length} Candidates
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {result.topCandidates.map((drug, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-black/20 border border-gray-700/40 rounded-xl p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                        #{drug.rank}
                      </span>
                      <span className="text-xs text-emerald-300">
                        pKd: {drug.bindingAffinity.toFixed(2)}
                      </span>
                      <span className="text-xs text-blue-300">
                        QED: {drug.qed.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono break-all">
                      {drug.smiles}
                    </p>
                    {(drug.mw || drug.logP) && (
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        {drug.mw && <span>MW: {drug.mw.toFixed(1)}</span>}
                        {drug.logP && <span>logP: {drug.logP.toFixed(2)}</span>}
                      </div>
                    )}
                  </div>
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
