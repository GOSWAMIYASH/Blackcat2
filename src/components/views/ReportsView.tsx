import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { SeverityBadge } from '../common/SeverityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import { FileCheck2, Printer, Download, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Check } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await api.getAssessmentDossier();
        setDossier(data);
      } catch (err) {
        console.error('Failed to load dossier:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!dossier) return;
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAT-SA-Assessment-Dossier-${dossier.metadata.reportId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || !dossier) {
    return (
      <div className="py-16 text-center text-xs text-zinc-500 font-mono">
        Generating Supervisory Assessment Dossier...
      </div>
    );
  }

  const { metadata, executiveSummary, findingsDossier, negativeSpaceSummary, examinerDecisionLog, recommendations } = dossier;

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Top Action Bar (hidden in print mode) */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 print:hidden">
        <div>
          <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <span>Formal Periodic Assessment Dossier</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tamper-evident evidentiary summary designed for regulatory presentation, compliance review, and supervisory filing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white font-semibold text-xs transition shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Formal Dossier Document */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-8 space-y-8 shadow-xl print:border-none print:p-0 print:bg-white print:text-black">
        {/* Document Header */}
        <div className="border-b border-zinc-800 pb-6 print:border-black">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-wider text-zinc-100 print:text-black">SAT-SA</span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-red-400 font-bold print:border-black print:text-black">
                  SIH26157
                </span>
              </div>
              <h2 className="text-sm font-semibold text-zinc-300 mt-1 uppercase tracking-wider print:text-black">
                SOC Supervisory Assessment Dossier & Evidence Audit
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 print:text-zinc-600">
                Periodic Operational Workflow Reconstruction & Execution-Gap Analysis
              </p>
            </div>

            <div className="text-right text-xs font-mono text-zinc-400 space-y-1 print:text-zinc-700">
              <div><strong>Dossier ID:</strong> {metadata.reportId}</div>
              <div><strong>Generated:</strong> {new Date(metadata.generatedAt).toLocaleString()}</div>
              <div><strong>Lead Examiner:</strong> {metadata.examiner}</div>
              <div><strong>Evaluation Period:</strong> {metadata.evaluationPeriod}</div>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 border-b border-zinc-800 pb-1 print:text-black print:border-black">
            1. Executive Assessment Summary
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed print:text-zinc-800">
            {executiveSummary.supervisoryOverview}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 print:bg-zinc-100 print:border-zinc-300">
              <span className="text-[10px] uppercase font-mono text-zinc-400 print:text-zinc-600">Total Entities</span>
              <div className="text-lg font-bold text-zinc-100 print:text-black">{executiveSummary.totalEntities}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 print:bg-zinc-100 print:border-zinc-300">
              <span className="text-[10px] uppercase font-mono text-zinc-400 print:text-zinc-600">Cases Reconstructed</span>
              <div className="text-lg font-bold text-zinc-100 print:text-black">{executiveSummary.totalCases}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 print:bg-zinc-100 print:border-zinc-300">
              <span className="text-[10px] uppercase font-mono text-zinc-400 print:text-zinc-600">Supervisory Signals</span>
              <div className="text-lg font-bold text-red-400 print:text-red-700">{executiveSummary.totalFindings}</div>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 print:bg-zinc-100 print:border-zinc-300">
              <span className="text-[10px] uppercase font-mono text-zinc-400 print:text-zinc-600">SLA Breach Exposure</span>
              <div className="text-lg font-bold text-amber-400 print:text-amber-700">{executiveSummary.slaBreachRate}%</div>
            </div>
          </div>
        </div>

        {/* Section 2: Negative-Space Matrix Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 border-b border-zinc-800 pb-1 print:text-black print:border-black">
            2. Negative-Space Operational Matrix Summary
          </h3>
          <p className="text-xs text-zinc-400 print:text-zinc-700">
            Lifecycle phase completeness verification across evaluated critical infrastructure sectors.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase print:border-black print:text-black">
                  <th className="py-2 px-3">Entity</th>
                  <th className="py-2 px-3">Investigation</th>
                  <th className="py-2 px-3">Escalation</th>
                  <th className="py-2 px-3">Closure</th>
                  <th className="py-2 px-3 text-right">Signals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 font-sans print:divide-zinc-300">
                {negativeSpaceSummary.map((row: any) => (
                  <tr key={row.entityId}>
                    <td className="py-2 px-3 font-semibold text-zinc-200 print:text-black">{row.entityName}</td>
                    <td className="py-2 px-3 font-mono text-xs">{row.investigationStatus}</td>
                    <td className="py-2 px-3 font-mono text-xs">{row.escalationStatus}</td>
                    <td className="py-2 px-3 font-mono text-xs">{row.closureStatus}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">{row.findingCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Detailed Supervisory Findings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 border-b border-zinc-800 pb-1 print:text-black print:border-black">
            3. Detailed Supervisory Findings Dossier
          </h3>

          <div className="space-y-4">
            {findingsDossier.map((f: any) => (
              <div
                key={f.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-2.5 print:bg-zinc-50 print:border-zinc-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-zinc-200 print:text-black">{f.id}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-300 print:text-black">{f.entityName}</span>
                    <span className="text-zinc-500">• Case {f.caseNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={f.severity} size="sm" />
                    <CategoryBadge category={f.category} size="sm" />
                  </div>
                </div>

                <div className="font-semibold text-zinc-100 text-xs print:text-black">{f.title}</div>
                <p className="text-xs text-zinc-300 print:text-zinc-700">{f.whatHappened}</p>

                <div className="pt-2 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] print:border-zinc-300">
                  <div>
                    <strong className="text-zinc-400 block mb-0.5 print:text-zinc-600">Expected vs Observed Workflow:</strong>
                    <div className="font-mono text-zinc-300 text-[10px] print:text-black">
                      Exp: {f.expectedWorkflow.join(' → ')}
                    </div>
                    <div className="font-mono text-red-300 text-[10px] print:text-red-700">
                      Obs: {f.observedWorkflow.join(' → ')}
                    </div>
                  </div>

                  <div>
                    <strong className="text-zinc-400 block mb-0.5 print:text-zinc-600">Examiner Review Status:</strong>
                    <div className="font-mono font-bold text-zinc-200 print:text-black">
                      {f.reviewStatus} (Score: {f.priorityScore}/100)
                    </div>
                    {f.reviewDecision?.notes && (
                      <div className="italic text-zinc-400 text-[10px] mt-0.5 print:text-zinc-700">
                        "{f.reviewDecision.notes}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Supervisory Recommendations */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 border-b border-zinc-800 pb-1 print:text-black print:border-black">
            4. Supervisory Directives & Corrective Actions
          </h3>
          <ul className="space-y-2 text-xs text-zinc-300 print:text-zinc-800 list-disc pl-5">
            {recommendations.map((rec: string, i: number) => (
              <li key={i} className="leading-relaxed">
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* Sign-off Block */}
        <div className="border-t border-zinc-800 pt-8 mt-12 grid grid-cols-2 gap-8 text-xs font-mono text-zinc-400 print:border-black print:text-black">
          <div>
            <div className="border-b border-zinc-700 w-48 mb-2 pb-8 print:border-black" />
            <div><strong>Examiner Signature</strong></div>
            <div>Dr. Arunima Sen (Lead Examiner)</div>
            <div>Cert-In / Supervisory Cyber Oversight</div>
          </div>
          <div className="text-right">
            <div className="border-b border-zinc-700 w-48 mb-2 pb-8 ml-auto print:border-black" />
            <div><strong>Verification Date</strong></div>
            <div>{new Date().toLocaleDateString()}</div>
            <div>SAT-SA Cryptographic Record ID: {metadata.reportId}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
