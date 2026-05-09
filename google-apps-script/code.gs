/**
 * Google Apps Script — Web App POST handler.
 *
 * - Contact form → tab "contactForm" in PRIMARY + BACKUP. Sends email.
 * - Marks submit  → tab "marksForm"  in PRIMARY + BACKUP. No email.
 *
 * Deploy as Web app (Execute as: Me, Anyone can access).
 * Put the Web App /exec URL in js/config.js as GOOGLE_SCRIPT_URL.
 */

const PRIMARY_SPREADSHEET_ID = '1JuCQAHfW5_k2m-zLbO3TkWTE3oFtgBz-lpenerlxOjs';
const BACKUP_SPREADSHEET_ID = '12VyxID9Y57nm081ZNBJ7tDDkjXpk9owXlFYpoMLjIyg';

const SHEET_CONTACT = 'contactForm';
const SHEET_MARKS   = 'marksForm';

const CONTACT_HEADERS = [
  'Timestamp', 'Name', 'Phone', 'Email', 'Courses',
  'Parent Phone', 'Class', 'School', 'Address'
];

const MARKS_HEADERS = [
  'Timestamp', 'SubmissionId', 'StudentName', 'Class', 'School',
  'Mobile', 'Subject', 'Term', 'MarksObtained', 'OutOf'
];

// ── Helpers ────────────────────────────────────────────────

function getSheet_(spreadsheetId, sheetName) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Missing sheet tab "' + sheetName + '" in ' + spreadsheetId);
  return sh;
}

/**
 * Fast append: only writes headers if the sheet is empty.
 * Removed autoResizeColumns + setBorder — those were the main speed killers.
 */
function fastAppend_(sheet, headers, rowData) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var hr = sheet.getRange(1, 1, 1, headers.length);
    hr.setFontWeight('bold');
    hr.setBackground('#7C3AED');
    hr.setFontColor('#FFFFFF');
  }
  sheet.appendRow(rowData);
}

function parsePostJson_(e) {
  if (e.parameter && e.parameter.payload) {
    try { return JSON.parse(e.parameter.payload); } catch (x) {}
  }
  if (e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (x) {
      var raw = e.postData.contents;
      if (raw.indexOf('payload=') === 0) {
        try { return JSON.parse(decodeURIComponent(raw.substring(8))); } catch (x2) {}
      }
    }
  }
  return null;
}

// ── Contact form ───────────────────────────────────────────

function handleContactPost_(data) {
  var ts = new Date();
  var rowData = [
    ts, data.name, data.phone, data.email, data.courses,
    data.parentPhone, data.class, data.school, data.address
  ];

  // 1. Write to primary (required)
  fastAppend_(getSheet_(PRIMARY_SPREADSHEET_ID, SHEET_CONTACT), CONTACT_HEADERS, rowData);

  // 2. Backup — best-effort, don't let it block or fail the response
  try {
    fastAppend_(getSheet_(BACKUP_SPREADSHEET_ID, SHEET_CONTACT), CONTACT_HEADERS, rowData);
  } catch (e) {
    console.log('Backup write failed: ' + e);
  }

  // 3. Email notification — best-effort
  try {
    MailApp.sendEmail({
      to: 'uditwadhwabhaiya@gmail.com',
      subject: 'New Enrollment — ' + data.name,
      body:
        'New contact form submission:\n\n' +
        'Name: '         + data.name        + '\n' +
        'Phone: '        + data.phone       + '\n' +
        'Email: '        + data.email       + '\n' +
        'Courses: '      + data.courses     + '\n' +
        'Parent Phone: ' + data.parentPhone + '\n' +
        'Class: '        + data.class       + '\n' +
        'School: '       + data.school      + '\n' +
        'Address: '      + data.address     + '\n\n' +
        'Timestamp: '    + ts
    });
  } catch (e) {
    console.log('Email failed: ' + e);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: 'Data saved successfully' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Marks form ─────────────────────────────────────────────

function handleMarksPost_(data) {
  var st     = data.student || {};
  var name   = String(st.studentName || '').trim();
  var clazz  = String(st.class       || '').trim();
  var school = String(st.school      || '').trim();
  var mobile = String(st.mobile      || '').replace(/\D/g, '');
  var marks  = data.marks;

  if (!name || !clazz || !school || !mobile)
    throw new Error('Missing student fields (studentName, class, school, mobile)');
  if (mobile.length !== 10)
    throw new Error('Mobile must be exactly 10 digits');
  if (!marks || !marks.length)
    throw new Error('Add at least one marks row');

  var submissionId = Utilities.getUuid();
  var ts = new Date();
  var primarySheet = getSheet_(PRIMARY_SPREADSHEET_ID, SHEET_MARKS);

  for (var i = 0; i < marks.length; i++) {
    var m = marks[i] || {};
    if (!m.subject || !m.term || m.marksObtained == null || m.outOf == null)
      throw new Error('Each marks row needs subject, term, marksObtained, and outOf');
    fastAppend_(primarySheet, MARKS_HEADERS, [
      ts, submissionId, name, clazz, school, mobile,
      String(m.subject).trim(), String(m.term).trim(), m.marksObtained, m.outOf
    ]);
  }

  try {
    var backupSheet = getSheet_(BACKUP_SPREADSHEET_ID, SHEET_MARKS);
    for (var j = 0; j < marks.length; j++) {
      var m2 = marks[j] || {};
      fastAppend_(backupSheet, MARKS_HEADERS, [
        ts, submissionId, name, clazz, school, mobile,
        String(m2.subject).trim(), String(m2.term).trim(), m2.marksObtained, m2.outOf
      ]);
    }
  } catch (e) {
    console.log('Backup marksForm failed: ' + e);
  }

  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Marks saved successfully',
      submissionId: submissionId,
      rowsWritten: marks.length
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Entry points ───────────────────────────────────────────

function doPost(e) {
  try {
    var data = parsePostJson_(e);

    if (!data && e.parameter) {
      data = {
        name: e.parameter.name || '', phone: e.parameter.phone || '',
        email: e.parameter.email || '', courses: e.parameter.courses || '',
        parentPhone: e.parameter.parentPhone || '', class: e.parameter.class || '',
        school: e.parameter.school || '', address: e.parameter.address || ''
      };
    }
    if (!data) throw new Error('No data received');

    return data.type === 'marks' ? handleMarksPost_(data) : handleContactPost_(data);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    'Web app: POST JSON contact fields → contactForm; POST { type:"marks", student, marks } → marksForm.'
  );
}

function testDoPost() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        name: 'Test User', phone: '1234567890', email: 'test@example.com',
        courses: '12th Economics', parentPhone: '0987654321',
        class: '12', school: 'Test School', address: 'Test Address'
      })
    }
  };
  Logger.log(doPost(mockEvent).getContent());
}
