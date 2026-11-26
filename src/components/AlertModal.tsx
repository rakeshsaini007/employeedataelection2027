import { CheckCircle2, X } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  mode: 'saved' | 'updated';
  employeeName: string;
  ehrmsCode: string;
  timestamp: string;
  onClose: () => void;
}

export function AlertModal({
  isOpen,
  mode,
  employeeName,
  ehrmsCode,
  timestamp,
  onClose,
}: AlertModalProps) {
  if (!isOpen) return null;

  const isUpdated = mode === 'updated';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="save-alert-title"
      aria-describedby="save-alert-desc"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <h3 id="save-alert-title" className="text-lg font-semibold text-slate-900">
                {isUpdated ? 'Data Updated Successfully' : 'Data Saved Successfully'}
              </h3>
              <p id="save-alert-desc" className="text-sm text-slate-600 mt-1">
                {isUpdated
                  ? 'The existing record in the EmployeeData Google Sheet has been updated.'
                  : 'Your employee information has been saved to the EmployeeData Google Sheet.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close alert"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <dl className="mt-5 pt-4 border-t border-slate-200 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-500">EHRMS Code</dt>
            <dd className="font-mono tabular-nums font-medium text-slate-900">{ehrmsCode}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-500">Employee Name</dt>
            <dd className="font-medium text-slate-900 text-right">{employeeName || '—'}</dd>
          </div>
          {timestamp && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-slate-500">Timestamp</dt>
              <dd className="font-mono tabular-nums text-slate-700">{timestamp}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            OK, Continue
          </button>
        </div>
      </div>
    </div>
  );
}
