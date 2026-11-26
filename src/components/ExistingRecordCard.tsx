import { RefreshCw } from 'lucide-react';
import type { EmployeeRecord } from '../types/employee';

interface ExistingRecordCardProps {
  employee: EmployeeRecord;
}

export function ExistingRecordCard({ employee }: ExistingRecordCardProps) {
  const filledFields: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: 'मोबाईल नं० (Mobile)', value: employee.mobileNo, mono: true },
    { label: 'कार्यरत विधान सभा क्षेत्र', value: employee.workAssembly },
    { label: 'निवास विधान सभा क्षेत्र', value: employee.residenceAssembly },
    { label: 'मूल निवासी विधान सभा क्षेत्र', value: employee.nativeAssembly },
    { label: 'गृह जनपद (Home District)', value: employee.homeDistrict },
    { label: 'सेवानिवृत्ति दिनांक (Retirement)', value: employee.retirementDate, mono: true },
    { label: 'अध्यापक श्रेणी (Teacher Category)', value: employee.teacherCategory },
    { label: 'जनपद में 3+ वर्ष कार्यरत', value: employee.threeYearsInDistrict },
    { label: 'अभ्युक्ति (Remarks)', value: employee.remarks },
    { label: 'वर्तमान ग्रेड पे / अवधि (वर्ष)', value: [employee.currentGradePay, employee.yearsInCurrentGradePay ? `${employee.yearsInCurrentGradePay} yrs` : ''].filter(Boolean).join(' · '), mono: true },
    { label: 'सातवाँ वेतन (Level / Index / Basic)', value: [employee.level7th, employee.index7th, employee.basicPay7th].filter(Boolean).join(' / '), mono: true },
    { label: 'छठा वेतन (Band / GP / Basic)', value: [employee.payBand6th, employee.gradePay6th, employee.basicPay6th].filter(Boolean).join(' / '), mono: true },
    { label: 'EPIC (वोटर कार्ड नंबर)', value: employee.epicNumber, mono: true },
    { label: 'EPIC विधान सभा (संख्या / नाम)', value: [employee.epicAssemblyNo, employee.epicAssemblyName].filter(Boolean).join(' - ') },
    { label: 'बूथ संख्या / मतदाता क्रमांक', value: [employee.boothNumber, employee.voterSerialNo].filter(Boolean).join(' / '), mono: true },
    { label: 'EPIC वर्तमान जनपद से निर्गत', value: employee.epicFromPostingDistrict },
    { label: 'बैंक एवं शाखा का नाम', value: [employee.bankName, employee.branchName].filter(Boolean).join(' — ') },
    { label: 'खाता संख्या (Account No.)', value: employee.accountNumber, mono: true },
    { label: 'IFSC Code', value: employee.ifscCode, mono: true },
    { label: 'Name (As per Bank Passbook)', value: employee.bankAccountHolderName },
  ].filter((item) => item.value && item.value.trim() !== '');

  return (
    <section
      aria-labelledby="existing-record-heading"
      className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 sm:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-amber-200/80">
        <div className="flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h3 id="existing-record-heading" className="text-base font-semibold text-slate-900">
              Saved Data Found in Sheet (पूर्व में दर्ज विवरण)
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              This employee already has submitted data in EmployeeData. Review below or edit the form to update.
            </p>
          </div>
        </div>

        {employee.timestamp && (
          <div className="text-xs text-slate-600 font-mono tabular-nums shrink-0">
            Last Saved: {employee.timestamp}
          </div>
        )}
      </div>

      {filledFields.length > 0 ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 pt-5">
          {filledFields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-medium text-slate-500">{field.label}</dt>
              <dd
                className={`mt-1 text-sm font-medium text-slate-900 break-words ${
                  field.mono ? 'font-mono tabular-nums' : ''
                }`}
              >
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="pt-4 text-sm text-slate-600">
          Submission timestamp recorded. Use the form below to review or update all fields.
        </p>
      )}
    </section>
  );
}
