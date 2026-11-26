import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Table,
  X,
} from 'lucide-react';
import { GOOGLE_SHEET_URL } from '../config/appsScriptUrl';
import { fetchAdminSheetData } from '../services/employeeApi';
import type { AdminSheetRow } from '../types/employee';

interface AdminSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSetupGuide: () => void;
  onSelectEhrms?: (ehrmsCode: string) => void;
}

export function AdminSheetModal({
  isOpen,
  onClose,
  onOpenSetupGuide,
  onSelectEhrms,
}: AdminSheetModalProps) {
  const [passcode, setPasscode] = useState('');
  const [verifiedKey, setVerifiedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsScriptUpdate, setNeedsScriptUpdate] = useState(false);

  const [sheetName, setSheetName] = useState('EmployeeData');
  const [sheetUrl, setSheetUrl] = useState(GOOGLE_SHEET_URL);
  const [rows, setRows] = useState<AdminSheetRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'pending'>('all');

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

      setVerifiedKey(keyToUse);
      setSheetName(res.sheetName || 'EmployeeData');
      if (res.sheetUrl) {
        setSheetUrl(res.sheetUrl);
      }
      setRows(res.rows || []);
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
    setVerifiedKey(null);
    setPasscode('');
    setRows([]);
    setError(null);
    setSearchQuery('');
    setStatusFilter('all');
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
          verifiedKey ? 'max-w-6xl max-h-[90vh]' : 'max-w-md'
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5 min-w-0">
            {verifiedKey ? (
              <Table className="w-5 h-5 text-blue-800 shrink-0" aria-hidden="true" />
            ) : (
              <Lock className="w-5 h-5 text-slate-700 shrink-0" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <h2
                id="admin-sheet-title"
                className="text-lg font-semibold text-slate-900 truncate"
              >
                {verifiedKey ? `Google Sheet: ${sheetName}` : 'Admin / Developer Access'}
              </h2>
              {verifiedKey ? (
                <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                  Total: {stats.total} · Submitted: {stats.submitted} · Pending: {stats.pending}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-0.5">
                  Restricted to app developer / administrator only.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {verifiedKey && (
              <>
                <button
                  type="button"
                  onClick={() => loadSheetData(verifiedKey)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  Refresh
                </button>
                <a
                  href={sheetUrl || GOOGLE_SHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Open Google Sheet
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={handleLock}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Lock
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Google Sheet viewer"
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!verifiedKey ? (
          <form onSubmit={handleUnlock} className="p-6 space-y-5">
            <div>
              <label
                htmlFor="admin-passcode-input"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Admin Developer Passcode
              </label>
              <input
                id="admin-passcode-input"
                type="password"
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
                  'Verify & Show Sheet'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50">
              <div className="relative flex-1 max-w-sm">
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

              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg shrink-0">
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
              {filteredRows.length === 0 ? (
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
                    {filteredRows.map((item) => {
                      const emp = item.employee;
                      return (
                        <tr
                          key={`${item.rowNumber}-${emp.ehrmsCode}`}
                          className="hover:bg-slate-50 transition-colors"
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
          </div>
        )}
      </div>
    </div>
  );
}
