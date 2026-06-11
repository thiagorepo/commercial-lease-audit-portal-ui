/**
 * Why: Centralizes document upload, text extraction, and lifecycle management
 *      so callers don't deal with storage + database + event emission separately.
 * What: Provides uploadAndProcess, getDocuments, getDocument, deleteDocument, retryProcessing.
 * Test: Mock supabase/storage calls, verify each method returns correct shape and emits events.
 */

import { supabase } from '@/lib/supabase';
import { uploadFile, deleteFile } from '@/lib/storage';
import { eventBus } from '@/lib/event-bus';

export interface ProcessDocumentResult {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  textContent?: string;
  metadata?: Record<string, string>;
  pageCount?: number;
  error?: string;
}

interface DocumentRow {
  id: string;
  lease_id: string;
  name: string;
  type: string;
  file_size: number;
  file_path: string;
  status: 'processing' | 'completed' | 'failed';
  text_content: string | null;
  metadata: Record<string, string> | null;
  page_count: number | null;
  error: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

const DOCUMENTS_TABLE = 'documents';
const STORAGE_BUCKET = 'lease-documents';

/** Placeholder text extraction — will be replaced by a Supabase Edge Function. */
function extractTextPlaceholder(fileName: string): {
  text: string;
  pageCount: number;
  metadata: Record<string, string>;
} {
  return {
    text: `[Extracted text from ${fileName} — placeholder for OCR/parsing pipeline]`,
    pageCount: 1,
    metadata: { extractionMethod: 'placeholder' },
  };
}

function toResult(row: DocumentRow): ProcessDocumentResult {
  return {
    id: row.id,
    status: row.status,
    textContent: row.text_content ?? undefined,
    metadata: (row.metadata as Record<string, string>) ?? undefined,
    pageCount: row.page_count ?? undefined,
    error: row.error ?? undefined,
  };
}

export const documentService = {
  /**
   * Why: Single entry point for uploading a file and kicking off processing.
   * What: Uploads to storage, inserts a DB row, runs text extraction, updates row, emits event.
   * Test: Mock uploadFile + supabase.from, assert result status is 'completed' and event emitted.
   */
  async uploadAndProcess(file: File, leaseId: string): Promise<ProcessDocumentResult> {
    const uploadResult = await uploadFile(file, STORAGE_BUCKET, `${leaseId}/${Date.now()}-${file.name}`);

    if (!uploadResult) {
      throw new Error(`Failed to upload file: ${file.name}`);
    }

    const { data: insertData, error: insertError } = await supabase
      .from(DOCUMENTS_TABLE)
      .insert({
        lease_id: leaseId,
        name: file.name,
        type: file.type,
        file_size: file.size,
        file_path: uploadResult.path,
        status: 'processing',
      })
      .select('id')
      .single();

    if (insertError || !insertData) {
      throw new Error(insertError?.message ?? 'Failed to create document record');
    }

    const documentId: string = insertData.id;

    try {
      const { text, pageCount, metadata } = extractTextPlaceholder(file.name);

      const { error: updateError } = await supabase
        .from(DOCUMENTS_TABLE)
        .update({
          status: 'completed',
          text_content: text,
          page_count: pageCount,
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (updateError) {
        throw updateError;
      }

      const result: ProcessDocumentResult = {
        id: documentId,
        status: 'completed',
        textContent: text,
        metadata,
        pageCount,
      };

      eventBus.emit('document.processed', result);
      return result;
    } catch (extractionError) {
      const errorMessage = extractionError instanceof Error ? extractionError.message : 'Unknown processing error';

      await supabase
        .from(DOCUMENTS_TABLE)
        .update({
          status: 'failed',
          error: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      const result: ProcessDocumentResult = {
        id: documentId,
        status: 'failed',
        error: errorMessage,
      };

      eventBus.emit('document.processed', result);
      return result;
    }
  },

  /**
   * Why: Lists all documents attached to a lease for the document management view.
   * What: Queries the documents table filtered by lease_id, ordered newest first.
   * Test: Mock supabase.from, assert returned array maps correctly to ProcessDocumentResult[].
   */
  async getDocuments(leaseId: string): Promise<ProcessDocumentResult[]> {
    const { data, error } = await supabase
      .from(DOCUMENTS_TABLE)
      .select('*')
      .eq('lease_id', leaseId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data as DocumentRow[]).map(toResult);
  },

  /**
   * Why: Fetches a single document's processing result for detail views.
   * What: Queries by primary key and returns the mapped result.
   * Test: Mock supabase.from, assert single result returned with correct id.
   */
  async getDocument(id: string): Promise<ProcessDocumentResult> {
    const { data, error } = await supabase
      .from(DOCUMENTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toResult(data as DocumentRow);
  },

  /**
   * Why: Removes a document record and its associated storage file on user delete.
   * What: Deletes the storage file first, then the database row, then emits event.
   * Test: Mock deleteFile + supabase.from, assert both called and event emitted.
   */
  async deleteDocument(id: string): Promise<void> {
    const { data, error: fetchError } = await supabase
      .from(DOCUMENTS_TABLE)
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const row = data as Pick<DocumentRow, 'file_path'>;

    if (row.file_path) {
      await deleteFile(STORAGE_BUCKET, row.file_path);
    }

    const { error: deleteError } = await supabase
      .from(DOCUMENTS_TABLE)
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    eventBus.emit('document.deleted', { id });
  },

  /**
   * Why: Allows users to retry processing on documents that previously failed.
   * What: Re-runs text extraction, updates status, emits event.
   * Test: Insert a failed row, call retryProcessing, assert status flips to 'completed'.
   */
  async retryProcessing(id: string): Promise<ProcessDocumentResult> {
    const { data, error: fetchError } = await supabase
      .from(DOCUMENTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const row = data as DocumentRow;

    const { text, pageCount, metadata } = extractTextPlaceholder(row.name);

    const { error: updateError } = await supabase
      .from(DOCUMENTS_TABLE)
      .update({
        status: 'completed',
        text_content: text,
        page_count: pageCount,
        metadata,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const result: ProcessDocumentResult = {
      id,
      status: 'completed',
      textContent: text,
      metadata,
      pageCount,
    };

    eventBus.emit('document.processed', result);
    return result;
  },
};
