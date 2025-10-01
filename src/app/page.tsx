'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
  Sparkles
} from 'lucide-react'
import ProteinInput from '@/components/ProteinInput'
import DrugCandidates from '@/components/DrugCandidates'
import AffinityVisualization from '@/components/AffinityVisualization'
import MolecularViewer from '@/components/MolecularViewer'
import AnalysisPipeline from '@/components/AnalysisPipeline'

export default function Home() {
  const [proteinSequence, setProteinSequence] = useState('')
  const [bindingPocket, setBindingPocket] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [drugCandidates, setDrugCandidates] = useState<any[]>([])
  const [currentStep, setCurrentStep] = useState<'input' | 'analysis' | 'prediction' | 'complete'>('input')

  const handleAnalyze = async (sequence: string, pocket?: string) => {
    setProteinSequence(sequence)
    setBindingPocket(pocket || '')
    setIsAnalyzing(true)
    setAnalysisComplete(false)
    setCurrentStep('analysis')
    
    // Simulate Affi-NN-ity pipeline steps
    // Step 1: ESM-2 Protein Embedding
    await new Promise(resolve => setTimeout(resolve, 800))
    setCurrentStep('prediction')
    
    // Step 2: Graph Neural Network Processing
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Step 3: ChemGAN Generation & Binding Affinity Prediction
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    // Realistic drug candidates based on PDBBind dataset characteristics
    const mockCandidates = [
      {
        id: 1,
        name: "ChemGAN-Generated Compound 1",
        smiles: "CC1=C(C=CC(=C1)C(=O)NC2=CC=C(C=C2)CN3CCN(CC3)C)OC",
        structure: "C₂₂H₂₆N₄O₃",
        pKd: 8.7, // Converted from experimental Kd
        rmse: 0.69, // Your model's RMSE
        r_squared: 0.50, // Your model's R²
        confidence: 94,
        molecular_weight: 394.47,
        logP: 3.2,
        interactions: ["π-π stacking", "H-bond (Asp181)", "Hydrophobic (Leu83)", "Van der Waals"],
        dataset_source: "PDBBind v2019",
        binding_site: pocket ? "Custom pocket" : "Site 1 (residues 78-95, 180-195)"
      },
      {
        id: 2,
        name: "ChemGAN-Generated Compound 2", 
        smiles: "COC1=CC=C(C=C1)C2=NC(=NC=C2)NC3=CC=C(C=C3)N4CCN(CC4)C",
        structure: "C₂₁H₂₄N₄O₂",
        pKd: 7.3,
        rmse: 0.72,
        r_squared: 0.48,
        confidence: 87,
        molecular_weight: 364.44,
        logP: 2.8,
        interactions: ["H-bond (Ser195)", "Electrostatic (Arg145)", "Hydrophobic pocket"],
        dataset_source: "PDBBind v2019",
        binding_site: pocket ? "Custom pocket" : "Site 2 (residues 140-160)"
      },
      {
        id: 3,
        name: "ChemGAN-Generated Compound 3",
        smiles: "CN1CCN(CC1)C2=CC=C(C=C2)NC(=O)C3=CC=C(C=C3)F",
        structure: "C₁₈H₂₀FN₃O",
        pKd: 6.9,
        rmse: 0.75,
        r_squared: 0.45,
        confidence: 82,
        molecular_weight: 313.37,
        logP: 2.1,
        interactions: ["H-bond network", "Fluorine interaction", "Aromatic stacking"],
        dataset_source: "PDBBind refined set",
        binding_site: pocket ? "Custom pocket" : "Site 1 (alternative pose)"
      },
      {
        id: 4,
        name: "ChemGAN-Generated Compound 4",
        smiles: "CC(C)NCC(C1=CC(=C(C=C1)O)CO)O",
        structure: "C₁₂H₁₉NO₃",
        pKd: 6.2,
        rmse: 0.81,
        r_squared: 0.42,
        confidence: 78,
        molecular_weight: 225.29,
        logP: 1.4,
        interactions: ["H-bond (Tyr264)", "OH-π interaction", "Weak hydrophobic"],
        dataset_source: "PDBBind general set",
        binding_site: pocket ? "Custom pocket" : "Allosteric site"
      }
    ]
    
    setDrugCandidates(mockCandidates)
    setCurrentStep('complete')
    setIsAnalyzing(false)
    setAnalysisComplete(true)
  }

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
              Dual-stream architecture combining <span className="font-semibold text-blue-300">Graph Neural Networks</span> for molecules with <span className="font-semibold text-indigo-300">ESM-2 protein language models</span>. 
              Trained on <span className="font-semibold text-emerald-300">PDBBind v2019 dataset</span> with <span className="font-semibold text-amber-300">ChemGAN</span> molecular generation pipeline.
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
                  <div className="text-sm font-medium text-slate-400">Root Mean Square Error</div>
                  <div className="text-lg font-semibold text-slate-200">RMSE: 0.69</div>
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
                  <div className="text-sm font-medium text-slate-400">Coefficient of Determination</div>
                  <div className="text-lg font-semibold text-slate-200">R²: 0.50</div>
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
                  <div className="text-sm font-medium text-slate-400">Training Dataset</div>
                  <div className="text-lg font-semibold text-slate-200">PDBBind v2019</div>
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
              University of Waterloo | WAT.ai Research Initiative | Borealis AI Let&apos;s SOLVE It Program
            </p>
          </motion.div>
        </motion.div>

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
                  proteinSequence ? 'opacity-100' : 'opacity-60'
                }`}
              >
                <div className={`relative p-4 rounded-xl transition-all duration-500 ${
                  proteinSequence 
                    ? 'bg-slate-700/30 border border-emerald-400/30 shadow-lg' 
                    : 'bg-slate-800/20 border border-slate-600/30'
                }`}>
                  <Microscope className={`w-8 h-8 relative z-10 transition-colors duration-300 ${
                    proteinSequence ? 'text-emerald-300' : 'text-slate-400'
                  }`} />
                </div>
                <div className="text-center">
                  <div className={`font-medium transition-colors duration-300 ${
                    proteinSequence ? 'text-white' : 'text-slate-400'
                  }`}>Protein Input</div>
                  <div className={`text-xs mt-1 transition-colors duration-300 ${
                    proteinSequence ? 'text-slate-300' : 'text-slate-500'
                  }`}>ESM-2 Embedding</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center space-x-2"
              >
                <ArrowRight className="w-5 h-5 text-slate-300/80" />
                <div className="w-8 h-px bg-slate-400/60"></div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex flex-col items-center space-y-3 transition-all duration-300 ${
                  isAnalyzing ? 'opacity-100' : analysisComplete ? 'opacity-100' : 'opacity-60'
                }`}
              >
                <div className={`relative p-4 rounded-xl transition-all duration-500 ${
                  isAnalyzing 
                    ? 'bg-slate-700/30 border border-amber-400/30 shadow-lg' 
                    : analysisComplete 
                    ? 'bg-slate-700/30 border border-blue-400/30 shadow-lg'
                    : 'bg-slate-800/20 border border-slate-600/30'
                }`}>
                  <Activity className={`w-8 h-8 relative z-10 transition-colors duration-300 ${
                    isAnalyzing ? 'text-amber-300' : analysisComplete ? 'text-blue-300' : 'text-slate-400'
                  }`} />
                </div>
                <div className="text-center">
                  <div className={`font-medium transition-colors duration-300 ${
                    isAnalyzing ? 'text-amber-300' : analysisComplete ? 'text-white' : 'text-slate-400'
                  }`}>ML Analysis</div>
                  <div className={`text-xs mt-1 transition-colors duration-300 ${
                    isAnalyzing ? 'text-amber-200' : analysisComplete ? 'text-slate-300' : 'text-slate-500'
                  }`}>GNN + ChemGAN</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="flex items-center space-x-2"
              >
                <ArrowRight className="w-5 h-5 text-slate-300/80" />
                <div className="w-8 h-px bg-slate-400/60"></div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex flex-col items-center space-y-3 transition-all duration-300 ${
                  analysisComplete ? 'opacity-100' : 'opacity-60'
                }`}
              >
                <div className={`relative p-4 rounded-xl transition-all duration-500 ${
                  analysisComplete 
                    ? 'bg-slate-700/30 border border-emerald-400/30 shadow-lg' 
                    : 'bg-slate-800/20 border border-slate-600/30'
                }`}>
                  <Zap className={`w-8 h-8 relative z-10 transition-colors duration-300 ${
                    analysisComplete ? 'text-emerald-300' : 'text-slate-400'
                  }`} />
                </div>
                <div className="text-center">
                  <div className={`font-medium transition-colors duration-300 ${
                    analysisComplete ? 'text-white' : 'text-slate-400'
                  }`}>Results</div>
                  <div className={`text-xs mt-1 transition-colors duration-300 ${
                    analysisComplete ? 'text-slate-300' : 'text-slate-500'
                  }`}>pKd Predictions</div>
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
                    width: proteinSequence ? (isAnalyzing ? "50%" : analysisComplete ? "100%" : "33%") : "0%" 
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
              <ProteinInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
              
              {(proteinSequence || isAnalyzing) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <AnalysisPipeline currentStep={currentStep} />
                </motion.div>
              )}
            </div>

            {/* Middle Column - Drug Candidates */}
            <div className="space-y-8">
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
                  <MolecularViewer protein={proteinSequence} bindingPocket={bindingPocket} />
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
  )
}