export interface EmployeeRecord {
  ehrmsCode: string;              // Col A
  employeeNameEn: string;         // Col B
  employeeNameHi: string;         // Col C
  designation: string;            // Col D
  workplaceName: string;          // Col E
  nyayPanchayat: string;          // Col F
  mobileNo: string;               // Col G
  gender: string;                 // Col H
  employeeType: string;           // Col I
  gazetted: string;               // Col J
  category: string;               // Col K
  payBand6th: string;             // Col L
  gradePay6th: string;            // Col M
  payScale6th: string;            // Col N
  postGradePay6th: string;        // Col O
  totalServiceYears: string;      // Col P
  basicPay6th: string;            // Col Q
  currentGradePay: string;        // Col R
  yearsInCurrentGradePay: string; // Col S
  level7th: string;               // Col T
  index7th: string;               // Col U
  basicPay7th: string;            // Col V
  workAssembly: string;           // Col W
  residenceAssembly: string;      // Col X
  nativeAssembly: string;         // Col Y
  homeDistrict: string;           // Col Z
  retirementDate: string;         // Col AA
  teacherCategory: string;        // Col AB
  threeYearsInDistrict: string;   // Col AC
  remarks: string;                // Col AD
  epicNumber: string;             // Col AE
  epicAssemblyNo: string;         // Col AF
  epicAssemblyName: string;       // Col AG
  boothNumber: string;            // Col AH
  voterSerialNo: string;          // Col AI
  epicFromPostingDistrict: string;// Col AJ
  bankName: string;               // Col AK
  branchName: string;             // Col AL
  accountNumber: string;          // Col AM
  ifscCode: string;               // Col AN
  bankAccountHolderName: string;  // Col AO
  timestamp: string;              // Col AP
}

export interface LookupResponse {
  success: boolean;
  found?: boolean;
  rowNumber?: number;
  hasExistingData?: boolean;
  employee?: EmployeeRecord;
  message?: string;
  error?: string;
}

export interface SaveResponse {
  success: boolean;
  mode?: 'saved' | 'updated';
  message?: string;
  rowNumber?: number;
  hasExistingData?: boolean;
  employee?: EmployeeRecord;
  error?: string;
}

export interface AdminSheetRow {
  rowNumber: number;
  hasExistingData: boolean;
  employee: EmployeeRecord;
}

export interface AdminSheetResponse {
  success: boolean;
  sheetName?: string;
  sheetUrl?: string;
  totalRows?: number;
  rows?: AdminSheetRow[];
  error?: string;
}

export const EMPTY_EMPLOYEE_RECORD: EmployeeRecord = {
  ehrmsCode: '',
  employeeNameEn: '',
  employeeNameHi: '',
  designation: '',
  workplaceName: '',
  nyayPanchayat: '',
  mobileNo: '',
  gender: '',
  employeeType: '',
  gazetted: '',
  category: '',
  payBand6th: '',
  gradePay6th: '',
  payScale6th: '',
  postGradePay6th: '',
  totalServiceYears: '',
  basicPay6th: '',
  currentGradePay: '',
  yearsInCurrentGradePay: '',
  level7th: '',
  index7th: '',
  basicPay7th: '',
  workAssembly: '',
  residenceAssembly: '',
  nativeAssembly: '',
  homeDistrict: '',
  retirementDate: '',
  teacherCategory: '',
  threeYearsInDistrict: '',
  remarks: '',
  epicNumber: '',
  epicAssemblyNo: '',
  epicAssemblyName: '',
  boothNumber: '',
  voterSerialNo: '',
  epicFromPostingDistrict: '',
  bankName: '',
  branchName: '',
  accountNumber: '',
  ifscCode: '',
  bankAccountHolderName: '',
  timestamp: '',
};
