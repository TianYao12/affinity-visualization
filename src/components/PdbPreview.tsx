"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Orbit, Info, Ruler } from "lucide-react";

type Atom = {
  x: number;
  y: number;
  z: number;
  element: string;
  chain: string;
  resSeq: number | null;
};

interface PdbPreviewProps {
  pdb: string;
}

function parsePdb(pdb: string): Atom[] {
  return pdb
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("ATOM") || line.startsWith("HETATM"))
    .map((line) => {
      // Columns: 31-38 X, 39-46 Y, 47-54 Z, 77-78 element
      const x = Number(line.slice(30, 38));
      const y = Number(line.slice(38, 46));
      const z = Number(line.slice(46, 54));
      const element = line.slice(76, 78).trim() || "?";
      const chain = line.slice(21, 22).trim() || "-";
      const resSeqRaw = line.slice(22, 26).trim();
      const resSeq = resSeqRaw ? Number(resSeqRaw) : null;
      return { x, y, z, element, chain, resSeq };
    })
    .filter((atom) => Number.isFinite(atom.x) && Number.isFinite(atom.y));
}

export default function PdbPreview({ pdb }: PdbPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const atoms = useMemo(() => parsePdb(pdb), [pdb]);
  const [hoverAtom, setHoverAtom] = useState<Atom | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!atoms.length) return;

    const xs = atoms.map((a) => a.x);
    const ys = atoms.map((a) => a.y);
    const zs = atoms.map((a) => a.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const pad = 20;
    const scaleX = (canvas.width - pad * 2) / Math.max(1, maxX - minX);
    const scaleY = (canvas.height - pad * 2) / Math.max(1, maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const chainPalette = [
      "#22d3ee",
      "#c084fc",
      "#f472b6",
      "#34d399",
      "#f59e0b",
      "#60a5fa",
      "#a3e635",
    ];
    const chainColor = (chain: string) => {
      const index = Math.abs(
        chain.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
      );
      return chainPalette[index % chainPalette.length];
    };

    atoms.forEach((atom) => {
      const x = pad + (atom.x - minX) * scale;
      const y = pad + (atom.y - minY) * scale;
      const depth = (atom.z - minZ) / Math.max(1, maxZ - minZ);
      const radius = 3 + depth * 2;
      const base =
        atom.element === "C"
          ? chainColor(atom.chain)
          : atom.element === "N"
          ? "#a855f7"
          : atom.element === "O"
          ? "#ef4444"
          : "#f8fafc";

      const alpha = 0.55 + depth * 0.35;
      const alphaHex = Math.floor(alpha * 255)
        .toString(16)
        .padStart(2, "0");

      ctx.beginPath();
      ctx.fillStyle = `${base}${alphaHex}`;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [atoms]);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !atoms.length) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const xs = atoms.map((a) => a.x);
    const ys = atoms.map((a) => a.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 20;
    const scaleX = (canvas.width - pad * 2) / Math.max(1, maxX - minX);
    const scaleY = (canvas.height - pad * 2) / Math.max(1, maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    let closest: { atom: Atom; dist: number } | null = null;
    atoms.forEach((atom) => {
      const x = pad + (atom.x - minX) * scale;
      const y = pad + (atom.y - minY) * scale;
      const d = Math.hypot(mx - x, my - y);
      if (!closest || d < closest.dist) {
        closest = { atom, dist: d };
      }
    });

    if (closest && closest.dist < 12) {
      setHoverAtom(closest.atom);
      setHoverPos({ x: mx, y: my });
    } else {
      setHoverAtom(null);
      setHoverPos(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/10 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
            <Orbit className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-[0.2em]">
              PDB Preview
            </p>
            <h3 className="text-lg font-semibold text-white">Ligand/Protein</h3>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {atoms.length} atoms parsed
        </div>
      </div>

      <div className="bg-black/30 rounded-xl border border-white/10 p-2">
        <canvas
          ref={canvasRef}
          width={360}
          height={260}
          className="w-full h-auto"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setHoverAtom(null);
            setHoverPos(null);
          }}
        />
        {hoverAtom && hoverPos && (
          <div
            className="absolute bg-slate-900/90 text-xs text-white rounded-lg px-3 py-2 border border-cyan-500/40 shadow-lg pointer-events-none"
            style={{
              left: hoverPos.x + 12,
              top: hoverPos.y + 12,
            }}
          >
            <div className="font-semibold">{hoverAtom.element}</div>
            <div className="text-cyan-200">
              Chain {hoverAtom.chain || "-"}
              {hoverAtom.resSeq ? ` • Res ${hoverAtom.resSeq}` : ""}
            </div>
            <div className="text-gray-300">
              ({hoverAtom.x.toFixed(2)}, {hoverAtom.y.toFixed(2)}, {hoverAtom.z.toFixed(2)})
            </div>
          </div>
        )}
      </div>

      {!atoms.length && (
        <p className="text-sm text-gray-400">
          Paste a PDB file to view a 2D projection. ATOM/HETATM records are used
          for positioning; colors follow element type (C/N/O/other).
        </p>
      )}
      {atoms.length > 0 && (
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-cyan-300" />
            <span>
              Bounding box: ΔX {(
                Math.max(...atoms.map((a) => a.x)) -
                Math.min(...atoms.map((a) => a.x))
              ).toFixed(1)}
              Å, ΔY {(
                Math.max(...atoms.map((a) => a.y)) -
                Math.min(...atoms.map((a) => a.y))
              ).toFixed(1)}
              Å, ΔZ {(
                Math.max(...atoms.map((a) => a.z)) -
                Math.min(...atoms.map((a) => a.z))
              ).toFixed(1)}
              Å
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-300" />
            <span>Chains colored deterministically; depth brightens front atoms.</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
