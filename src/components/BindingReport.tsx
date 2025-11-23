"use client";

import { motion } from "framer-motion";
import type { BindingPostProcessResult } from "@/types/prediction";
import {
  Loader2,
  Wand2,
  BookOpenText,
  Beaker,
  Bot,
  AlertTriangle,
} from "lucide-react";

interface BindingReportProps {
  report: BindingPostProcessResult | null;
  onGenerate: () => void;
  isLoading: boolean;
  disabled?: boolean;
  sdfPresent: boolean;
}

export default function BindingReport({
  report,
  onGenerate,
  isLoading,
  disabled,
  sdfPresent,
}: BindingReportProps) {
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <Wand2 className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-[0.2em]">
              Post-processing
            </p>
            <h3 className="text-xl font-semibold text-white">
              Binding Affinity Summary
            </h3>
          </div>
        </div>
        <button
          onClick={onGenerate}
          disabled={isLoading || disabled || !sdfPresent}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Building prompt</span>
            </>
          ) : (
            <>
              <BookOpenText className="w-4 h-4" />
              <span>Generate Summary</span>
            </>
          )}
        </button>
      </div>

      {!sdfPresent && (
        <p className="text-sm text-amber-200 bg-amber-500/10 border border-amber-500/40 rounded-xl p-3">
          Paste an SDF first so we can resolve the ligand name via NCBI.
        </p>
      )}

      {report ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-300">
                Protein:{" "}
                <span className="text-white font-semibold">
                  {report.proteinName}
                </span>
              </p>
              <p className="text-sm text-gray-300">
                Ligand:{" "}
                <span className="text-white font-semibold">
                  {report.drugName || "Unresolved (NCBI lookup mock)"}
                </span>
              </p>
              <p className="text-sm text-gray-300">
                pKd:{" "}
                <span className="text-white font-semibold">
                  {report.bindingAffinity.toFixed(2)}
                </span>
              </p>
            </div>
            <Beaker className="w-10 h-10 text-indigo-200" />
          </div>
          <div className="bg-black/30 border border-white/10 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">GPT Prompt Template</p>
            <pre className="text-xs text-indigo-50 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
              {report.prompt}
            </pre>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>
              GPT Messages: {report.gptMessages.length} · NCBI source:{" "}
              {report.ncbiSource}
            </p>
            {report.notes && <p>Note: {report.notes}</p>}
          </div>
        </motion.div>
      ) : (
        <p className="text-sm text-gray-400">
          When ready, this panel will build a GPT prompt that combines your
          protein, predicted affinity, and NCBI-derived ligand name.
        </p>
      )}

      {report?.llmOutput && (
        <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-indigo-100">
            <Bot className="w-4 h-4" />
            <span>
              LLM Output ({report.llmModel || "openai"} · {report.llmSource})
            </span>
          </div>
          <pre className="text-xs text-indigo-50 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
            {report.llmOutput}
          </pre>
        </div>
      )}

      {!report?.llmOutput && report?.llmError && (
        <div className="flex items-center gap-2 text-sm text-amber-200 bg-amber-500/10 border border-amber-500/40 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4" />
          <span>{report.llmError}</span>
        </div>
      )}
    </div>
  );
}
