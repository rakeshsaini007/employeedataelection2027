/**
 * ============================================================================
 * Google Apps Script Backend for "EmployeeData" Sheet
 * ============================================================================
 * HOW TO DEPLOY:
 * 1. Open your Google Sheet containing the "EmployeeData" tab.
 * 2. Go to Extensions -> Apps Script.
 * 3. Delete any default code in Code.gs and paste this entire file.
 * 4. Click "Save" (Ctrl+S).
 * 5. Click "Deploy" -> "New deployment".
 * 6. Click the gear icon next to "Select type" and choose "Web app".
 * 7. Set:
 *    - Description: EmployeeData Portal API
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 8. Click "Deploy", authorize permissions if prompted, and copy the Web App URL
 *    (it ends with /exec).
 * 9. Paste that URL into: src/config/appsScriptUrl.ts
 * ============================================================================
 */

var SHEET_NAME = 'EmployeeData';

/**
 * Developer / Admin passcode required for ?action=list (Show Google Sheet).
 * Change this to your preferred private admin passcode before deploying.
 */
var ADMIN_PASSCODE = 'Admin@2027';

/**
 * Exact 42-column mapping (A = 0 through AP = 41) matching "EmployeeData" sheet.
 */
var COLUMNS = [
  'ehrmsCode',              // A (0): कर्मचारी का EHRMS कोड
  'employeeNameEn',         // B (1): EMPLOYEE NAME
  'employeeNameHi',         // C (2): कर्मचारी का नाम (हिन्दी में)
  'designation',            // D (3): पदनाम
  'workplaceName',          // E (4): कार्यरत स्थल का नाम
  'nyayPanchayat',          // F (5): न्याय पंचायत
  'mobileNo',               // G (6): मोबाईल नं०
  'gender',                 // H (7): लिंग (पुरूष / महिला / तृतीय लिंग)
  'employeeType',           // I (8): कर्मचारी का प्रकार (P-स्थाई, T-अस्थाई, C-संविदा)
  'gazetted',               // J (9): राजपत्रित (हाँ / नहीं)
  'category',               // K (10): श्रेणी (I, II, III या IV)
  'payBand6th',             // L (11): वर्तमान पे बैंड (छठा वेतन आयोग)
  'gradePay6th',            // M (12): वर्तमान ग्रेड पे (छठा वेतन आयोग)
  'payScale6th',            // N (13): पे स्केल (छठा वेतन आयोग)
  'postGradePay6th',        // O (14): पद का ग्रेड पे (छठा वेतन आयोग)
  'totalServiceYears',      // P (15): कुल सेवा अवधि (वर्ष में)
  'basicPay6th',            // Q (16): मूल वेतन (छठा वेतन आयोग)
  'currentGradePay',        // R (17): वर्तमान ग्रेड पे
  'yearsInCurrentGradePay', // S (18): वर्तमान ग्रेड पे में कितने समय से कार्यरत (वर्ष में)
  'level7th',               // T (19): लेवल नंबर (सातवाँ वेतन आयोग)
  'index7th',               // U (20): इंडेक्स नंबर (सातवाँ वेतन आयोग)
  'basicPay7th',            // V (21): मूल वेतन (सातवाँ वेतन आयोग)
  'workAssembly',           // W (22): विधान सभा क्षेत्र का नाम जहाँ वह वर्तमान में कार्यरत हैं
  'residenceAssembly',      // X (23): विधान सभा क्षेत्र का नाम जहाँ वह वर्तमान में निवास करता है
  'nativeAssembly',         // Y (24): विधान सभा क्षेत्र का नाम जहाँ का मूल निवासी है
  'homeDistrict',           // Z (25): गृह जनपद का नाम
  'retirementDate',         // AA (26): सेवानिवृत्ति का दिनांक (31.05.2027 तक और पूर्व)
  'teacherCategory',        // AB (27): अध्यापक किस श्रेणी में आता है
  'threeYearsInDistrict',   // AC (28): क्या पिछले 04 वर्षों में 03 वर्ष या अधिक समय से इस जनपद में कार्यरत है?
  'remarks',                // AD (29): अभ्युक्ति (गर्भवती महिला, दिव्यांग, बी०एल०ओ०, आदि)
  'epicNumber',             // AE (30): EPIC (वोटर कार्ड नंबर)
  'epicAssemblyNo',         // AF (31): EPIC विधान सभा क्षेत्र संख्या
  'epicAssemblyName',       // AG (32): EPIC विधान सभा क्षेत्र का नाम
  'boothNumber',            // AH (33): बूथ संख्या
  'voterSerialNo',          // AI (34): मतदाता क्रमांक
  'epicFromPostingDistrict',// AJ (35): यदि EPIC वर्तमान तैनाती जनपद से निर्गत (हाँ / नहीं)
  'bankName',               // AK (36): बैंक का नाम
  'branchName',             // AL (37): शाखा का नाम
  'accountNumber',          // AM (38): खाता संख्या
  'ifscCode',               // AN (39): IFSC
  'bankAccountHolderName',  // AO (40): Name (As per Bank Passbook in English)
  'timestamp'               // AP (41): Timestamp
];

/**
 * Columns whose presence indicates the user has already submitted data in the sheet
 * (beyond pre-filled master columns A-F, H-K, R).
 */
var SUBMISSION_INDICATOR_KEYS = [
  'timestamp',
  'mobileNo',
  'workAssembly',
  'residenceAssembly',
  'nativeAssembly',
  'homeDistrict',
  'retirementDate',
  'epicNumber',
  'bankName',
  'accountNumber',
  'ifscCode',
  'bankAccountHolderName'
];

/**
 * Columns stored as explicit text format ('@') so leading zeros are preserved.
 */
var TEXT_COLUMNS = {
  0: true,   // ehrmsCode
  6: true,   // mobileNo
  26: true,  // retirementDate
  30: true,  // epicNumber
  31: true,  // epicAssemblyNo
  33: true,  // boothNumber
  34: true,  // voterSerialNo
  38: true,  // accountNumber
  39: true   // ifscCode
};

function getEmployeeSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet "' + SHEET_NAME + '" was not found in this spreadsheet.');
  }
  return sheet;
}

function normalizeCell_(val) {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
  }
  return String(val).trim();
}

function rowToObject_(row) {
  var obj = {};
  for (var i = 0; i < COLUMNS.length; i++) {
    obj[COLUMNS[i]] = normalizeCell_(row[i]);
  }
  return obj;
}

function hasSubmittedData_(employeeObj) {
  for (var i = 0; i < SUBMISSION_INDICATOR_KEYS.length; i++) {
    var key = SUBMISSION_INDICATOR_KEYS[i];
    if (employeeObj[key] && String(employeeObj[key]).trim() !== '') {
      return true;
    }
  }
  return false;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * GET Handler:
 * - ?action=lookup&ehrms=6494
 * - ?action=health
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = (params.action || 'lookup').toLowerCase();
    var sheet = getEmployeeSheet_();

    if (action === 'health') {
      return jsonResponse_({
        success: true,
        sheet: SHEET_NAME,
        totalRows: Math.max(0, sheet.getLastRow() - 1)
      });
    }

    if (action === 'list') {
      var providedKey = String(params.adminKey || '').trim();
      if (!providedKey || providedKey !== ADMIN_PASSCODE) {
        return jsonResponse_({
          success: false,
          error: 'Unauthorized: Invalid admin passcode.'
        });
      }

      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var totalLastRow = sheet.getLastRow();
      var allRows = [];

      if (totalLastRow >= 2) {
        var rawGrid = sheet.getRange(2, 1, totalLastRow - 1, COLUMNS.length).getValues();
        for (var idx = 0; idx < rawGrid.length; idx++) {
          var empObj = rowToObject_(rawGrid[idx]);
          if (empObj.ehrmsCode) {
            allRows.push({
              rowNumber: idx + 2,
              hasExistingData: hasSubmittedData_(empObj),
              employee: empObj
            });
          }
        }
      }

      return jsonResponse_({
        success: true,
        sheetName: SHEET_NAME,
        sheetUrl: ss.getUrl(),
        totalRows: allRows.length,
        rows: allRows
      });
    }

    var ehrms = String(params.ehrms || params.ehrmsCode || '').trim();
    if (!ehrms) {
      return jsonResponse_({
        success: false,
        error: 'EHRMS code is required.'
      });
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return jsonResponse_({
        success: true,
        found: false,
        message: 'No employee records found in "' + SHEET_NAME + '".'
      });
    }

    var data = sheet.getRange(2, 1, lastRow - 1, COLUMNS.length).getValues();
    var targetNormalized = ehrms.toUpperCase();

    for (var r = 0; r < data.length; r++) {
      var cellEhrms = normalizeCell_(data[r][0]).toUpperCase();
      if (cellEhrms === targetNormalized) {
        var employee = rowToObject_(data[r]);
        return jsonResponse_({
          success: true,
          found: true,
          rowNumber: r + 2,
          hasExistingData: hasSubmittedData_(employee),
          employee: employee
        });
      }
    }

    return jsonResponse_({
      success: true,
      found: false,
      message: 'EHRMS Code "' + ehrms + '" was not found in the "' + SHEET_NAME + '" sheet.'
    });
  } catch (err) {
    return jsonResponse_({
      success: false,
      error: err && err.message ? err.message : 'Unexpected server error.'
    });
  }
}

/**
 * POST Handler:
 * Receives JSON payload (sent with Content-Type: text/plain;charset=utf-8 to avoid CORS preflight)
 * Updates the matching EHRMS row in "EmployeeData" and sets Timestamp.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var payload = JSON.parse(rawBody);
    var input = payload.employee || payload;

    var ehrms = String(input.ehrmsCode || '').trim();
    if (!ehrms) {
      return jsonResponse_({
        success: false,
        error: 'EHRMS code is required to save or update data.'
      });
    }

    var sheet = getEmployeeSheet_();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return jsonResponse_({
        success: false,
        error: 'EmployeeData sheet has no employee rows.'
      });
    }

    var ehrmsRange = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var targetRowNumber = -1;
    var targetNormalized = ehrms.toUpperCase();

    for (var r = 0; r < ehrmsRange.length; r++) {
      if (normalizeCell_(ehrmsRange[r][0]).toUpperCase() === targetNormalized) {
        targetRowNumber = r + 2;
        break;
      }
    }

    if (targetRowNumber === -1) {
      return jsonResponse_({
        success: false,
        error: 'EHRMS Code "' + ehrms + '" not found in "' + SHEET_NAME + '". Only listed employees can submit data.'
      });
    }

    var rowRange = sheet.getRange(targetRowNumber, 1, 1, COLUMNS.length);
    var existingValues = rowRange.getValues()[0];
    var existingObj = rowToObject_(existingValues);
    var wasAlreadySubmitted = hasSubmittedData_(existingObj);

    var nowFormatted = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'dd/MM/yyyy HH:mm:ss'
    );

    var updatedRow = [];
    for (var c = 0; c < COLUMNS.length; c++) {
      var key = COLUMNS[c];
      if (c === 0) {
        // Always preserve exact EHRMS code in Column A
        updatedRow.push(existingValues[0]);
      } else if (key === 'timestamp') {
        updatedRow.push(nowFormatted);
      } else if (Object.prototype.hasOwnProperty.call(input, key)) {
        var val = input[key] === null || input[key] === undefined ? '' : String(input[key]).trim();
        updatedRow.push(val);
      } else {
        updatedRow.push(existingValues[c]);
      }
    }

    // Preserve leading zeros for text-sensitive columns (Mobile, Account No, Booth, EPIC, etc.)
    for (var colIdx in TEXT_COLUMNS) {
      if (Object.prototype.hasOwnProperty.call(TEXT_COLUMNS, colIdx)) {
        sheet.getRange(targetRowNumber, Number(colIdx) + 1).setNumberFormat('@');
      }
    }

    rowRange.setValues([updatedRow]);
    SpreadsheetApp.flush();

    var savedObj = rowToObject_(updatedRow);

    return jsonResponse_({
      success: true,
      mode: wasAlreadySubmitted ? 'updated' : 'saved',
      message: wasAlreadySubmitted
        ? 'Employee data updated successfully!'
        : 'Employee data saved successfully!',
      rowNumber: targetRowNumber,
      hasExistingData: true,
      employee: savedObj
    });
  } catch (err) {
    return jsonResponse_({
      success: false,
      error: err && err.message ? err.message : 'Failed to save data to Google Sheet.'
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (releaseErr) {
      // Ignore if lock was not acquired
    }
  }
}
