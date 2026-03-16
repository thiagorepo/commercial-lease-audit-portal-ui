import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, ChevronDown } from 'lucide-react';
import { StatusBadge, PriorityBadge } from '@/components/custom/StatusBadge';
import { VarianceIndicator } from '@/components/custom/VarianceIndicator';
import { Timeline, statusHistoryToTimelineItems } from '@/components/custom/Timeline';
import { discrepancies, users } from '@/data/mock';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import type { DiscrepancyStatus } from '@/types';

export function DiscrepancyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const disc = discrepancies.find(d => d.id === id);

  const [status, setStatus] = useState<DiscrepancyStatus>('open');
  const [reassignOpen, setReassignOpen] = useState(false);
  const [assignedUser, setAssignedUser] = useState('');
  const [comments, setComments] = useState<Array<{ id: string; userName: string; createdAt: string; content: string }>>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (disc) {
      setStatus(disc.status);
      setAssignedUser(disc.assignedTo ?? '');
      setComments(disc.notes ?? []);
    }
  }, [id]);

  if (!disc) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Discrepancy not found.</p>
        <Link to="/discrepancies" className="text-primary hover:text-primary text-sm font-medium mt-2 inline-block">Back to Discrepancies</Link>
      </div>
    );
  }

  const statusHistory = statusHistoryToTimelineItems(disc.statusHistory);

  const transition = (next: DiscrepancyStatus, message: string) => {
    setStatus(next);
    toast.success(message);
  };

  const actions: Record<string, { label: string; color: string; onClick: () => void }[]> = {
    open: [
      { label: 'Start Review', color: 'bg-primary hover:bg-primary/90 text-white', onClick: () => transition('pending', 'Status updated to Pending Review') },
      { label: 'Dismiss', color: 'border border-border text-muted-foreground hover:bg-accent', onClick: () => transition('dismissed', 'Discrepancy dismissed') },
    ],
    pending: [
      { label: 'Resolve', color: 'bg-success-500 hover:bg-success-600 text-white', onClick: () => transition('resolved', 'Discrepancy resolved') },
      { label: 'Mark False Positive', color: 'border border-border text-muted-foreground hover:bg-accent', onClick: () => transition('false-positive', 'Marked as false positive') },
      { label: 'Dismiss', color: 'border border-border text-muted-foreground hover:bg-accent', onClick: () => transition('dismissed', 'Discrepancy dismissed') },
    ],
    resolved: [
      { label: 'Record Recovery', color: 'bg-success-500 hover:bg-success-600 text-white', onClick: () => transition('recovered', 'Recovery recorded') },
    ],
  };

  const currentActions = actions[status] || [];

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => navigate('/discrepancies')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Discrepancies
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground font-mono">{disc.id.toUpperCase()}</h1>
            <StatusBadge status={status} />
            <PriorityBadge priority={disc.priority} />
          </div>
          {currentActions.length > 0 && (
            <div className="flex gap-2">
              {currentActions.map(a => (
                <button key={a.label} onClick={a.onClick} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${a.color}`}>
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Description</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{disc.description}</p>
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-muted text-foreground/80 capitalize">
                {disc.category.replace(/-/g, ' ')}
              </span>
              <Link to={`/leases/${disc.leaseId}`} className="text-sm text-primary hover:text-primary font-medium">
                {disc.leaseNumber} — {disc.tenantName}
              </Link>
              <span className="text-xs text-muted-foreground/70">{disc.propertyName}</span>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Financial Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Expected Amount</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(disc.expectedAmount)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Actual Amount</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(disc.actualAmount)}</p>
              </div>
              <div className="p-3 bg-error-50 rounded-lg border border-error-100">
                <p className="text-xs text-muted-foreground mb-1">Variance</p>
                <VarianceIndicator amount={disc.variance} percent={disc.variancePercent} />
              </div>
            </div>
          </div>

          {(status === 'recovered' || disc.status === 'recovered') && disc.recoveredAmount !== undefined && (
            <div className="bg-success-50 border border-success-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-success-600" />
                <h3 className="text-sm font-semibold text-success-800">Recovery Recorded</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-success-600">Recovered Amount</p>
                  <p className="text-lg font-bold text-success-800">{formatCurrency(disc.recoveredAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-success-600">Recovery Date</p>
                  <p className="text-sm font-semibold text-success-800">{disc.recoveryDate ? formatDate(disc.recoveryDate) : '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-success-600">Recovery Rate</p>
                  <p className="text-lg font-bold text-success-800">{disc.variance !== 0 ? Math.round((disc.recoveredAmount / disc.variance) * 100) : 0}%</p>
                </div>
              </div>
              {disc.recoveryNotes && <p className="mt-3 text-sm text-success-700">{disc.recoveryNotes}</p>}
            </div>
          )}

          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Comments ({comments.length})</h3>
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground/70">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {comments.map(note => (
                  <div key={note.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                      {note.userName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{note.userName}</span>
                        <span className="text-xs text-muted-foreground/70">{formatDateTime(note.createdAt)}</span>
                      </div>
                      <p className="text-sm text-foreground/80">{note.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newComment.trim()) {
                    setComments(p => [...p, {
                      id: Date.now().toString(),
                      userName: 'You',
                      createdAt: new Date().toISOString(),
                      content: newComment
                    }]);
                    setNewComment('');
                    toast.success('Comment added');
                  }
                }}
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring"
              />
              <button
                onClick={() => {
                  if (newComment.trim()) {
                    setComments(p => [...p, {
                      id: Date.now().toString(),
                      userName: 'You',
                      createdAt: new Date().toISOString(),
                      content: newComment
                    }]);
                    setNewComment('');
                    toast.success('Comment added');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Assignment</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                {disc.assignedTo.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{assignedUser}</p>
                <p className="text-xs text-muted-foreground">Assigned Auditor</p>
              </div>
            </div>
            <div className="relative">
              <button onClick={() => setReassignOpen(o => !o)} className="w-full flex items-center justify-between py-2 px-3 border border-border rounded-lg text-sm text-muted-foreground hover:bg-accent transition-colors">
                <span>Reassign</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground/70" />
              </button>
              {reassignOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setReassignOpen(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-xl py-1 max-h-48 overflow-y-auto">
                    {users.filter(u => u.status === 'active').map(u => (
                      <button key={u.id} onClick={() => { setAssignedUser(u.name); setReassignOpen(false); toast.success(`Reassigned to ${u.name}`); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                          {u.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                        </div>
                        {assignedUser === u.name && <CheckCircle className="w-4 h-4 text-primary ml-auto shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Status History</h3>
            <Timeline items={statusHistory} />
          </div>

          {disc.relatedDocuments.length > 0 && (
            <div className="bg-card rounded-xl border border-border shadow-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Related Documents</h3>
              <ul className="space-y-2">
                {disc.relatedDocuments.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
