'use client'

import { motion } from 'framer-motion'
import { Dna, Zap, Target, Activity, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface AnalysisStepProps {
  icon: React.ReactNode
  title: string
  description: string
  isActive: boolean
  isComplete: boolean
  details?: string[]
}

function AnalysisStep({ icon, title, description, isActive, isComplete, details }: AnalysisStepProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`border rounded-xl p-4 transition-all ${
        isActive 
          ? 'border-blue-400/50 bg-blue-500/10' 
          : isComplete 
          ? 'border-green-400/50 bg-green-500/10' 
          : 'border-gray-600/30 bg-gray-700/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            isActive 
              ? 'bg-blue-500/20 text-blue-400' 
              : isComplete 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-gray-600/20 text-gray-400'
          }`}>
            {icon}
          </div>
          <div>
            <h3 className={`font-semibold ${
              isActive 
                ? 'text-blue-400' 
                : isComplete 
                ? 'text-green-400' 
                : 'text-gray-400'
            }`}>
              {title}
            </h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>
        
        {details && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} />
          </button>
        )}
      </div>
      
      {details && isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-3 pt-3 border-t border-gray-600/30"
        >
          <ul className="space-y-1">
            {details.map((detail, index) => (
              <li key={index} className="text-sm text-gray-400 flex items-center">
                <div className="w-1 h-1 bg-gray-500 rounded-full mr-2" />
                {detail}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
      
      {isActive && (
        <div className="mt-3">
          <div className="h-1 bg-gray-700/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

interface AnalysisPipelineProps {
  currentStep: 'input' | 'analysis' | 'prediction' | 'complete'
}

export default function AnalysisPipeline({ currentStep }: AnalysisPipelineProps) {
  const steps = [
    {
      id: 'input',
      icon: <Dna className="w-5 h-5" />,
      title: 'ESM-2 Protein Embedding',
      description: 'Processing protein sequence through language model',
      details: [
        'Full protein sequence → ESM-2 (320-dim embedding)',
        'Binding pocket sequence → ESM-2 (320-dim embedding)',
        'Concatenation → 640-dimensional protein representation',
        'Biochemical context and evolutionary signals captured'
      ]
    },
    {
      id: 'analysis',
      icon: <Activity className="w-5 h-5" />,
      title: 'ChemGAN Molecule Generation',
      description: 'Generating candidate drug molecules using GANs',
      details: [
        'ChemGAN generates novel SMILES strings',
        'Molecular graphs: atoms as nodes, bonds as edges',
        'GIN layers extract 128-dim molecular embeddings',
        'Drug-like chemical space exploration'
      ]
    },
    {
      id: 'prediction',
      icon: <Target className="w-5 h-5" />,
      title: 'Dual-Stream Fusion Network',
      description: 'Predicting binding affinity using combined embeddings',
      details: [
        'Protein embedding (640-dim) → FC layers → 128-dim',
        'Molecular embedding (128-dim) from GIN layers',
        'Fusion: concatenate → 256-dim → FC → pKd prediction',
        'Trained on PDBBind v2019 (RMSE: 0.69, R²: 0.50)'
      ]
    },
    {
      id: 'complete',
      icon: <Zap className="w-5 h-5" />,
      title: 'Results & Visualization',
      description: 'Ranking candidates and generating insights',
      details: [
        'pKd predictions with confidence scores',
        'ADMET property estimation (MW, LogP)',
        'Interaction analysis and binding sites',
        'Generate-and-predict loop for optimization'
      ]
    }
  ]

  const getStepIndex = (stepId: string) => steps.findIndex(s => s.id === stepId)
  const currentStepIndex = getStepIndex(currentStep)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-indigo-500/20 rounded-xl">
          <Activity className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Analysis Pipeline</h2>
          <p className="text-sm text-gray-400">Real-time processing workflow</p>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <AnalysisStep
            key={step.id}
            icon={step.icon}
            title={step.title}
            description={step.description}
            isActive={index === currentStepIndex}
            isComplete={index < currentStepIndex}
            details={step.details}
          />
        ))}
      </div>
    </motion.div>
  )
}