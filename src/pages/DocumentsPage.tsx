import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, File, Download, Trash2, Eye, Search } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { FileUploadModal } from '@/components/custom/FileUploadModal';
import { TableSkeleton } from '@/components/custom/TableSkeleton';
import { EmptyState } from '@/components/custom/EmptyState';
import { Pagination } from '@/components/custom/Pagination';
import { documents } from '@/data/mock';
import { formatDate } from '@/lib/utils';
import type { Document } from '@/types';
import { toast } from 'sonner';

export function DocumentsPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filteredDocs = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDownload = (doc: Document) => {
    toast.success(`Downloading ${doc.name}`);
  };

  const handleDelete = (doc: Document) => {
    toast.success(`Deleted ${doc.name}`);
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
          <TableSkeleton rows={10} columns={6} />
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
                      <td className="px-3 py-3 text-sm text-muted-foreground">{doc.uploadedBy}</td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">{formatDate(doc.uploadedAt)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-error-600 transition-colors"
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
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      <FileUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
