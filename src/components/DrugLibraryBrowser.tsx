"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Search,
  RefreshCw,
  PlusCircle,
  CheckCircle,
  Trash2,
  FlaskConical,
} from "lucide-react";
import type { DrugLibrarySelection } from "@/types/prediction";
import type { DrugLibraryCompound } from "@/lib/drugLibrary";

interface DrugLibraryBrowserProps {
  selectedCompounds: DrugLibrarySelection[];
  onSelectCompound: (compound: DrugLibrarySelection) => void;
  onRemoveCompound: (compoundId: string) => void;
  defaultQuery?: string;
}

const SOURCE_OPTIONS = [
  {
    value: "chembl",
    label: "ChEMBL",
    description: "FDA-approved + clinical pipeline small molecules",
  },
] as const;

const DEFAULT_QUERY = "HIV protease inhibitor";

export default function DrugLibraryBrowser({
  selectedCompounds,
  onSelectCompound,
  onRemoveCompound,
  defaultQuery = DEFAULT_QUERY,
}: DrugLibraryBrowserProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [source, setSource] = useState<(typeof SOURCE_OPTIONS)[number]["value"]>(
    SOURCE_OPTIONS[0].value
  );
  const [results, setResults] = useState<DrugLibraryCompound[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelected = useCallback(
    (compoundId: string) =>
      selectedCompounds.some((compound) => compound.id === compoundId),
    [selectedCompounds]
  );

  const handleSearch = useCallback(
    async (searchQuery?: string, overrideSource?: string) => {
      const nextQuery = searchQuery ?? query;
      const sourceToUse = overrideSource ?? source;
      if (!nextQuery.trim()) {
        setError("Enter a keyword, disease, or target to search.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          query: nextQuery,
          source: sourceToUse,
          limit: "25",
        });
        const response = await fetch(`/api/drug-library?${params.toString()}`);

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(
            payload?.error || `Search failed (${response.status}).`
          );
        }

        const data = await response.json();
        setResults(data.compounds ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to query drug nomination database."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [query, source]
  );

  useEffect(() => {
    handleSearch(defaultQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queuedCount = selectedCompounds.length;
  const queueLimit = 12;

  const selectedIds = useMemo(
    () => new Set(selectedCompounds.map((compound) => compound.id)),
    [selectedCompounds]
  );

  const handleSelect = (compound: DrugLibraryCompound) => {
    if (selectedIds.has(compound.id) || !compound.smiles) {
      return;
    }

    if (queuedCount >= queueLimit) {
      setError(`Queue limit reached (${queueLimit} compounds).`);
      return;
    }

    onSelectCompound({
      id: compound.id,
      sourceCompoundId: compound.sourceCompoundId,
      name: compound.name,
      smiles: compound.smiles,
      source: compound.source,
      molecularWeight: compound.molecularWeight,
      alogp: compound.alogp,
      psa: compound.psa,
      hba: compound.hba,
      hbd: compound.hbd,
      ro5Violations: compound.ro5Violations,
      maxPhase: compound.maxPhase ?? null,
      inchikey: compound.inchikey ?? null,
      formula: compound.formula ?? null,
      sourceUrl: compound.sourceUrl,
      dataset: compound.dataset,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 h-full flex flex-col"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-slate-500/20 rounded-xl">
          <Database className="w-6 h-6 text-slate-200" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">
            Drug Nomination Database
          </h2>
          <p className="text-sm text-gray-400">
            Pull candidate compounds (SMILES) from ChEMBL & queue for inference
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g., HIV reverse transcriptase, protease inhibitor, EGFR"
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/30 border border-gray-700/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold flex items-center justify-center space-x-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Searching</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>Source:</span>
          <div className="flex gap-2">
            {SOURCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSource(option.value);
                  handleSearch(query, option.value);
                }}
                className={`px-3 py-1 rounded-full border text-xs transition ${
                  source === option.value
                    ? "border-emerald-400/60 text-emerald-100 bg-emerald-500/10"
                    : "border-gray-600/60 text-gray-400 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100"
        >
          {error}
        </motion.div>
      )}

      <div className="mt-5 flex-1 overflow-hidden flex flex-col space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Results:{" "}
            <strong className="text-white">{results.length}</strong> · Queue:{" "}
            <strong className="text-white">
              {queuedCount}/{queueLimit}
            </strong>
          </span>
          <span className="uppercase text-xs tracking-wide text-gray-500">
            {source.toUpperCase()}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {results.map((compound) => {
            const queued = isSelected(compound.id);
            const smilesMissing = !compound.smiles;
            const disableSelection = queued || smilesMissing;

            return (
              <motion.div
                key={compound.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="border border-gray-700/40 rounded-xl p-3 bg-black/20"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white text-sm font-semibold">
                        {compound.name}
                      </p>
                      {compound.maxPhase !== null &&
                        compound.maxPhase !== undefined && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-500/40">
                            Phase {compound.maxPhase}
                          </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono break-all mb-2">
                      {compound.smiles || "SMILES unavailable"}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-300">
                      <div>
                        <p className="text-gray-500 text-[10px]">MW</p>
                        <p>{compound.molecularWeight ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px]">AlogP</p>
                        <p>{compound.alogp ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px]">RO5</p>
                        <p>{compound.ro5Violations ?? 0}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelect(compound)}
                    disabled={disableSelection}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition ${
                      queued
                        ? "border-emerald-500/50 text-emerald-200 bg-emerald-500/10"
                        : smilesMissing
                        ? "border-gray-600/50 text-gray-500"
                        : "border-purple-500/50 text-purple-200 hover:bg-purple-500/10"
                    }`}
                  >
                    {queued ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        Queued
                      </>
                    ) : smilesMissing ? (
                      "No SMILES"
                    ) : (
                      <>
                        <PlusCircle className="w-3 h-3" />
                        Nominate
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {selectedCompounds.length > 0 && (
        <div className="mt-6 border-t border-gray-700/50 pt-4">
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-300">
            <FlaskConical className="w-4 h-4 text-emerald-300" />
            <span>Queued for binding affinity inference</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCompounds.map((compound) => (
              <span
                key={compound.id}
                className="flex items-center gap-2 text-xs bg-emerald-500/10 border border-emerald-400/40 text-emerald-100 px-3 py-1 rounded-full"
              >
                {compound.name}
                <button
                  onClick={() => onRemoveCompound(compound.id)}
                  className="text-emerald-200 hover:text-white"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
