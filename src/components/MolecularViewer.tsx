'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Atom, RotateCcw, ZoomIn, ZoomOut, Play, Pause } from 'lucide-react'

interface MolecularViewerProps {
  protein: string
  bindingPocket?: string
}

export default function MolecularViewer({ protein, bindingPocket }: MolecularViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRotating, setIsRotating] = useState(true)
  const [zoom, setZoom] = useState(1)
  const animationFrameRef = useRef<number>()
  const rotationRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawMolecule = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const baseRadius = 100 * zoom
      
      // Draw protein backbone (simplified helical structure)
      ctx.strokeStyle = '#3B82F6'
      ctx.lineWidth = 3
      ctx.beginPath()
      
      const points = []
      const helixPoints = 50
      for (let i = 0; i < helixPoints; i++) {
        const angle = (i / helixPoints) * Math.PI * 4 + rotationRef.current
        const x = centerX + Math.cos(angle) * (baseRadius * 0.6) + Math.sin(i * 0.3) * 20
        const y = centerY + Math.sin(angle) * (baseRadius * 0.6) + (i - helixPoints/2) * 3
        points.push({ x, y, angle: i })
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
      
      // Draw amino acid side chains
      points.forEach((point, i) => {
        if (i % 3 === 0) {
          const sideChainLength = 15 + Math.sin(point.angle * 0.5) * 10
          const sideChainAngle = point.angle * 2 + rotationRef.current * 0.5
          const endX = point.x + Math.cos(sideChainAngle) * sideChainLength
          const endY = point.y + Math.sin(sideChainAngle) * sideChainLength
          
          ctx.strokeStyle = '#10B981'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(point.x, point.y)
          ctx.lineTo(endX, endY)
          ctx.stroke()
          
          // Draw side chain atom
          ctx.fillStyle = '#10B981'
          ctx.beginPath()
          ctx.arc(endX, endY, 4, 0, 2 * Math.PI)
          ctx.fill()
        }
      })
      
      // Draw binding sites (highlighted areas)
      const bindingSites = [
        { x: centerX - 40, y: centerY - 30, active: true },
        { x: centerX + 30, y: centerY + 20, active: false },
        { x: centerX - 20, y: centerY + 40, active: true }
      ]
      
      bindingSites.forEach(site => {
        const glowRadius = 25 + Math.sin(rotationRef.current * 2) * 5
        const gradient = ctx.createRadialGradient(site.x, site.y, 0, site.x, site.y, glowRadius)
        
        if (site.active) {
          gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)')
          gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)')
          gradient.addColorStop(1, 'rgba(239, 68, 68, 0)')
        } else {
          gradient.addColorStop(0, 'rgba(156, 163, 175, 0.4)')
          gradient.addColorStop(0.5, 'rgba(156, 163, 175, 0.2)')
          gradient.addColorStop(1, 'rgba(156, 163, 175, 0)')
        }
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(site.x, site.y, glowRadius, 0, 2 * Math.PI)
        ctx.fill()
        
        // Draw binding site marker
        ctx.fillStyle = site.active ? '#EF4444' : '#6B7280'
        ctx.beginPath()
        ctx.arc(site.x, site.y, 6, 0, 2 * Math.PI)
        ctx.fill()
      })
      
      // Draw floating drug molecules (small representations)
      const drugMolecules = [
        { x: centerX + 80, y: centerY - 60, phase: 0 },
        { x: centerX - 90, y: centerY + 50, phase: Math.PI },
        { x: centerX + 60, y: centerY + 70, phase: Math.PI * 0.5 }
      ]
      
      drugMolecules.forEach(drug => {
        const floatX = drug.x + Math.sin(rotationRef.current + drug.phase) * 10
        const floatY = drug.y + Math.cos(rotationRef.current + drug.phase) * 8
        
        // Draw small molecule structure
        ctx.strokeStyle = '#A855F7'
        ctx.lineWidth = 2
        ctx.beginPath()
        
        // Simple hexagonal structure
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2
          const x = floatX + Math.cos(angle) * 8
          const y = floatY + Math.sin(angle) * 8
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        ctx.stroke()
        
        // Central atom
        ctx.fillStyle = '#A855F7'
        ctx.beginPath()
        ctx.arc(floatX, floatY, 3, 0, 2 * Math.PI)
        ctx.fill()
      })
      
      if (isRotating) {
        rotationRef.current += 0.02
        animationFrameRef.current = requestAnimationFrame(drawMolecule)
      }
    }
    
    drawMolecule()
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRotating, zoom])

  const toggleRotation = () => {
    setIsRotating(!isRotating)
  }

  const resetView = () => {
    setZoom(1)
    rotationRef.current = 0
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <Atom className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">3D Molecular Structure</h2>
            <p className="text-sm text-gray-400">Interactive protein visualization</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-2 bg-gray-700/30 hover:bg-gray-600/30 rounded-lg transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="p-2 bg-gray-700/30 hover:bg-gray-600/30 rounded-lg transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={resetView}
            className="p-2 bg-gray-700/30 hover:bg-gray-600/30 rounded-lg transition-all"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={toggleRotation}
            className="p-2 bg-gray-700/30 hover:bg-gray-600/30 rounded-lg transition-all"
            title={isRotating ? "Pause Rotation" : "Start Rotation"}
          >
            {isRotating ? (
              <Pause className="w-4 h-4 text-gray-400" />
            ) : (
              <Play className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="relative bg-black/20 rounded-xl p-4 mb-4">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full h-auto max-w-full"
          style={{ filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))' }}
        />
        
        {/* Legend */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-xs text-gray-300">Protein Backbone</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-xs text-gray-300">Side Chains</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-xs text-gray-300">Active Sites</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
            <span className="text-xs text-gray-300">Drug Molecules</span>
          </div>
        </div>
      </div>

      {/* Protein Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-black/20 rounded-lg p-3">
          <p className="text-gray-400 mb-1">Sequence Length</p>
          <p className="text-white font-semibold">{protein.length} residues</p>
        </div>
        <div className="bg-black/20 rounded-lg p-3">
          <p className="text-gray-400 mb-1">{bindingPocket ? 'Custom Pocket' : 'Predicted Sites'}</p>
          <p className="text-white font-semibold">{bindingPocket ? bindingPocket.length + ' residues' : '3 identified'}</p>
        </div>
      </div>
      
      {/* ESM-2 Processing Info */}
      <div className="mt-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-500/20">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-blue-400">ESM-2 Embeddings Generated</span>
        </div>
        <p className="text-xs text-gray-400">
          Protein language model extracted 640-dim embeddings capturing evolutionary and structural context
        </p>
      </div>
    </motion.div>
  )
}