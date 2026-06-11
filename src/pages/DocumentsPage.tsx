import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Upload, File, Download, Trash2, Eye, Search, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { FileUploadModal } from '@/components/custom/FileUploadModal';
import { TableSkeleton } from '@/components/custom/TableSkeleton';
import { EmptyState } from '@/components/custom/EmptyState';
import { Pagination } from '@/components/custom/Pagination';
import { documentService, type ProcessDocumentResult } from '@/services/document.service';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

/** Display shape for the documents table. */
interface DocumentListItem {
  id: string;
  name: string;
  type: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  status: ProcessDocumentResult['status'];
}

/** Map service result to display-friendly row with fallbacks for missing fields. */
function toListItem(result: ProcessDocumentResult): DocumentListItem {
  const meta = result.metadata ?? {};
  return {
    id: result.id,
    name: meta.name ?? result.id,
    type: meta.type ?? 'other',
    fileSize: meta.fileSize ?? '—',
    uploadedBy: meta.uploadedBy ?? '—',
    uploadedAt: meta.uploadedAt ?? new Date().toISOString(),
    status: result.status,
  };
}

export function DocumentsPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocumentListItem[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [retiring, setRetrying] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  /** Default lease id for fetching documents. Will be replaced by context/routing. */
  const DEFAULT_LEASE_ID = 'lease-1';

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const results = await documentService.getDocuments(DEFAULT_LEASE_ID);
      setDocs(results.map(toListItem));
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      toast.error('Failed to load documents.');
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocs = docs.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownload = (doc: DocumentListItem) => {
    toast.success(`Downloading ${doc.name}`);
  };

  const handleDelete = async (doc: DocumentListItem) => {
    if (deleting) return;
    setDeleting(doc.id);
    try {
      await documentService.deleteDocument(doc.id);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      toast.success(`Deleted ${doc.name}`);
    } catch (err) {
      console.error('Failed to delete document:', err);
      toast.error(`Failed to delete ${doc.name}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleRetry = async (doc: DocumentListItem) => {
    if (retiring) return;
    setRetrying(doc.id);
    try {
      const result = await documentService.retryProcessing(doc.id);
      setDocs(prev =>
        prev.map(d => d.id === doc.id ? toListItem(result) : d),
      );
      toast.success(`Retrying processing for ${doc.name}`);
    } catch (err) {
      console.error('Failed to retry processing:', err);
      toast.error(`Failed to retry ${doc.name}`);
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Manage lease documents, invoices, and audit reports"
        actions={
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" /> Upload Document
          </button>
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={10} cols={6} />
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            icon={File}
            title="No documents found"
            description="Upload your first document to get started"
            action={{
              label: 'Upload Document',
              onClick: () => setUploadOpen(true),
            }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Name</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Type</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Size</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Uploaded By</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Date</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedDocs.map((doc) => (
                    <tr key={doc.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-foreground/80 capitalize">
                          {doc.type.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">{doc.fileSize}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium capitalize ${
                          doc.status === 'completed'
                            ? 'bg-success-50 text-success-700'
                            : doc.status === 'failed'
                              ? 'bg-error-50 text-error-700'
                              : 'bg-warning-50 text-warning-700'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">{doc.uploadedBy}</td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">{formatDate(doc.uploadedAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {doc.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(doc)}
                              disabled={retiring === doc.id}
                              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-warning-600 transition-colors disabled:opacity-50"
                              title="Retry processing"
                            >
                              <RefreshCw className={`w-4 h-4 ${retiring === doc.id ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            disabled={deleting === doc.id}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-error-600 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 border-t border-border/50">
                <Pagination
                  page={currentPage}
                  pageSize={itemsPerPage}
                  total={filteredDocs.length}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <FileUploadModal open={uploadOpen} onClose={() => { setUploadOpen(false); fetchDocuments(); }} />
    </div>
  );
}
