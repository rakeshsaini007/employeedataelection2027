import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Lock,
  Search,
  Table,
} from 'lucide-react';
import {
  isAppsScriptConfigured,
  lookupEmployeeByEhrms,
  saveOrUpdateEmployee,
} from './services/employeeApi';
import { EMPTY_EMPLOYEE_RECORD } from './types/employee';
import type { EmployeeRecord } from './types/employee';
import { EmployeeIdentityCard } from './components/EmployeeIdentityCard';
import { ExistingRecordCard } from './components/ExistingRecordCard';
import { EmployeeDataForm } from './components/EmployeeDataForm';
import { AlertModal } from './components/AlertModal';
import { SetupGuideModal } from './components/SetupGuideModal';
import { AdminSheetModal } from './components/AdminSheetModal';
import type { VerifiedAdminSession } from './components/AdminSheetModal';
import { transliterateEnglishSegments } from './utils/hindiTransliterate';

export default function App() {
  const [ehrmsInput, setEhrmsInput] = useState('');
  const [fetchedEhrms, setFetchedEhrms] = useState<string | null>(null);
  const [rowNumber, setRowNumber] = useState<number | null>(null);
  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [formData, setFormData] = useState<EmployeeRecord>(EMPTY_EMPLOYEE_RECORD);
  const [hasExistingData, setHasExistingData] = useState(false);

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    mode: 'saved' | 'updated';
    message: string;
    timestamp: string;
  } | null>(null);

  const [alertModalState, setAlertModalState] = useState<{
    isOpen: boolean;
    mode: 'saved' | 'updated';
    employeeName: string;
    ehrmsCode: string;
    timestamp: string;
  }>({
    isOpen: false,
    mode: 'saved',
    employeeName: '',
    ehrmsCode: '',
    timestamp: '',
  });

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminSession, setAdminSession] = useState<VerifiedAdminSession | null>(null);
  const appsScriptConfigured = isAppsScriptConfigured();
  const lastAutoSearchedRef = useRef<string>('');

  const performLookup = useCallback(async (codeToSearch: string) => {
    const trimmed = codeToSearch.trim();
    if (!trimmed) {
      setLookupError('Please enter an EHRMS code.');
      return;
    }

    lastAutoSearchedRef.current = trimmed;
    setIsLookingUp(true);
    setLookupError(null);
    setValidationError(null);
    setStatusBanner(null);

    try {
      const res = await lookupEmployeeByEhrms(trimmed);
      if (!res.success) {
        setEmployee(null);
        setFetchedEhrms(null);
        setLookupError(res.error || 'Failed to look up EHRMS code.');
        return;
      }

      if (!res.found || !res.employee) {
        setEmployee(null);
        setFetchedEhrms(null);
        setRowNumber(null);
        setHasExistingData(false);
        setLookupError(
          res.message || `EHRMS Code "${trimmed}" was not found in EmployeeData.`
        );
        return;
      }

      setEmployee(res.employee);
      setFormData(res.employee);
      setFetchedEhrms(res.employee.ehrmsCode);
      setRowNumber(res.rowNumber ?? null);
      setHasExistingData(Boolean(res.hasExistingData));
    } catch (err) {
      setEmployee(null);
      setFetchedEhrms(null);
      setLookupError(
        err instanceof Error ? err.message : 'Unable to connect to Google Apps Script.'
      );
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  // Automatically fetch employee details after user pauses typing a valid EHRMS code (>= 4 chars)
  useEffect(() => {
    const trimmed = ehrmsInput.trim();
    if (!appsScriptConfigured) return;
    if (trimmed.length < 4) return;
    if (trimmed === fetchedEhrms || trimmed === lastAutoSearchedRef.current) return;

    const timer = window.setTimeout(() => {
      performLookup(trimmed);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [ehrmsInput, appsScriptConfigured, fetchedEhrms, performLookup]);

  const handleLookupSubmit = (e: FormEvent) => {
    e.preventDefault();
    performLookup(ehrmsInput);
  };

  const handleReset = () => {
    setEhrmsInput('');
    setFetchedEhrms(null);
    setRowNumber(null);
    setEmployee(null);
    setFormData(EMPTY_EMPLOYEE_RECORD);
    setHasExistingData(false);
    setLookupError(null);
    setValidationError(null);
    setStatusBanner(null);
    lastAutoSearchedRef.current = '';
  };

  const handleFieldChange = (field: keyof EmployeeRecord, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const requiredFields: Array<{ key: keyof EmployeeRecord; label: string }> = [
      { key: 'employeeNameHi', label: 'कर्मचारी का नाम (हिन्दी में)' },
      { key: 'mobileNo', label: 'मोबाईल नं०' },
      { key: 'gender', label: 'लिंग' },
      { key: 'totalServiceYears', label: 'कुल सेवा अवधि (वर्ष में)' },
      { key: 'yearsInCurrentGradePay', label: 'वर्तमान ग्रेड पे में कार्यरत अवधि (वर्ष में)' },
      { key: 'workAssembly', label: 'विधान सभा क्षेत्र (कार्यरत)' },
      { key: 'residenceAssembly', label: 'विधान सभा क्षेत्र (निवास)' },
      { key: 'nativeAssembly', label: 'विधान सभा क्षेत्र (मूल निवासी)' },
      { key: 'homeDistrict', label: 'गृह जनपद का नाम' },
      { key: 'retirementDate', label: 'सेवानिवृत्ति का दिनांक' },
      { key: 'teacherCategory', label: 'अध्यापक श्रेणी' },
      { key: 'threeYearsInDistrict', label: 'जनपद में 3 वर्ष या अधिक कार्यरत' },
      { key: 'epicNumber', label: 'EPIC (वोटर कार्ड नंबर)' },
      { key: 'epicAssemblyNo', label: 'EPIC विधान सभा क्षेत्र संख्या' },
      { key: 'epicAssemblyName', label: 'EPIC विधान सभा क्षेत्र का नाम' },
      { key: 'boothNumber', label: 'बूथ संख्या' },
      { key: 'voterSerialNo', label: 'मतदाता क्रमांक' },
      { key: 'epicFromPostingDistrict', label: 'EPIC वर्तमान तैनाती जनपद से निर्गत' },
      { key: 'bankName', label: 'बैंक का नाम' },
      { key: 'branchName', label: 'शाखा का नाम' },
      { key: 'accountNumber', label: 'खाता संख्या' },
      { key: 'ifscCode', label: 'IFSC Code' },
      { key: 'bankAccountHolderName', label: 'Name (As per Bank Passbook in English)' },
    ];

    const missingField = requiredFields.find((f) => !formData[f.key]?.trim());
    if (missingField) {
      setValidationError(`Please fill in the mandatory field: ${missingField.label}`);
      return;
    }

    let submissionData = { ...formData };
    const transliterateFields: Array<
      | 'employeeNameHi'
      | 'residenceAssembly'
      | 'nativeAssembly'
      | 'homeDistrict'
      | 'epicAssemblyName'
      | 'bankName'
      | 'branchName'
    > = [
      'employeeNameHi',
      'residenceAssembly',
      'nativeAssembly',
      'homeDistrict',
      'epicAssemblyName',
      'bankName',
      'branchName',
    ];
    let didTransliterate = false;
    for (const field of transliterateFields) {
      if (/[A-Za-z]/.test(submissionData[field])) {
        submissionData[field] = await transliterateEnglishSegments(submissionData[field]);
        didTransliterate = true;
      }
    }
    if (didTransliterate) {
      setFormData(submissionData);
    }

    if (/[^\u0900-\u097F\s.\-]/.test(submissionData.employeeNameHi.trim())) {
      setValidationError('कर्मचारी का नाम केवल हिन्दी (देवनागरी) भाषा में ही दर्ज करें।');
      return;
    }

    if (/[^\u0900-\u097F0-9\s.\-]/.test(submissionData.residenceAssembly.trim())) {
      setValidationError('निवास विधान सभा क्षेत्र का नाम केवल हिन्दी (देवनागरी) भाषा में ही दर्ज करें।');
      return;
    }

    if (/[^\u0900-\u097F0-9\s.\-]/.test(submissionData.nativeAssembly.trim())) {
      setValidationError('मूल निवासी विधान सभा क्षेत्र का नाम केवल हिन्दी (देवनागरी) भाषा में ही दर्ज करें।');
      return;
    }

    if (/[^\u0900-\u097F\s.\-]/.test(submissionData.homeDistrict.trim())) {
      setValidationError('गृह जनपद का नाम केवल हिन्दी (देवनागरी) भाषा में ही दर्ज करें।');
      return;
    }

    if (/[^\u0900-\u097F0-9\s.\-]/.test(submissionData.epicAssemblyName.trim())) {
      setValidationError('EPIC विधान सभा क्षेत्र का नाम केवल हिन्दी (देवनागरी) भाषा में ही दर्ज करें।');
      return;
    }

    if (!/^\d{10}$/.test(submissionData.mobileNo.trim())) {
      setValidationError('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!/^\d+$/.test(submissionData.epicAssemblyNo.trim())) {
      setValidationError('EPIC विधान सभा क्षेत्र संख्या केवल अंकों (Numeric) में दर्ज करें।');
      return;
    }

    if (!/^\d+$/.test(submissionData.boothNumber.trim())) {
      setValidationError('बूथ संख्या (Booth Number) केवल अंकों (Numeric) में दर्ज करें।');
      return;
    }

    if (!/^\d+$/.test(submissionData.voterSerialNo.trim())) {
      setValidationError('मतदाता क्रमांक (Voter Serial No.) केवल अंकों (Numeric) में दर्ज करें।');
      return;
    }

    if (!/^\d{11,}$/.test(submissionData.accountNumber.trim())) {
      setValidationError(
        'Bank Account Number must be numeric and greater than 10 digits (at least 11 digits).'
      );
      return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(submissionData.ifscCode.trim())) {
      setValidationError(
        'IFSC Code must follow standard format: 4 letters, 5th character must be 0, and 6 alphanumeric characters (e.g. SBIN0001234).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveOrUpdateEmployee(submissionData);
      if (!res.success || !res.employee) {
        setValidationError(res.error || 'Failed to save data. Please try again.');
        return;
      }

      const mode = res.mode === 'updated' ? 'updated' : 'saved';
      const savedEmp = res.employee;

      setEmployee(savedEmp);
      setFormData(savedEmp);
      setHasExistingData(true);

      setStatusBanner({
        mode,
        message:
          mode === 'updated'
            ? 'Employee data updated successfully in EmployeeData sheet.'
            : 'Employee data saved successfully in EmployeeData sheet.',
        timestamp: savedEmp.timestamp,
      });

      setAlertModalState({
        isOpen: true,
        mode,
        employeeName: savedEmp.employeeNameEn || savedEmp.employeeNameHi || savedEmp.ehrmsCode,
        ehrmsCode: savedEmp.ehrmsCode,
        timestamp: savedEmp.timestamp,
      });
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Unable to save data to Google Sheets.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar (Strict 3-zone contract) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            EmployeeData Portal
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {employee && (
              <a
                href="#employee-data-form"
                className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
              >
                Data Form
              </a>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {adminSession ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Table className="w-3.5 h-3.5 text-blue-800" aria-hidden="true" />
                  Sheet Viewer
                </button>
                <a
                  href={adminSession.tabUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Open Google Sheet
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => setAdminSession(null)}
                  title="Lock Admin Sheet Access"
                  aria-label="Lock Admin Sheet Access"
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Lock</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                Admin Sheet Access
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="top" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* Configuration Notice when URL is not yet pasted */}
        {!appsScriptConfigured && (
          <div
            role="status"
            className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="text-sm text-slate-800">
                <p className="font-semibold text-slate-900">
                  Google Apps Script URL Required
                </p>
                <p className="text-slate-600 mt-0.5">
                  Deploy <span className="font-mono font-medium text-slate-900">code.js</span> as a Web App and paste the URL into{' '}
                  <span className="font-mono font-medium text-slate-900">src/config/appsScriptUrl.ts</span>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSetupOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-amber-900 bg-white border border-amber-300 hover:bg-amber-100/60 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              View code.js &amp; Steps
            </button>
          </div>
        )}

        {/* Hero & EHRMS Lookup Card */}
        <section
          id="lookup-section"
          className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-slate-500">
              विधानसभा सामान्य निर्वाचन - 2027 · EmployeeData Sheet Integration
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 text-balance">
              Employee Data Lookup &amp; Submission
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
              Enter your EHRMS Code below to automatically fetch your Name and Department details from the EmployeeData Google Sheet.
            </p>
          </div>

          <form
            onSubmit={handleLookupSubmit}
            className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl"
          >
            <div className="flex-1">
              <label htmlFor="ehrms-lookup-input" className="sr-only">
                EHRMS Code
              </label>
              <div className="relative">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="ehrms-lookup-input"
                  type="text"
                  value={ehrmsInput}
                  onChange={(e) => setEhrmsInput(e.target.value)}
                  placeholder="Enter EHRMS Code (e.g. 6494)"
                  className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-3 text-sm font-mono tabular-nums text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLookingUp}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
            >
              {isLookingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Fetching...
                </>
              ) : (
                'Fetch Details'
              )}
            </button>
          </form>

          {lookupError && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2.5 max-w-2xl"
            >
              <AlertCircle className="w-4 h-4 text-red-700 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{lookupError}</span>
            </div>
          )}
        </section>

        {/* Inline Save/Update Status Alert Banner */}
        {statusBanner && (
          <div
            role="alert"
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold text-emerald-950">{statusBanner.message}</p>
              {statusBanner.timestamp && (
                <p className="text-emerald-800 font-mono tabular-nums text-xs mt-1">
                  Saved Timestamp: {statusBanner.timestamp}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Loading Skeleton while looking up */}
        {isLookingUp && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4">
            <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="h-12 bg-slate-100 rounded animate-pulse" />
              <div className="h-12 bg-slate-100 rounded animate-pulse" />
              <div className="h-12 bg-slate-100 rounded animate-pulse" />
              <div className="h-12 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        )}

        {/* Loaded Employee Sections */}
        {!isLookingUp && employee && (
          <>
            <EmployeeIdentityCard
              employee={employee}
              rowNumber={rowNumber}
              hasExistingData={hasExistingData}
            />

            {hasExistingData && <ExistingRecordCard employee={employee} />}

            <EmployeeDataForm
              formData={formData}
              hasExistingData={hasExistingData}
              isSubmitting={isSubmitting}
              validationError={validationError}
              onChange={handleFieldChange}
              onSubmit={handleFormSubmit}
            />
          </>
        )}
      </main>

      <AlertModal
        isOpen={alertModalState.isOpen}
        mode={alertModalState.mode}
        employeeName={alertModalState.employeeName}
        ehrmsCode={alertModalState.ehrmsCode}
        timestamp={alertModalState.timestamp}
        onClose={() => setAlertModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      <SetupGuideModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
      />

      <AdminSheetModal
        isOpen={isAdminModalOpen}
        adminSession={adminSession}
        onVerified={(session) => setAdminSession(session)}
        onLock={() => setAdminSession(null)}
        onClose={() => setIsAdminModalOpen(false)}
        onOpenSetupGuide={() => setIsSetupOpen(true)}
        onSelectEhrms={(code) => {
          setEhrmsInput(code);
          performLookup(code);
        }}
      />
    </div>
  );
}
