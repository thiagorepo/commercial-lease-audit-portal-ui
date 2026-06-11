import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/event-bus';

/** Field names extractable from a lease document. */
export type ExtractableField =
  | 'leaseNumber'
  | 'startDate'
  | 'endDate'
  | 'baseRent'
  | 'camType'
  | 'squareFootage'
  | 'tenantName'
  | 'landlordName'
  | 'escalationRate'
  | 'renewalOption'
  | 'terminationClause';

export interface ExtractedTerm {
  field: ExtractableField;
  value: string;
  confidence: number; // 0-1
  source: 'ai' | 'manual' | 'ocr';
}

export interface TermExtractionResult {
  leaseId: string;
  terms: ExtractedTerm[];
  overallConfidence: number;
  extractedAt: string;
}

/** Database row shape for the extracted_terms table. */
interface ExtractedTermRow {
  id?: string;
  lease_id: string;
  document_id: string;
  field: ExtractableField;
  value: string;
  confidence: number;
  source: 'ai' | 'manual' | 'ocr';
  created_at?: string;
  updated_at?: string;
}

const TABLE = 'extracted_terms';

/**
 * Why: Generates mock extracted terms for development before AI pipeline is integrated.
 * What: Returns a static set of realistic lease terms with varied confidence scores.
 * Test: Assert the returned array has 11 items with fields matching ExtractableField union.
 */
function mockExtraction(): ExtractedTerm[] {
  return [
    { field: 'leaseNumber', value: 'LSE-2024-0042', confidence: 0.97, source: 'ai' },
    { field: 'startDate', value: '2024-01-01', confidence: 0.95, source: 'ai' },
    { field: 'endDate', value: '2029-12-31', confidence: 0.95, source: 'ai' },
    { field: 'baseRent', value: '8500.00', confidence: 0.92, source: 'ai' },
    { field: 'camType', value: 'triple-net', confidence: 0.89, source: 'ai' },
    { field: 'squareFootage', value: '5200', confidence: 0.94, source: 'ai' },
    { field: 'tenantName', value: 'Acme Corporation', confidence: 0.98, source: 'ai' },
    { field: 'landlordName', value: 'Metro Properties LLC', confidence: 0.91, source: 'ai' },
    { field: 'escalationRate', value: '3.0', confidence: 0.85, source: 'ai' },
    { field: 'renewalOption', value: 'true', confidence: 0.88, source: 'ai' },
    { field: 'terminationClause', value: '180-day written notice required', confidence: 0.82, source: 'ai' },
  ];
}

/**
 * Why: Averages confidence across terms to give auditors a single quality signal.
 * What: Computes the arithmetic mean of confidence values, or 0 if empty.
 * Test: Pass empty array -> 0. Pass [{confidence: 0.8}, {confidence: 1.0}] -> 0.9.
 */
function computeOverallConfidence(terms: ExtractedTerm[]): number {
  if (terms.length === 0) return 0;
  const sum = terms.reduce((acc, t) => acc + t.confidence, 0);
  return Math.round((sum / terms.length) * 100) / 100;
}

/**
 * Why: Maps an ExtractedTerm to a database row for a given lease and document.
 * What: Returns a plain object matching the extracted_terms table schema.
 * Test: Assert returned object has lease_id and document_id matching inputs.
 */
function toRow(term: ExtractedTerm, leaseId: string, documentId: string): ExtractedTermRow {
  return {
    lease_id: leaseId,
    document_id: documentId,
    field: term.field,
    value: term.value,
    confidence: term.confidence,
    source: term.source,
  };
}

/**
 * Why: Maps a database row back to the domain ExtractedTerm type.
 * What: Picks and renames relevant columns from the Supabase row shape.
 * Test: Pass a row with snake_case keys, assert output uses camelCase field names.
 */
function fromRow(row: ExtractedTermRow): ExtractedTerm {
  return {
    field: row.field,
    value: row.value,
    confidence: row.confidence,
    source: row.source,
  };
}

export const termExtractionService = {
  /**
   * Why: Core extraction pipeline -- fetches document, extracts terms (mock for now),
   *      persists results, and notifies subscribers.
   * What: Returns TermExtractionResult with all extracted terms and overall confidence.
   * Test: Call with valid IDs, assert terms array is non-empty and event was emitted.
   */
  async extractTerms(
    documentId: string,
    leaseId: string,
  ): Promise<TermExtractionResult> {
    // 1. Verify document exists
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // 2. Extract terms (mock for now -- will be replaced by AI pipeline)
    const terms = mockExtraction();
    const overallConfidence = computeOverallConfidence(terms);
    const extractedAt = new Date().toISOString();

    // 3. Delete previous extractions for this lease to avoid duplicates
    await supabase.from(TABLE).delete().eq('lease_id', leaseId);

    // 4. Persist extracted terms
    const rows = terms.map((t) => toRow(t, leaseId, documentId));
    const { error: insertError } = await supabase.from(TABLE).insert(rows);

    if (insertError) {
      throw new Error(`Failed to store extracted terms: ${insertError.message}`);
    }

    // 5. Emit event for downstream consumers
    const result: TermExtractionResult = {
      leaseId,
      terms,
      overallConfidence,
      extractedAt,
    };

    eventBus.emit('terms.extracted', result);

    return result;
  },

  /**
   * Why: Allows auditors to correct AI-extracted values, improving accuracy over time.
   * What: Updates a single term's value and sets source to 'manual'.
   * Test: Call with a corrected value, then getExtractedTerms -- assert value and source updated.
   */
  async reviewTerm(
    leaseId: string,
    field: ExtractableField,
    correctedValue: string,
  ): Promise<ExtractedTerm> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ value: correctedValue, source: 'manual' as const })
      .eq('lease_id', leaseId)
      .eq('field', field)
      .select()
      .single();

    if (error || !data) {
      throw new Error(
        `Failed to update term "${field}" for lease ${leaseId}: ${error?.message ?? 'not found'}`,
      );
    }

    const updated = fromRow(data as ExtractedTermRow);

    eventBus.emit('terms.reviewed', { leaseId, field, correctedValue });

    return updated;
  },

  /**
   * Why: Retrieves stored extraction results for display in the audit UI.
   * What: Fetches all extracted terms for a lease from the database.
   * Test: Insert terms for a lease, call this, assert matching count and values.
   */
  async getExtractedTerms(leaseId: string): Promise<ExtractedTerm[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('lease_id', leaseId)
      .order('field');

    if (error) {
      throw new Error(
        `Failed to fetch terms for lease ${leaseId}: ${error.message}`,
      );
    }

    return ((data as ExtractedTermRow[]) ?? []).map(fromRow);
  },

  /**
   * Why: Supports re-extraction after document updates or when initial extraction failed.
   * What: Deletes existing terms and re-runs extraction for the lease's latest document.
   * Test: Call after updating a document, assert new terms differ from previous extraction.
   */
  async reExtract(leaseId: string): Promise<TermExtractionResult> {
    // Find the latest lease document
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('lease_id', leaseId)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (docError || !doc) {
      throw new Error(`No document found for lease: ${leaseId}`);
    }

    return termExtractionService.extractTerms(doc.id, leaseId);
  },
};
