import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Table,
  X,
} from 'lucide-react';
import { GOOGLE_SHEET_URL } from '../config/appsScriptUrl';
import {
  fetchAdminSheetData,
  resolveVerifiedSheetUrls,
} from '../services/employeeApi';
import type { AdminSheetRow } from '../types/employee';

export interface VerifiedAdminSession {
  adminKey: string;
  sheetName: string;
  tabUrl: string;
  spreadsheetUrl: string;
  rows: AdminSheetRow[];
}

interface AdminSheetModalProps {
  isOpen: boolean;
  adminSession: VerifiedAdminSession | null;
  onVerified: (session: VerifiedAdminSession) => void;
  onLock: () => void;
  onClose: () => void;
  onOpenSetupGuide: () => void;
  onSelectEhrms?: (ehrmsCode: string) => void;
}

const PAGE_SIZE = 25;

export function AdminSheetModal({
  isOpen,
  adminSession,
  onVerified,
  onLock,
  onClose,
  onOpenSetupGuide,
  onSelectEhrms,
}: AdminSheetModalProps) {
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsScriptUpdate, setNeedsScriptUpdate] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpRowInput, setJumpRowInput] = useState('');
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const rows = adminSession?.rows ?? [];
  const sheetName = adminSession?.sheetName ?? 'EmployeeData';

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const loadSheetData = async (keyToUse: string) => {
    setIsLoading(true);
    setError(null);
    setNeedsScriptUpdate(false);

    try {
      const res = await fetchAdminSheetData(keyToUse);
      if (!res.success) {
        if (res.error === 'EHRMS code is required.') {
          setNeedsScriptUpdate(true);
          setError(
            'Your deployed Google Apps Script does not include the admin sheet endpoint yet. Update code.js in Apps Script and deploy a new version.'
          );
        } else {
          setError(res.error || 'Unauthorized access.');
        }
        return false;
      }

      const { tabUrl, spreadsheetUrl } = resolveVerifiedSheetUrls(res, GOOGLE_SHEET_URL);

      onVerified({
        adminKey: keyToUse,
        sheetName: res.sheetName || 'EmployeeData',
        tabUrl,
        spreadsheetUrl,
        rows: res.rows || [],
      });
      setPasscode('');
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to fetch Google Sheet data.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter the admin passcode.');
      return;
    }
    await loadSheetData(passcode.trim());
  };

  const handleLock = () => {
    setPasscode('');
    setError(null);
    setNeedsScriptUpdate(false);
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
    setJumpRowInput('');
    setHighlightedRow(null);
    setCopiedLink(false);
    onLock();
  };

  const handleCopySheetUrl = async () => {
    if (!adminSession) return;
    try {
      await navigator.clipboard.writeText(adminSession.tabUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(false);
    }
  };

  const stats = useMemo(() => {
    const submitted = rows.filter((r) => r.hasExistingData).length;
    return {
      total: rows.length,
      submitted,
      pending: rows.length - submitted,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((item) => {
      if (statusFilter === 'submitted' && !item.hasExistingData) return false;
      if (statusFilter === 'pending' && item.hasExistingData) return false;

      if (!q) return true;
      const emp = item.employee;
      return (
        emp.ehrmsCode.toLowerCase().includes(q) ||
        emp.employeeNameEn.toLowerCase().includes(q) ||
        emp.employeeNameHi.toLowerCase().includes(q) ||
        emp.workplaceName.toLowerCase().includes(q) ||
        emp.mobileNo.toLowerCase().includes(q)
      );
    });
  }, [rows, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, safePage]);

  const handleJumpToRow = (e: FormEvent) => {
    e.preventDefault();
    const targetRow = Number(jumpRowInput.trim());
    if (!Number.isInteger(targetRow) || targetRow < 2) return;

    const indexInAll = rows.findIndex((item) => item.rowNumber === targetRow);
    if (indexInAll === -1) return;

    setStatusFilter('all');
    setSearchQuery('');
    const targetPage = Math.floor(indexInAll / PAGE_SIZE) + 1;
    setCurrentPage(targetPage);
    setHighlightedRow(targetRow);
    window.setTimeout(() => setHighlightedRow(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-sheet-title"
    >
      <div
        className={`bg-white border border-slate-200 rounded-xl w-full flex flex-col shadow-lg ${
          adminSession ? 'max-w-6xl max-h-[92vh]' : 'max-w-md'
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5 min-w-0">
            {adminSession ? (
              <Table className="w-5 h-5 text-blue-800 shrink-0" aria-hidden="true" />
            ) : (
              <Lock className="w-5 h-5 text-slate-700 shrink-0" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <h2
                id="admin-sheet-title"
                className="text-lg font-semibold text-slate-900 truncate"
              >
                {adminSession ? `Google Sheet: ${sheetName}` : 'Admin Verification Required'}
              </h2>
              {adminSession ? (
                <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                  Total: {stats.total} · Submitted: {stats.submitted} · Pending: {stats.pending}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-0.5">
                  Google Sheet navigation controls unlock only after Admin verification.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {adminSession && (
              <>
                <button
                  type="button"
                  onClick={() => loadSheetData(adminSession.adminKey)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleLock}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  Lock
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Google Sheet modal"
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!adminSession ? (
          <form onSubmit={handleUnlock} className="p-6 space-y-5">
            <div>
              <label
                htmlFor="admin-passcode-input"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Admin Passcode
              </label>
              <input
                id="admin-passcode-input"
                type="password"
                autoComplete="current-password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passcode"
                autoFocus
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-700 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
                {needsScriptUpdate && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSetupGuide();
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-900 bg-white border border-red-300 hover:bg-red-100/60 rounded-md transition-colors"
                  >
                    View Updated code.js
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Unlock Sheet'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Verified Google Sheet Navigation Controls */}
            <div className="px-6 py-3.5 bg-blue-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-950">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>Admin Verified · Google Sheet Navigation</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={adminSession.tabUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
                  Open {sheetName} Tab
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>

                <a
                  href={adminSession.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Open Workbook
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={handleCopySheetUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                      Copied URL
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      Copy Sheet Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Search, Filter & Row Jump Toolbar */}
            <div className="px-6 py-3.5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-slate-50">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative flex-1 min-w-52 max-w-sm">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search EHRMS, name, school, mobile..."
                    className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                  />
                </div>

                <form onSubmit={handleJumpToRow} className="flex items-center gap-1.5">
                  <label htmlFor="jump-to-row-input" className="sr-only">
                    Jump to Sheet Row
                  </label>
                  <input
                    id="jump-to-row-input"
                    type="number"
                    min={2}
                    max={rows.length + 1}
                    value={jumpRowInput}
                    onChange={(e) => setJumpRowInput(e.target.value)}
                    placeholder="Row #"
                    className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-mono tabular-nums text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Go
                  </button>
                </form>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg shrink-0 self-start lg:self-auto">
                {(
                  [
                    { id: 'all', label: `All (${stats.total})` },
                    { id: 'submitted', label: `Submitted (${stats.submitted})` },
                    { id: 'pending', label: `Pending (${stats.pending})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      statusFilter === tab.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Viewport */}
            <div className="flex-1 overflow-auto">
              {paginatedRows.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  No matching employee records found in {sheetName}.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Row</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">EHRMS</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Name (EN)</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">नाम (हिन्दी)</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">पदनाम</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">कार्यरत स्थल</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">मोबाईल</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">निवास वि०स०</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">EPIC No.</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">खाता संख्या</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">IFSC</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Status</th>
                      <th className="py-2.5 px-3 font-semibold whitespace-nowrap">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedRows.map((item) => {
                      const emp = item.employee;
                      const isHighlighted = highlightedRow === item.rowNumber;
                      return (
                        <tr
                          key={`${item.rowNumber}-${emp.ehrmsCode}`}
                          className={`transition-colors ${
                            isHighlighted ? 'bg-blue-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                            {item.rowNumber}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-blue-800 whitespace-nowrap">
                            {onSelectEhrms ? (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectEhrms(emp.ehrmsCode);
                                  onClose();
                                }}
                                className="hover:underline cursor-pointer"
                                title="Load this employee into form"
                              >
                                {emp.ehrmsCode}
                              </button>
                            ) : (
                              emp.ehrmsCode
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-900 font-medium whitespace-nowrap">
                            {emp.employeeNameEn || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 whitespace-nowrap">
                            {emp.employeeNameHi || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                            {emp.designation || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate" title={emp.workplaceName}>
                            {emp.workplaceName || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                            {emp.mobileNo || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                            {emp.residenceAssembly || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                            {emp.epicNumber || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                            {emp.accountNumber || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800 whitespace-nowrap">
                            {emp.ifscCode || '—'}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                            {item.hasExistingData ? (
                              <span className="text-emerald-700">Submitted</span>
                            ) : (
                              <span className="text-slate-500">Pending</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                            {emp.timestamp || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Sheet Pagination Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <span className="font-mono tabular-nums">
                Showing {filteredRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length} rows
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={safePage <= 1}
                  aria-label="First page"
                  className="p-1.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  aria-label="Previous page"
                  className="p-1.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <span className="px-2.5 font-mono tabular-nums text-slate-800 font-medium">
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  aria-label="Next page"
                  className="p-1.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safePage >= totalPages}
                  aria-label="Last page"
                  className="p-1.5 text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
