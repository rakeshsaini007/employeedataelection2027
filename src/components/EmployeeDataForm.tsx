import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import {
  getHindiSuggestions,
  getOfflineHindiSuggestions,
  transliterateEnglishSegments,
} from '../utils/hindiTransliterate';
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

function findEnglishWordTarget(
  text: string,
  cursor: number | null,
  manualSelectOnly: boolean
): { word: string; start: number; end: number } | null {
  if (!/[A-Za-z]/.test(text)) return null;

  const pos = cursor === null ? text.length : Math.max(0, Math.min(cursor, text.length));

  // Check if cursor is inside or immediately at the end of an English word
  let start = pos;
  while (start > 0 && /[A-Za-z]/.test(text[start - 1])) {
    start -= 1;
  }
  let end = pos;
  while (end < text.length && /[A-Za-z]/.test(text[end])) {
    end += 1;
  }

  if (end > start) {
    return { word: text.slice(start, end), start, end };
  }

  if (!manualSelectOnly) {
    const trailingMatch = text.match(/^(.*?)([A-Za-z]+)([^A-Za-z]*)$/);
    if (trailingMatch) {
      const wStart = trailingMatch[1].length;
      return {
        word: trailingMatch[2],
        start: wStart,
        end: wStart + trailingMatch[2].length,
      };
    }
    return null;
  }

  // In manual mode, pick the nearest preceding English word before cursor, else the first English word
  const before = text.slice(0, pos);
  const beforeMatches = Array.from(before.matchAll(/[A-Za-z]+/g));
  if (beforeMatches.length > 0) {
    const last = beforeMatches[beforeMatches.length - 1];
    const wStart = last.index ?? 0;
    return { word: last[0], start: wStart, end: wStart + last[0].length };
  }

  const firstMatch = text.match(/[A-Za-z]+/);
  if (firstMatch && firstMatch.index !== undefined) {
    return {
      word: firstMatch[0],
      start: firstMatch.index,
      end: firstMatch.index + firstMatch[0].length,
    };
  }

  return null;
}

function HindiTextField({
  id,
  label,
  value,
  onChange,
  placeholder = 'केवल हिन्दी में लिखें',
  required = false,
  allowDigits = false,
  autoTransliterate = false,
  manualSelectOnly = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  allowDigits?: boolean;
  autoTransliterate?: boolean;
  manualSelectOnly?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);
  const [warning, setWarning] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const latestValueRef = useRef(value);
  latestValueRef.current = value;

  const activeTarget = autoTransliterate
    ? findEnglishWordTarget(value, cursorPos, manualSelectOnly)
    : null;
  const activeEnglishWord = activeTarget ? activeTarget.word : '';

  const applyAsyncTransliteration = async (snapshot: string) => {
    const converted = await transliterateEnglishSegments(snapshot);
    const current = latestValueRef.current;
    if (current === snapshot) {
      onChange(converted);
    } else if (current.startsWith(snapshot)) {
      onChange(converted + current.slice(snapshot.length));
    }
  };

  // Live Hindi suggestion candidates as the user types English letters
  useEffect(() => {
    if (!autoTransliterate || !activeEnglishWord) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    setSuggestions(getOfflineHindiSuggestions(activeEnglishWord));

    const fetchTimer = window.setTimeout(() => {
      void getHindiSuggestions(activeEnglishWord).then((list) => {
        if (!cancelled && list.length > 0) {
          setSuggestions(list);
        }
      });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(fetchTimer);
    };
  }, [activeEnglishWord, autoTransliterate]);

  // Auto-transliterate after a brief pause in typing (disabled in manualSelectOnly mode)
  useEffect(() => {
    if (!autoTransliterate || manualSelectOnly || !/[A-Za-z]/.test(value)) return;
    const snapshot = value;
    const timer = window.setTimeout(() => {
      void applyAsyncTransliteration(snapshot);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [value, autoTransliterate, manualSelectOnly]);

  const handleSelectSuggestion = async (chosenHindi: string) => {
    const snapshot = latestValueRef.current;
    const target = findEnglishWordTarget(snapshot, cursorPos, manualSelectOnly);
    if (!target) return;

    const prefix = snapshot.slice(0, target.start);
    const suffix = snapshot.slice(target.end);
    const resolvedPrefix =
      !manualSelectOnly && /[A-Za-z]/.test(prefix)
        ? await transliterateEnglishSegments(prefix)
        : prefix;
    const needsSpace = suffix.length === 0 ? ' ' : '';
    const updated = `${resolvedPrefix}${chosenHindi}${needsSpace}${suffix}`;
    const nextCursor = resolvedPrefix.length + chosenHindi.length + (suffix.startsWith(' ') ? 1 : needsSpace.length);

    if (latestValueRef.current === snapshot) {
      latestValueRef.current = updated;
      onChange(updated);
      setCursorPos(nextCursor);
      window.requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(nextCursor, nextCursor);
        }
      });
    }
  };

  const handleInput = (raw: string, nextCursor: number | null) => {
    const pattern = autoTransliterate
      ? allowDigits
        ? /[^\u0900-\u097FA-Za-z0-9\s.\-]/g
        : /[^\u0900-\u097FA-Za-z\s.\-]/g
      : allowDigits
        ? /[^\u0900-\u097F0-9\s.\-]/g
        : /[^\u0900-\u097F\s.\-]/g;

    const cleaned = raw.replace(pattern, '');
    setWarning(cleaned !== raw);
    setCursorPos(nextCursor);
    latestValueRef.current = cleaned;
    onChange(cleaned);

    if (autoTransliterate && !manualSelectOnly && /[A-Za-z]+[\s.\-]+$/.test(cleaned)) {
      void applyAsyncTransliteration(cleaned);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        lang="hi"
        required={required}
        value={value}
        placeholder={placeholder}
        onClick={(e) => setCursorPos(e.currentTarget.selectionStart)}
        onKeyUp={(e) => setCursorPos(e.currentTarget.selectionStart)}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={(e) => {
          isComposingRef.current = false;
          handleInput(e.currentTarget.value, e.currentTarget.selectionStart);
        }}
        onBlur={(e) => {
          if (autoTransliterate && !manualSelectOnly && /[A-Za-z]/.test(e.currentTarget.value)) {
            void applyAsyncTransliteration(e.currentTarget.value);
          }
        }}
        onChange={(e) => {
          if (isComposingRef.current) {
            onChange(e.target.value);
          } else {
            handleInput(e.target.value, e.target.selectionStart);
          }
        }}
        className={inputClassName}
      />
      {autoTransliterate && activeEnglishWord && suggestions.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5" role="group" aria-label="Hindi suggestions">
          <span className="text-xs text-slate-500">
            {manualSelectOnly ? `“${activeEnglishWord}” चुनें:` : 'चुनें:'}
          </span>
          {suggestions.map((option, idx) => (
            <button
              key={`${option}-${idx}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void handleSelectSuggestion(option)}
              className={`px-2 py-0.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                idx === 0
                  ? 'bg-blue-50 text-blue-900 border-blue-300 hover:bg-blue-100'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : warning ? (
        <p className="mt-1 text-xs text-amber-700">
          {autoTransliterate
            ? 'केवल हिन्दी या अंग्रेजी अक्षरों में लिखें।'
            : 'केवल हिन्दी (देवनागरी) भाषा में ही लिखें।'}
        </p>
      ) : autoTransliterate ? (
        <p className="mt-1 text-xs text-slate-500">
          {manualSelectOnly
            ? 'अंग्रेजी में टाइप करें और नीचे दिए हिन्दी विकल्पों में से चुनें'
            : 'अंग्रेजी में टाइप करें — Space दबाते ही स्वतः हिन्दी में बदल जाएगा या नीचे दिए विकल्प चुनें'}
        </p>
      ) : null}
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
      <div className="flex items-center justify-end pb-4 border-b border-slate-200">
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
          <HindiTextField
            id="employeeNameHi"
            label="कर्मचारी का नाम (हिन्दी में)"
            value={formData.employeeNameHi}
            onChange={(v) => onChange('employeeNameHi', v)}
            placeholder="अंग्रेजी में लिखें और विकल्प चुनें"
            autoTransliterate
            manualSelectOnly
            required
          />
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
              placeholder="अंग्रेजी में लिखें और विकल्प चुनें"
              allowDigits
              autoTransliterate
              manualSelectOnly
              required
            />
          )}
          <HindiTextField
            id="nativeAssembly"
            label="विधान सभा क्षेत्र का नाम जहाँ का मूल निवासी है"
            value={formData.nativeAssembly}
            onChange={(v) => onChange('nativeAssembly', v)}
            placeholder="अंग्रेजी में लिखें और विकल्प चुनें"
            allowDigits
            autoTransliterate
            manualSelectOnly
            required
          />
          <HindiTextField
            id="homeDistrict"
            label="गृह जनपद का नाम (Home District)"
            value={formData.homeDistrict}
            onChange={(v) => onChange('homeDistrict', v)}
            placeholder="अंग्रेजी में लिखें और विकल्प चुनें"
            autoTransliterate
            manualSelectOnly
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

          <SelectField
            id="remarks"
            label="अभ्युक्ति (गर्भवती महिला, दिव्यांग, बी०एल०ओ०, गम्भीर बीमार, आवश्यक सेवा, ड्राइवर आदि)"
            value={formData.remarks}
            options={[
              'कोई नहीं',
              'गर्भवती महिला',
              'दिव्यांग',
              'बी०एल०ओ०',
              'गम्भीर रूप से बीमार',
              'आवश्यक सेवा',
              'ड्राइवर',
            ]}
            onChange={(v) => onChange('remarks', v)}
          />
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
            placeholder="अंग्रेजी में लिखें और विकल्प चुनें"
            allowDigits
            autoTransliterate
            manualSelectOnly
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
          <HindiTextField
            id="bankName"
            label="बैंक का नाम (Bank Name)"
            value={formData.bankName}
            onChange={(v) => onChange('bankName', v)}
            placeholder="अंग्रेजी में लिखें और विकल्प चुनें (जैसे: State Bank of India)"
            allowDigits
            autoTransliterate
            manualSelectOnly
            required
          />
          <HindiTextField
            id="branchName"
            label="शाखा का नाम (Branch Name)"
            value={formData.branchName}
            onChange={(v) => onChange('branchName', v)}
            placeholder="अंग्रेजी में लिखें और विकल्प चुनें"
            allowDigits
            autoTransliterate
            manualSelectOnly
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
      <div className="pt-6 border-t border-slate-200 flex justify-end">
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
