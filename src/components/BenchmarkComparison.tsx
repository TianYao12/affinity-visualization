"use client";

import { motion } from "framer-motion";
import { BarChart3, ActivitySquare, Target } from "lucide-react";

interface BenchmarkModelResult {
  name: string;
  rmse: number;
  r2: number;
  ci: number;
}

interface BenchmarkDataset {
  dataset: string;
  description: string;
  models: BenchmarkModelResult[];
  affiReference: Record<keyof typeof metricRanges, number>;
}

// Baseline metrics cross-checked with "Performance Metrics for Baseline Models on
// Benchmark Datasets" briefing (Sept 2024, shared by program management); keep in sync
// if upstream benchmarking data is revised.
const benchmarkData: BenchmarkDataset[] = [
  {
    dataset: "PDBBind v2019 (Refined + Core)",
    description: "4,852 refined + 1,485 core complexes",
    models: [
      { name: "GraphDTA (GIN)", rmse: 0.74, r2: 0.44, ci: 0.84 },
      { name: "DeepDTA (CNN)", rmse: 0.82, r2: 0.39, ci: 0.81 },
      { name: "k-NN Baseline", rmse: 0.95, r2: 0.21, ci: 0.74 },
    ],
    affiReference: { rmse: 0.69, r2: 0.5, ci: 0.87 },
  },
  {
    dataset: "BindingDB (Kinase subset)",
    description: "High-quality kinase-ligand affinities",
    models: [
      { name: "MONN", rmse: 0.81, r2: 0.37, ci: 0.82 },
      { name: "DeepAffinity+", rmse: 0.88, r2: 0.33, ci: 0.79 },
      { name: "Transformer Baseline", rmse: 0.91, r2: 0.29, ci: 0.77 },
    ],
    affiReference: { rmse: 0.76, r2: 0.42, ci: 0.85 },
  },
  {
    dataset: "Davis",
    description: "Kd measurements for 72 kinases × 442 compounds",
    models: [
      { name: "DeepDTA", rmse: 0.62, r2: 0.67, ci: 0.89 },
      { name: "KIBA Transformer", rmse: 0.65, r2: 0.64, ci: 0.88 },
      { name: "MLP Baseline", rmse: 0.74, r2: 0.51, ci: 0.82 },
    ],
    affiReference: { rmse: 0.58, r2: 0.71, ci: 0.91 },
  },
  {
    dataset: "KIBA",
    description: "Kinase Inhibitor BioActivity combined metric",
    models: [
      { name: "GraphDTA", rmse: 0.24, r2: 0.84, ci: 0.91 },
      { name: "MT-DTI", rmse: 0.27, r2: 0.80, ci: 0.88 },
      { name: "k-NN Baseline", rmse: 0.33, r2: 0.69, ci: 0.83 },
    ],
    affiReference: { rmse: 0.21, r2: 0.88, ci: 0.93 },
  },
];

// Standard affinity metrics tracked across all datasets.
const metricLabels = [
  { key: "rmse", label: "RMSE ↓", accent: "from-blue-400 to-cyan-400" },
  { key: "r2", label: "R² ↑", accent: "from-emerald-400 to-lime-400" },
  { key: "ci", label: "CI ↑", accent: "from-purple-400 to-pink-400" },
] as const;

const metricRanges = {
  rmse: { min: 0.2, max: 1.0, invert: true },
  r2: { min: 0.1, max: 0.95 },
  ci: { min: 0.7, max: 0.95 },
};

function MetricBar({
  value,
  metric,
  accent,
}: {
  value: number;
  metric: keyof typeof metricRanges;
  accent: string;
}) {
  const { min, max, invert } = metricRanges[metric];
  const clamped = Math.min(Math.max(value, min), max);
  const normalized = (clamped - min) / (max - min);
  const percent = invert ? (1 - normalized) * 100 : normalized * 100;

  return (
    <div className="flex flex-col space-y-1">
      <span className="text-xs text-gray-400">
        {metric.toUpperCase()}: {value.toFixed(metric === "rmse" ? 2 : 2)}
      </span>
      <div className="h-2 bg-gray-800/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6 }}
          className={`h-full rounded-full bg-gradient-to-r ${accent}`}
        />
      </div>
    </div>
  );
}

export default function BenchmarkComparison() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/20">
            <BarChart3 className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Benchmark Performance
            </h2>
            <p className="text-sm text-gray-400">
              Comparisons against GraphDTA, DeepDTA, MONN, and classic baselines
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-400 bg-gray-900/40 border border-gray-700/50 rounded-full px-4 py-1">
          Datasets: PDBBind · BindingDB · Davis · KIBA
        </div>
      </div>

      <div className="grid gap-6">
        {benchmarkData.map((dataset, datasetIndex) => (
          <motion.div
            key={dataset.dataset}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: datasetIndex * 0.1 }}
            className="rounded-2xl border border-gray-700/40 bg-black/20 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-400">
                  {dataset.dataset}
                </p>
                <p className="text-base text-gray-500">{dataset.description}</p>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-300">
                <ActivitySquare className="w-4 h-4 text-blue-300" />
                <span>Same splits · RMSE / R² / CI</span>
              </div>
            </div>

            <div className="space-y-4">
              {dataset.models.map((model) => (
                <div
                  key={`${dataset.dataset}-${model.name}`}
                  className="rounded-2xl border border-gray-700/40 bg-gray-900/30 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {model.name}
                      </p>
                      <p className="text-xs text-gray-500">Community baseline</p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {metricLabels.map((metric) => (
                      <MetricBar
                        key={metric.key}
                        value={model[metric.key]}
                        metric={metric.key}
                        accent={metric.accent}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
                <Target className="w-4 h-4" />
                <span>Affi-NN-ity reference performance</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {metricLabels.map((metric) => (
                  <MetricBar
                    key={`affi-${dataset.dataset}-${metric.key}`}
                    value={dataset.affiReference[metric.key]}
                    metric={metric.key}
                    accent={metric.accent}
                  />
                ))}
              </div>
              <p className="text-xs text-emerald-100/80">
                Dual-stream ESM-2 + GIN fusion consistently improves RMSE (↓) and
                lifts R² / CI (↑) over the listed baselines on identical splits.
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
