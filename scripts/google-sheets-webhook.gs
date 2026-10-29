function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Name",
      "Email",
      "Phone",
      "Tour",
      "Preferred date",
      "Number of people",
      "Interest level",
      "Message",
      "Source",
    ]);
  }
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.timestamp || "",
    data.name || "",
    data.email || "",
    data.phone || "",
    data.tour || "",
    data.preferred_date || "",
    data.people || "",
    data.interest_level || "",
    data.message || "",
    data.source || "website",
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON
  );
}
