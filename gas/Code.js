/* ═══════════════════════════════════════════════
   송암공원 SK VIEW — 관심고객 등록 Apps Script
   + Google Chat 즉시 알림
   + Meta Lead Ads 자동 수집
   ═══════════════════════════════════════════════ */

/* ── 설정 ────────────────────────────────────── */
var CONFIG = {
  // Google Chat Webhook URL (스페이스 설정 → 웹훅 추가에서 생성)
  CHAT_WEBHOOK_URL: PropertiesService.getScriptProperties().getProperty('CHAT_WEBHOOK_URL') || '',

  // Meta (Facebook) API 설정
  META_ACCESS_TOKEN: PropertiesService.getScriptProperties().getProperty('META_ACCESS_TOKEN') || '',
  META_PAGE_ID: PropertiesService.getScriptProperties().getProperty('META_PAGE_ID') || '',

  // 시트 이름
  SHEET_NAME_WEB: '웹사이트',      // 웹 폼 리드
  SHEET_NAME_META: '메타광고',      // 메타 리드
};

var COLS = 12;

/* ═══════════════════════════════════════════════
   1. 웹사이트 폼 제출 처리 (기존 doPost)
   ═══════════════════════════════════════════════ */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME_WEB) || ss.getActiveSheet();

    // 헤더가 없으면 첫 행에 자동 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '타임스탬프', '이름', '연락처', '관심평형', '방문희망일', '희망시간대', '문의내용',
        '유입매체', '캠페인', '광고콘텐츠', '검색어', '페이지URL'
      ]);
      sheet.getRange(1, 1, 1, COLS).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var data = JSON.parse(e.postData.contents);

    // 서버 사이드 입력값 검증
    var name = (data.name || '').toString().trim();
    var phone = (data.phone || '').toString().trim().replace(/[^0-9\-]/g, '');
    if (!name || name.length < 2 || name.length > 20) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'error', message: 'invalid name' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (!/^01[016789]\d{7,8}$/.test(phone.replace(/-/g, ''))) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'error', message: 'invalid phone' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // HTML 태그 제거
    name = name.replace(/<[^>]*>/g, '');
    var message = (data.message || '').toString().trim().substring(0, 500).replace(/<[^>]*>/g, '');

    // 유입경로 요약 (빈값이면 '직접유입')
    var source = data.utm_source || '';
    var medium = data.utm_medium || '';
    var sourceLabel = source ? (source + (medium ? ' / ' + medium : '')) : '직접유입';

    sheet.appendRow([
      new Date(),                  // A: 타임스탬프
      name,                        // B: 이름 (검증됨)
      phone,                       // C: 연락처 (검증됨)
      (data.size || '').toString().trim().substring(0, 50),  // D: 관심평형
      (data.visit_date || '').toString().trim().substring(0, 20),  // E: 방문희망일
      (data.visit_time || '').toString().trim().substring(0, 20),  // F: 희망시간대
      message,                     // G: 문의내용 (검증됨)
      sourceLabel,                 // H: 유입매체
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

    // ★ Google Chat 즉시 알림
    sendChatNotification({
      source: '🌐 홈페이지',
      name: name || '(미입력)',
      phone: phone || '(미입력)',
      size: data.size || '-',
      visitDate: data.visit_date || '-',
      visitTime: data.visit_time || '-',
      message: message || '-',
      channel: sourceLabel,
      campaign: data.utm_campaign || '-'
    });

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ═══════════════════════════════════════════════
   2. Google Chat 알림 전송
   ═══════════════════════════════════════════════ */
function sendChatNotification(lead) {
  var webhookUrl = CONFIG.CHAT_WEBHOOK_URL;
  if (!webhookUrl) {
    Logger.log('⚠️ CHAT_WEBHOOK_URL이 설정되지 않았습니다.');
    return;
  }

  var now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');

  var message = {
    cards: [{
      header: {
        title: '🔔 새 분양 상담 접수!',
        subtitle: lead.source + ' | ' + now
      },
      sections: [{
        widgets: [
          {
            keyValue: {
              topLabel: '👤 이름',
              content: lead.name
            }
          },
          {
            keyValue: {
              topLabel: '📞 연락처',
              content: lead.phone
            }
          },
          {
            keyValue: {
              topLabel: '🏠 관심평형',
              content: lead.size
            }
          },
          {
            keyValue: {
              topLabel: '📅 방문희망',
              content: lead.visitDate + ' ' + lead.visitTime
            }
          },
          {
            keyValue: {
              topLabel: '💬 문의내용',
              content: lead.message
            }
          },
          {
            keyValue: {
              topLabel: '📊 유입경로',
              content: lead.channel + (lead.campaign !== '-' ? ' (' + lead.campaign + ')' : '')
            }
          }
        ]
      },
      {
        widgets: [{
          buttons: [{
            textButton: {
              text: '📋 시트 확인',
              onClick: {
                openLink: {
                  url: SpreadsheetApp.getActiveSpreadsheet().getUrl()
                }
              }
            }
          }]
        }]
      }]
    }]
  };

  try {
    UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(message)
    });
    Logger.log('✅ Google Chat 알림 전송 완료');
  } catch (err) {
    Logger.log('❌ Google Chat 알림 실패: ' + err.toString());
  }
}

/* ═══════════════════════════════════════════════
   3. Meta Lead Ads 자동 수집
   - 1분마다 트리거로 실행
   - 새 리드 → 시트 기록 + Google Chat 알림
   ═══════════════════════════════════════════════ */
function fetchMetaLeads() {
  var token = CONFIG.META_ACCESS_TOKEN;
  var pageId = CONFIG.META_PAGE_ID;

  if (!token || !pageId) {
    Logger.log('⚠️ Meta API 설정이 없습니다. 스크립트 속성에 META_ACCESS_TOKEN, META_PAGE_ID를 입력하세요.');
    return;
  }

  var props = PropertiesService.getScriptProperties();

  // 마지막 수집 시간 (Unix timestamp, 초 단위)
  var lastFetch = parseInt(props.getProperty('META_LAST_FETCH') || '0', 10);
  var now = Math.floor(Date.now() / 1000);

  // 첫 실행이면 5분 전부터
  if (lastFetch === 0) lastFetch = now - 300;

  try {
    // 페이지의 모든 리드젠 폼 가져오기
    var formsUrl = 'https://graph.facebook.com/v19.0/' + pageId + '/leadgen_forms'
      + '?access_token=' + token
      + '&fields=id,name,status'
      + '&filtering=[{"field":"status","operator":"EQUAL","value":"ACTIVE"}]';

    var formsResp = UrlFetchApp.fetch(formsUrl, { muteHttpExceptions: true });
    var formsData = JSON.parse(formsResp.getContentText());

    if (!formsData.data || formsData.data.length === 0) {
      Logger.log('활성 리드폼 없음');
      props.setProperty('META_LAST_FETCH', String(now));
      return;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var metaSheet = ss.getSheetByName(CONFIG.SHEET_NAME_META);
    if (!metaSheet) {
      metaSheet = ss.insertSheet(CONFIG.SHEET_NAME_META);
      metaSheet.appendRow([
        '타임스탬프', '이름', '연락처', '이메일', '관심평형', '문의내용',
        '폼이름', '리드ID', '생성시간', '캠페인', '광고세트', '광고'
      ]);
      metaSheet.getRange(1, 1, 1, 12).setFontWeight('bold');
      metaSheet.setFrozenRows(1);
    }

    var newLeadCount = 0;

    // 각 폼의 리드 수집
    for (var f = 0; f < formsData.data.length; f++) {
      var formId = formsData.data[f].id;
      var formName = formsData.data[f].name || '(폼이름 없음)';

      var leadsUrl = 'https://graph.facebook.com/v19.0/' + formId + '/leads'
        + '?access_token=' + token
        + '&fields=id,created_time,field_data,ad_id,ad_name,adset_name,campaign_name'
        + '&filtering=[{"field":"time_created","operator":"GREATER_THAN","value":"' + lastFetch + '"}]'
        + '&limit=50';

      var leadsResp = UrlFetchApp.fetch(leadsUrl, { muteHttpExceptions: true });
      var leadsData = JSON.parse(leadsResp.getContentText());

      if (!leadsData.data) continue;

      for (var i = 0; i < leadsData.data.length; i++) {
        var lead = leadsData.data[i];
        var fields = parseLeadFields(lead.field_data || []);

        var createdTime = lead.created_time || '';

        metaSheet.appendRow([
          new Date(),                           // 수집 타임스탬프
          fields.name || '(미입력)',             // 이름
          fields.phone || '(미입력)',            // 연락처
          fields.email || '-',                  // 이메일
          fields.size || '-',                   // 관심평형
          fields.message || '-',                // 문의내용
          formName,                             // 폼 이름
          lead.id || '',                        // 리드 ID
          createdTime,                          // 메타 생성시간
          lead.campaign_name || '-',            // 캠페인
          lead.adset_name || '-',               // 광고세트
          lead.ad_name || '-'                   // 광고
        ]);

        // Google Chat 알림
        sendChatNotification({
          source: '📱 메타광고',
          name: fields.name || '(미입력)',
          phone: fields.phone || '(미입력)',
          size: fields.size || '-',
          visitDate: '-',
          visitTime: '-',
          message: fields.message || '-',
          channel: 'Meta Ads',
          campaign: lead.campaign_name || '-'
        });

        newLeadCount++;
      }
    }

    // 마지막 수집 시간 업데이트
    props.setProperty('META_LAST_FETCH', String(now));
    Logger.log('✅ 메타 리드 ' + newLeadCount + '건 수집 완료');

  } catch (err) {
    Logger.log('❌ 메타 리드 수집 오류: ' + err.toString());
  }
}

/* ── Meta 리드 필드 파싱 ─────────────────────── */
function parseLeadFields(fieldData) {
  var result = { name: '', phone: '', email: '', size: '', message: '' };

  for (var i = 0; i < fieldData.length; i++) {
    var fname = (fieldData[i].name || '').toLowerCase();
    var fval = (fieldData[i].values && fieldData[i].values[0]) || '';

    if (fname === 'full_name' || fname === '이름' || fname === 'name') {
      result.name = fval;
    } else if (fname === 'phone_number' || fname === '연락처' || fname === 'phone' || fname === '전화번호') {
      result.phone = fval;
    } else if (fname === 'email' || fname === '이메일') {
      result.email = fval;
    } else if (fname === 'size' || fname === '관심평형' || fname === '평형') {
      result.size = fval;
    } else if (fname === 'message' || fname === '문의내용' || fname === '메시지') {
      result.message = fval;
    }
  }

  return result;
}

/* ═══════════════════════════════════════════════
   4. 트리거 설정/해제
   ═══════════════════════════════════════════════ */

// 1분마다 메타 리드 자동 수집 트리거 설치
function installMetaTrigger() {
  // 기존 트리거 제거
  removeMetaTrigger();

  ScriptApp.newTrigger('fetchMetaLeads')
    .timeBased()
    .everyMinutes(1)
    .create();

  Logger.log('✅ 메타 리드 수집 트리거 설치 (1분 간격)');
}

// 트리거 제거
function removeMetaTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'fetchMetaLeads') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  Logger.log('트리거 제거 완료');
}

/* ═══════════════════════════════════════════════
   5. 초기 설정 도우미
   ═══════════════════════════════════════════════ */

// 스크립트 속성 한번에 설정 (Apps Script 에디터에서 실행)
function setupProperties() {
  var props = PropertiesService.getScriptProperties();

  // ★ 아래 값들을 실제 값으로 교체하세요 ★
  props.setProperties({
    'CHAT_WEBHOOK_URL': 'YOUR_GOOGLE_CHAT_WEBHOOK_URL_HERE',
    'META_ACCESS_TOKEN': 'YOUR_META_LONG_LIVED_ACCESS_TOKEN_HERE',
    'META_PAGE_ID': 'YOUR_FACEBOOK_PAGE_ID_HERE'
  });

  Logger.log('✅ 속성 설정 완료! 값을 확인하세요:');
  Logger.log(props.getProperties());
}

/* ═══════════════════════════════════════════════
   6. 테스트 함수들
   ═══════════════════════════════════════════════ */

// 웹 폼 제출 테스트
function testDoPost() {
  var mock = {
    postData: {
      contents: JSON.stringify({
        name: '테스트',
        phone: '010-1234-5678',
        size: '84A',
        visit_date: '2026-04-01',
        visit_time: '10-12',
        message: 'Google Chat 알림 테스트',
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

// Google Chat 알림 테스트
function testChatNotification() {
  sendChatNotification({
    source: '🧪 테스트',
    name: '홍길동',
    phone: '010-1234-5678',
    size: '84A (34평)',
    visitDate: '2026-04-01',
    visitTime: '10-12시',
    message: '84A 타입 관심있습니다',
    channel: 'Meta / cpc',
    campaign: '선착순분양'
  });
}

// 메타 리드 수집 수동 테스트
function testFetchMetaLeads() {
  fetchMetaLeads();
}
