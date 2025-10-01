'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Loader2, Database, X, CheckCircle } from 'lucide-react'
import { searchProteins, fetchProteinSequence, getExampleProteins, type ProteinSearchResult, type ProteinSequence } from '@/lib/ncbi'

interface ProteinSearchProps {
  onSelectProtein: (sequence: string, title: string, accession: string) => void
  onClose: () => void
}

export default function ProteinSearch({ onSelectProtein, onClose }: ProteinSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProteinSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [selectedProteinId, setSelectedProteinId] = useState<string>('')
  const [error, setError] = useState<string>('')

  const exampleProteins = getExampleProteins()

  const handleSearch = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    setError('')
    setSearchResults([])

    try {
      const results = await searchProteins(query, 15)
      setSearchResults(results)
      
      if (results.length === 0) {
        setError('No proteins found for this search term')
      }
    } catch (err) {
      setError('Search failed. Please check your internet connection and try again.')
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectProtein = async (protein: ProteinSearchResult) => {
    setIsFetching(true)
    setSelectedProteinId(protein.id)
    setError('')

    try {
      const fullProtein = await fetchProteinSequence(protein.id)
      
      if (fullProtein && fullProtein.sequence) {
        onSelectProtein(
          fullProtein.sequence, 
          fullProtein.title, 
          fullProtein.accession
        )
        onClose()
      } else {
        setError('Failed to fetch protein sequence')
      }
    } catch (err) {
      setError('Failed to fetch protein sequence. Please try again.')
      console.error('Fetch error:', err)
    } finally {
      setIsFetching(false)
      setSelectedProteinId('')
    }
  }

  const handleExampleSearch = (example: typeof exampleProteins[0]) => {
    setSearchQuery(example.query)
    handleSearch(example.query)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-lg z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-xl border-2 border-slate-500/60 rounded-3xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-2xl ring-2 ring-blue-500/20"
      >
        {/* Header */}
        <div className="relative p-8 border-b-2 border-slate-600/50 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <div className="p-4 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-2xl border-2 border-blue-400/40 shadow-xl">
                <Database className="w-8 h-8 text-blue-300" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
                  NCBI Protein Database
                </h2>
                <p className="text-slate-300 mt-2 text-base font-medium">Search and import protein sequences from NCBI</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-slate-700/50 rounded-xl transition-all duration-200 hover:scale-105 group"
            >
              <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(85vh-160px)]">
          {/* Search Bar */}
          <div className="relative bg-gradient-to-br from-slate-800/40 to-slate-700/30 p-6 rounded-3xl border border-slate-600/40">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-slate-300 transition-colors group-focus-within:text-blue-300" />
              <input
                type="text"
                placeholder="Search proteins (e.g., 'human insulin', 'SARS-CoV-2 spike', accession number)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className="w-full pl-14 pr-6 py-5 bg-gradient-to-r from-slate-900/90 to-slate-800/90 border-2 border-slate-500/60 rounded-2xl text-white placeholder-slate-400 focus:border-blue-400/80 focus:outline-none focus:ring-3 focus:ring-blue-400/40 transition-all duration-300 text-xl font-medium shadow-lg"
                disabled={isSearching || isFetching}
              />
              {isSearching && (
                <div className="absolute right-4 top-4">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              )}
            </div>
            <button
              onClick={() => handleSearch(searchQuery)}
              disabled={!searchQuery.trim() || isSearching || isFetching}
              className="mt-5 w-full px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-blue-500/30 hover:scale-102 disabled:hover:scale-100 flex items-center justify-center space-x-3 text-lg"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>{isSearching ? 'Searching NCBI...' : 'Search NCBI'}</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg"
            >
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Search Results - Show first when available */}
          {searchResults.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/10 p-6 rounded-3xl border-2 border-emerald-600/40">
              <h3 className="text-xl font-bold text-white mb-8 flex items-center space-x-3">
                <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full shadow-lg"></div>
                <span className="drop-shadow-sm">Search Results ({searchResults.length})</span>
              </h3>
              <div className="space-y-5">
                {searchResults.map((protein, index) => (
                  <motion.div
                    key={protein.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group p-7 bg-gradient-to-br from-slate-800/70 to-slate-700/50 border-2 border-slate-600/50 hover:border-slate-500/70 rounded-2xl transition-all duration-300 hover:shadow-2xl"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 space-y-3">
                        <h4 className="font-semibold text-slate-100 group-hover:text-white transition-colors leading-tight">
                          {protein.title}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center space-x-2 text-slate-400 group-hover:text-slate-300 transition-colors">
                            <span className="text-blue-400 font-medium">ID:</span>
                            <span className="font-mono">{protein.accession}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-400 group-hover:text-slate-300 transition-colors">
                            <span className="text-emerald-400 font-medium">Length:</span>
                            <span>{protein.length} aa</span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-400 group-hover:text-slate-300 transition-colors">
                            <span className="text-purple-400 font-medium">Organism:</span>
                            <span className="truncate">{protein.organism}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSelectProtein(protein)}
                        disabled={isFetching}
                        className="ml-8 flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-emerald-600/40 to-green-600/40 hover:from-emerald-500/50 hover:to-green-500/50 text-emerald-200 hover:text-white rounded-2xl transition-all duration-300 font-bold border-2 border-emerald-500/40 hover:border-emerald-400/60 disabled:opacity-50 hover:scale-105 disabled:hover:scale-100 shadow-lg text-base"
                      >
                        {isFetching && selectedProteinId === protein.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Import</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Proteins - Show when no search results or as suggestions after results */}
          <div className="bg-gradient-to-br from-slate-800/30 to-slate-700/20 p-6 rounded-3xl border border-slate-600/30">
            <h3 className="text-xl font-bold text-white mb-8 flex items-center space-x-3">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full shadow-lg"></div>
              <span className="drop-shadow-sm">{searchResults.length > 0 ? 'Popular Suggestions' : 'Popular Proteins'}</span>
            </h3>
            <div className="grid grid-cols-2 gap-5">
              {exampleProteins.map((protein) => (
                <motion.button
                  key={protein.name}
                  onClick={() => handleExampleSearch(protein)}
                  disabled={isFetching}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group p-6 bg-gradient-to-br from-slate-800/80 to-slate-700/60 hover:from-slate-700/80 hover:to-slate-600/60 border-2 border-slate-600/50 hover:border-slate-500/70 rounded-2xl transition-all duration-300 text-left shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <h4 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors mb-3">
                    {protein.name}
                  </h4>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed mb-4">
                    {protein.description}
                  </p>
                  <div className="flex items-center text-sm text-blue-400 group-hover:text-blue-300 transition-colors font-medium">
                    <Download className="w-4 h-4 mr-2" />
                    <span>Import sequence</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-red-900/50 border-2 border-red-600/60 rounded-2xl shadow-xl"
            >
              <p className="text-red-200 text-lg font-semibold">⚠️ Error: {error}</p>
            </motion.div>
          )}

          {/* NCBI Attribution */}
          <div className="pt-6 border-t border-slate-700/30">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              <Database className="w-3 h-3 inline mr-1" />
              Data provided by NCBI Protein Database | 
              <a 
                href="https://www.ncbi.nlm.nih.gov/protein/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 ml-1 transition-colors"
              >
                Learn more about NCBI
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}