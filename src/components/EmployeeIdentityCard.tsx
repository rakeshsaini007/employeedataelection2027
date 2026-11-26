import type { EmployeeRecord } from '../types/employee';

interface EmployeeIdentityCardProps {
  employee: EmployeeRecord;
  rowNumber: number | null;
  hasExistingData: boolean;
}

export function EmployeeIdentityCard({
  employee,
  rowNumber,
  hasExistingData,
}: EmployeeIdentityCardProps) {
  const details = [
    { label: 'EHRMS Code (कोड)', value: employee.ehrmsCode, mono: true },
    { label: 'Employee Name (English)', value: employee.employeeNameEn || '—', mono: false },
    { label: 'कर्मचारी का नाम (हिन्दी)', value: employee.employeeNameHi || '—', mono: false },
    { label: 'पदनाम (Designation)', value: employee.designation || '—', mono: false },
    { label: 'कार्यरत स्थल का नाम (Department / School)', value: employee.workplaceName || '—', mono: false, wide: true },
    { label: 'न्याय पंचायत (Nyay Panchayat)', value: employee.nyayPanchayat || '—', mono: false },
    { label: 'लिंग (Gender)', value: employee.gender || '—', mono: false },
    { label: 'कर्मचारी का प्रकार (Type)', value: employee.employeeType || '—', mono: false },
    { label: 'श्रेणी (Category)', value: employee.category || '—', mono: false },
    { label: 'वर्तमान ग्रेड पे (Grade Pay)', value: employee.currentGradePay || '—', mono: true },
  ];

  return (
    <section
      aria-labelledby="employee-identity-heading"
      className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-5 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Fetched from EmployeeData
            {rowNumber ? ` · Sheet Row ${rowNumber}` : ''}
            {' · '}
            {hasExistingData ? 'Record Status: Existing Data Found' : 'Record Status: New Entry'}
          </p>
          <h2
            id="employee-identity-heading"
            className="text-xl font-semibold text-slate-900 mt-1"
          >
            {employee.employeeNameEn || employee.employeeNameHi || `EHRMS ${employee.ehrmsCode}`}
          </h2>
        </div>

        <div className="text-sm text-slate-600 font-mono tabular-nums shrink-0">
          EHRMS: <span className="font-semibold text-slate-900">{employee.ehrmsCode}</span>
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5 pt-6">
        {details.map((item) => (
          <div
            key={item.label}
            className={item.wide ? 'sm:col-span-2' : undefined}
          >
            <dt className="text-xs font-medium text-slate-500">{item.label}</dt>
            <dd
              className={`mt-1 text-sm font-medium text-slate-900 break-words ${
                item.mono ? 'font-mono tabular-nums' : ''
              }`}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
