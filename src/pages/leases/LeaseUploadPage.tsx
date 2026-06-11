import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/custom/PageHeader';
import { ConfidenceMeter } from '@/components/custom/ConfidenceMeter';
import { documentService } from '@/services/document.service';
import { termExtractionService, type ExtractedTerm } from '@/services/term-extraction.service';
import { cn } from '@/lib/utils';

type UploadState = 'idle' | 'selected' | 'uploading' | 'processing' | 'success' | 'error';

const steps = ['Upload', 'Extracting Terms', 'Validating Data', 'Complete'];

function StepIndicators({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                i < currentStep
                  ? 'bg-success text-white'
                  : i === currentStep
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {i < currentStep ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={cn(
                'text-xs mt-1.5 font-medium',
                i <= currentStep ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 w-8 sm:w-12 mb-5 transition-colors',
                i < currentStep ? 'bg-success' : 'bg-muted'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function LeaseUploadPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<UploadState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [extractedTerms, setExtractedTerms] = useState<ExtractedTerm[]>([]);
  const [createdLeaseId, setCreatedLeaseId] = useState<string>('');
  const [createdDocId, setCreatedDocId] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setState('selected');
    setErrorMessage('');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;
    setState('uploading');
    setProgress(10);
    setErrorMessage('');

    try {
      // Use a placeholder leaseId -- in a real flow, the user would select or create a lease first.
      // For now, generate a temp leaseId to wire the service.
      const leaseId = crypto.randomUUID();
      setCreatedLeaseId(leaseId);

      setProgress(30);

      const result = await documentService.uploadAndProcess(file, leaseId);
      setCreatedDocId(result.id);

      if (cancelledRef.current) return;

      setProgress(60);
      setState('processing');
      setCurrentStep(1);

      if (result.status === 'failed') {
        throw new Error(result.error ?? 'Document processing failed');
      }

      // Extract terms from the processed document
      const extractionResult = await termExtractionService.extractTerms(
        result.id,
        leaseId,
      );

      if (cancelledRef.current) return;

      setExtractedTerms(extractionResult.terms);
      setCurrentStep(2);

      // Brief pause for validation step UX
      await new Promise<void>((resolve) => {
        if (cancelledRef.current) { resolve(); return; }
        setTimeout(resolve, 1200);
      });

      if (cancelledRef.current) return;

      setCurrentStep(3);
      setProgress(100);

      await new Promise<void>((resolve) => {
        if (cancelledRef.current) { resolve(); return; }
        setTimeout(resolve, 800);
      });

      if (cancelledRef.current) return;

      setState('success');
      setCurrentStep(4);
    } catch (err) {
      if (cancelledRef.current) return;
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
      setState('error');
    }
  };

  const handleReset = () => {
    setState('idle');
    setFile(null);
    setProgress(0);
    setCurrentStep(0);
    setErrorMessage('');
    setExtractedTerms([]);
    setCreatedLeaseId('');
    setCreatedDocId('');
  };

  // Map extracted terms to the display format
  const termDisplayItems = extractedTerms.map((t) => ({
    label: t.field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
    value: t.value,
    confidence: Math.round(t.confidence * 100),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/leases')}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <PageHeader title="Upload Lease Document" description="Add a new lease document to your portfolio" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {state === 'idle' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
                dragOver
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/70 hover:bg-accent'
              )}
            >
              <UploadCloud className={cn('w-12 h-12 mx-auto mb-4', dragOver ? 'text-primary' : 'text-muted-foreground/70')} />
              <p className="text-base font-medium text-foreground/80 mb-2">
                {dragOver ? 'Drop file here' : 'Drag and drop your file here, or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground/70">Supports PDF, DOC, DOCX, XLS, XLSX (max 25MB)</p>
              <input ref={inputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          )}

          {state === 'selected' && file && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg border border-border">
                <FileText className="w-8 h-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={handleReset} className="p-1 text-muted-foreground/70 hover:text-error-600 transition-colors">
                  <span className="sr-only">Remove file</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-2 block">Property</label>
                  <select className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground/80">
                    <option>One Harbor Plaza</option>
                    <option>Midtown Tower</option>
                    <option>Capital Square Office Park</option>
                    <option>Brickell Financial Center</option>
                    <option>Galleria Trade Center</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-2 block">Tenant Name</label>
                  <input type="text" placeholder="Enter tenant name" className="w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-2 block">Document Type</label>
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
                  <p className="text-xs text-muted-foreground">
                    {progress < 60 ? `Uploading... ${progress}%` : 'Processing...'}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <button disabled className="w-full py-2.5 bg-muted text-muted-foreground/70 text-sm font-medium rounded-lg cursor-not-allowed">
                <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                Uploading &amp; processing...
              </button>
            </div>
          )}

          {(state === 'processing') && (
            <div className="py-4 space-y-4">
              <p className="text-sm font-medium text-foreground/80 mb-4">Processing document...</p>
              <StepIndicators currentStep={currentStep} />
            </div>
          )}

          {state === 'success' && (
            <div className="space-y-4">
              <StepIndicators currentStep={currentStep} />
              <div className="flex items-center gap-3 p-4 bg-success-50 border border-success-200 rounded-xl">
                <CheckCircle className="w-6 h-6 text-success-600 shrink-0" />
                <p className="text-sm font-medium text-success-700">Document processed successfully</p>
              </div>
              <button
                onClick={() => navigate('/leases')}
                className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Review Lease
              </button>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-error-50 border border-error-200 rounded-xl">
                <AlertCircle className="w-6 h-6 text-error-600 shrink-0" />
                <p className="text-sm font-medium text-error-700">
                  {errorMessage || 'Upload failed. Please check the file and try again.'}
                </p>
              </div>
              <button onClick={handleReset} className="w-full py-2.5 bg-error-500 text-white text-sm font-medium rounded-lg hover:bg-error-600 transition-colors">
                Try Again
              </button>
            </div>
          )}
        </div>

        {state === 'success' && termDisplayItems.length > 0 && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Extracted Terms</p>
              {termDisplayItems.map(item => (
                <div key={item.label} className="space-y-2 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                  <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                  <p className="text-base font-semibold text-foreground">{item.value}</p>
                  <ConfidenceMeter value={item.confidence} showLabel />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
