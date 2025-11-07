"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dna,
  Search,
  Loader2,
  Upload,
  Clipboard,
  Database,
} from "lucide-react";
import { validateProteinSequence } from "@/lib/ncbi";
import ProteinSearch from "./ProteinSearch";

interface ProteinInputProps {
  onAnalyze: (sequence: string, bindingPocket?: string) => void;
  isAnalyzing: boolean;
}

export default function ProteinInput({
  onAnalyze,
  isAnalyzing,
}: ProteinInputProps) {
  const [sequence, setSequence] = useState("");
  const [bindingPocket, setBindingPocket] = useState("");
  const [inputMethod, setInputMethod] = useState<"paste" | "upload" | "search">(
    "paste"
  );
  const [showSearch, setShowSearch] = useState(false);
  const [proteinMetadata, setProteinMetadata] = useState<{
    title: string;
    accession: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateSequence = (seq: string): boolean => {
    const validAminoAcids = /^[ACDEFGHIKLMNPQRSTVWY\s\n]*$/i;
    const cleanSeq = seq.replace(/\s|\n/g, "");
    return cleanSeq.length > 0 && validAminoAcids.test(cleanSeq);
  };

  const handleProteinImport = (data: {
    sequence: string;
    title: string;
    accession: string;
  }) => {
    setSequence(data.sequence);
    setProteinMetadata({ title: data.title, accession: data.accession });
    setShowSearch(false);
    setValidationErrors([]);

    // Auto-fill binding pocket if not set
    if (!bindingPocket && data.sequence.length > 100) {
      // Use a representative segment as binding pocket
      const pocketStart = Math.floor(data.sequence.length * 0.3);
      const pocketLength = Math.min(50, Math.floor(data.sequence.length * 0.1));
      setBindingPocket(
        data.sequence.substring(pocketStart, pocketStart + pocketLength)
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sequence.trim() && !isAnalyzing) {
      onAnalyze(sequence.trim(), bindingPocket.trim() || undefined);
    }
  };

  const sampleProteins = [
    {
      name: "COVID-19 Main Protease (Mpro)",
      sequence:
        "SGFRKMAFPSGKVEGCMVQVTCGTTTLNGLWLDDVVYCPRHVICTSEDMLNPNYEDLLIRKSNHNFLVQAGNVQLRVIGHSMQNCVLKLKVDTANPKTPKYKFVRIQPGQTFSVLACYNGSPSGVYQCAMRPNFTIKGSFLNGSCGSVGFNIDYDCVSFCYMHHMELPTGVHAGTDLEGNFYGPFVDRQTAQAAGTDTTITVNVLAWLYAAVINGDRWFLNRFTTTLNDFNLVAMKYNYEPLTQDHVDILGPLSAQTGIAVLDMCASLKELLQNGMNGRTILGSALLEDEFTPFDVVRQCSGVTFQ",
      pocket:
        "SGVTFQGKFKKIVKGTHHWLLLTILTSLLVLVQSTQWSLFFLYENAFLPFAMGIIAMSAFAMMFVKHKHAFLCLFLLPSLATVAYFNMVYMPASWVMRIMTWLDMVDTSLSGFKLKDCVMYASAVVLLILMTARTVYDDGARRVWTLMNVLTLVYKVYYGNALDQAISMWALVISVTSNYSGVVTTIMFLARGIVFMCVEYCPIFFITGNTLQCIMLVYCFLGYCCDDTPEEKFIVFQRKRLTTINGTGVCQVPLNNTYLIKWDEEWLIYEDPVFYRRASHTFAKIRDHIQLLYTKINYVWQNIIQIGLIVLTPEKCNYFQYEIETCILYIKSEDNSFKYFTALETTIDFKGLSVSDEVIRQVDEQTQKPFKYFAFFPKQENAFGIEVLEGLIVSRILSLMDIVNTTPYLVLSFGFGNISTGWFIIGDPLFFNVIHTGVFISAVFGYLKFPIFSLDREGRWFNGILLAVFTYDMTVKLTVPFCKNFNQCMVKILVGSQTLMYLYKKGLFGRLMFMTAICRKEGSIYKVIGSYVARILGFNSKSLLTNFLFYLISMDLLSSYDWIQSQNSDLQWSEAIPYILVFSLLWKTDGVKNITNWYFITHYFVSLLCFLLKLLISNVIFDFKIGFRHAVLYSFAHNSAMDLQVCKMVFHILRMSTEHAIIHLGDVALNNVNVMELNMFSFDKLEEEIKKINHTYLKLCTALKISESQPFLQTGLQVRSGYMRNCCNSGTSMKVVGLLSYRGKCELFMGTLSTSILNLSACKTAIELQHFVDTAGDMTLS",
    },
    {
      name: "Human ACE2 Receptor",
      sequence:
        "MSSSSWLLLSLVAVTAAQSTIEEQAKTFLDKFNHEAEDLFYQSSLASWNYNTNITEENVQNMNNAGDKWSAFLKEQSTLAQMYPLQEIQNLTVKLQLQALQQNGSSVLSEDKSKRLNTILNTMSTIYSTGKVCNPDNPQECLLLEPGLNEIMANSLDYNERLWAWESWRSEVGKQLRPLYEEYVVLKNEMARANHYEDYGDYWRGDYEVNGVDGYDYSRGQLIEDVEHTFEEIKPLYEHLHAYVRAKLMNAYPSYISPIGCLPAHLLGDMWGRFWTNLYSLTVPFGQKPNIDVTDAMVDQAWDAQRIFKEAEKFFVSVGLPNMTQGFWENSMLTDPGNVQKAVCHPTAWDLGKGDFRILMCTKVTMDDFLTAHHEMGHIQYDMAYAAQPFLLRNGANEGFHEAVGEIMSLSAATPKHLKSIGLLSPDFQEDNETEINFLLKQALTIVGTLPFTYMLEKWRWMVFKGEIPKDQWMKKWWEMKREIVGVVEPVPHDETYCDPASLFHVSNDYSFIRYYTRTLYQFQFQEALCQAAKHEGPLHKCDISNSTEAGQKLFNMLRLGKSEPWTLALENVVGAKNMNVRPLLNYFEPLFTWLKDQNKNSFVGWSTDWSPYADQSIKVRISLKSALGDKAYEWNDNEMYLFRSSVAYAMRQYFLKVKNQMILFGEEDVRVANLKPRISFNFFVTAPKNVSDIIPRTEVEKAIRMSRSRINDAFRLNDNSLEFLGIQPTLGPPNQPPVSIWLIVFGVVMGVIVVGIVILIFTGIRDRKKKNKARSGENPYASIDISKGENNPGFQNTDDVQTSF",
      pocket:
        "HDFFKQNGMRFRKLFYAVFFSYFANTGTYQILSPQGKYQWGKDKAEGQDYLQYLQELLKQSAVYPTWWALKKLNQSIQHPDNLFRRFFTTNKADVQLFKHDFFKQNGMRFRKLFYAVFFSYFANTGTYQIL",
    },
    {
      name: "EGFR Kinase Domain",
      sequence:
        "FKKIKVLGSGAFGTVYKGLWIPEGAKVKIPVAIKELREATSPKANKEILDEAYVMASVDNPHVCRLLGICLTSTVQLITQLMPFGCLLDYVREHKDNIGSQYLLNWCVQIAKGMNYLEDRRLVHRDLAARNVLVKTPQHVKITDFGLAKLLGAEEKEYHAEGGKVPIKWMALESILHRIYTHQSDVWSYGVTVWELMTFGSKPYDGIPASEISSILEKGERLPQPPICTIDVYMIMVKCWMIDADSRPKFRELIIEFSKMARDPQRYLVIQGDERMHLPSPTDSNFYRALMDEEDMDDVVDADEYLIPQQGFFSSPSTSRTPLLSSLSATSNNSTVACIDRNGLQSCPIKEDSFLQRYSSDPTGALTEDSIDDTFLPVPEYINQSVPKRPAGSVQNPVYHNQPLNPAPSRDPHYQDPHSTAVGNPEYLNTVQPTCVNSTFDSPAHWAQKGSHQISLDNPDYQQDFFPKEAKPNGIFKGSTAENAEYLRVAPQSSEFIGA",
      pocket:
        "FKKIKVLGSGAFGTVYKGLWIPEGAKVKIPVAIKELREATSPKANKEILDEAYVMASVDNPHVCRLLGICLTSTVQLITQLMPFGCLLDYVREHKD",
    },
  ];

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
            Enter your protein sequence for analysis
          </p>
        </div>
      </div>

      {/* Input Method Toggle */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => {
            setInputMethod("search");
            setShowSearch(true);
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            inputMethod === "search"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
              : "bg-gray-700/30 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30"
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Search NCBI</span>
        </button>
        <button
          onClick={() => setInputMethod("paste")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            inputMethod === "paste"
              ? "bg-blue-500/20 text-blue-400 border border-blue-400/30"
              : "bg-gray-700/30 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30"
          }`}
        >
          <Clipboard className="w-4 h-4" />
          <span>Paste Sequence</span>
        </button>
        <button
          onClick={() => setInputMethod("upload")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            inputMethod === "upload"
              ? "bg-blue-500/20 text-blue-400 border border-blue-400/30"
              : "bg-gray-700/30 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload FASTA</span>
        </button>
      </div>

      {/* Display imported protein metadata */}
      {proteinMetadata && (
        <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 text-emerald-400 text-sm">
            <Database className="w-4 h-4" />
            <span className="font-medium">
              Imported: {proteinMetadata.title}
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Accession: {proteinMetadata.accession}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {inputMethod === "paste" ? (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="sequence"
                className="block text-lg font-semibold text-gray-300 mb-3"
              >
                Protein Sequence (FASTA format)
              </label>
              <textarea
                id="sequence"
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                placeholder="Enter protein sequence here... (e.g., MALKWVQRLLVS...)"
                className="w-full h-40 px-6 py-4 bg-black/20 border border-gray-600/30 rounded-2xl text-white placeholder-gray-500 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all resize-none font-mono text-base"
                disabled={isAnalyzing}
              />
            </div>

            {/* Binding Pocket Input */}
            <div>
              <label
                htmlFor="binding-pocket"
                className="block text-lg font-semibold text-gray-300 mb-3"
              >
                Binding Pocket Sequence (Optional - for targeted prediction)
              </label>
              <textarea
                id="binding-pocket"
                value={bindingPocket}
                onChange={(e) => setBindingPocket(e.target.value)}
                placeholder="Enter binding site residues... (e.g., specific pocket sequence for enhanced accuracy)"
                className="w-full h-28 px-6 py-4 bg-black/20 border border-gray-600/30 rounded-2xl text-white placeholder-gray-500 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all resize-none font-mono text-base"
                disabled={isAnalyzing}
              />
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-600/30 rounded-3xl p-16 text-center">
            <Upload className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <p className="text-gray-400 mb-6 text-lg">
              Drop your FASTA file here or click to browse
            </p>
            <button
              type="button"
              className="px-8 py-4 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-400/30 hover:bg-blue-600/30 transition-colors font-semibold text-lg"
            >
              Select File
            </button>
          </div>
        )}

        {/* Sample Proteins */}
        <div className="space-y-4">
          <p className="text-lg font-medium text-gray-400">
            Try sample proteins:
          </p>
          <div className="flex flex-wrap gap-3">
            {sampleProteins.map((protein, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setSequence(protein.sequence);
                  setBindingPocket(protein.pocket);
                }}
                className="px-5 py-3 text-sm bg-purple-500/20 text-purple-400 rounded-2xl hover:bg-purple-500/30 transition-all border border-purple-400/30 font-medium"
                disabled={isAnalyzing}
              >
                {protein.name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!sequence.trim() || isAnalyzing}
          className="w-full flex items-center justify-center space-x-3 px-8 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-purple-600 text-lg font-semibold shadow-lg hover:shadow-xl"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Analyzing Protein...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Predict Binding Affinity</span>
            </>
          )}
        </button>
      </form>

      {sequence && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 p-4 bg-black/20 rounded-xl space-y-3"
        >
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Protein Length:</span>
            <span className="text-sm text-blue-400 font-mono">
              {sequence.length} amino acids
            </span>
          </div>
          <div className="text-xs text-gray-500 font-mono break-all">
            <span className="text-gray-400">Full: </span>
            {sequence.substring(0, 80)}
            {sequence.length > 80 && "..."}
          </div>

          {bindingPocket && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Binding Pocket:</span>
                <span className="text-sm text-purple-400 font-mono">
                  {bindingPocket.length} residues
                </span>
              </div>
              <div className="text-xs text-gray-500 font-mono break-all">
                <span className="text-gray-400">Pocket: </span>
                {bindingPocket.substring(0, 60)}
                {bindingPocket.length > 60 && "..."}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* NCBI Protein Search Modal */}
      {showSearch && (
        <ProteinSearch
          onSelectProtein={(sequence, title, accession) =>
            handleProteinImport({ sequence, title, accession })
          }
          onClose={() => setShowSearch(false)}
        />
      )}
    </motion.div>
  );
}
