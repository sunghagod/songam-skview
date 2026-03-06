/* ═══════════════════════════════════════════════
   content.js — 송암공원 SK VIEW
   localStorage에 저장된 콘텐츠를 페이지에 적용
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var STORE_KEY = 'skview_content';
  var IMG_KEY   = 'skview_images';

  /* ── 저장된 데이터 로드 ─────────────────── */
  function loadContent() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch(e) { return {}; }
  }
  function loadImages() {
    try { return JSON.parse(localStorage.getItem(IMG_KEY)) || {}; } catch(e) { return {}; }
  }

  /* ── 텍스트 data-cid 적용 ─────────────── */
  function applyText(data) {
    Object.keys(data).forEach(function(cid) {
      var el = document.querySelector('[data-cid="' + cid + '"]');
      if (!el) return;
      el.innerHTML = data[cid];
    });
  }

  /* ── 이미지 data-cid-bg 적용 ─────────── */
  function applyImages(imgs) {
    Object.keys(imgs).forEach(function(cid) {
      /* bg 이미지 (data-cid-bg) */
      var el = document.querySelector('[data-cid-bg="' + cid + '"]');
      if (el) el.style.backgroundImage = 'url(' + imgs[cid] + ')';

      /* src 이미지 (data-cid-img) */
      var img = document.querySelector('[data-cid-img="' + cid + '"]');
      if (img) img.src = imgs[cid];

      /* section 배경 (data-cid-section-bg) */
      var sec = document.querySelector('[data-cid-section-bg="' + cid + '"]');
      if (sec) sec.style.backgroundImage = 'url(' + imgs[cid] + ')';
    });
  }

  /* ── 특수: 섹션 bg 이미지 (s0-bg, s1-img-inner 등) ─ */
  function applySectionBgImages(imgs) {
    var sectionBgMap = {
      'hero-bg':    '.s0-bg',
      'brand-img':  '.s1-img-inner',
      'contact-img':'.s5-img',
      'loc-bg':     '.s2-bg',
      'loc-img1':   '.li0',
      'loc-img2':   '.li1',
      'loc-img3':   '.li2',
      'loc-img4':   '.li3',
    };
    Object.keys(sectionBgMap).forEach(function(cid) {
      if (!imgs[cid]) return;
      var el = document.querySelector(sectionBgMap[cid]);
      if (el) el.style.backgroundImage = 'url(' + imgs[cid] + ')';
    });
  }

  /* ── 실행 ─────────────────────────────── */
  function init() {
    var data = loadContent();
    var imgs = loadImages();
    applyText(data);
    applyImages(imgs);
    applySectionBgImages(imgs);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── 공개 API (admin.js에서 사용) ─────── */
  window.SkvContent = {
    save: function(cid, value) {
      var data = loadContent();
      data[cid] = value;
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    },
    saveImage: function(cid, dataUrl) {
      var imgs = loadImages();
      imgs[cid] = dataUrl;
      localStorage.setItem(IMG_KEY, JSON.stringify(imgs));
    },
    load: loadContent,
    loadImages: loadImages,
    reset: function() {
      localStorage.removeItem(STORE_KEY);
      localStorage.removeItem(IMG_KEY);
    }
  };
})();
