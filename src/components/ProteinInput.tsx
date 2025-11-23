"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dna, Loader2, Upload, Database } from "lucide-react";

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

    onAnalyze(sequence.trim(), bindingPocket.trim() || undefined);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-4xl mx-auto bg-white/5 backdrop-blur-lg rounded-3xl p-10 border border-white/10 shadow-2xl"
    >
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

      {/* --- PDB Upload Box ONLY --- */}
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
    </motion.div>
  );
}
