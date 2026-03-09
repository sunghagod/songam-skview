/**
 * main.js — 송암공원 SK VIEW
 * 진월더리브 방식 완전 재현
 *
 * ── 핵심 시스템 ───────────────────────────────────────
 *  1. fullPage Scroll  (wheel accumulator + translate3d)
 *  2. overlay-panel    (섹션 내 단계별 wheel 전환)
 *  3. hslide           (섹션 내 수평 슬라이드)
 *  4. GSAP 2-step FX   (prepFx/playFxIn)
 *  5. header data-theme (섹션·슬라이드별)
 *  6. Custom cursor
 *  7. Mobile (IO + normal scroll)
 *  8. Number counter, Form+Toast, Keyboard nav
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════
     CONFIG
     ══════════════════════════════════════════════════════ */
  var SCROLL_SPEED     = 1000;   // ms — 섹션 전환 속도
  var OVERLAY_STEP_MS  = 900;    // ms — overlay 단계 전환 잠금
  var WHEEL_THRESHOLD  = 50;     // 누적 wheel 임계값
  var WHEEL_RESET_MS   = 180;    // wheel 누적 리셋 타이머
  var COOLDOWN_MS      = 200;    // afterLoad 쿨다운
  var MOBILE_BP        = 768;    // 모바일 기준 px

  /* ══════════════════════════════════════════════════════
     STATE
     ══════════════════════════════════════════════════════ */
  var curIdx       = 0;
  var isFPMoving   = false;
  var blockUntil   = 0;
  var wheelAcc     = 0;
  var wheelTimer   = null;
  var isMobile     = window.innerWidth <= MOBILE_BP;
  var counterDone  = false;

  /* overlay state: { [sectionIdx]: { step, max } } */
  var overlayState = {};

  /* hslide state: { [sectionIdx]: { idx, count } } */
  var hslideState  = {};

  /* ══════════════════════════════════════════════════════
     DOM
     ══════════════════════════════════════════════════════ */
  var wrap     = document.getElementById('wrap');
  var header   = document.getElementById('header');
  var dotsNav  = document.getElementById('dots');
  var dots     = Array.prototype.slice.call(dotsNav ? dotsNav.querySelectorAll('.dot') : []);
  var gnbLinks = Array.prototype.slice.call(document.querySelectorAll('.gnb a'));
  var ham      = document.getElementById('ham');
  var mmenu    = document.getElementById('mmenu');
  var floatBtn = document.getElementById('floatBtn');
  var toast    = document.getElementById('toast');
  var form     = document.getElementById('form');
  var logoLink = document.getElementById('logoLink');
  var SECTIONS = Array.prototype.slice.call(document.querySelectorAll('.sec'));
  var SEC_COUNT = SECTIONS.length;

  /* ══════════════════════════════════════════════════════
     TIME HELPERS
     ══════════════════════════════════════════════════════ */
  function now() { return Date.now(); }
  function block(ms) { var t = now() + ms; if (t > blockUntil) blockUntil = t; }
  function isBlocked() { return isFPMoving || now() < blockUntil; }

  /* ══════════════════════════════════════════════════════
     HEADER THEME
     ══════════════════════════════════════════════════════ */
  function applyHeaderTheme() {
    var sec = SECTIONS[curIdx];
    if (!sec) return;

    /* hslide: 활성 슬라이드의 data-header 우선 */
    var activeSlide = sec.querySelector('.slide.active[data-header]');
    if (activeSlide) {
      header.setAttribute('data-theme', activeSlide.getAttribute('data-header') || 'dark');
      _syncDots(activeSlide.getAttribute('data-header') || 'dark');
      return;
    }

    /* overlay: is-active 패널의 data-header 우선 */
    var activePanel = sec.querySelector('.overlay-panel.is-active[data-header]');
    if (activePanel) {
      header.setAttribute('data-theme', activePanel.getAttribute('data-header') || 'dark');
      _syncDots(activePanel.getAttribute('data-header') || 'dark');
      return;
    }

    /* 섹션 자체의 data-theme */
    var theme = sec.dataset.theme || 'dark';
    header.setAttribute('data-theme', theme);
    _syncDots(theme);
  }

  function _syncDots(theme) {
    if (dotsNav) dotsNav.classList.toggle('light', theme === 'light');
    header.classList.toggle('scrolled', curIdx !== 0);
  }

  /* ══════════════════════════════════════════════════════
     OVERLAY PANEL
     ══════════════════════════════════════════════════════ */
  function isOverlay(sec) {
    return sec && sec.getAttribute('data-overlay') === 'on';
  }

  function ensureOverlay(idx) {
    if (overlayState[idx]) return overlayState[idx];
    var sec    = SECTIONS[idx];
    if (!sec) return null;
    var panels = sec.querySelectorAll('.overlay-panel[data-step]');
    if (!panels.length) return null;

    var max = 0;
    panels.forEach(function (p) {
      var n = parseInt(p.getAttribute('data-step'), 10);
      if (!isNaN(n) && n > max) max = n;
    });

    panels.forEach(function (p) { p.classList.remove('is-active'); });
    var first = sec.querySelector('.overlay-panel[data-step="0"]');
    if (first) first.classList.add('is-active');

    overlayState[idx] = { step: 0, max: max };
    return overlayState[idx];
  }

  function renderOverlay(idx) {
    var sec = SECTIONS[idx];
    var st  = overlayState[idx];
    if (!sec || !st) return;

    var panels = sec.querySelectorAll('.overlay-panel[data-step]');

    /* 모든 패널 비활성 + FX 리셋 */
    panels.forEach(function (p) {
      p.classList.remove('is-active');
      if (window.AnimateFx) window.AnimateFx.prep(p);
    });

    /* 대상 패널 활성 */
    var target = sec.querySelector('.overlay-panel[data-step="' + st.step + '"]');
    if (!target) return;

    target.classList.add('is-active');
    if (window.AnimateFx) window.AnimateFx.prep(target);

    /* CSS transition 끝나면 FX 실행 */
    _waitTransitionEnd(target, function () {
      requestAnimationFrame(function () {
        void target.offsetWidth;
        if (window.AnimateFx) window.AnimateFx.play(target);
        /* 진행 dot 업데이트 */
        _updateOverlayProgress(idx, st.step, st.max);
        applyHeaderTheme();
      });
    });
  }

  function stepOverlayForward(idx) {
    var st = overlayState[idx];
    if (!st || st.step >= st.max) return false;
    st.step++;
    renderOverlay(idx);
    block(OVERLAY_STEP_MS);
    return true;
  }

  function stepOverlayBackward(idx) {
    var st = overlayState[idx];
    if (!st || st.step <= 0) return false;
    st.step--;
    renderOverlay(idx);
    block(OVERLAY_STEP_MS);
    return true;
  }

  function _updateOverlayProgress(idx, step, max) {
    var sec  = SECTIONS[idx];
    if (!sec) return;
    var dots = sec.querySelectorAll('.ov-dot');
    dots.forEach(function (d, i) { d.classList.toggle('on', i === step); });
  }

  function _waitTransitionEnd(el, cb) {
    var done = false;
    function finish() {
      if (done) return; done = true;
      el.removeEventListener('transitionend', onEnd);
      cb();
    }
    function onEnd(e) { if (e.target === el) finish(); }
    el.addEventListener('transitionend', onEnd);
    setTimeout(finish, 600); /* 안전장치 */
  }

  /* ══════════════════════════════════════════════════════
     HORIZONTAL SLIDE
     ══════════════════════════════════════════════════════ */
  function isHSlide(sec) {
    return sec && sec.getAttribute('data-hslide') === 'on';
  }

  function ensureHSlide(idx) {
    if (hslideState[idx]) return hslideState[idx];
    var sec    = SECTIONS[idx];
    if (!sec) return null;
    var track  = sec.querySelector('.hslide-track');
    var slides = sec.querySelectorAll('.slide');
    if (!slides.length) return null;

    /* 첫 슬라이드 활성 */
    slides.forEach(function (s) { s.classList.remove('active'); });
    slides[0].classList.add('active');

    hslideState[idx] = { idx: 0, count: slides.length, track: track };
    return hslideState[idx];
  }

  function renderHSlide(secIdx) {
    var st    = hslideState[secIdx];
    var sec   = SECTIONS[secIdx];
    if (!st || !sec) return;

    var slides = sec.querySelectorAll('.slide');
    slides.forEach(function (s, i) {
      s.classList.toggle('active', i === st.idx);
      if (window.AnimateFx) window.AnimateFx.prep(s);
    });

    /* translate track */
    if (st.track) {
      st.track.style.transform = 'translateX(' + (-st.idx * 100) + 'vw)';
    }

    /* 활성 슬라이드 FX */
    var activeSlide = slides[st.idx];
    if (activeSlide) {
      requestAnimationFrame(function () {
        void activeSlide.offsetWidth;
        if (window.AnimateFx) window.AnimateFx.play(activeSlide);
        applyHeaderTheme();
      });
    }

    /* 슬라이드 도트 */
    _updateHSlideProgress(secIdx, st.idx, st.count);
  }

  function slideForward(secIdx) {
    var st = hslideState[secIdx];
    if (!st || st.idx >= st.count - 1) return false;
    st.idx++;
    renderHSlide(secIdx);
    block(SCROLL_SPEED);
    return true;
  }

  function slideBackward(secIdx) {
    var st = hslideState[secIdx];
    if (!st || st.idx <= 0) return false;
    st.idx--;
    renderHSlide(secIdx);
    block(SCROLL_SPEED);
    return true;
  }

  function _updateHSlideProgress(secIdx, idx, count) {
    var sec = SECTIONS[secIdx];
    if (!sec) return;
    var dots = sec.querySelectorAll('.hs-dot');
    dots.forEach(function (d, i) { d.classList.toggle('on', i === idx); });
  }

  /* ══════════════════════════════════════════════════════
     FULLPAGE SCROLL
     ══════════════════════════════════════════════════════ */
  function goTo(idx, skipAnim) {
    idx = Math.max(0, Math.min(idx, SEC_COUNT - 1));
    if (idx === curIdx) return;

    var prev = curIdx;
    curIdx   = idx;

    /* wrap 이동 */
    wrap.style.transform = 'translateY(' + (-idx * 100) + 'vh)';

    /* 진입 섹션 prep */
    var entering = SECTIONS[idx];
    if (entering) {
      if (isOverlay(entering)) {
        var st = ensureOverlay(idx);
        var panel = entering.querySelector('.overlay-panel[data-step="' + st.step + '"]');
        if (window.AnimateFx && panel) window.AnimateFx.prep(panel);
      } else if (isHSlide(entering)) {
        var hs  = ensureHSlide(idx);
        var sld = entering.querySelectorAll('.slide')[hs ? hs.idx : 0];
        if (window.AnimateFx && sld) window.AnimateFx.prep(sld);
      } else {
        if (window.AnimateFx) window.AnimateFx.prep(entering);
      }
    }

    /* UI 즉시 업데이트 */
    _updateDots(idx);
    applyHeaderTheme();
    floatBtn && floatBtn.classList.toggle('show', idx > 0 && idx < SEC_COUNT - 1);
    closeMmenu();

    /* afterLoad — 전환 완료 후 FX 실행 */
    setTimeout(function () {
      isFPMoving = false;
      block(COOLDOWN_MS);

      var sec = SECTIONS[curIdx];
      if (!sec) return;

      if (isOverlay(sec)) {
        ensureOverlay(curIdx);
        renderOverlay(curIdx);
      } else if (isHSlide(sec)) {
        ensureHSlide(curIdx);
        renderHSlide(curIdx);
      } else {
        void sec.offsetWidth;
        if (window.AnimateFx) window.AnimateFx.play(sec);
      }

      if (curIdx === 1) runCounters();

      /* 이전 섹션 리셋 */
      var prevSec = SECTIONS[prev];
      if (prevSec) {
        if (window.AnimateFx) window.AnimateFx.reset(prevSec);
        prevSec.querySelectorAll('.overlay-panel').forEach(function (p) {
          if (window.AnimateFx) window.AnimateFx.reset(p);
        });
        prevSec.querySelectorAll('.slide').forEach(function (s) {
          if (window.AnimateFx) window.AnimateFx.reset(s);
        });
        /* overlay/hslide state 리셋 */
        if (overlayState[prev]) { overlayState[prev].step = 0; }
        if (hslideState[prev])  { hslideState[prev].idx  = 0; }
      }

      applyHeaderTheme();
    }, SCROLL_SPEED);
  }

  function _updateDots(idx) {
    dots.forEach(function (d, i) { d.classList.toggle('on', i === idx); });
    gnbLinks.forEach(function (a, i) { a.classList.toggle('act', i + 1 === idx); });
  }

  /* ══════════════════════════════════════════════════════
     WHEEL HANDLER
     ══════════════════════════════════════════════════════ */
  function normDelta(e) {
    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 16;
    else if (e.deltaMode === 2) d *= 800;
    return d;
  }

  function onWheel(e) {
    if (isMobile) return;
    if (isBlocked()) { e.preventDefault(); e.stopImmediatePropagation(); return; }

    var sec = SECTIONS[curIdx];
    if (!sec) return;

    /* overlay/hslide 섹션이면 누적 처리 */
    if (isOverlay(sec) || isHSlide(sec)) {
      wheelAcc += normDelta(e);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(function () { wheelAcc = 0; }, WHEEL_RESET_MS);

      if (Math.abs(wheelAcc) < WHEEL_THRESHOLD) {
        e.preventDefault(); e.stopImmediatePropagation();
        return;
      }

      var down = wheelAcc > 0;
      wheelAcc = 0;

      if (isOverlay(sec)) {
        ensureOverlay(curIdx);
        var st   = overlayState[curIdx];
        var used = down
          ? (st.step < st.max ? (stepOverlayForward(curIdx), true) : false)
          : (st.step > 0      ? (stepOverlayBackward(curIdx), true) : false);
        if (used) { e.preventDefault(); e.stopImmediatePropagation(); return; }
        /* step 끝 → 섹션 전환 */
        if (!down && st.step === 0) { /* 위로 나가기 */ }
      }

      if (isHSlide(sec)) {
        ensureHSlide(curIdx);
        var moved = down ? slideForward(curIdx) : slideBackward(curIdx);
        if (moved) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      }
    }

    /* 일반 섹션 누적 */
    wheelAcc += normDelta(e);
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(function () { wheelAcc = 0; }, WHEEL_RESET_MS);

    if (Math.abs(wheelAcc) < WHEEL_THRESHOLD) return;
    var goDown = wheelAcc > 0;
    wheelAcc = 0;

    if (goDown && curIdx === SEC_COUNT - 1) return;
    if (!goDown && curIdx === 0) return;

    isFPMoving = true;
    block(SCROLL_SPEED);
    goTo(curIdx + (goDown ? 1 : -1));
  }

  /* 터치 */
  var touchY0 = 0;
  function onTouchStart(e) { touchY0 = e.touches[0].clientY; }
  function onTouchEnd(e) {
    if (isMobile || isBlocked()) return;
    var dy = touchY0 - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 40) return;
    var down = dy > 0;

    var sec = SECTIONS[curIdx];
    if (isOverlay(sec)) {
      ensureOverlay(curIdx);
      var st = overlayState[curIdx];
      if (down && st.step < st.max) { stepOverlayForward(curIdx); return; }
      if (!down && st.step > 0)     { stepOverlayBackward(curIdx); return; }
    }
    if (isHSlide(sec)) {
      ensureHSlide(curIdx);
      if (down ? slideForward(curIdx) : slideBackward(curIdx)) return;
    }

    isFPMoving = true;
    block(SCROLL_SPEED);
    goTo(curIdx + (down ? 1 : -1));
  }

  /* ── data-go 전역 위임 ──────────────────────────────── */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-go]');
    if (!el) return;
    e.preventDefault();
    var idx = parseInt(el.getAttribute('data-go'), 10);
    if (isMobile) {
      var t = SECTIONS[idx];
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    } else {
      isFPMoving = true;
      block(SCROLL_SPEED);
      goTo(idx);
    }
    closeMmenu();
  });

  /* ══════════════════════════════════════════════════════
     MOBILE IntersectionObserver
     ══════════════════════════════════════════════════════ */
  var mobileIO = null;

  function initMobile() {
    document.body.classList.add('mobile-mode');
    wrap.style.transform = '';

    /* 모바일 히어로 패널 전환 애니메이션 (GSAP) */
    var heroPanel0 = document.querySelector('.s0-panel[data-step="0"]');
    var heroPanel1 = document.querySelector('.s0-panel[data-step="1"]');
    var heroP1Body = heroPanel1 ? heroPanel1.querySelector('.s0-body') : null;
    var heroP0Body = heroPanel0 ? heroPanel0.querySelector('.s0-body') : null;
    var heroAnimPlayed = false;

    if (heroPanel0 && heroP0Body) {
      /* 초기 상태: 패널 0 본문 보이기 */
      gsap.set(heroP0Body, { opacity: 1, y: 0 });
      var io0 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            gsap.to(heroP0Body, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
          } else {
            gsap.to(heroP0Body, { opacity: 0, y: -30, duration: 0.5, ease: 'power2.in' });
          }
        });
      }, { threshold: 0.15 });
      io0.observe(heroPanel0);
    }
    if (heroPanel1) {
      var io1 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && !heroAnimPlayed && heroP1Body && gsap) {
            heroAnimPlayed = true;
            // 배경 오버레이 전환
            var after1 = heroPanel1;
            // 콘텐츠 순차 등장
            var children = heroP1Body.children;
            gsap.to(heroP1Body, { opacity: 1, y: 0, duration: 0 });
            var tl = gsap.timeline();
            for (var i = 0; i < children.length; i++) {
              gsap.set(children[i], { opacity: 0, y: 40 });
              tl.to(children[i], { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, i * 0.15);
            }
          }
        });
      }, { threshold: 0.2 });
      io1.observe(heroPanel1);
    }

    mobileIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var idx = SECTIONS.indexOf(en.target);
        _updateDots(idx);
        if (idx === 1) runCounters();
        if (floatBtn) floatBtn.classList.toggle('show', idx > 0 && idx < SEC_COUNT - 1);
      });
    }, { threshold: 0.35 });

    SECTIONS.forEach(function (s) { mobileIO.observe(s); });

    if (window.AnimateFx) {
      window.AnimateFx.initIO();
    }
  }

  function destroyMobile() {
    document.body.classList.remove('mobile-mode');
    if (mobileIO) { mobileIO.disconnect(); mobileIO = null; }
  }

  /* ══════════════════════════════════════════════════════
     CUSTOM CURSOR
     ══════════════════════════════════════════════════════ */
  var cursorEl   = document.getElementById('cursor');
  var cRing      = cursorEl ? cursorEl.querySelector('.cursor-ring') : null;
  var cDot       = cursorEl ? cursorEl.querySelector('.cursor-dot')  : null;
  var cX = 0, cY = 0, rX = 0, rY = 0, rafC = null;

  function moveCursor() {
    rX += (cX - rX) * 0.14;
    rY += (cY - rY) * 0.14;
    if (cDot)  { cDot.style.left  = cX + 'px'; cDot.style.top  = cY + 'px'; }
    if (cRing) { cRing.style.left = rX + 'px'; cRing.style.top = rY + 'px'; }
    rafC = requestAnimationFrame(moveCursor);
  }

  if (cursorEl) {
    document.addEventListener('mousemove', function (e) {
      cX = e.clientX; cY = e.clientY;
      if (!rafC) moveCursor();
    });
    var interactables = 'a,button,[data-go],input,select,textarea,.tab,.ccard,.pcard,.dot,.ov-dot,.hs-dot';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(interactables)) cursorEl.classList.add('hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(interactables)) cursorEl.classList.remove('hover');
    });
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var theme = en.target.dataset.theme;
          cursorEl.classList.toggle('light', theme === 'light');
        }
      });
    }, { threshold: 0.5 }).observe && SECTIONS.forEach(function (s) {
      /* simple theme observer for cursor */
    });
  }

  /* ══════════════════════════════════════════════════════
     MOBILE MENU
     ══════════════════════════════════════════════════════ */
  function closeMmenu() {
    if (mmenu) mmenu.classList.remove('open');
    if (ham) ham.classList.remove('open');
  }
  if (ham) {
    ham.addEventListener('click', function () {
      var open = mmenu && mmenu.classList.contains('open');
      if (open) closeMmenu();
      else { if (mmenu) mmenu.classList.add('open'); ham.classList.add('open'); }
    });
  }

  /* ══════════════════════════════════════════════════════
     NUMBER COUNTER
     ══════════════════════════════════════════════════════ */
  function runCounters() {
    if (counterDone) return;
    counterDone = true;
    document.querySelectorAll('.cnt[data-to]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-to'), 10);
      var dur    = 2200;
      var start  = performance.now();
      (function tick(now) {
        var p = Math.min((now - start) / dur, 1);
        var e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); /* easeOutExpo */
        el.textContent = Math.floor(e * target);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      })(start);
    });
  }

  /* ══════════════════════════════════════════════════════
     FORM + TOAST
     ══════════════════════════════════════════════════════ */
  var toastTimer = null;
  function showToast() {
    if (!toast) return;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 3200);
  }
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      showToast();
      form.reset();
    });
  }

  /* ══════════════════════════════════════════════════════
     KEYBOARD NAV
     ══════════════════════════════════════════════════════ */
  document.addEventListener('keydown', function (e) {
    if (isMobile || isBlocked()) return;
    var sec = SECTIONS[curIdx];
    var key = e.key;
    var down = key === 'ArrowDown' || key === 'PageDown';
    var up   = key === 'ArrowUp'   || key === 'PageUp';
    if (!down && !up && key !== 'Home' && key !== 'End') return;
    e.preventDefault();

    if (key === 'Home') { isFPMoving = true; block(SCROLL_SPEED); goTo(0); return; }
    if (key === 'End')  { isFPMoving = true; block(SCROLL_SPEED); goTo(SEC_COUNT - 1); return; }

    if (isOverlay(sec)) {
      ensureOverlay(curIdx);
      if (down && stepOverlayForward(curIdx))  return;
      if (up   && stepOverlayBackward(curIdx)) return;
    }
    if (isHSlide(sec)) {
      if (down && slideForward(curIdx))  return;
      if (up   && slideBackward(curIdx)) return;
    }

    isFPMoving = true; block(SCROLL_SPEED);
    goTo(curIdx + (down ? 1 : -1));
  });

  /* ══════════════════════════════════════════════════════
     COMMUNITY GALLERY (s4) — Overlay-synced Tab Switcher
     ══════════════════════════════════════════════════════ */
  var commItems = Array.prototype.slice.call(document.querySelectorAll('.s4-item'));
  var commBgs   = Array.prototype.slice.call(document.querySelectorAll('.s4-bg'));
  var commMap   = document.getElementById('s4Map');
  var commPreviewImgs = Array.prototype.slice.call(document.querySelectorAll('.s4-preview-img'));
  var commPreviewTag  = document.getElementById('s4PreviewTag');
  var commPreviewBox  = document.getElementById('s4Preview');
  var commTitles = ['피트니스센터','실내 수영장','클라이밍월','스포츠 멀티존','VR 체험존','카페 라운지','단지 위치'];

  function switchComm(idx) {
    commItems.forEach(function (item, i) { item.classList.toggle('active', i === idx); });
    commBgs.forEach(function (bg, i)     { bg.classList.toggle('active', i === idx); });
    /* mobile preview sync */
    commPreviewImgs.forEach(function (img, i) { img.classList.toggle('active', i === idx); });
    if (commPreviewTag) commPreviewTag.textContent = commTitles[idx] || '';
    if (commPreviewBox) commPreviewBox.classList.toggle('hide', idx === 6);
    /* 07번(idx=6) 지도 토글 — 배경은 유지, 우측에 지도 표시 */
    if (commMap) commMap.classList.toggle('active', idx === 6);
  }

  /* 클릭으로도 전환 + overlay state 동기화 */
  commItems.forEach(function (item, i) {
    item.addEventListener('click', function () {
      switchComm(i);
      /* overlay state도 동기화 */
      var s4Idx = SECTIONS.indexOf(document.querySelector('.s4'));
      if (overlayState[s4Idx]) overlayState[s4Idx].step = i;
      _updateOverlayProgress(s4Idx, i, 5);
    });
  });

  /* overlay 시스템 감시 → 커뮤니티 배경/탭 동기화 */
  var s4Sec    = document.querySelector('.s4');
  var s4BodyEl = s4Sec ? s4Sec.querySelector('.s4-body') : null;

  var _origRenderOverlay = renderOverlay;
  renderOverlay = function (idx) {
    _origRenderOverlay(idx);
    if (SECTIONS[idx] === s4Sec && overlayState[idx]) {
      switchComm(overlayState[idx].step);
      /* 최초 진입 시 body FX 실행 */
      if (s4BodyEl && !s4BodyEl._fxDone && window.AnimateFx) {
        s4BodyEl._fxDone = true;
        window.AnimateFx.play(s4BodyEl);
      }
    }
  };

  /* s4를 떠날 때 리셋 — 기존 afterLoad의 reset에 훅 */
  var _origResetFx = window.AnimateFx ? window.AnimateFx.reset : null;
  if (_origResetFx) {
    window.AnimateFx.reset = function (container) {
      _origResetFx(container);
      if (container === s4Sec && s4BodyEl) {
        s4BodyEl._fxDone = false;
        _origResetFx(s4BodyEl);
        switchComm(0);
      }
    };
  }

  /* ══════════════════════════════════════════════════════
     RESIZE
     ══════════════════════════════════════════════════════ */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var was = isMobile;
      isMobile = window.innerWidth <= MOBILE_BP;
      if (!was && isMobile) {
        window.removeEventListener('wheel',      onWheel);
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchend',   onTouchEnd);
        initMobile();
      } else if (was && !isMobile) {
        destroyMobile();
        window.addEventListener('wheel',      onWheel,      { passive: false, capture: true });
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchend',   onTouchEnd,   { passive: true });
        goTo(0);
      }
      if (typeof moveSl === 'function') moveSl(slOff);
    }, 250);
  });

  /* ══════════════════════════════════════════════════════
     LOGO
     ══════════════════════════════════════════════════════ */
  if (logoLink) {
    logoLink.addEventListener('click', function () {
      if (isMobile) SECTIONS[0] && SECTIONS[0].scrollIntoView({ behavior: 'smooth' });
      else { isFPMoving = true; block(SCROLL_SPEED); goTo(0); }
    });
  }

  /* ══════════════════════════════════════════════════════
     BOOT
     ══════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    /* 모든 섹션 초기 prep */
    SECTIONS.forEach(function (sec, i) {
      if (isOverlay(sec)) {
        var st = ensureOverlay(i);
        if (st) {
          var panels = sec.querySelectorAll('.overlay-panel');
          panels.forEach(function (p) {
            if (window.AnimateFx) window.AnimateFx.prep(p);
          });
          /* s4 커뮤니티: body 내 data-fx 요소도 prep */
          var bodyEl = sec.querySelector('.s4-body');
          if (bodyEl && window.AnimateFx) window.AnimateFx.prep(bodyEl);
        }
      } else if (isHSlide(sec)) {
        var hs = ensureHSlide(i);
        if (hs) {
          sec.querySelectorAll('.slide').forEach(function (s) {
            if (window.AnimateFx) window.AnimateFx.prep(s);
          });
        }
      } else {
        if (i !== 0 && window.AnimateFx) window.AnimateFx.prep(sec);
      }
    });

    if (isMobile) {
      initMobile();
    } else {
      /* PC 이벤트 등록 */
      window.addEventListener('wheel',      onWheel,      { passive: false, capture: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchend',   onTouchEnd,   { passive: true });

      /* 히어로 섹션 FX 실행 */
      var hero = SECTIONS[0];
      if (hero) {
        if (isOverlay(hero)) {
          ensureOverlay(0);
          renderOverlay(0);
        } else {
          setTimeout(function () {
            if (window.AnimateFx) window.AnimateFx.play(hero);
          }, 100);
        }
      }

      _updateDots(0);
      applyHeaderTheme();
      floatBtn && floatBtn.classList.remove('show');
    }
  });

})();
