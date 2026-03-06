# 송암공원 SK VIEW — 프론트엔드 PDR
## Product Design Requirements v1.0

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 프로젝트명 | 송암공원 SK VIEW 분양 랜딩페이지 |
| 목적 | 분양 홍보 및 관심고객 등록 전환 |
| 타겟 | 30~50대 실수요자, 청주 지역 관심 고객 |
| 톤앤무드 | 다크 럭셔리 + 골드 악센트 (하이엔드 아파트 브랜드 이미지) |
| 주요 전환 지표 | 관심고객 등록 폼 제출, 전화 문의 |

---

## 2. 수집 자료 기반 핵심 설계 원칙

### 2-1. 분석 사이트에서 도출한 원칙

#### 사이트A (진월더리브.kr — 커스텀)
| 채택 패턴 | 근거 |
|---|---|
| **GSAP `data-fx` 선언형 애니메이션 엔진** | HTML 속성만으로 애니메이션 제어 → 유지보수 용이 |
| **blur(8px)→clear 2단계 진입** | 단순 fade-up보다 고급감 높음 |
| **fullPage.js 기반 섹션 스크롤** | 분양 사이트에서 섹션별 몰입도 극대화 |
| **overlay-panel step 시스템** | 같은 섹션 내에서 단계적 콘텐츠 노출 (히어로 연출에 적합) |
| **헤더 `data-header="light|dark"` 테마 전환** | 섹션 배경에 따라 자동 대응, 가독성 보장 |
| **휠 누적(accumulator) + 임계값** | 트랙패드 오작동 방지, 의도된 스크롤만 반응 |

#### 사이트B (진월-더리브라포레.kr — imweb)
| 채택 패턴 | 근거 |
|---|---|
| **CSS `translate3d` 2D 좌표 자체 구현** | 라이브러리 없이 수직+수평 섹션 이동 가능 |
| **CSS `@keyframes` + `.on` 클래스 토글** | GSAP 없이도 충분한 연출 가능, 번들 경량화 |
| **`IntersectionObserver` 모바일 대응** | 모바일에서는 일반 스크롤 + IO로 `.on` 토글 |
| **Vimeo `?background=1` 배경영상** | 컨트롤 숨김, 자동재생, 가벼운 임베드 |
| **sticky 수평 스크롤 변환** | 세로 스크롤 → 가로 이동 트릭 (프리미엄 리스트에 적합) |
| **탭 전환 + 배경 동시 교체** | 입지 섹션에서 카테고리별 정보를 한 뷰에 제공 |

### 2-2. Behance 12선에서 도출한 원칙

| 출처 | 채택 패턴 |
|---|---|
| **98 Wireless** (936likes) | 다크(#0D0D0D) + 골드(#C9A96E) 컬러 시스템, 아웃라인→채움 버튼 |
| **Horizon Grove** (1,002likes) | 비대칭 그리드(3:7), 숫자 인덱싱(01/02/03), 어스톤 팔레트 |
| **KINETIQ** | 커스텀 커서, `clip-path` reveal 전환, `letter-spacing` 압축/확장 |
| **Creatura** | Three.js/GSAP ScrollTrigger `pin` 스크롤, 파티클 배경 |
| **Nestora** | 분할 Hero(텍스트 50% + 이미지 50%), 이미지 마스크 클리핑 |
| **Architecture Portfolio 2025** | 진행률 바, 세리프/산세리프 믹스 타이포 |
| **FOOD WAVE 2025** | 아시아 미니멀리즘, SVG 라인 드로잉 애니메이션 |
| **Mercedes Showroom** | pin 스크롤, CSS 조명 효과, 360° 뷰어 인터랙션 |
| **Landing Folio** | Glass morphism 카드, 그라디언트 Hero |
| **2025 Design Trends** | 다크+네온, Variable Font, 스크롤 반응 텍스트, 3D 인터페이스 |

### 2-3. 최종 적용 우선순위

```
[필수] GSAP data-fx 선언형 + blur→clear 2단계 진입
[필수] fullPage 섹션 스크롤 (PC: wheel + translate3d / Mobile: IO)
[필수] 다크 럭셔리 + 골드 컬러 시스템
[필수] 헤더 light/dark 자동 전환
[필수] 숫자 카운터 애니메이션
[필수] 탭 전환 UI (입지 섹션)
[필수] 반응형 (PC / 태블릿 / 모바일)
[권장] 커스텀 커서 (PC only)
[권장] letter-spacing 압축/확장 애니메이션
[권장] clip-path reveal 섹션 전환
[권장] 수평 드래그 슬라이더 (커뮤니티)
[선택] 배경 영상 (Vimeo background mode)
[선택] 파티클/노이즈 배경 효과
[선택] 진행률 바
```

---

## 3. 디자인 시스템

### 3-1. 컬러 팔레트

```
Primary Dark     #0B0B0B    — 메인 배경
Dark 2           #111111    — 보조 다크 배경
Dark 3           #161616    — 카드 배경

Gold             #C09B6A    — 핵심 악센트
Gold Light       #D4B896    — 호버/강조
Gold Dark        #8B6E45    — 라이트 배경 위 텍스트

White            #FFFFFF    — 다크 배경 위 본문
Off-white        #F5F2EC    — 라이트 섹션 배경
Light BG         #F7F5F0    — 폼/카드 배경

Dark Text        #1A1A1A    — 라이트 배경 위 제목
Gray             #888888    — 보조 텍스트
Gray Light       #C8C8C8    — 디바이더, 비활성
```

**근거:**
- 98 Wireless: `#0D0D0D` + `#C9A96E` 조합이 부동산 럭셔리 컨벤션
- Horizon Grove: 라이트 섹션용 어스톤(`#F5F2EC`) 교차 배치
- 2025 트렌드: 다크 모드 + 골드/앰버 포인트

### 3-2. 타이포그래피

```
한글 본문:
  Pretendard (Variable)
  — CDN: cdn.jsdelivr.net/gh/orioncactus/pretendard
  — Weight: 300(Light), 400(Regular), 500(Medium), 600(SemiBold), 700(Bold)

영문 제목 (세리프):
  Cormorant Garamond
  — Google Fonts
  — Weight: 300(Light), 400(Regular), 500(Medium), 600(SemiBold)
  — 용도: 히어로 타이틀, 섹션 대제목, 숫자 카운터

보조 산세리프 (영문):
  Noto Sans KR 또는 Pretendard 공유
```

**타이포 스케일:**
```
Hero Title     clamp(52px, 9vw, 110px)  — Cormorant, weight 300
Section Title  clamp(32px, 4vw, 54px)   — Cormorant, weight 400
Section Label  11px, letter-spacing 0.45em — Pretendard, weight 600
Body           14~15px, line-height 2.0   — Pretendard, weight 300
Caption        11~12px                    — Pretendard, weight 400
```

**근거:**
- 사이트B: Pretendard(한글) + baskerville-urw(영문 세리프) 조합
- Architecture Portfolio 2025: Playfair Display + Inter 믹스
- 2025 트렌드: 세리프/산세리프 대비로 고급감 연출

### 3-3. 간격(Spacing) 시스템

```
4px / 8px / 12px / 16px / 20px / 24px / 28px / 32px / 40px / 48px / 60px / 80px
```

### 3-4. 라운딩(Border Radius)

```
카드: 4px (미세 라운드, 고급감 유지)
버튼: 2px (거의 직각, 럭셔리 톤)
원형 요소: 50% (커스텀 커서, 플로팅 버튼)
```

---

## 4. 페이지 구조 (섹션 맵)

### 4-1. 전체 구조

```
HEADER (fixed, z-index: 1000)
├── 로고 (송암공원 / SK VIEW)
├── GNB (PC: 인라인 / Mobile: 숨김)
├── 전화버튼 + 햄버거

#container (fullPage scroll 대상)
├── SEC 0  HERO          [dark]   100vh  — 풀스크린 타이틀 + CTA
├── SEC 1  BRAND         [light]  100vh  — 좌우 분할 (이미지 | 텍스트+카운터)
├── SEC 2  LOCATION      [dark]   100vh  — 탭 전환 (자연/교통/학군/인프라)
├── SEC 3  PREMIUM       [light]  100vh  — 4카드 그리드
├── SEC 4  COMMUNITY     [dark]   100vh  — 수평 드래그 슬라이더
├── SEC 5  CONTACT       [mixed]  100vh  — 좌우 분할 (이미지 | 폼)
└── SEC 6  FOOTER        [dark]   auto   — 사업 정보

FLOATING (fixed, z-index: 800)
├── 관심고객 등록 원형 버튼
├── 섹션 도트 네비게이션 (우측)
└── 쿠키 동의 모달 (선택)
```

### 4-2. 섹션별 상세 와이어프레임

#### SEC 0: HERO

```
┌──────────────────────────────────────────────────┐
│  (full-screen background image / gradient)       │
│                                                  │
│  ┌─────────────────────────────────┐             │
│  │ 충북 청주시 서원구 · 송암공원 인접  ← tag-line   │
│  │                                 │             │
│  │ 송암공원       ← clip-left 등장   │             │
│  │ SK VIEW       ← clip-right 등장  │             │
│  │                                 │             │
│  │ 자연이 선사하는 프리미엄…          │             │
│  │                                 │             │
│  │ [관심고객등록]  [입지안내보기]      │             │
│  └─────────────────────────────────┘             │
│                                                  │
│               │ (scroll indicator)               │
│             SCROLL                               │
└──────────────────────────────────────────────────┘
```

**애니메이션 시퀀스:**
```
0.0s  배경 이미지 scale(1.05)→1 줌아웃
0.4s  tag-line: blur(8px)→0 + fade-up
0.7s  "송암공원": clip-left (좌→우 마스크 해제)
1.0s  "SK VIEW": clip-right (우→좌 마스크 해제)
1.4s  설명 텍스트: fade-up
1.7s  CTA 버튼 2개: fade-up
2.2s  스크롤 인디케이터: fade-in + 무한 라인 애니메이션
```

**근거:**
- 사이트A: 히어로 `data-fx="fade-up"` + `data-delay` 순차 등장
- KINETIQ: clip-path 기반 텍스트 reveal
- 사이트B: 배경 `s1-bg-scale` 줌아웃 keyframe

#### SEC 1: BRAND

```
┌──────────────────────┬───────────────────────────┐
│                      │                           │
│  (아파트 렌더링 이미지)  │  BRAND STORY  ← label    │
│                      │                           │
│  scale(1.06)→1       │  SK VIEW,                 │
│  진입 시 줌인 해제     │  새로운 주거 문화를          │
│                      │  선도합니다    ← title      │
│                      │                           │
│                      │  ────── (gold line expand) │
│                      │                           │
│  [SK ECO PLANT]      │  SK에코플랜트가… ← desc     │
│   뱃지              │                           │
│                      │  847세대  |  35층  |  5개동 │
│                      │  카운터 애니메이션           │
└──────────────────────┴───────────────────────────┘
```

**애니메이션:**
```
0.0s  좌측 이미지 scale(1.06)→1 (1.2s)
0.0s  "BRAND STORY" fade-up
0.15s 타이틀 fade-up
0.3s  gold-line width 0→60px
0.4s  설명 텍스트 fade-up
0.55s 카운터 영역 fade-up
0.6s  카운터 숫자: 0→목표값 (ease-out cubic, 1.6s)
```

**근거:**
- 사이트A: 숫자 카운터가 없었지만 Behance Musemind에서 차용
- Horizon Grove: 좌우 비대칭 분할 (이미지 | 텍스트)
- 사이트B: `.on` 클래스 토글 시 `animation: s1-title-x1 1.5s both`

#### SEC 2: LOCATION

```
┌──────────────────────────────────────────────────┐
│  (dark background with subtle nature gradient)   │
│                                                  │
│  LOCATION                                        │
│  어디에도 없는                                      │
│  최상의 입지                                       │
│                                                  │
│  [자연환경]  [교통]  [학군]  [생활인프라]  ← 탭      │
│                                                  │
│  ┌──────────┬─────────────────────────┐           │
│  │          │  송암공원 도보 5분         │           │
│  │ (이미지)  │  ✓ 단지 바로 앞 300m     │           │
│  │          │  ✓ 미래공원, 어린이공원    │           │
│  │          │  ✓ 청주 상당산성 조망      │           │
│  │          │  ✓ 녹지율 64%            │           │
│  └──────────┴─────────────────────────┘           │
└──────────────────────────────────────────────────┘
```

**인터랙션:**
```
탭 클릭 → 기존 패널 opacity:0 → 신규 패널 opacity:1 (0.5s)
탭 버튼: 비활성=outline, 활성=gold filled
패널 이미지: 탭별 다른 배경 (자연=녹색계, 교통=청색계, 학군=적색계, 인프라=보라계)
```

**근거:**
- 사이트B sec5: 4탭(Vision/Traffic/Nature/Education) + 배경 동시 전환
- 사이트A sec4 quad grid: 4분할 카테고리 구성
- Nestora: 체크마크 리스트 UI

#### SEC 3: PREMIUM

```
┌──────────────────────────────────────────────────┐
│  (light off-white background)                    │
│                                                  │
│  PREMIUM                                         │
│  차별화된 프리미엄 설계                              │
│                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │  (img)  │ │  (img)  │ │  (img)  │ │  (img)  ││
│  │    01   │ │    02   │ │    03   │ │    04   ││
│  ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤│
│  │스카이    │ │스마트홈  │ │프리미엄  │ │특화설계  ││
│  │커뮤니티  │ │시스템    │ │조경      │ │평면     ││
│  │설명...  │ │설명...  │ │설명...  │ │설명...  ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘│
└──────────────────────────────────────────────────┘
```

**인터랙션:**
```
카드 hover:
  - 카드 전체: translateY(-8px), shadow 강화
  - 이미지: scale(1.04) 줌인
  - 숫자(01~04): opacity 증가

그리드: PC 4열, 태블릿 2열, 모바일 1열
```

**근거:**
- 사이트A: `premium_item` 3열 그리드 + `data-fx="fade-left/down/right"` 방향별 등장
- Horizon Grove: 숫자 인덱싱(01/02/03)으로 항목 구분
- Landing Folio: 카드 hover 줌인 + 섀도우 패턴

#### SEC 4: COMMUNITY (수평 슬라이더)

```
┌──────────────────────────────────────────────────┐
│  (dark background)                               │
│                                                  │
│  COMMUNITY             ◀  ▶  ← prev/next        │
│  일상이 특별해지는                                   │
│  커뮤니티                                          │
│                                                  │
│  ┌──────────┐┌──────────┐┌──────────┐ ...        │
│  │ (피트니스) ││ (인피니티) ││ (키즈카페) │            │
│  │          ││  풀)     ││          │            │
│  ├──────────┤├──────────┤├──────────┤            │
│  │ 제목     ││ 제목     ││ 제목     │   drag →   │
│  │ 설명     ││ 설명     ││ 설명     │            │
│  └──────────┘└──────────┘└──────────┘            │
│                                                  │
└──────────────────────────────────────────────────┘
```

**인터랙션:**
```
PC:   마우스 드래그(grab→grabbing), 좌우 버튼
모바일: 터치 스와이프
PC: 3카드 보이기 / 태블릿: 2카드 / 모바일: 1카드
카드 hover: translateY(-6px) + 이미지 scale(1.05)
```

**근거:**
- 사이트B sec6: `s6-sticky-wrap` 가로 스크롤 (드래그 + 터치)
- Mercedes Showroom: 카드 슬라이더 + 좌우 네비게이션
- 사이트B: `touchstart/move/end` + `mousedown/move/up` 이벤트

#### SEC 5: CONTACT

```
┌──────────────────────┬───────────────────────────┐
│                      │                           │
│  (배경 이미지)        │  CONTACT US               │
│                      │  관심고객 등록              │
│  분양 상담 · 관심 고객 │                           │
│  지금 바로            │  이름     [          ]     │
│  문의하세요           │  연락처   [          ]     │
│                      │  관심평형 [▼ 선택    ]     │
│  📞 1600-0000       │  문의내용 [          ]     │
│  09:00~18:00        │  ☑ 개인정보 동의            │
│                      │  [관심고객 등록하기 →]       │
│                      │                           │
│                      │  📍 모델하우스 주소          │
│                      │  🕐 운영시간               │
└──────────────────────┴───────────────────────────┘
```

**근거:**
- 사이트A: `contact.php` 별도 페이지 → 본 프로젝트는 인페이지 폼으로 전환율 향상
- Nestora: 분할 레이아웃 (이미지 | 폼)
- 2025 트렌드: CTA는 최소 클릭으로 도달 가능해야 함

---

## 5. 애니메이션 스펙

### 5-1. GSAP data-fx 엔진 (사이트A 방식 채택)

```
공통 진입 구조 (2단계):
  1단계 (pre): autoAlpha:0, blur(8px) → autoAlpha:1, blur(0)  [0.25s]
  2단계 (main): fx별 이동/변환                                   [dur 기본 0.9s]

공통 퇴장 구조 (선택):
  data-out="0.35" → hold 후 autoAlpha:0                        [outDur]
```

**지원 fx 목록 (사이트A에서 채택):**

| data-fx | 효과 | 용도 |
|---|---|---|
| `fade-up` | y:50→0 | 대부분의 콘텐츠 등장 |
| `fade-down` | y:-50→0 | 위에서 내려오는 요소 |
| `fade-left` | x:-50→0 | 좌측에서 등장 |
| `fade-right` | x:50→0 | 우측에서 등장 |
| `fade` | 이동 없이 나타남 | 정적 요소 |
| `move` | data-x/y 지정 | 자유 방향 이동 |
| `clip-left` | clip-path: inset(0 100% 0 0)→inset(0) | 히어로 타이틀 |
| `clip-right` | clip-path: inset(0 0 0 100%)→inset(0) | 히어로 타이틀 |
| `letter-in` | letter-spacing 넓음→좁음 | 영문 대제목 |
| `hero` | y:20 + scale:0.98→0,1 | 배경 이미지 진입 |
| `expand` | width:0→target | gold-line 같은 디바이더 |
| `stagger` | 자식 순차 등장 | 리스트, 그리드 아이템 |

**data 속성 파라미터:**
```html
<element
  data-fx="fade-up"
  data-delay="0.5"       <!-- 시작 딜레이(초) -->
  data-dur="0.9"         <!-- 메인 지속시간 -->
  data-pre="0.25"        <!-- blur 페이즈 시간 -->
  data-y="50"            <!-- move용 y값 -->
  data-x="0"             <!-- move용 x값 -->
  data-hold="0.6"        <!-- 완료 후 유지 시간 -->
  data-out="0"           <!-- 아웃 시간 (0=없음) -->
  data-out-y="-20"       <!-- 아웃 이동값 -->
>
```

### 5-2. CSS @keyframes (사이트B 방식 병행)

| keyframe | 트리거 | 효과 |
|---|---|---|
| `hero-bg-in` | 페이지 로드 | 배경 scale(1.05)→1 |
| `si-line-anim` | 항상 반복 | 스크롤 인디케이터 라인 |
| `float-pulse` | 항상 반복 | 플로팅 버튼 펄스 링 |
| `counter-in` | `.on` 진입 | 숫자 0→목표 (JS 처리) |

### 5-3. 섹션 전환 (사이트A+B 하이브리드)

```
PC (>768px):
  container { transform: translateY(-{n}*100vh); transition: 0.9s cubic-bezier(0.4,0,0.2,1); }
  wheel 이벤트 캡처 → 누적값 ≥ 50 시 섹션 이동
  이동 후 950ms 휠 잠금

Mobile (≤768px):
  일반 스크롤 + IntersectionObserver(threshold: 0.15) → .on 토글
```

---

## 6. 인터랙션 스펙

### 6-1. 커스텀 커서 (PC only)

```
구조: .cursor > .cursor-ring + .cursor-dot
- dot: 즉시 추적 (mousemove)
- ring: 지연 추적 (rAF lerp 0.12)
- 인터랙티브 요소 hover: ring 56px 확대 + 반투명 gold 배경
- mix-blend-mode: difference
```

**근거:** KINETIQ — 커스텀 커서가 럭셔리 브랜드감 강화

### 6-2. 헤더

```
상태:
  - 투명 (기본)
  - dark (data-header="dark" 섹션) → 흰색 로고/텍스트
  - light (data-header="light" 섹션) → 검정 로고/텍스트

메뉴:
  - PC: 인라인 ul, hover 시 underline(gold) width 0→100%
  - Mobile: 햄버거 → .open 토글 → 풀스크린 슬라이드인 메뉴

전화버튼:
  - PC: 아이콘 + 번호 표시
  - Mobile: 아이콘만
```

**근거:**
- 사이트A: `data-header` + CSS attribute selector
- 사이트B: `header.black`, `header.s5-bg` 클래스 분기
- 98 Wireless: 아웃라인 버튼 스타일

### 6-3. 탭 (입지 섹션)

```
4탭: 자연환경 / 교통 / 학군 / 생활인프라
클릭 → 기존 패널 opacity:0 + position:absolute
     → 신규 패널 opacity:1 + position:relative
탭 버튼: outline → filled(gold) 전환 (0.3s)
```

**근거:** 사이트B sec5: 4탭(Vision/Traffic/Nature/Education)

### 6-4. 수평 슬라이더 (커뮤니티)

```
이동 방식:
  - 마우스 드래그 (mousedown→mousemove→mouseup)
  - 터치 스와이프 (touchstart→touchmove→touchend)
  - 좌/우 화살표 버튼

이동 단위: 카드 1장 width + gap
transition: 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)
최대 인덱스: 총 카드 - visible 카드 수
```

**근거:**
- 사이트B sec6: `sec6PosX1/X2` + `touchstart/move/end`
- Mercedes Showroom: pin + 슬라이더

### 6-5. 숫자 카운터

```
트리거: 브랜드 섹션 .on 진입 + 600ms
방식: requestAnimationFrame loop
이징: ease-out cubic (1 - (1-t)^3)
지속: 1600ms
대상: 847(세대), 35(층), 5(개동)
```

### 6-6. 폼

```
필드: 이름(필수), 연락처(필수), 관심평형(선택), 문의내용(선택), 개인정보동의(필수)
제출: preventDefault → 토스트 알림 3.5s → 폼 리셋
스타일: border 1px rgba(0,0,0,0.1), focus 시 border-color: gold
```

---

## 7. 기술 아키텍처

### 7-1. 파일 구조

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js          ← 스크롤 제어, 인터랙션, 폼
│   └── animate.js       ← GSAP data-fx 엔진 (사이트A 방식)
└── assets/
    └── img/
        ├── hero-bg.jpg          (히어로 배경)
        ├── brand-building.jpg   (브랜드 아파트 렌더링)
        ├── location-bg.jpg      (입지 배경)
        ├── loc-nature.jpg       (탭: 자연)
        ├── loc-traffic.jpg      (탭: 교통)
        ├── loc-school.jpg       (탭: 학군)
        ├── loc-infra.jpg        (탭: 인프라)
        ├── premium-01~04.jpg    (프리미엄 카드)
        ├── community-01~06.jpg  (커뮤니티 카드)
        ├── contact-bg.jpg       (관심고객 배경)
        ├── logo_w.png           (흰색 로고)
        └── logo_b.png           (검정 로고)
```

### 7-2. 외부 의존성

| 라이브러리 | 버전 | CDN | 용도 |
|---|---|---|---|
| GSAP | 3.x | jsdelivr | 애니메이션 엔진 |
| Pretendard | 1.3.9 | jsdelivr | 한글 폰트 |
| Cormorant Garamond | — | Google Fonts | 영문 세리프 |
| Font Awesome | 6.5.1 | cdnjs | 아이콘 |

**비채택 라이브러리 (근거):**
- fullPage.js: 라이센스 비용 → 자체 구현
- Swiper/Owl Carousel: 슬라이더 1개만 필요 → 자체 구현
- Tailwind CSS: 커스텀 디자인 시스템과 충돌 → 순수 CSS

### 7-3. 성능 목표

```
Lighthouse:
  Performance  ≥ 90
  Accessibility ≥ 85
  Best Practices ≥ 90
  SEO            ≥ 90

FCP  < 1.5s
LCP  < 2.5s
CLS  < 0.1
TBT  < 200ms

이미지: WebP, lazy loading (히어로 제외)
폰트: font-display: swap, preconnect
JS: defer, 코드 분할 불필요 (단일 페이지)
```

---

## 8. 반응형 전략

### 8-1. 브레이크포인트

```
PC:      >1200px   기본 레이아웃
태블릿:   961~1200px  GNB 축소, 패딩 감소
소형태블릿: 769~960px   GNB→햄버거, 분할→수직, 2열 그리드
모바일:   ≤768px    일반 스크롤, 1열, 풀폭 요소
소형모바일: ≤480px    타이포 축소, 1열 그리드
```

### 8-2. PC vs 모바일 핵심 차이

| 항목 | PC (>768px) | Mobile (≤768px) |
|---|---|---|
| 스크롤 | wheel → translate3d fullpage | 일반 스크롤 |
| 애니메이션 트리거 | fullpage 콜백 | IntersectionObserver |
| 섹션 높이 | 100vh 고정 | auto, min-height: 100svh |
| 커스텀 커서 | 활성 | 비활성 |
| 섹션 도트 | 우측 표시 | 숨김 |
| 스크롤 인디케이터 | 표시 | 숨김 |
| 슬라이더 | 3카드 보이기 | 1카드 + 스와이프 |
| 프리미엄 그리드 | 4열 | 2열→1열 |
| 분할 레이아웃 | 좌우 분할 | 상하 스택 |

**근거:**
- 사이트A: `isMobile && /m/index`로 완전 분기
- 사이트B: `window.innerWidth <= 768` 분기 + `IntersectionObserver`

---

## 9. SEO / 접근성

```
- <html lang="ko">
- 시맨틱 태그: header, nav, section, footer, main
- og:title, og:description, og:image 메타 태그
- canonical URL 설정
- alt 텍스트: 모든 이미지
- aria-label: 버튼, 링크
- focus-visible: 키보드 접근성
- prefers-reduced-motion: 애니메이션 축소 대응
- 키보드 내비게이션: ↑↓ / PageUp/Down으로 섹션 이동
```

---

## 10. 체크리스트

### 개발 완료 기준

- [ ] 히어로 타이틀 clip-path 등장 애니메이션
- [ ] GSAP data-fx 엔진 (blur→clear 2단계)
- [ ] fullPage 스크롤 (PC wheel + 모바일 IO)
- [ ] 헤더 light/dark 자동 전환
- [ ] 숫자 카운터 (847/35/5)
- [ ] 입지 4탭 전환
- [ ] 프리미엄 4카드 hover 효과
- [ ] 커뮤니티 드래그 슬라이더
- [ ] 관심고객 등록 폼 + 토스트
- [ ] 커스텀 커서 (PC)
- [ ] 섹션 도트 네비게이션
- [ ] 플로팅 CTA 버튼
- [ ] 반응형 (1200 / 960 / 768 / 480)
- [ ] 키보드 내비게이션
- [ ] 모바일 햄버거 메뉴
- [ ] 이미지 에셋 교체 (placeholder → 실제)
- [ ] Lighthouse 성능 ≥ 90
- [ ] 크로스 브라우저 (Chrome, Safari, Edge)

---

*작성일: 2026-03-06*
*Based on: 진월더리브.kr(커스텀), 진월-더리브라포레.kr(imweb), Behance 12선 분석*
