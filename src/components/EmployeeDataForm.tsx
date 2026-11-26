import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import type { EmployeeRecord } from '../types/employee';

interface EmployeeDataFormProps {
  formData: EmployeeRecord;
  hasExistingData: boolean;
  isSubmitting: boolean;
  validationError: string | null;
  onChange: (field: keyof EmployeeRecord, value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

const inputClassName =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15 transition-colors';

const monoInputClassName = `${inputClassName} font-mono tabular-nums`;

const RESIDENCE_ASSEMBLY_OPTIONS = [
  '34-स्वार',
  '35-चमरौआ',
  '36-बिलासपुर',
  '37-रामपुर',
  '38-मिलक',
];
const OTHER_RESIDENCE_OPTION = 'अन्य';

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  required?: boolean;
}) {
  const normalizedOptions =
    value && !options.includes(value) ? [value, ...options] : options;

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      <select
        id={id}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={inputClassName}
      >
        <option value="">-- चुनें / Select --</option>
        {normalizedOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  mono = false,
  required = false,
  maxLength,
  inputMode,
  uppercase = false,
  listId,
  error,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  mono?: boolean;
  required?: boolean;
  maxLength?: number;
  inputMode?: 'text' | 'numeric' | 'tel' | 'decimal';
  uppercase?: boolean;
  listId?: string;
  error?: string | null;
  hint?: string;
}) {
  const baseClass = mono ? monoInputClassName : inputClassName;
  const fieldClass = error
    ? `${baseClass} border-red-400 focus:border-red-600 focus:ring-red-600/15`
    : baseClass;

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        required={required}
        maxLength={maxLength}
        inputMode={inputMode}
        list={listId}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onBlur={onBlur}
        onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
        className={fieldClass}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

function HindiTextField({
  id,
  label,
  value,
  onChange,
  placeholder = 'केवल हिन्दी में लिखें',
  required = false,
  allowDigits = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  allowDigits?: boolean;
}) {
  const isComposingRef = useRef(false);
  const [warning, setWarning] = useState(false);

  const sanitize = (raw: string) => {
    const pattern = allowDigits ? /[^\u0900-\u097F0-9\s.\-]/g : /[^\u0900-\u097F\s.\-]/g;
    const cleaned = raw.replace(pattern, '');
    setWarning(cleaned !== raw);
    onChange(cleaned);
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type="text"
        lang="hi"
        required={required}
        value={value}
        placeholder={placeholder}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={(e) => {
          isComposingRef.current = false;
          sanitize(e.currentTarget.value);
        }}
        onChange={(e) => {
          if (isComposingRef.current) {
            onChange(e.target.value);
          } else {
            sanitize(e.target.value);
          }
        }}
        className={inputClassName}
      />
      {warning && (
        <p className="mt-1 text-xs text-amber-700">
          केवल हिन्दी (देवनागरी) भाषा में ही लिखें।
        </p>
      )}
    </div>
  );
}

export function EmployeeDataForm({
  formData,
  hasExistingData,
  isSubmitting,
  validationError,
  onChange,
  onSubmit,
}: EmployeeDataFormProps) {
  const isComposingHindiRef = useRef(false);
  const [hindiInputWarning, setHindiInputWarning] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isOtherResidence, setIsOtherResidence] = useState(false);

  useEffect(() => {
    setIsOtherResidence(
      Boolean(
        formData.residenceAssembly.trim() &&
          !RESIDENCE_ASSEMBLY_OPTIONS.includes(formData.residenceAssembly)
      )
    );
  }, [formData.ehrmsCode]);

  const showOtherResidenceInput =
    isOtherResidence ||
    (formData.residenceAssembly.trim().length > 0 &&
      !RESIDENCE_ASSEMBLY_OPTIONS.includes(formData.residenceAssembly));

  const residenceSelectValue = showOtherResidenceInput
    ? OTHER_RESIDENCE_OPTION
    : formData.residenceAssembly;

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const showMobileError =
    (touched.mobileNo || Boolean(validationError)) &&
    formData.mobileNo.trim().length > 0 &&
    !/^\d{10}$/.test(formData.mobileNo.trim());

  const showAccountError =
    (touched.accountNumber || Boolean(validationError)) &&
    formData.accountNumber.trim().length > 0 &&
    !/^\d{11,}$/.test(formData.accountNumber.trim());

  const showIfscError =
    (touched.ifscCode || Boolean(validationError)) &&
    formData.ifscCode.trim().length > 0 &&
    !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.trim());

  const sanitizeHindiName = (raw: string) => {
    const cleaned = raw.replace(/[^\u0900-\u097F\s.\-]/g, '');
    setHindiInputWarning(cleaned !== raw);
    onChange('employeeNameHi', cleaned);
  };

  const formatDateWithSlashes = (raw: string, previous: string) => {
    const isDeleting = raw.length < previous.length;
    const digits = raw.replace(/\D/g, '').slice(0, 8);

    if (digits.length === 0) return '';
    if (digits.length < 2) return digits;
    if (digits.length === 2) {
      if (isDeleting && !raw.endsWith('/')) return digits;
      return `${digits}/`;
    }
    if (digits.length < 4) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    if (digits.length === 4) {
      if (isDeleting && !raw.endsWith('/')) {
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
      }
      return `${digits.slice(0, 2)}/${digits.slice(2)}/`;
    }
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  return (
    <form
      id="employee-data-form"
      onSubmit={onSubmit}
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Employee Information Form (कर्मचारी विवरण प्रपत्र)
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Verify pre-filled particulars and complete all remaining fields accurately for Election 2027 records.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-600 shrink-0">
          {hasExistingData ? 'Mode: Update Existing Row' : 'Mode: New Submission'}
        </span>
      </div>

      {/* Section 1: Basic & Service Profile */}
      <fieldset className="space-y-5">
        <legend className="text-base font-semibold text-slate-900 pb-2 border-b border-slate-100 w-full">
          01. Basic &amp; Service Profile (सामान्य एवं सेवा विवरण)
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label htmlFor="employeeNameHi" className="block text-xs font-medium text-slate-700 mb-1.5">
              कर्मचारी का नाम (हिन्दी में)
              <span className="text-red-600 ml-0.5">*</span>
            </label>
            <input
              id="employeeNameHi"
              type="text"
              lang="hi"
              required
              value={formData.employeeNameHi}
              placeholder="केवल हिन्दी में लिखें"
              onCompositionStart={() => {
                isComposingHindiRef.current = true;
              }}
              onCompositionEnd={(e) => {
                isComposingHindiRef.current = false;
                sanitizeHindiName(e.currentTarget.value);
              }}
              onChange={(e) => {
                if (isComposingHindiRef.current) {
                  onChange('employeeNameHi', e.target.value);
                } else {
                  sanitizeHindiName(e.target.value);
                }
              }}
              className={inputClassName}
            />
            {hindiInputWarning && (
              <p className="mt-1 text-xs text-amber-700">
                केवल हिन्दी (देवनागरी) भाषा में ही लिखें।
              </p>
            )}
          </div>
          <TextField
            id="mobileNo"
            label="मोबाईल नं० (10-Digit Mobile No.)"
            value={formData.mobileNo}
            onChange={(v) => onChange('mobileNo', v.replace(/\D/g, '').slice(0, 10))}
            onBlur={() => markTouched('mobileNo')}
            placeholder="e.g. 9876543210"
            maxLength={10}
            inputMode="tel"
            mono
            required
            error={
              showMobileError
                ? `Mobile number must be exactly 10 digits (${formData.mobileNo.trim().length}/10).`
                : null
            }
            hint="Exactly 10 numeric digits"
          />
          <SelectField
            id="gender"
            label="लिंग (पुरूष / महिला / तृतीय लिंग)"
            value={formData.gender}
            options={['पुरूष', 'महिला', 'तृतीय लिंग']}
            onChange={(v) => onChange('gender', v)}
            required
          />
        </div>
      </fieldset>

      {/* Section 2: Pay Commission Details */}
      <fieldset className="space-y-5 pt-2 border-t border-slate-200">
        <legend className="text-base font-semibold text-slate-900 pt-6 pb-2 border-b border-slate-100 w-full">
          02. Pay Commission &amp; Service Tenure (वेतन आयोग विवरण — 6th &amp; 7th Pay)
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <TextField
            id="totalServiceYears"
            label="कुल सेवा अवधि (वर्ष में)"
            value={formData.totalServiceYears}
            onChange={(v) => onChange('totalServiceYears', v)}
            placeholder="e.g. 12"
            inputMode="decimal"
            mono
            required
          />
          <TextField
            id="yearsInCurrentGradePay"
            label="वर्तमान ग्रेड पे में कार्यरत अवधि (वर्ष में)"
            value={formData.yearsInCurrentGradePay}
            onChange={(v) => onChange('yearsInCurrentGradePay', v)}
            placeholder="e.g. 5"
            inputMode="decimal"
            mono
            required
          />
        </div>
      </fieldset>

      {/* Section 3: Assembly Constituency & Posting Details */}
      <fieldset className="space-y-5 pt-2 border-t border-slate-200">
        <legend className="text-base font-semibold text-slate-900 pt-6 pb-2 border-b border-slate-100 w-full">
          03. Assembly Constituency, Retirement &amp; Remarks (विधान सभा एवं सेवानिवृत्ति विवरण)
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SelectField
            id="workAssembly"
            label="विधान सभा क्षेत्र का नाम जहाँ वर्तमान में कार्यरत हैं"
            value={formData.workAssembly}
            options={['34-स्वार', '35-चमरौआ', '36-बिलासपुर', '37-रामपुर', '38-मिलक']}
            onChange={(v) => onChange('workAssembly', v)}
            required
          />
          <div>
            <label
              htmlFor="residenceAssembly"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              विधान सभा क्षेत्र का नाम जहाँ वर्तमान में निवास करता है
              <span className="text-red-600 ml-0.5">*</span>
            </label>
            <select
              id="residenceAssembly"
              value={residenceSelectValue}
              required
              onChange={(e) => {
                const val = e.target.value;
                if (val === OTHER_RESIDENCE_OPTION) {
                  setIsOtherResidence(true);
                  if (RESIDENCE_ASSEMBLY_OPTIONS.includes(formData.residenceAssembly)) {
                    onChange('residenceAssembly', '');
                  }
                } else {
                  setIsOtherResidence(false);
                  onChange('residenceAssembly', val);
                }
              }}
              className={inputClassName}
            >
              <option value="">-- चुनें / Select --</option>
              {RESIDENCE_ASSEMBLY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option value={OTHER_RESIDENCE_OPTION}>{OTHER_RESIDENCE_OPTION}</option>
            </select>
          </div>
          {showOtherResidenceInput && (
            <HindiTextField
              id="residenceAssemblyOther"
              label="अन्य विधान सभा क्षेत्र का नाम लिखें"
              value={formData.residenceAssembly}
              onChange={(v) => onChange('residenceAssembly', v)}
              placeholder="केवल हिन्दी में लिखें (जैसे: 40-मुरादाबाद)"
              allowDigits
              required
            />
          )}
          <HindiTextField
            id="nativeAssembly"
            label="विधान सभा क्षेत्र का नाम जहाँ का मूल निवासी है"
            value={formData.nativeAssembly}
            onChange={(v) => onChange('nativeAssembly', v)}
            placeholder="केवल हिन्दी में लिखें"
            allowDigits
            required
          />
          <HindiTextField
            id="homeDistrict"
            label="गृह जनपद का नाम (Home District)"
            value={formData.homeDistrict}
            onChange={(v) => onChange('homeDistrict', v)}
            placeholder="केवल हिन्दी में लिखें"
            required
          />
          <TextField
            id="retirementDate"
            label="सेवानिवृत्ति का दिनांक (31.05.2027 तक और पूर्व)"
            value={formData.retirementDate}
            onChange={(v) =>
              onChange('retirementDate', formatDateWithSlashes(v, formData.retirementDate))
            }
            placeholder="DD/MM/YYYY"
            maxLength={10}
            inputMode="numeric"
            mono
            required
          />
          <SelectField
            id="teacherCategory"
            label="अध्यापक श्रेणी (Teacher Category)"
            value={formData.teacherCategory}
            options={[
              'प्राथमिक शिक्षक-T2',
              'जूनियर हाई स्कूल शिक्षक-T1',
            ]}
            onChange={(v) => onChange('teacherCategory', v)}
            required
          />

          <div className="md:col-span-2">
            <SelectField
              id="threeYearsInDistrict"
              label="क्या संबंधित अधिकारी / कर्मचारी पिछले 04 वर्षों में 03 वर्ष या उससे अधिक समय से इस जनपद में कार्यरत है?"
              value={formData.threeYearsInDistrict}
              options={['हाँ', 'नहीं']}
              onChange={(v) => onChange('threeYearsInDistrict', v)}
              required
            />
          </div>

          <TextField
            id="remarks"
            label="अभ्युक्ति (गर्भवती महिला, दिव्यांग, बी०एल०ओ०, गम्भीर बीमार, आवश्यक सेवा, ड्राइवर आदि)"
            value={formData.remarks}
            onChange={(v) => onChange('remarks', v)}
            listId="remarks-options"
            placeholder="यदि लागू हो तो लिखें अन्यथा खाली छोड़ें"
          />
          <datalist id="remarks-options">
            <option value="कोई नहीं" />
            <option value="गर्भवती महिला" />
            <option value="दिव्यांग" />
            <option value="बी०एल०ओ०" />
            <option value="गम्भीर रूप से बीमार" />
            <option value="आवश्यक सेवा" />
            <option value="ड्राइवर" />
          </datalist>
        </div>
      </fieldset>

      {/* Section 4: EPIC / Voter Registration Details */}
      <fieldset className="space-y-5 pt-2 border-t border-slate-200">
        <legend className="text-base font-semibold text-slate-900 pt-6 pb-2 border-b border-slate-100 w-full">
          04. Voter Registration / EPIC Details (निर्वाचक नामावली पंजीकरण विवरण)
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <TextField
            id="epicNumber"
            label="EPIC (वोटर कार्ड नंबर)"
            value={formData.epicNumber}
            onChange={(v) => onChange('epicNumber', v)}
            placeholder="e.g. ABC1234567"
            uppercase
            mono
            required
          />
          <TextField
            id="epicAssemblyNo"
            label="EPIC विधान सभा क्षेत्र संख्या"
            value={formData.epicAssemblyNo}
            onChange={(v) => onChange('epicAssemblyNo', v.replace(/\D/g, ''))}
            inputMode="numeric"
            mono
            required
            hint="Numeric only"
          />
          <HindiTextField
            id="epicAssemblyName"
            label="EPIC विधान सभा क्षेत्र का नाम"
            value={formData.epicAssemblyName}
            onChange={(v) => onChange('epicAssemblyName', v)}
            placeholder="केवल हिन्दी में लिखें"
            allowDigits
            required
          />
          <TextField
            id="boothNumber"
            label="बूथ संख्या (Booth Number)"
            value={formData.boothNumber}
            onChange={(v) => onChange('boothNumber', v.replace(/\D/g, ''))}
            inputMode="numeric"
            mono
            required
            hint="Numeric only"
          />
          <TextField
            id="voterSerialNo"
            label="मतदाता क्रमांक (Voter Serial No.)"
            value={formData.voterSerialNo}
            onChange={(v) => onChange('voterSerialNo', v.replace(/\D/g, ''))}
            inputMode="numeric"
            mono
            required
            hint="Numeric only"
          />
          <SelectField
            id="epicFromPostingDistrict"
            label="यदि EPIC वर्तमान तैनाती जनपद से निर्गत (हाँ / नहीं)"
            value={formData.epicFromPostingDistrict}
            options={['हाँ', 'नहीं']}
            onChange={(v) => onChange('epicFromPostingDistrict', v)}
            required
          />
        </div>
      </fieldset>

      {/* Section 5: Bank Account Details */}
      <fieldset className="space-y-5 pt-2 border-t border-slate-200">
        <legend className="text-base font-semibold text-slate-900 pt-6 pb-2 border-b border-slate-100 w-full">
          05. Bank Account Details (बैंक अकाउंट का विवरण)
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <TextField
            id="bankName"
            label="बैंक का नाम (Bank Name)"
            value={formData.bankName}
            onChange={(v) => onChange('bankName', v)}
            placeholder="e.g. State Bank of India"
            required
          />
          <TextField
            id="branchName"
            label="शाखा का नाम (Branch Name)"
            value={formData.branchName}
            onChange={(v) => onChange('branchName', v)}
            required
          />
          <TextField
            id="accountNumber"
            label="खाता संख्या (Bank Account Number)"
            value={formData.accountNumber}
            onChange={(v) => onChange('accountNumber', v.replace(/\D/g, ''))}
            onBlur={() => markTouched('accountNumber')}
            placeholder="Minimum 11 digits"
            inputMode="numeric"
            mono
            required
            error={
              showAccountError
                ? `Account number must be numeric and greater than 10 digits (${formData.accountNumber.trim().length} digits entered).`
                : null
            }
            hint="Numeric only, greater than 10 digits"
          />
          <TextField
            id="ifscCode"
            label="IFSC Code"
            value={formData.ifscCode}
            onChange={(v) =>
              onChange('ifscCode', v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))
            }
            onBlur={() => markTouched('ifscCode')}
            placeholder="e.g. SBIN0001234"
            maxLength={11}
            uppercase
            mono
            required
            error={
              showIfscError
                ? 'Invalid IFSC format: 4 letters, 5th character must be 0, followed by 6 alphanumeric characters (e.g. SBIN0001234).'
                : null
            }
            hint="4 letters + 0 (5th character) + 6 alphanumeric"
          />
          <div className="md:col-span-2">
            <TextField
              id="bankAccountHolderName"
              label="Name (As per Bank Passbook in English)"
              value={formData.bankAccountHolderName}
              onChange={(v) => onChange('bankAccountHolderName', v)}
              placeholder="FULL NAME IN ENGLISH AS ON PASSBOOK"
              uppercase
              required
            />
          </div>
        </div>
      </fieldset>

      {validationError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {validationError}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-xs text-slate-500">
          {hasExistingData
            ? 'Existing data is already recorded for this EHRMS code. Clicking Update will overwrite the row in EmployeeData.'
            : 'Submitting will store this information into your matching EHRMS row in the EmployeeData sheet.'}
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
            hasExistingData
              ? 'bg-emerald-700 hover:bg-emerald-800 focus-visible:outline-emerald-700'
              : 'bg-blue-800 hover:bg-blue-900 focus-visible:outline-blue-800'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              {hasExistingData ? 'Updating Data...' : 'Saving Data...'}
            </>
          ) : hasExistingData ? (
            <>
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Update Data
            </>
          ) : (
            <>
              <Save className="w-4 h-4" aria-hidden="true" />
              Submit Data
            </>
          )}
        </button>
      </div>
    </form>
  );
}
