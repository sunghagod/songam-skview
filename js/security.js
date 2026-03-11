/* ═══════════════════════════════════════════════
   security.js — 송암공원 SK VIEW 보안 모듈
   XSS 방지, 입력 검증, 레이트 리미팅
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════
     1. XSS 방지 — HTML 새니타이저
     ══════════════════════════════════════════════ */

  // 허용할 태그와 속성 화이트리스트
  var ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'br', 'span', 'small', 'p', 'ul', 'li'];
  var ALLOWED_ATTRS = ['class', 'style'];

  /**
   * HTML 문자열에서 허용된 태그만 남기고 나머지 제거
   * script, iframe, on* 이벤트 핸들러 등 차단
   */
  function sanitizeHTML(html) {
    if (typeof html !== 'string') return '';

    // 1) script, iframe, object, embed 태그 완전 제거
    html = html.replace(/<\s*(script|iframe|object|embed|link|style|meta|base)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '');
    html = html.replace(/<\s*(script|iframe|object|embed|link|style|meta|base)[^>]*\/?>/gi, '');

    // 2) on* 이벤트 핸들러 속성 제거 (onclick, onerror 등)
    html = html.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    // 3) javascript:, data:, vbscript: URL 스킴 제거
    html = html.replace(/(?:href|src|action)\s*=\s*(?:"[^"]*(?:javascript|data|vbscript)\s*:[^"]*"|'[^']*(?:javascript|data|vbscript)\s*:[^']*')/gi, '');

    // 4) DOM 파서를 이용한 안전한 태그 필터링
    var doc = new DOMParser().parseFromString(html, 'text/html');
    cleanNode(doc.body);
    return doc.body.innerHTML;
  }

  function cleanNode(node) {
    var children = Array.prototype.slice.call(node.childNodes);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.nodeType === 1) { // Element
        var tag = child.tagName.toLowerCase();
        if (ALLOWED_TAGS.indexOf(tag) === -1) {
          // 허용되지 않은 태그: 자식 노드만 살리고 태그 제거
          while (child.firstChild) {
            node.insertBefore(child.firstChild, child);
          }
          node.removeChild(child);
        } else {
          // 허용된 태그: 위험한 속성 제거
          var attrs = Array.prototype.slice.call(child.attributes);
          for (var j = 0; j < attrs.length; j++) {
            var attrName = attrs[j].name.toLowerCase();
            if (ALLOWED_ATTRS.indexOf(attrName) === -1 || attrName.indexOf('on') === 0) {
              child.removeAttribute(attrs[j].name);
            }
          }
          cleanNode(child);
        }
      }
    }
  }

  /**
   * 문자열을 안전하게 이스케이프 (textContent 대신 사용)
   */
  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }


  /* ══════════════════════════════════════════════
     2. 입력값 검증
     ══════════════════════════════════════════════ */

  var validators = {
    /** 이름: 2~20자, 한글/영문/공백 */
    name: function (val) {
      val = (val || '').trim();
      if (!val) return { valid: false, msg: '이름을 입력해주세요.' };
      if (val.length < 2 || val.length > 20) return { valid: false, msg: '이름은 2~20자로 입력해주세요.' };
      if (!/^[가-힣a-zA-Z\s]+$/.test(val)) return { valid: false, msg: '이름은 한글 또는 영문만 입력 가능합니다.' };
      return { valid: true, value: val };
    },

    /** 전화번호: 한국 휴대폰 (010-XXXX-XXXX) */
    phone: function (val) {
      val = (val || '').trim().replace(/\s/g, '');
      if (!val) return { valid: false, msg: '연락처를 입력해주세요.' };
      // 하이픈 유무 모두 허용
      var cleaned = val.replace(/-/g, '');
      if (!/^01[016789]\d{7,8}$/.test(cleaned)) {
        return { valid: false, msg: '올바른 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)' };
      }
      // 포맷팅
      var formatted = cleaned.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3');
      return { valid: true, value: formatted };
    },

    /** 메시지: 최대 500자, 위험 문자 제거 */
    message: function (val) {
      val = (val || '').trim();
      if (val.length > 500) return { valid: false, msg: '문의사항은 500자 이내로 작성해주세요.' };
      // HTML 태그 제거
      val = val.replace(/<[^>]*>/g, '');
      return { valid: true, value: val };
    }
  };


  /* ══════════════════════════════════════════════
     3. 레이트 리미팅 (폼 스팸 방지)
     ══════════════════════════════════════════════ */

  var rateLimitStore = {};

  /**
   * 레이트 리미트 체크
   * @param {string} key - 식별키
   * @param {number} intervalMs - 제한 간격(ms)
   * @param {number} maxCount - 간격 내 최대 허용 횟수
   * @returns {boolean} true = 허용, false = 차단
   */
  function rateLimit(key, intervalMs, maxCount) {
    var now = Date.now();
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = [];
    }

    // 만료된 기록 제거
    rateLimitStore[key] = rateLimitStore[key].filter(function (t) {
      return now - t < intervalMs;
    });

    if (rateLimitStore[key].length >= maxCount) {
      return false; // 차단
    }

    rateLimitStore[key].push(now);
    return true; // 허용
  }


  /* ══════════════════════════════════════════════
     4. 비밀번호 해싱 (SHA-256)
     ══════════════════════════════════════════════ */

  /**
   * SHA-256 해시 생성 (async)
   * @param {string} text
   * @returns {Promise<string>} hex 해시
   */
  function sha256(text) {
    var encoder = new TextEncoder();
    var data = encoder.encode(text);
    return crypto.subtle.digest('SHA-256', data).then(function (buffer) {
      var hashArray = Array.from(new Uint8Array(buffer));
      return hashArray.map(function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  }


  /* ══════════════════════════════════════════════
     5. CSRF 토큰 (세션 기반)
     ══════════════════════════════════════════════ */

  var csrfToken = null;

  function generateCSRFToken() {
    var arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    csrfToken = Array.from(arr, function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
    sessionStorage.setItem('csrf_token', csrfToken);
    return csrfToken;
  }

  function getCSRFToken() {
    if (!csrfToken) {
      csrfToken = sessionStorage.getItem('csrf_token') || generateCSRFToken();
    }
    return csrfToken;
  }


  /* ══════════════════════════════════════════════
     공개 API
     ══════════════════════════════════════════════ */

  window.Security = {
    sanitizeHTML: sanitizeHTML,
    escapeHTML: escapeHTML,
    validate: validators,
    rateLimit: rateLimit,
    sha256: sha256,
    csrf: {
      generate: generateCSRFToken,
      get: getCSRFToken
    }
  };

})();
