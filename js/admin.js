/* ═══════════════════════════════════════════════
   admin.js — 송암공원 SK VIEW 관리자
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── 비밀번호 ─────────────────────────── */
  var ADMIN_PW = 'cynegod';

  /* ── 로컬스토리지 키 ─────────────────── */
  var STORE_KEY = 'skview_content';
  var IMG_KEY   = 'skview_images';

  /* ── 상태 ────────────────────────────── */
  var currentPanel = 'dashboard';
  var pendingData  = {};   // unsaved text changes
  var pendingImgs  = {};   // unsaved image changes

  /* ── 유틸 ────────────────────────────── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function loadContent() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch(e) { return {}; }
  }
  function loadImages() {
    try { return JSON.parse(localStorage.getItem(IMG_KEY)) || {}; } catch(e) { return {}; }
  }
  function saveContent(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
  function saveImages(imgs)  { localStorage.setItem(IMG_KEY,   JSON.stringify(imgs));  }

  /* ── 토스트 ──────────────────────────── */
  function toast(msg) {
    var t = $('#aToast');
    t.querySelector('span').textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2800);
  }

  /* ── 로그인 ──────────────────────────── */
  function initLogin() {
    var btn   = $('#btnLogin');
    var input = $('#adminPw');
    var err   = $('#loginErr');

    function tryLogin() {
      if (input.value === ADMIN_PW) {
        $('#loginScreen').style.display = 'none';
        $('#adminApp').classList.add('on');
        initApp();
      } else {
        err.classList.add('show');
        input.value = '';
        input.focus();
        setTimeout(function() { err.classList.remove('show'); }, 2000);
      }
    }

    btn.addEventListener('click', tryLogin);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') tryLogin();
    });
  }

  /* ── 사이드바 네비 ───────────────────── */
  function initNav() {
    $$('.sb-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var target = item.dataset.panel;
        if (!target) return;
        $$('.sb-item').forEach(function(i) { i.classList.remove('active'); });
        item.classList.add('active');
        $$('.panel').forEach(function(p) { p.classList.remove('active'); });
        var panel = $('#panel-' + target);
        if (panel) {
          panel.classList.add('active');
          currentPanel = target;
        }
      });
    });

    /* 아코디언 */
    $$('.sec-card-head').forEach(function(head) {
      head.addEventListener('click', function() {
        head.closest('.sec-card').classList.toggle('open');
      });
    });

    /* 빠른 이동 */
    $$('.quick-link').forEach(function(lnk) {
      lnk.addEventListener('click', function() {
        var target = lnk.dataset.goto;
        if (!target) return;
        var navItem = $('[data-panel="' + target + '"]');
        if (navItem) navItem.click();
      });
    });
  }

  /* ── 텍스트 입력 필드 초기화 ──────────── */
  function initTextFields() {
    var saved = loadContent();
    $$('[data-field]').forEach(function(input) {
      var cid = input.dataset.field;
      if (saved[cid] !== undefined) {
        input.value = saved[cid];
      }
      input.addEventListener('input', function() {
        pendingData[cid] = input.value;
      });
    });
  }

  /* ── 이미지 업로더 초기화 ────────────── */
  function initImageUploaders() {
    var savedImgs = loadImages();

    $$('[data-img-field]').forEach(function(wrap) {
      var cid     = wrap.dataset.imgField;
      var input   = wrap.querySelector('input[type="file"]');
      var preview = wrap.querySelector('.img-preview img');
      var noImg   = wrap.querySelector('.no-img');
      var btnReset= wrap.querySelector('.btn-img-reset');

      /* 기존 저장 이미지 */
      if (savedImgs[cid]) {
        preview.src = savedImgs[cid];
        preview.classList.add('loaded');
        if (noImg) noImg.style.display = 'none';
      }

      input.addEventListener('change', function() {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
          var dataUrl = e.target.result;
          pendingImgs[cid] = dataUrl;
          preview.src = dataUrl;
          preview.classList.add('loaded');
          if (noImg) noImg.style.display = 'none';
        };
        reader.readAsDataURL(file);
      });

      if (btnReset) {
        btnReset.addEventListener('click', function() {
          pendingImgs[cid] = null;  // null = 삭제 표시
          preview.src = '';
          preview.classList.remove('loaded');
          if (noImg) noImg.style.display = '';
        });
      }
    });
  }

  /* ── 저장 버튼 ───────────────────────── */
  function initSaveButtons() {
    $$('.btn-save').forEach(function(btn) {
      btn.addEventListener('click', function() {
        /* 텍스트 저장 */
        var data = loadContent();
        Object.keys(pendingData).forEach(function(k) {
          data[k] = pendingData[k];
        });
        saveContent(data);

        /* 이미지 저장 */
        var imgs = loadImages();
        Object.keys(pendingImgs).forEach(function(k) {
          if (pendingImgs[k] === null) {
            delete imgs[k];
          } else {
            imgs[k] = pendingImgs[k];
          }
        });
        saveImages(imgs);

        pendingData = {};
        pendingImgs = {};

        toast('저장되었습니다.');
      });
    });
  }

  /* ── 미리보기 버튼 ───────────────────── */
  function initPreviewButtons() {
    $$('.btn-preview').forEach(function(btn) {
      btn.addEventListener('click', function() {
        window.open('index.html', '_blank');
      });
    });
  }

  /* ── 로그아웃 ────────────────────────── */
  function initLogout() {
    var btn = $('#btnLogout');
    if (!btn) return;
    btn.addEventListener('click', function() {
      $('#adminApp').classList.remove('on');
      $('#loginScreen').style.display = '';
      $('#adminPw').value = '';
    });
  }

  /* ── 전체 초기화 버튼 ────────────────── */
  function initReset() {
    var btn = $('#btnResetAll');
    if (!btn) return;
    btn.addEventListener('click', function() {
      if (!confirm('모든 저장된 콘텐츠를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
      localStorage.removeItem(STORE_KEY);
      localStorage.removeItem(IMG_KEY);
      location.reload();
    });
  }

  /* ── 대시보드/설정 통계 ─────────────── */
  function updateDashboard() {
    var data = loadContent();
    var imgs = loadImages();
    var textCount = Object.keys(data).length;
    var imgCount  = Object.keys(imgs).length;

    var elText  = $('#dashTextCount');
    var elImg   = $('#dashImgCount');
    var elText2 = $('#settingsTextCount');
    var elImg2  = $('#settingsImgCount');
    if (elText)  elText.textContent  = textCount + '개';
    if (elImg)   elImg.textContent   = imgCount  + '개';
    if (elText2) elText2.textContent = textCount + '개';
    if (elImg2)  elImg2.textContent  = imgCount  + '개';
  }

  /* ── Google Sheets 테스트 전송 ──────── */
  function initTestForm() {
    var btn = $('#btnTestForm');
    var result = $('#testFormResult');
    if (!btn) return;
    btn.addEventListener('click', function() {
      var cfg = loadContent();
      var url = cfg['form-script-url'] || '';
      if (!url) {
        showTestResult('error', 'Apps Script URL을 먼저 입력 후 저장해주세요.');
        return;
      }
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 전송 중...';
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          name: '테스트',
          phone: '010-0000-0000',
          size: '테스트 평형',
          message: '관리자 테스트 전송'
        })
      }).then(function() {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 테스트 전송';
        showTestResult('ok', '전송 완료! Google Sheets에서 테스트 행을 확인하세요.');
      }).catch(function() {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 테스트 전송';
        showTestResult('error', '전송 실패. URL을 다시 확인해주세요.');
      });
    });

    function showTestResult(type, msg) {
      if (!result) return;
      result.style.display = 'block';
      result.style.color = type === 'ok' ? '#50a064' : '#c03c3c';
      result.textContent = msg;
    }
  }

  /* ── 앱 초기화 ───────────────────────── */
  function initApp() {
    initNav();
    initTextFields();
    initImageUploaders();
    initSaveButtons();
    initPreviewButtons();
    initLogout();
    initReset();
    initTestForm();
    updateDashboard();

    /* 첫 패널 활성화 */
    var first = $('.sb-item[data-panel]');
    if (first) first.click();
  }

  /* ── 시작 ────────────────────────────── */
  document.addEventListener('DOMContentLoaded', initLogin);
})();
