import { GOOGLE_APPS_SCRIPT_URL } from '../config/appsScriptUrl';
import type {
  AdminSheetResponse,
  EmployeeRecord,
  LookupResponse,
  SaveResponse,
} from '../types/employee';

const PLACEHOLDER_MARKER = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';

export function isAppsScriptConfigured(): boolean {
  const url = GOOGLE_APPS_SCRIPT_URL.trim();
  return (
    url.length > 0 &&
    !url.includes(PLACEHOLDER_MARKER) &&
    (url.startsWith('https://script.google.com/') || url.startsWith('http://') || url.startsWith('https://'))
  );
}

export async function lookupEmployeeByEhrms(ehrmsCode: string): Promise<LookupResponse> {
  if (!isAppsScriptConfigured()) {
    throw new Error(
      'Google Apps Script URL is not configured yet. Please paste your deployed Web App URL into src/config/appsScriptUrl.ts.'
    );
  }

  const trimmed = ehrmsCode.trim();
  if (!trimmed) {
    throw new Error('Please enter an EHRMS code.');
  }

  const separator = GOOGLE_APPS_SCRIPT_URL.includes('?') ? '&' : '?';
  const requestUrl = `${GOOGLE_APPS_SCRIPT_URL.trim()}${separator}action=lookup&ehrms=${encodeURIComponent(trimmed)}`;

  const response = await fetch(requestUrl, {
    method: 'GET',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}. Please verify your Apps Script deployment.`);
  }

  const data = (await response.json()) as LookupResponse;
  return data;
}

export async function fetchAdminSheetData(adminKey: string): Promise<AdminSheetResponse> {
  if (!isAppsScriptConfigured()) {
    throw new Error(
      'Google Apps Script URL is not configured yet. Please paste your deployed Web App URL into src/config/appsScriptUrl.ts.'
    );
  }

  const trimmedKey = adminKey.trim();
  if (!trimmedKey) {
    throw new Error('Admin passcode is required.');
  }

  const separator = GOOGLE_APPS_SCRIPT_URL.includes('?') ? '&' : '?';
  const requestUrl = `${GOOGLE_APPS_SCRIPT_URL.trim()}${separator}action=list&adminKey=${encodeURIComponent(trimmedKey)}`;

  const response = await fetch(requestUrl, {
    method: 'GET',
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}. Please verify your Apps Script deployment.`);
  }

  const data = (await response.json()) as AdminSheetResponse;
  return data;
}

export function isSafeGoogleSheetUrl(rawUrl: string | undefined): rawUrl is string {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'https:' && parsed.hostname === 'docs.google.com';
  } catch {
    return false;
  }
}

export function resolveVerifiedSheetUrls(
  res: AdminSheetResponse,
  fallbackTabUrl: string
): { tabUrl: string; spreadsheetUrl: string } {
  const safeSpreadsheetUrl = isSafeGoogleSheetUrl(res.spreadsheetUrl)
    ? res.spreadsheetUrl.trim()
    : isSafeGoogleSheetUrl(res.sheetUrl)
      ? res.sheetUrl.trim().split('#')[0]
      : isSafeGoogleSheetUrl(fallbackTabUrl)
        ? fallbackTabUrl.trim().split('#')[0]
        : 'https://docs.google.com/spreadsheets';

  const safeTabUrl = isSafeGoogleSheetUrl(res.tabUrl)
    ? res.tabUrl.trim()
    : isSafeGoogleSheetUrl(res.sheetUrl) && res.sheetUrl.includes('#gid=')
      ? res.sheetUrl.trim()
      : isSafeGoogleSheetUrl(fallbackTabUrl)
        ? fallbackTabUrl.trim()
        : safeSpreadsheetUrl;

  return {
    tabUrl: safeTabUrl,
    spreadsheetUrl: safeSpreadsheetUrl,
  };
}

export async function saveOrUpdateEmployee(employee: EmployeeRecord): Promise<SaveResponse> {
  if (!isAppsScriptConfigured()) {
    throw new Error(
      'Google Apps Script URL is not configured yet. Please paste your deployed Web App URL into src/config/appsScriptUrl.ts.'
    );
  }

  // Use text/plain;charset=utf-8 to prevent CORS preflight (OPTIONS), which Google Apps Script does not support.
  const response = await fetch(GOOGLE_APPS_SCRIPT_URL.trim(), {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({ employee }),
  });

  if (!response.ok) {
    throw new Error(`Save failed with status ${response.status}. Please verify your Apps Script deployment.`);
  }

  const data = (await response.json()) as SaveResponse;
  return data;
}
