'use client'

import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'
import { TrendingUp, BarChart3, Activity } from 'lucide-react'

interface DrugCandidate {
  id: number
  name: string
  smiles: string
  structure: string
  pKd: number
  rmse: number
  r_squared: number
  confidence: number
  molecular_weight: number
  logP: number
  interactions: string[]
  dataset_source: string
  binding_site: string
}

interface AffinityVisualizationProps {
  candidates: DrugCandidate[]
}

export default function AffinityVisualization({ candidates }: AffinityVisualizationProps) {
  // Prepare data for charts
  const barData = candidates.map(candidate => ({
    name: candidate.name.replace('ChemGAN-Generated Compound', 'Comp'),
    pKd: candidate.pKd,
    rmse: candidate.rmse,
    confidence: candidate.confidence,
    r_squared: candidate.r_squared * 100 // Convert to percentage for display
  }))

  const radarData = candidates.slice(0, 3).map(candidate => ({
    compound: candidate.name.replace('ChemGAN-Generated Compound', 'Comp'),
    affinity: candidate.pKd,
    stability: candidate.confidence / 10,
    selectivity: (candidate.r_squared * 10), // Use R² as selectivity proxy
    drugLikeness: Math.min(candidate.molecular_weight / 50, 10), // MW-based druglikeness
    lipophilicity: (candidate.logP + 3) * 2 // Scaled logP
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-lg p-3 rounded-lg border border-gray-600/30">
          <p className="text-white font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey === 'pKd' && 'pKd Value: '}
              {entry.dataKey === 'rmse' && 'RMSE: '}
              {entry.dataKey === 'confidence' && 'Confidence: '}
              {entry.dataKey === 'r_squared' && 'R² Score: '}
              {entry.value}
              {entry.dataKey === 'confidence' && '%'}
              {entry.dataKey === 'r_squared' && '%'}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-green-500/20 rounded-xl">
          <BarChart3 className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Affinity Analysis</h2>
          <p className="text-sm text-gray-400">Comparative binding affinity visualization</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Binding Affinity Bar Chart */}
        <div className="bg-black/20 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 text-blue-400 mr-2" />
            ChemGAN Generated Compounds - pKd Predictions
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Dual-stream GNN + ESM-2 architecture predictions (RMSE: 0.69, R²: 0.50)
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="pKd" 
                  fill="url(#affinityGradient)" 
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="affinityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drug Properties Radar Chart */}
        {radarData.length > 0 && (
          <div className="bg-black/20 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Activity className="w-5 h-5 text-purple-400 mr-2" />
              Drug Properties Profile
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData[0] ? [radarData[0]] : []}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 10]} 
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  />
                  <Radar
                    name="Properties"
                    dataKey="affinity"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
              <div className="text-center bg-black/20 rounded-lg p-2">
                <p className="text-xs text-gray-400">pKd</p>
                <p className="text-lg font-semibold text-blue-400">{radarData[0]?.affinity?.toFixed(1) || 0}</p>
              </div>
              <div className="text-center bg-black/20 rounded-lg p-2">
                <p className="text-xs text-gray-400">R² Score</p>
                <p className="text-lg font-semibold text-green-400">{radarData[0] ? (radarData[0].selectivity / 10).toFixed(2) : '0.00'}</p>
              </div>
              <div className="text-center bg-black/20 rounded-lg p-2">
                <p className="text-xs text-gray-400">LogP</p>
                <p className="text-lg font-semibold text-purple-400">{radarData[0] ? ((radarData[0].lipophilicity / 2) - 3).toFixed(1) : '0.0'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {candidates.length > 0 ? Math.max(...candidates.map(c => c.pKd)).toFixed(1) : '0'}
            </div>
            <div className="text-sm text-gray-400">Highest pKd</div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {candidates.length > 0 ? Math.max(...candidates.map(c => c.r_squared)).toFixed(2) : '0.00'}
            </div>
            <div className="text-sm text-gray-400">Best R²</div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {candidates.length}
            </div>
            <div className="text-sm text-gray-400">Generated</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}