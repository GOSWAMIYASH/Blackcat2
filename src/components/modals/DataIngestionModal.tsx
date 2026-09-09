import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, CheckCircle2, AlertTriangle, ArrowRight, Database } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SAMPLE_CSV_DATA = `case_id,case_number,title,severity,status,created_at,triage_started_at,investigation_started_at,escalated_at,closed_at,entity_id,entity_name,assigned_analyst,classification,root_cause,escalation_tier
CASE-DEMO-01,SEC-2026-901,Suspicious PowerShell Execution,CRITICAL,CLOSED,2026-03-01T08:00:00Z,2026-03-01T08:15:00Z,2026-03-01T08:30:00Z,,2026-03-01T09:00:00Z,ENT-001,Power Grid Corp,ANL-01,True Positive,Malware Script,
CASE-DEMO-02,SEC-2026-902,Unauthorized Admin Access,HIGH,CLOSED,2026-03-01T10:00:00Z,2026-03-01T10:20:00Z,,,2026-03-01T10:24:00Z,ENT-002,State Defense Works,ANL-02,False Positive,,
CASE-DEMO-03,SEC-2026-903,Database Query Exfiltration,CRITICAL,INVESTIGATING,2026-02-28T04:00:00Z,2026-02-28T04:30:00Z,2026-02-28T05:00:00Z,,,ENT-003,Reserve Bank System,ANL-03,True Positive,,`;

export const DataIngestionModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('text/csv');
  const [isIngesting, setIsIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const type = file.name.endsWith('.json') ? 'application/json' : 'text/csv';
    setMimeType(type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setFileName('sample_soc_evidence.csv');
    setMimeType('text/csv');
    setFileContent(SAMPLE_CSV_DATA);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!fileContent.trim()) {
      setError('Please select a file or load sample evidence data');
      return;
    }

    setIsIngesting(true);
    setError(null);

    try {
      const res = await api.uploadSOCData(fileContent, mimeType);
      setValidationResult(res.ingestion);
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Ingestion failed');
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-red-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Ingest SOC Operational Evidence Dataset
              </h2>
              <p className="text-xs text-zinc-400">
                Upload CSV or JSON files for schema validation, workflow reconstruction, and execution gap analysis.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone & Load Sample */}
        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2"
          >
            <UploadCloud className="w-8 h-8 text-zinc-500" />
            <div className="text-xs font-semibold text-zinc-200">
              {fileName ? fileName : 'Click to select CSV or JSON log file'}
            </div>
            <p className="text-[11px] text-zinc-500">
              Supports standard SIEM / Ticketing exports (Case IDs, timestamps, entity IDs, statuses)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Want to test ingestion without custom files?</span>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-xs font-semibold text-red-400 hover:text-red-300 transition underline flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Load Verified SOC Sample Dataset</span>
            </button>
          </div>

          {/* Content Preview */}
          {fileContent && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span>Payload Preview ({mimeType})</span>
                <span>{fileContent.split('\n').length} lines</span>
              </div>
              <pre className="text-[10px] font-mono text-zinc-300 max-h-32 overflow-y-auto bg-zinc-950 p-2 rounded border border-zinc-850">
                {fileContent.slice(0, 1000)}...
              </pre>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {validationResult && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>
                Successfully ingested {validationResult.normalizedCases.length} cases and recomputed all supervisory findings!
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isIngesting || !fileContent}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white font-semibold text-xs transition shadow-md disabled:opacity-50"
          >
            {isIngesting ? 'Normalizing & Computing...' : 'Run Normalization & Ingest'}
          </button>
        </div>
      </div>
    </div>
  );
};
