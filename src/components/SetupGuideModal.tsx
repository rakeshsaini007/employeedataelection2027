import { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APPS_SCRIPT_TEMPLATE_NOTE = `// Copy the contents of /code.js from the project root into Apps Script (Code.gs)
// and set your ADMIN_PASSCODE in Project Settings -> Script Properties (or in code.js).
// Then deploy as Web App (Execute as: Me, Who has access: Anyone) and paste the /exec URL
// into src/config/appsScriptUrl.ts.`;

export function SetupGuideModal({ isOpen, onClose }: SetupGuideModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE_NOTE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-guide-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-lg">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="setup-guide-title" className="text-lg font-semibold text-slate-900">
              Google Apps Script Setup & Vercel Deployment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect your Google Sheet (&quot;EmployeeData&quot;) using code.js and src/config/appsScriptUrl.ts
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup guide"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          <ol className="space-y-3 text-sm text-slate-700 list-decimal pl-5">
            <li>
              Open your Google Sheet containing the <span className="font-mono font-semibold text-slate-900">EmployeeData</span> tab and click <span className="font-medium text-slate-900">Extensions → Apps Script</span>.
            </li>
            <li>
              Copy the <span className="font-mono font-semibold text-slate-900">code.js</span> script below, paste it into <span className="font-mono">Code.gs</span> in the Apps Script editor, and save.
            </li>
            <li>
              Click <span className="font-medium text-slate-900">Deploy → New deployment → Web app</span>. Set <span className="font-medium text-slate-900">Execute as: Me</span> and <span className="font-medium text-slate-900">Who has access: Anyone</span>, then deploy and copy the <span className="font-mono">/exec</span> URL.
            </li>
            <li>
              Open <span className="font-mono font-semibold text-slate-900">src/config/appsScriptUrl.ts</span> in this project and paste your URL into <span className="font-mono">GOOGLE_APPS_SCRIPT_URL</span>.
            </li>
            <li>
              Push to GitHub and deploy to <span className="font-medium text-slate-900">Vercel</span> (Vite preset + included <span className="font-mono">vercel.json</span> works out of the box).
            </li>
          </ol>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-200">
              <span className="text-xs font-mono font-medium text-slate-700">code.js</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                    Copied code.js
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    Copy code.js
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-800 bg-slate-50 overflow-x-auto max-h-72 leading-relaxed">
              <code>{APPS_SCRIPT_TEMPLATE_NOTE}</code>
            </pre>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
