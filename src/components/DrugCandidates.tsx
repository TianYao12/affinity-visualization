"use client";

import { motion } from "framer-motion";
import {
  Beaker,
  Zap,
  Target,
  TrendingUp,
  Award,
  ChevronRight,
} from "lucide-react";

interface DrugCandidate {
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

interface DrugCandidatesProps {
  candidates: DrugCandidate[];
}

export default function DrugCandidates({ candidates }: DrugCandidatesProps) {
  const getAffinityColor = (pKd: number) => {
    if (pKd >= 8) return "from-green-400 to-emerald-500";
    if (pKd >= 6) return "from-yellow-400 to-orange-500";
    return "from-red-400 to-pink-500";
  };

  const getAffinityLabel = (pKd: number) => {
    if (pKd >= 8) return "High";
    if (pKd >= 6) return "Medium";
    return "Low";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-purple-500/20 rounded-xl">
          <Beaker className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Drug Candidates</h2>
          <p className="text-sm text-gray-400">
            AI-predicted molecular compounds with binding affinity scores
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {candidates.map((candidate, index) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group bg-black/20 rounded-xl p-5 border border-gray-700/30 hover:border-purple-400/30 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                    {candidate.name}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-yellow-400">
                      #{index + 1}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 font-mono mb-1">
                  {candidate.structure}
                </p>
                <p className="text-xs text-gray-500 font-mono mb-2 break-all">
                  {candidate.smiles}
                </p>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                    {candidate.dataset_source}
                  </span>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                    {candidate.binding_site}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
            </div>

            {/* pKd Score */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  Binding Affinity (pKd)
                </span>
                <span
                  className={`text-sm font-semibold bg-gradient-to-r ${getAffinityColor(
                    candidate.pKd
                  )} bg-clip-text text-transparent`}
                >
                  {getAffinityLabel(candidate.pKd)} ({candidate.pKd.toFixed(1)})
                </span>
              </div>
              <div className="relative h-2 bg-gray-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(candidate.pKd / 10) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`h-full bg-gradient-to-r ${getAffinityColor(
                    candidate.pKd
                  )} rounded-full`}
                />
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">RMSE</p>
                  <p className="text-sm font-semibold text-blue-400">
                    {candidate.rmse.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">R² Score</p>
                  <p className="text-sm font-semibold text-green-400">
                    {candidate.r_squared.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Properties */}
            <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
              <div className="bg-gray-800/30 rounded-lg p-2 text-center">
                <p className="text-gray-400">MW</p>
                <p className="text-white font-semibold">
                  {candidate.molecular_weight.toFixed(1)}
                </p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-2 text-center">
                <p className="text-gray-400">LogP</p>
                <p className="text-white font-semibold">
                  {candidate.logP.toFixed(1)}
                </p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-2 text-center">
                <p className="text-gray-400">Conf.</p>
                <p className="text-white font-semibold">
                  {candidate.confidence}%
                </p>
              </div>
            </div>

            {/* Interactions */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-gray-400">Key Interactions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {candidate.interactions.map((interaction, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-full border border-orange-400/30"
                  >
                    {interaction}
                  </span>
                ))}
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="mt-4 pt-4 border-t border-gray-700/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Model Confidence</span>
                <span className="text-xs text-gray-400">
                  {candidate.confidence}%
                </span>
              </div>
              <div className="h-1 bg-gray-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${candidate.confidence}%` }}
                  transition={{ duration: 1.2, delay: index * 0.1 + 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="text-center py-12">
          <Beaker className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No drug candidates generated yet.</p>
          <p className="text-sm text-gray-500">
            Run protein analysis to see predictions.
          </p>
        </div>
      )}
    </motion.div>
  );
}
