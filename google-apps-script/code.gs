/**
 * Google Apps Script — Web App POST handler.
 *
 * - Contact form → tab "contactForm" in PRIMARY + BACKUP (same row shape as before). Sends email.
 * - Marks submit   → tab "marksForm" in PRIMARY + BACKUP (one row per subject line). No email.
 *
 * Create both tabs in each spreadsheet with exact names: contactForm, marksForm
 * (or let the script create header row on an empty tab — names must match).
 *
 * Deploy as Web app (Execute as: Me, Anyone can access).
 * Put the Web App /exec URL in js/config.js as GOOGLE_SCRIPT_URL.
 */

const PRIMARY_SPREADSHEET_ID = '1f9vCO6Ayp-kiqGlTZeijMCW8tyQms-Sfu4RqG_cylMI';
const BACKUP_SPREADSHEET_ID = '1Vc_p73bZYGW8AfFAWZ-ZGdVNfUph39SoLvRWw_1gTCA';

const SHEET_CONTACT = 'contactForm';
const SHEET_MARKS = 'marksForm';

const CONTACT_HEADERS = [
  'Timestamp',
  'Name',
  'Phone',
  'Email',
  'Courses',
  'Parent Phone',
  'Class',
  'School',
  'Address'
];

const MARKS_HEADERS = [
  'Timestamp',
  'SubmissionId',
  'StudentName',
  'Class',
  'School',
  'Mobile',
  'Subject',
  'Term',
  'MarksObtained',
  'OutOf'
];

function getSheet_(spreadsheetId, sheetName) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sh = ss.getSheetByName(sheetName);
  if (!sh) {
    throw new Error('Missing sheet tab "' + sheetName + '" in spreadsheet ' + spreadsheetId);
  }
  return sh;
}

/**
 * Ensures row 1 matches expectedHeaders, then appends rowData and formats the new row.
 */
function ensureHeadersAndAppendRow_(sheet, expectedHeaders, rowData) {
  var numCols = expectedHeaders.length;

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expectedHeaders);
    var hr0 = sheet.getRange(1, 1, 1, numCols);
    hr0.setFontWeight('bold');
    hr0.setBackground('#4A90E2');
    hr0.setFontColor('#FFFFFF');
  } else {
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var headersMatch = currentHeaders.length === numCols;
    if (headersMatch) {
      for (var i = 0; i < numCols; i++) {
        if (currentHeaders[i] !== expectedHeaders[i]) {
          headersMatch = false;
          break;
        }
      }
    }
    if (!headersMatch) {
      sheet.getRange(1, 1, 1, sheet.getLastColumn()).clear();
      sheet.getRange(1, 1, 1, numCols).setValues([expectedHeaders]);
      var hr2 = sheet.getRange(1, 1, 1, numCols);
      hr2.setFontWeight('bold');
      hr2.setBackground('#4A90E2');
      hr2.setFontColor('#FFFFFF');
    }
  }

  sheet.appendRow(rowData);
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1, 1, numCols).setBorder(true, true, true, true, true, true);
  sheet.autoResizeColumns(1, numCols);
}

function parsePostJson_(e) {
  if (e.parameter && e.parameter.payload) {
    try {
      return JSON.parse(e.parameter.payload);
    } catch (x) {
      /* continue */
    }
  }
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (x2) {
      var raw = e.postData.contents;
      if (raw.indexOf('payload=') === 0) {
        try {
          return JSON.parse(decodeURIComponent(raw.substring('payload='.length)));
        } catch (x3) {
          /* continue */
        }
      }
    }
  }
  return null;
}

function handleMarksPost_(data) {
  var st = data.student || {};
  var name = String(st.studentName || '').trim();
  var clazz = String(st.class || '').trim();
  var school = String(st.school || '').trim();
  var mobile = String(st.mobile || '').replace(/\D/g, '');
  var marks = data.marks;

  if (!name || !clazz || !school || !mobile) {
    throw new Error('Missing student fields (studentName, class, school, mobile)');
  }
  if (mobile.length !== 10) {
    throw new Error('Mobile must be exactly 10 digits');
  }
  if (!marks || !marks.length) {
    throw new Error('Add at least one marks row');
  }

  var submissionId = Utilities.getUuid();
  var ts = new Date();

  var primarySheet = getSheet_(PRIMARY_SPREADSHEET_ID, SHEET_MARKS);
  var i;
  for (i = 0; i < marks.length; i++) {
    var m = marks[i] || {};
    var subject = String(m.subject || '').trim();
    var term = String(m.term || '').trim();
    var ob = m.marksObtained;
    var out = m.outOf;
    if (!subject || !term || ob === '' || ob == null || out === '' || out == null) {
      throw new Error('Each marks row needs subject, term, marksObtained, and outOf');
    }
    var rowData = [
      ts,
      submissionId,
      name,
      clazz,
      school,
      mobile,
      subject,
      term,
      ob,
      out
    ];
    ensureHeadersAndAppendRow_(primarySheet, MARKS_HEADERS, rowData);
  }

  try {
    var backupSheet = getSheet_(BACKUP_SPREADSHEET_ID, SHEET_MARKS);
    var j;
    for (j = 0; j < marks.length; j++) {
      var m2 = marks[j] || {};
      var rowData2 = [
        ts,
        submissionId,
        name,
        clazz,
        school,
        mobile,
        String(m2.subject || '').trim(),
        String(m2.term || '').trim(),
        m2.marksObtained,
        m2.outOf
      ];
      ensureHeadersAndAppendRow_(backupSheet, MARKS_HEADERS, rowData2);
    }
  } catch (backupErr) {
    console.log('Backup marksForm write failed: ' + backupErr);
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: 'Marks saved successfully',
      submissionId: submissionId,
      rowsWritten: marks.length
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handleContactPost_(data) {
  var timestamp = new Date();
  var rowData = [
    timestamp,
    data.name,
    data.phone,
    data.email,
    data.courses,
    data.parentPhone,
    data.class,
    data.school,
    data.address
  ];

  var primarySheet = getSheet_(PRIMARY_SPREADSHEET_ID, SHEET_CONTACT);
  ensureHeadersAndAppendRow_(primarySheet, CONTACT_HEADERS, rowData);

  try {
    var backupSheet = getSheet_(BACKUP_SPREADSHEET_ID, SHEET_CONTACT);
    ensureHeadersAndAppendRow_(backupSheet, CONTACT_HEADERS, rowData);
  } catch (backupErr) {
    console.log('Backup contactForm write failed: ' + backupErr);
  }

  try {
    MailApp.sendEmail({
      to: 'jasujabhavishya@gmail.com',
      subject: 'New Contact Form Submission - ' + data.name,
      body:
        'New contact form submission received!\n\n' +
        'Name: ' +
        data.name +
        '\n' +
        'Phone: ' +
        data.phone +
        '\n' +
        'Email: ' +
        data.email +
        '\n' +
        'Courses: ' +
        data.courses +
        '\n' +
        'Parent Phone: ' +
        data.parentPhone +
        '\n' +
        'Class: ' +
        data.class +
        '\n' +
        'School: ' +
        data.school +
        '\n' +
        'Address: ' +
        data.address +
        '\n\n' +
        'Timestamp: ' +
        timestamp
    });
  } catch (emailError) {
    console.log('Email notification failed:', emailError);
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: 'Data saved successfully'
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = parsePostJson_(e);

    if (!data) {
      if (e.parameter) {
        data = {
          name: e.parameter.name || '',
          phone: e.parameter.phone || '',
          email: e.parameter.email || '',
          courses: e.parameter.courses || '',
          parentPhone: e.parameter.parentPhone || '',
          class: e.parameter.class || '',
          school: e.parameter.school || '',
          address: e.parameter.address || ''
        };
      } else {
        throw new Error('No data received');
      }
    }

    if (data.type === 'marks') {
      return handleMarksPost_(data);
    }

    return handleContactPost_(data);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString()
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    'Web app: POST JSON contact fields → contactForm; POST { type: "marks", student, marks } → marksForm.'
  );
}

function testDoPost() {
  var testData = {
    name: 'Test User',
    phone: '1234567890',
    email: 'test@example.com',
    courses: '11th Economics, 12th Economics',
    parentPhone: '0987654321',
    class: '12th',
    school: 'Test School',
    address: 'Test Address'
  };

  var mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  var result = doPost(mockEvent);
  Logger.log(result.getContent());
}
