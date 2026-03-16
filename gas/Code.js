/* ═══════════════════════════════════════════════
   송암공원 SK VIEW — 관심고객 등록 Apps Script
   ═══════════════════════════════════════════════ */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    var COLS = 12;

    // 헤더가 없으면 첫 행에 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '타임스탬프', '이름', '연락처', '관심평형', '방문희망일', '희망시간대', '문의내용',
        '유입매체', '광고유형', '캠페인', '광고콘텐츠', '페이지URL'
      ]);
      sheet.getRange(1, 1, 1, COLS).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var data = JSON.parse(e.postData.contents);

    // 유입경로 요약 (빈값이면 '직접유입')
    var source = data.utm_source || '';
    var medium = data.utm_medium || '';
    var sourceLabel = source ? (source + (medium ? ' / ' + medium : '')) : '직접유입';

    sheet.appendRow([
      new Date(),                  // A: 타임스탬프
      data.name         || '',     // B: 이름
      data.phone        || '',     // C: 연락처
      data.size         || '',     // D: 관심평형
      data.visit_date   || '',     // E: 방문희망일
      data.visit_time   || '',     // F: 희망시간대
      data.message      || '',     // G: 문의내용
      sourceLabel,                 // H: 유입매체 (meta / cpc, danggeun / local, 직접유입)
      data.utm_campaign || '',     // I: 캠페인
      data.utm_content  || '',     // J: 광고콘텐츠
      data.utm_term     || '',     // K: 검색어/키워드
      data.page_url     || ''      // L: 페이지URL
    ]);

    // 최신순 정렬 (헤더 제외)
    var lastRow = sheet.getLastRow();
    if (lastRow > 2) {
      sheet.getRange(2, 1, lastRow - 1, COLS).sort({ column: 1, ascending: false });
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
        message: 'clasp 배포 테스트',
        utm_source: 'meta',
        utm_medium: 'cpc',
        utm_campaign: '선착순분양',
        utm_content: '',
        utm_term: '',
        page_url: 'https://songam-skview.com/?utm_source=meta&utm_medium=cpc&utm_campaign=선착순분양'
      })
    }
  };
  var result = doPost(mock);
  Logger.log(result.getContent());
}
