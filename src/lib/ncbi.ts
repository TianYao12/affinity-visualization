// NCBI E-utilities API service for protein data retrieval
// Documentation: https://www.ncbi.nlm.nih.gov/books/NBK25497/

export interface ProteinSearchResult {
  id: string;
  title: string;
  organism: string;
  length: number;
  accession: string;
}

export interface ProteinSequence {
  id: string;
  accession: string;
  title: string;
  organism: string;
  sequence: string;
  length: number;
  molecularWeight?: number;
  features?: string[];
}

const NCBI_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';

// Search for proteins by name or keyword
export async function searchProteins(
  query: string, 
  maxResults: number = 10
): Promise<ProteinSearchResult[]> {
  try {
    // Step 1: Search for protein IDs
    const searchUrl = `${NCBI_BASE_URL}esearch.fcgi?db=protein&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.status}`);
    }
    
    const searchData = await searchResponse.json();
    const idList = searchData.esearchresult?.idlist || [];
    
    if (idList.length === 0) {
      return [];
    }
    
    // Step 2: Get summary information for the proteins
    const summaryUrl = `${NCBI_BASE_URL}esummary.fcgi?db=protein&id=${idList.join(',')}&retmode=json`;
    
    const summaryResponse = await fetch(summaryUrl);
    if (!summaryResponse.ok) {
      throw new Error(`Summary fetch failed: ${summaryResponse.status}`);
    }
    
    const summaryData = await summaryResponse.json();
    
    const results: ProteinSearchResult[] = [];
    
    for (const id of idList) {
      const proteinInfo = summaryData.result?.[id];
      if (proteinInfo) {
        results.push({
          id: id,
          title: proteinInfo.title || 'Unknown protein',
          organism: proteinInfo.organism || 'Unknown organism',
          length: proteinInfo.slen || 0,
          accession: proteinInfo.caption || proteinInfo.accessionversion || id
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error searching proteins:', error);
    throw new Error('Failed to search proteins. Please check your internet connection.');
  }
}

// Fetch full protein sequence by ID
export async function fetchProteinSequence(proteinId: string): Promise<ProteinSequence | null> {
  try {
    // Fetch FASTA format sequence
    const fastaUrl = `${NCBI_BASE_URL}efetch.fcgi?db=protein&id=${proteinId}&rettype=fasta&retmode=text`;
    
    const fastaResponse = await fetch(fastaUrl);
    if (!fastaResponse.ok) {
      throw new Error(`FASTA fetch failed: ${fastaResponse.status}`);
    }
    
    const fastaText = await fastaResponse.text();
    
    // Parse FASTA format
    const lines = fastaText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('Invalid FASTA format');
    }
    
    const header = lines[0];
    const sequence = lines.slice(1).join('').replace(/\s/g, '');
    
    // Parse header for metadata
    const headerMatch = header.match(/^>(\S+)\s+(.+)$/);
    const accession = headerMatch?.[1] || proteinId;
    const description = headerMatch?.[2] || 'Unknown protein';
    
    // Extract organism if available
    const organismMatch = description.match(/\[([^\]]+)\]$/);
    const organism = organismMatch?.[1] || 'Unknown organism';
    
    // Clean title (remove organism part)
    const title = description.replace(/\s*\[([^\]]+)\]$/, '');
    
    return {
      id: proteinId,
      accession: accession,
      title: title,
      organism: organism,
      sequence: sequence,
      length: sequence.length,
      features: []
    };
    
  } catch (error) {
    console.error('Error fetching protein sequence:', error);
    return null;
  }
}

// Fetch protein sequence by accession number (e.g., "NP_000001")
export async function fetchProteinByAccession(accession: string): Promise<ProteinSequence | null> {
  try {
    // First search for the accession to get the ID
    const searchResults = await searchProteins(accession, 1);
    
    if (searchResults.length === 0) {
      throw new Error(`No protein found with accession: ${accession}`);
    }
    
    // Fetch the full sequence using the ID
    return await fetchProteinSequence(searchResults[0].id);
    
  } catch (error) {
    console.error('Error fetching protein by accession:', error);
    return null;
  }
}

// Get popular/example proteins for the interface
export function getExampleProteins(): Array<{name: string, query: string, description: string}> {
  return [
    {
      name: "COVID-19 Spike Protein",
      query: "SARS-CoV-2 spike protein",
      description: "SARS-CoV-2 surface glycoprotein for vaccine development"
    },
    {
      name: "Human Insulin",
      query: "human insulin",
      description: "Hormone regulating blood glucose levels"
    },
    {
      name: "p53 Tumor Suppressor",
      query: "human p53 tumor suppressor",
      description: "Guardian of the genome protein"
    },
    {
      name: "Hemoglobin Alpha",
      query: "human hemoglobin alpha",
      description: "Oxygen-carrying protein in red blood cells"
    },
    {
      name: "EGFR Kinase",
      query: "human EGFR kinase domain",
      description: "Epidermal growth factor receptor for cancer research"
    },
    {
      name: "ACE2 Receptor",
      query: "human ACE2 receptor",
      description: "SARS-CoV-2 cellular entry point"
    }
  ];
}

// Validate protein sequence format
export function validateProteinSequence(sequence: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const cleanSeq = sequence.replace(/\s/g, '').toUpperCase();
  
  // Check if empty
  if (cleanSeq.length === 0) {
    errors.push('Sequence cannot be empty');
  }
  
  // Check for valid amino acid characters
  const validAAs = 'ACDEFGHIKLMNPQRSTVWY';
  const ambiguousCodes = 'BJOUXZ*-';
  const allValid = validAAs + ambiguousCodes;
  
  for (let i = 0; i < cleanSeq.length; i++) {
    const char = cleanSeq[i];
    if (!allValid.includes(char)) {
      errors.push(`Invalid character '${char}' at position ${i + 1}`);
      if (errors.length > 10) {
        errors.push('... and more invalid characters');
        break;
      }
    }
  }
  
  // Check length bounds
  if (cleanSeq.length < 10) {
    errors.push('Sequence too short (minimum 10 amino acids)');
  } else if (cleanSeq.length > 50000) {
    errors.push('Sequence too long (maximum 50,000 amino acids)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}