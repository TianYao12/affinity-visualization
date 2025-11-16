# Connect front-end to a drug candidate nomination database


## Drug Nomination & Library Integration

- Added a live ChEMBL connector (`src/lib/drugLibrary.ts`) plus a `/api/drug-library` route so the frontend can pull SMILES-ready compounds with physicochemical metadata.
- Introduced the `DrugLibraryBrowser` component to search ChEMBL, view ADMET cues, and queue up to 12 compounds for inference.
- Extended the analysis request/response types so queued compounds ride along with `/api/analyze` and show up ahead of the ChemGAN mock outputs, making it obvious when user-selected molecules are being evaluated.
- Documented the workflow additions in the main `README.md` (“Latest Updates” + new “Drug Nomination Library” usage section) for quicker onboarding.

> TODO: Expand the backend aggregator with DrugCentral/ZINC sources plus filters for target class, clinical phase, and Lipinski/Veber rules.
