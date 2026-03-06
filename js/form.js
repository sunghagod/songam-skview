/* ═══════════════════════════════════════════════
   form.js — 송암공원 SK VIEW 관심고객 등록
   Google Apps Script → Google Sheets 연동
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Google Apps Script 배포 URL ─────────────
     admin 페이지 설정 또는 아래에 직접 입력      */
  var FALLBACK_URL = 'https://script.google.com/macros/s/AKfycbx-EFIV7S47mTAv6UFx-y1VXMvx0bT10iB2-f4JfTEcq4t_MU9l04gxELZfDAciJJAF/exec';

  /* ── 폼 요소 ─────────────────────────────── */
  var form      = document.getElementById('form');
  if (!form) return;

  var btn       = form.querySelector('.btn-submit');
  var resultEl  = document.getElementById('formResult');
  var btnText   = '관심고객 등록하기 <i class="fa-solid fa-arrow-right"></i>';

  /* ── Script URL: admin 저장값 우선 ─────────── */
  function getScriptUrl() {
    try {
      var cfg = JSON.parse(localStorage.getItem('skview_content') || '{}');
      return cfg['form-script-url'] || FALLBACK_URL;
    } catch (e) {
      return FALLBACK_URL;
    }
  }

  /* ── 제출 핸들러 ─────────────────────────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var scriptUrl = getScriptUrl();
    if (!scriptUrl) {
      showResult('error', '폼 서버 URL이 설정되지 않았습니다.\n관리자 페이지 → 설정에서 Google Script URL을 입력해주세요.');
      return;
    }

    var data = {
      name:    form.querySelector('[name="name"]').value.trim(),
      phone:   form.querySelector('[name="phone"]').value.trim(),
      size:    form.querySelector('[name="size"]').value,
      message: form.querySelector('[name="message"]').value.trim()
    };

    setLoading(true);

    /* no-cors: body를 text/plain으로 전송 (CORS 우회)
       Apps Script에서 e.postData.contents로 수신       */
    fetch(scriptUrl, {
      method: 'POST',
      mode:   'no-cors',
      body:   JSON.stringify(data)
    })
    .then(function () {
      setLoading(false);
      showResult('success', '관심고객 등록이 완료되었습니다.\n빠른 시일 내에 연락드리겠습니다.');
      form.reset();
    })
    .catch(function () {
      setLoading(false);
      showResult('error', '전송 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
    });
  });

  /* ── UI 헬퍼 ─────────────────────────────── */
  function setLoading(on) {
    btn.disabled = on;
    btn.innerHTML = on
      ? '<i class="fa-solid fa-spinner fa-spin"></i> 전송 중...'
      : btnText;
  }

  function showResult(type, msg) {
    if (!resultEl) return;
    resultEl.className = 'form-result form-result--' + type;
    resultEl.innerHTML = msg.replace(/\n/g, '<br>');
    resultEl.style.display = 'block';
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (type === 'success') {
      setTimeout(function () { resultEl.style.display = 'none'; }, 6000);
    }
  }
})();
