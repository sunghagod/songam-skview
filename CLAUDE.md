# 송암공원 SK VIEW

## 프로젝트 정보
- **프로젝트명**: 송암공원 중흥S-클래스 SK VIEW 분양 랜딩페이지
- **위치**: 광주광역시 남구 송암동, 1,575세대, 17개동, 27층
- **대표번호**: 1533-3592 / 분양문의: 1800-7076

## 스택
- 순수 HTML/CSS/JS + GSAP 3 (프레임워크 없음)
- 디자인: 다크 럭셔리(#0B0B0B) + 골드(#C09B6A)
- 폰트: Pretendard(한글) + Cormorant Garamond(영문 세리프)

## 배포
- **호스팅**: Cloudflare Pages
- **GitHub**: https://github.com/sunghagod/songam-skview (main 브랜치 = production)
- **프로덕션 URL**: https://songam-skview.com (커스텀 도메인, Cloudflare DNS)
- **Pages 기본 URL**: https://songam-skview.pages.dev
- **로컬 서버**: `cd "C:\Users\sungh\OneDrive\Desktop\송암공원" && python -m http.server 8080` → http://localhost:8080

## 파일 구조
- `index.html` — 메인 랜딩 (8개 섹션: Hero, Brand, 학세권, 공원, 문화복지센터, 평형안내, 긴급혜택, Contact, Footer)
- `admin.html` — 관리자 페이지 (localStorage CMS)
- `css/style.css` — 메인 스타일
- `js/main.js` — fullPage 스크롤, overlay-panel, hslide, 커서, 모바일 IO
- `js/animate.js` — GSAP 2단계 FX 엔진 (data-fx 선언형)
- `js/content.js` — localStorage 기반 CMS
- `js/form.js` — 관심고객 등록 → Google Apps Script 연동
- `js/admin.js` — 관리자 로그인/편집/저장
- `js/security.js` — XSS 방지, 입력 검증, 레이트리미팅

## 수정 후 확인
- Playwright 기존 페이지에서 새로고침(navigate)으로 확인 (새 창 열지 말 것)
- 스크린샷 찍어서 직접 검증 후 사용자에게 보여주기
