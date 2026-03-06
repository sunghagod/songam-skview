/* ═══════════════════════════════════════════════
   송암공원 SK VIEW — 관심고객 등록 Apps Script
   ═══════════════════════════════════════════════ */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // 헤더가 없으면 첫 행에 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['타임스탬프', '이름', '연락처', '관심평형', '문의내용']);
      sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date(),           // A: 타임스탬프
      data.name    || '',   // B: 이름
      data.phone   || '',   // C: 연락처
      data.size    || '',   // D: 관심평형
      data.message || ''    // E: 문의내용
    ]);

    // 최신순 정렬 (헤더 제외)
    var lastRow = sheet.getLastRow();
    if (lastRow > 2) {
      sheet.getRange(2, 1, lastRow - 1, 5).sort({ column: 1, ascending: false });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 수동 테스트용
function testDoPost() {
  var mock = {
    postData: {
      contents: JSON.stringify({
        name: '테스트',
        phone: '010-1234-5678',
        size: '84㎡ (34평형)',
        message: 'clasp 배포 테스트'
      })
    }
  };
  var result = doPost(mock);
  Logger.log(result.getContent());
}
