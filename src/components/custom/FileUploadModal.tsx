import { useState, useRef, useCallback, useEffect } from 'react';
import { X, UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfidenceMeter } from './ConfidenceMeter';
import { useNavigate } from 'react-router-dom';

type UploadState = 'idle' | 'selected' | 'uploading' | 'processing' | 'success' | 'error';

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = ['Upload', 'Extracting Terms', 'Validating Data', 'Complete'];

const extractedData = [
  { label: 'Base Rent', value: '$485,000 / year', confidence: 96 },
  { label: 'Lease Term', value: 'Jan 1, 2021 – Dec 31, 2026', confidence: 98 },
  { label: 'CAM Type', value: 'Triple Net (NNN)', confidence: 88 },
  { label: 'Square Footage', value: '22,500 sq ft', confidence: 94 },
];

export function FileUploadModal({ open, onClose }: FileUploadModalProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<UploadState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      timeoutRefs.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setState('selected');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleUpload = () => {
    setState('uploading');
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRefs.current.forEach(t => clearTimeout(t));
    timeoutRefs.current = [];

    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setState('processing');
          setCurrentStep(1);
          timeoutRefs.current.push(setTimeout(() => setCurrentStep(2), 1500));
          timeoutRefs.current.push(setTimeout(() => setCurrentStep(3), 3000));
          timeoutRefs.current.push(setTimeout(() => { setState('success'); setCurrentStep(4); }, 4500));
          return 100;
        }
        return p + 4;
      });
    }, 120);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    timeoutRefs.current.forEach(t => clearTimeout(t));
    timeoutRefs.current = [];
    setState('idle');
    setFile(null);
    setProgress(0);
    setCurrentStep(0);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in flex flex-col max-h-[90vh] sm:max-h-auto">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">Upload Lease Document</h2>
          <button onClick={handleClose} className="p-1 text-muted-foreground/70 hover:text-accent-foreground rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {state === 'idle' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
                dragOver
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/70 hover:bg-accent'
              )}
            >
              <UploadCloud className={cn('w-10 h-10 mx-auto mb-3', dragOver ? 'text-primary' : 'text-muted-foreground/70')} />
              <p className="text-sm font-medium text-foreground/80 mb-1">
                {dragOver ? 'Drop file here' : 'Drag and drop your file here, or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground/70">Supports PDF, DOC, DOCX, XLS, XLSX (max 25MB)</p>
              <input ref={inputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          )}

          {state === 'selected' && file && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
                <FileText className="w-8 h-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={handleReset} className="p-1 text-muted-foreground/70 hover:text-error-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground/80 mb-1 block">Property</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground/80">
                    <option>One Harbor Plaza</option>
                    <option>Midtown Tower</option>
                    <option>Capital Square Office Park</option>
                    <option>Brickell Financial Center</option>
                    <option>Galleria Trade Center</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/80 mb-1 block">Tenant Name</label>
                  <input type="text" placeholder="Enter tenant name" className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/80 mb-1 block">Document Type</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground/80">
                    <option>New Lease</option>
                    <option>Amendment</option>
                    <option>Renewal</option>
                    <option>Sublease</option>
                  </select>
                </div>
              </div>
              <button onClick={handleUpload} className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                Upload Document
              </button>
            </div>
          )}

          {state === 'uploading' && (
            <div className="py-6 space-y-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">Uploading... {progress}%</p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <button disabled className="w-full py-2.5 bg-muted text-muted-foreground/70 text-sm font-medium rounded-lg cursor-not-allowed">
                Uploading...
              </button>
            </div>
          )}

          {(state === 'processing') && (
            <div className="py-4 space-y-4">
              <p className="text-sm font-medium text-foreground/80 mb-4">Processing document...</p>
              {steps.map((step, i) => {
                const isDone = i < currentStep;
                const isActive = i === currentStep;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2',
                      isDone ? 'bg-success-500 border-success-500' : isActive ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    )}>
                      {isDone ? <CheckCircle className="w-4 h-4 text-white" /> : isActive ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" /> : <div className="w-2 h-2 rounded-full bg-muted" />}
                    </div>
                    <span className={cn('text-sm', isDone ? 'text-success-700 font-medium' : isActive ? 'text-primary font-medium' : 'text-muted-foreground/70')}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {state === 'success' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-success-50 border border-success-200 rounded-xl">
                <CheckCircle className="w-6 h-6 text-success-600 shrink-0" />
                <p className="text-sm font-medium text-success-700">Document processed successfully</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Extracted Terms</p>
                {extractedData.map(item => (
                  <div key={item.label} className="flex items-center gap-4 py-2 border-b border-border/50 last:border-0">
                    <div className="w-28 shrink-0">
                      <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                    <div className="flex-1">
                      <ConfidenceMeter value={item.confidence} showLabel />
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { handleClose(); navigate('/leases'); }}
                className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Review Lease
              </button>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-error-50 border border-error-200 rounded-xl">
                <AlertCircle className="w-6 h-6 text-error-600 shrink-0" />
                <p className="text-sm font-medium text-error-700">Upload failed. Please check the file and try again.</p>
              </div>
              <button onClick={handleReset} className="w-full py-2.5 bg-error-500 text-white text-sm font-medium rounded-lg hover:bg-error-600 transition-colors">
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
