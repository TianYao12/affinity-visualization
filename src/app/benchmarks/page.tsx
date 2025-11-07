import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BenchmarkComparison from "@/components/BenchmarkComparison";

export default function BenchmarksPage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900" />
      <div className="absolute inset-0 bg-molecular-pattern opacity-20" />

      <div className="relative z-10 container mx-auto px-6 py-12 space-y-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Benchmarks
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-2">
              Comparative Model Performance
            </h1>
            <p className="text-base md:text-lg text-slate-300 mt-4 max-w-2xl">
              Explore how Affi-NN-ity stacks up against GraphDTA, DeepDTA, MONN,
              and classical baselines across PDBBind, BindingDB, Davis, and KIBA
              datasets. Metrics are harmonized using shared splits for a
              consistent view of RMSE, R², and Concordance Index.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center space-x-2 rounded-full border border-white/30 px-5 py-2 text-sm font-medium text-white transition hover:border-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Analysis</span>
          </Link>
        </div>

        <div className="mb-6">
          <BenchmarkComparison />
        </div>
      </div>
    </main>
  );
}
