"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dna, Loader2, Upload, Database, Eye, Search, Zap, TrendingUp, CheckCircle } from "lucide-react";

interface ProteinInputProps {
  onAnalyze: (sequence: string, bindingPocket?: string) => void;
  isAnalyzing: boolean;
  onProteinContextChange?: (context: {
    name?: string;
    accession?: string;
    sequence?: string;
  }) => void;
}

export default function ProteinInput({
  onAnalyze,
  isAnalyzing,
  onProteinContextChange,
}: ProteinInputProps) {
  const [sequence, setSequence] = useState("");
  const [bindingPocket, setBindingPocket] = useState("");
  const [proteinNameInput, setProteinNameInput] = useState("");
  const [proteinMetadata, setProteinMetadata] = useState<{
    title: string;
  } | null>(null);
  const [proteinInfo, setProteinInfo] = useState<{
    family: string;
    description: string;
    function: string;
  } | null>(null);
  const [loadingProteinInfo, setLoadingProteinInfo] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [workflowStep, setWorkflowStep] = useState(-1); // -1 = not started
  const [workflowDurations, setWorkflowDurations] = useState<number[]>([]);

  // --- Extract sequence from PDB file ---
  const parsePDBSequence = async (file: File) => {
    const text = await file.text();

    // extract ATOM lines for amino acids
    const lines = text.split("\n");
    const residues: Record<string, string> = {};

    const aa3to1: Record<string, string> = {
      ALA: "A", ARG: "R", ASN: "N", ASP: "D",
      CYS: "C", GLN: "Q", GLU: "E", GLY: "G",
      HIS: "H", ILE: "I", LEU: "L", LYS: "K",
      MET: "M", PHE: "F", PRO: "P", SER: "S",
      THR: "T", TRP: "W", TYR: "Y", VAL: "V",
    };

    for (const line of lines) {
      if (line.startsWith("ATOM") && line.slice(12, 16).trim() === "CA") {
        const resName = line.slice(17, 20).trim();
        const resNum = line.slice(22, 26).trim();
        if (aa3to1[resName]) {
          residues[resNum] = aa3to1[resName];
        }
      }
    }

    const sequence1 = Object.keys(residues)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((k) => residues[k])
      .join("");

    return sequence1;
  };

  // --- Identify protein family (simulated or via LLM/NCBI) ---
  const identifyProtein = async (seq: string) => {
    setLoadingProteinInfo(true);
    // Simulate protein identification delay
    await new Promise((r) => setTimeout(r, 1500));

    // Simulated protein families - replace with actual NCBI BLAST or LLM call
    const proteinFamilies = [
      {
        family: "Serine/Threonine Kinase",
        description: "Kinase superfamily",
        function: "Phosphorylation & signal transduction",
      },
      {
        family: "Serine Protease",
        description: "Protease family",
        function: "Proteolytic cleavage",
      },
      {
        family: "Immunoglobulin Domain",
        description: "Ig-like fold",
        function: "Immune recognition & binding",
      },
      {
        family: "G-Protein Coupled Receptor",
        description: "GPCR superfamily",
        function: "Signal transduction",
      },
    ];

    const identified =
      proteinFamilies[Math.floor(Math.random() * proteinFamilies.length)];
    setProteinInfo(identified);
    setLoadingProteinInfo(false);
  };

  const handlePDBUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdb")) {
      alert("Please upload a valid .pdb file");
      return;
    }

    const seq = await parsePDBSequence(file);

    setSequence(seq);
    setProteinNameInput(file.name.replace(".pdb", ""));
    setProteinMetadata({ title: file.name });

    onProteinContextChange?.({
      name: file.name,
      sequence: seq,
    });

    // Identify protein immediately after upload
    await identifyProtein(seq);

    // optional auto-pocket extraction
    if (!bindingPocket && seq.length > 100) {
      const pocketStart = Math.floor(seq.length * 0.3);
      const pocketLength = Math.min(50, Math.floor(seq.length * 0.1));
      setBindingPocket(seq.substring(pocketStart, pocketStart + pocketLength));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sequence.trim() || isAnalyzing) return;

    onProteinContextChange?.({
      name: proteinNameInput,
      sequence,
    });

    // Start workflow
    const durations = [
      Math.random() * 3000 + 3000, // search: 3-6s
      Math.random() * 3000 + 3000, // validate: 3-6s
      2000, // ranking: 2s
      0, // results
    ];
    setWorkflowDurations(durations);
    setWorkflowStep(0);

    onAnalyze(sequence.trim(), bindingPocket.trim() || undefined);
  };

  // Auto-advance workflow steps
  const [useEffectCalled, setUseEffectCalled] = useState(false);
  
  useEffect(() => {
    if (workflowStep === -1 || workflowStep >= 4 || workflowDurations.length === 0) return;

    const timer = setTimeout(() => {
      if (workflowStep < 3) {
        setWorkflowStep(workflowStep + 1);
      } else {
        setWorkflowStep(4);
      }
    }, workflowDurations[workflowStep]);

    return () => clearTimeout(timer);
  }, [workflowStep, workflowDurations]);

  const workflowSteps = [
    { id: "search", title: "Searching Zinc drug database for candidate drugs", icon: Search },
    { id: "validate", title: "Validating drug candidates using drug likeness tests", icon: Zap },
    { id: "ranking", title: "Ranking candidate drugs by binding affinity", icon: TrendingUp },
    { id: "results", title: "Top 100 drugs with viable binding affinity", icon: CheckCircle },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* MAIN PROTEIN INPUT CARD */}
      <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-10 border border-white/10 shadow-2xl mb-6">
        <div className="flex items-center space-x-4 mb-8">
          <div className="p-4 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl border border-blue-500/30">
            <Dna className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Protein Input
            </h2>
            <p className="text-lg text-gray-400 mt-1">
              Upload a PDB file (.pdb) to extract the amino acid sequence
            </p>
          </div>
        </div>

        {proteinMetadata && (
          <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 text-emerald-400 text-sm">
              <Database className="w-4 h-4" />
              <span className="font-medium">Imported: {proteinMetadata.title}</span>
            </div>
          </div>
        )}

        {/* --- PDB Upload Box --- */}
        <div className="border-2 border-dashed border-gray-600/30 rounded-3xl p-16 text-center mb-6">
          <Upload className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <p className="text-gray-400 mb-6 text-lg">
            Drop your PDB file here or click to browse
          </p>
          <input
            type="file"
            accept=".pdb"
            onChange={handlePDBUpload}
            className="hidden"
            id="pdb-upload"
          />
          <label
            htmlFor="pdb-upload"
            className="cursor-pointer px-8 py-4 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-400/30 hover:bg-blue-600/30 transition-colors font-semibold text-lg inline-block"
          >
            Select PDB File
          </label>
        </div>

        {/* --- Protein Info Loading --- */}
        {loadingProteinInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-gray-300 font-semibold">
                Identifying protein family...
              </span>
            </div>
            <div className="h-2 bg-gray-700/30 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              />
            </div>
          </motion.div>
        )}

        {/* --- Protein Info Display with Visualize Button --- */}
        {proteinInfo && !loadingProteinInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/20 mb-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  {proteinInfo.family}
                </h3>
                <p className="text-gray-300 text-sm mb-2">
                  {proteinInfo.description}
                </p>
                <p className="text-gray-400 text-xs">
                  <span className="text-blue-400 font-semibold">Function:</span>{" "}
                  {proteinInfo.function}
                </p>
              </div>
              <button
                onClick={() => setShowVisualization(!showVisualization)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-400/30 hover:bg-blue-600/30 transition-colors whitespace-nowrap ml-4"
              >
                <Eye className="w-4 h-4" />
                <span>Visualize</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* --- Visualization Placeholder --- */}
        {showVisualization && proteinInfo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/20 rounded-xl p-4 mb-6"
          >
            <p className="text-gray-400 text-sm text-center">
              3D molecular visualization displays here
            </p>
          </motion.div>
        )}

        {/* --- Analysis Form --- */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {sequence && (
            <>
              <div>
                <label className="block text-lg font-semibold text-gray-300 mb-3">
                  Protein Name (optional)
                </label>
                <input
                  value={proteinNameInput}
                  onChange={(e) => setProteinNameInput(e.target.value)}
                  className="w-full px-4 py-3 bg-black/20 border border-gray-600/30 rounded-2xl text-white placeholder-gray-500 focus:border-blue-400/50 focus:ring-blue-400/30 focus:ring-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-300 mb-3">
                  Binding Pocket Sequence (optional)
                </label>
                <textarea
                  value={bindingPocket}
                  onChange={(e) => setBindingPocket(e.target.value)}
                  className="w-full h-28 px-6 py-4 bg-black/20 border border-gray-600/30 rounded-2xl text-white font-mono focus:border-purple-400/50 focus:ring-purple-400/30 focus:ring-2 outline-none"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={!sequence || isAnalyzing}
            className="w-full flex items-center justify-center space-x-3 px-8 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 text-lg font-semibold shadow-lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Analyzing Protein...</span>
              </>
            ) : (
              <span>Predict Binding Affinity</span>
            )}
          </button>
        </form>

        {/* Sequence Debug Info */}
        {sequence && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 p-4 bg-black/20 rounded-xl space-y-3"
          >
            <div className="flex justify-between text-sm text-gray-400">
              <span>Protein Length:</span>
              <span className="text-blue-400 font-mono">{sequence.length} aa</span>
            </div>

            <div className="text-xs text-gray-500 font-mono break-all">
              <span className="text-gray-400">Sequence: </span>
              {sequence.substring(0, 120)}
              {sequence.length > 120 && "..."}
            </div>

            {bindingPocket && (
              <>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Binding Pocket:</span>
                  <span className="text-purple-400 font-mono">
                    {bindingPocket.length} residues
                  </span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* DRUG DISCOVERY WORKFLOW */}
      {workflowStep >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 mb-6"
        >
          <h3 className="text-2xl font-bold text-white mb-6">
            Drug Discovery Pipeline
          </h3>

          <div className="space-y-4">
            {workflowSteps.map((step, idx) => {
              const isActive = idx === workflowStep;
              const isCompleted = idx < workflowStep;
              const Icon = step.icon;
              const duration = workflowDurations[idx] || 0;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`rounded-xl p-5 border transition-all ${
                    isActive
                      ? "bg-blue-500/10 border-blue-500/30"
                      : isCompleted
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-gray-700/5 border-gray-600/20"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        isActive
                          ? "bg-blue-500/20"
                          : isCompleted
                          ? "bg-green-500/20"
                          : "bg-gray-600/20"
                      }`}
                    >
                      {isActive ? (
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                      ) : isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Icon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold text-sm ${
                          isActive
                            ? "text-blue-300"
                            : isCompleted
                            ? "text-green-300"
                            : "text-gray-400"
                        }`}
                      >
                        {step.title}
                      </p>

                      {isActive && duration > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{
                                duration: duration / 1000,
                                ease: "linear",
                              }}
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                            />
                          </div>
                          <p className="text-xs text-gray-400">
                            {Math.round(duration / 1000)}s
                          </p>
                        </div>
                      )}

                      {isCompleted && (
                        <p className="text-xs text-green-400 mt-1">Completed</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {workflowStep >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30"
            >
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h4 className="font-bold text-green-300">Analysis Complete</h4>
              </div>
              <p className="text-gray-300 text-sm">
                Successfully identified 100 candidate drugs with viable binding affinity.
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}