import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Search, Filter } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { TableSkeleton } from '@/components/custom/TableSkeleton';
import { EmptyState } from '@/components/custom/EmptyState';
import { Pagination } from '@/components/custom/Pagination';
import { StatusBadge } from '@/components/custom/StatusBadge';
import { invoices } from '@/data/mock';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export function InvoicesPage() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const statusCounts = {
    all: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    disputed: invoices.filter(i => i.status === 'disputed').length,
  };

  const handleDownload = (invoiceNumber: string) => {
    toast.success(`Downloading invoice ${invoiceNumber}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Track and manage all property invoices"
      />

      <div className="flex flex-wrap gap-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary text-white'
                : 'bg-muted text-foreground/80 hover:bg-muted/80'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card">
        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={15} columns={6} />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices found"
            description="No invoices match your current filters"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Invoice #</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Description</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-3">Status</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border/30 hover:bg-accent transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-primary">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="px-3 py-3 text-sm text-foreground">{invoice.description}</td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">{formatDate(invoice.date)}</td>
                      <td className="px-3 py-3 text-sm font-semibold text-foreground">{formatCurrency(invoice.amount)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => handleDownload(invoice.invoiceNumber)}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
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
    </div>
  );
}
