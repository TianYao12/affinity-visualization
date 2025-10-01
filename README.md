# Affi-NN-ity: Protein-Drug Binding Affinity Predictor

An advanced Next.js visualization interface for **Affi-NN-ity**, a dual-stream neural network architecture that combines Graph Neural Networks for molecules with ESM-2 protein language models to predict drug-target binding affinity.

## 🧬 Project Overview

**Affi-NN-ity** addresses one of the most critical bottlenecks in drug discovery: predicting how strongly potential drug compounds will bind to their protein targets. Our approach combines:

- **Graph Neural Networks (GINConv)** for molecular representation learning
- **ESM-2 protein language model** for capturing biochemical and evolutionary context
- **ChemGAN** for novel molecule generation
- **Dual-stream fusion architecture** for binding affinity prediction

**Current Performance**: RMSE = 0.69, R² = 0.50 on PDBBind v2019 dataset

## ✨ Key Features

🧬 **Advanced Protein Processing**
- ESM-2 embeddings for full protein sequences (320-dim)
- Binding pocket-specific embeddings (320-dim)
- Support for COVID-19 Mpro, ACE2, EGFR, and custom proteins
- Real-time sequence validation

🔬 **State-of-the-Art ML Pipeline**
- ChemGAN molecular generation
- Dual-stream GNN + Transformer architecture
- PDBBind v2019 training (4852 refined + 12800 general complexes)
- Generate-and-predict optimization loops

📊 **Interactive Scientific Visualizations**
- Real-time pKd prediction charts
- ADMET property analysis (MW, LogP, RMSE, R²)
- 3D molecular structure viewer with binding sites
- Biological interaction network visualization

🎨 **Professional Biological Interface**
- Scientific color palettes optimized for molecular data
- Custom DNA helix and molecular animations
- Research-grade typography and iconography
- Responsive design for laboratory environments

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom biological themes
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **3D Graphics**: HTML5 Canvas with custom molecular rendering

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd affinity-visualization
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Usage

### 1. Protein Input
- **Full Sequence**: Paste complete protein FASTA sequence
- **Binding Pocket** (Optional): Specify target binding site for enhanced accuracy  
- **Sample Proteins**: COVID-19 Mpro, ACE2 Receptor, EGFR Kinase Domain
- ESM-2 processes sequences into 640-dimensional embeddings

### 2. Affi-NN-ity Pipeline
- **Step 1**: ESM-2 protein language model embedding generation
- **Step 2**: ChemGAN molecular generation from chemical space
- **Step 3**: Dual-stream fusion network for pKd prediction
- **Step 4**: ADMET analysis and candidate ranking

### 3. Results Analysis
- **Generated Compounds**: ChemGAN-produced SMILES with pKd predictions
- **Model Performance**: Individual RMSE and R² scores per prediction
- **Molecular Properties**: MW, LogP, binding interactions
- **Dataset Context**: PDBBind v2019 source annotations

### 4. Scientific Visualizations
- **3D Molecular Viewer**: Protein structure with highlighted binding sites
- **Affinity Charts**: Comparative pKd analysis across candidates
- **Property Radar**: Multi-dimensional drug characteristics
- **Performance Metrics**: Real-time model confidence indicators

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles with biological themes
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ProteinInput.tsx   # Protein sequence input interface
│   ├── DrugCandidates.tsx # Drug candidate display
│   ├── MolecularViewer.tsx # 3D molecular visualization
│   ├── AffinityVisualization.tsx # Charts and graphs
│   └── AnalysisPipeline.tsx # Analysis workflow display
└── types/                 # TypeScript type definitions
```

## Customization

### Color Themes
The application uses custom biological color palettes defined in `tailwind.config.ts`:
- **DNA**: Blue tones for nucleic acids
- **Protein**: Purple tones for amino acids  
- **Binding**: Green tones for interactions
- **Molecular**: Orange tones for compounds

### Animation Timing
Molecular animations can be customized in `globals.css`:
- DNA helix rotation speed
- Floating molecule movements
- Binding site pulsation effects

### ML Model Integration
To integrate your actual ML model:
1. Replace the mock data in `src/app/page.tsx`
2. Update the `handleAnalyze` function with your API calls
3. Modify the `DrugCandidate` interface to match your data structure

## Development

### Build Commands
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Adding New Features
1. Create new components in `src/components/`
2. Follow the existing TypeScript patterns
3. Use Framer Motion for animations
4. Maintain the biological color scheme

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by modern bioinformatics tools
- Built with cutting-edge web technologies
- Designed for the scientific research community

## Support

For support, email support@example.com or create an issue on GitHub.