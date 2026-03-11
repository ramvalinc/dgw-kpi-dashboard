// DGW KPI Dashboard — Google Apps Script Backend
// Deploy as: Web App → Execute as: Me → Who has access: Anyone
// After deploying, paste the Web App URL into the dashboard setup screen.

const SHEET_NAME = 'KPI_Data';

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'ping') {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'read') {
    return readData();
  }

  return ContentService
    .createTextOutput(JSON.stringify({ error: 'Unknown action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'write') {
      return writeData(body.data);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange('A1').setValue('json_data');
  }
  return sheet;
}

function readData() {
  try {
    const sheet = getOrCreateSheet();
    const val = sheet.getRange('B1').getValue();
    const data = val ? JSON.parse(val) : {};
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput('{}')
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function writeData(data) {
  try {
    const sheet = getOrCreateSheet();
    sheet.getRange('B1').setValue(JSON.stringify(data));
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'saved' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
