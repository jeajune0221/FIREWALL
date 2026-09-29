# AI Pottery Story
## UI/UX Specification — Short Version

---

# 1. 서비스 목표

베트남 도예가가 작품 사진과 짧은 이야기를 입력하면:

1. AI가 작품의 시각적 특징을 분석한다.
2. 전통 문양 후보를 제안한다.
3. 장인이 직접 확인한다.
4. 판매·홍보용 콘텐츠를 생성한다.

핵심 원칙:

- AI는 후보만 제안한다.
- 최종 선택은 장인이 한다.
- 문화 정보는 Pattern DB만 사용한다.
- 장인이 말하지 않은 내용은 만들지 않는다.
- AI 생성 결과는 게시 전 사용자가 확인한다.

---

# 2. 전체 사용자 흐름

```text
사진 업로드
→ AI 분석
→ 관찰 결과 확인
→ 문양 선택
→ 장인 이야기 입력
→ 콘텐츠 생성
→ 결과 확인
→ 언어 선택
→ 복사
```

---

# 3. 디자인 방향

## 키워드

```text
Modern
Minimal
Editorial
Craft
Human
```

## 피해야 할 것

- 검정 + 금색 전통 스타일
- 한지 배경
- 전통 문양 반복 배경
- 보라색 AI Gradient
- Glassmorphism
- 과도한 둥근 카드
- AI Sparkle / Orb / 3D Icon

전통적인 느낌은 UI가 아니라 **실제 작품 사진과 문양**에서 보여준다.

---

# 4. 색상

```text
Background      #F6F4EF
Surface         #FFFFFF

Primary         #183C32
Primary Hover   #214C40

Text Primary    #171916
Text Secondary  #676A64

Border          #E2E0DA

Accent          #B65338
Error           #B42318
Success         #267A4A
```

---

# 5. Typography

```css
font-family:
  Inter,
  Pretendard,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

```text
H1          26px / 700
H2          20px / 700
Body Large  17px
Body        15px
Caption     13px
```

Input / Textarea:

```text
17px
```

---

# 6. 공통 UI 규칙

```text
기준 화면       390 × 844
좌우 Padding    20px
Button Height   52px
Touch Target    최소 44px
Card Radius     12px
```

Shadow는 최소화하고 Border 중심으로 구분한다.

---

# 7. 화면 구조

```text
/
사진 업로드

/analyze
AI 분석

/verify
분석 결과 + 문양 확인

/story
장인 이야기

/result
생성 중 + 결과
```

---

# 8. Screen 1 — 사진 업로드

## 주요 UI

```text
작품 사진을 올려주세요.

[ 사진 영역 ]

[ 사진 촬영 ]
[ 갤러리에서 선택 ]

[ AI 분석 시작 ]
```

사진 선택 후:

- `object-fit: contain`
- 다시 촬영
- 사진 변경

지원:

```text
JPG / PNG / WEBP / HEIC / HEIF
```

HEIC는 내부에서 JPEG/WebP로 변환한다.

---

# 9. Screen 2 — AI 분석

단계별 가짜 Progress를 사용하지 않는다.

```text
작품을 살펴보고 있어요.

제품 종류, 색상, 시각적 특징,
문양 후보를 분석하고 있습니다.
```

Spinner 또는 Skeleton만 사용한다.

---

# 10. Vision 데이터 구조

AI 결과는 자유 문자열 대신 ID로 받는다.

## Product Type

예:

```text
VASE
BOWL
PLATE
CUP
JAR
TEAPOT
FIGURINE
OTHER
UNKNOWN
```

## Color

예:

```text
WHITE
BLACK
GRAY
BLUE
GREEN
RED
YELLOW
BROWN
BEIGE
PURPLE
```

## Visual Feature

예:

```text
FLORAL_DECORATION
GEOMETRIC_DECORATION
ANIMAL_DECORATION
SYMMETRICAL_PATTERN
GLOSSY_SURFACE
MATTE_SURFACE
RELIEF_DECORATION
```

화면에는 ID 대신 VI / EN / KO 이름을 표시한다.

---

# 11. Screen 3 — 관찰 결과 확인

```text
분석 결과

제품 종류
[ 화병 ▼ ]

주요 색상
Blue ×
White ×
[ + 색상 선택 ]

보이는 특징
Floral decoration ×
Symmetrical pattern ×
```

규칙:

- 제품 종류는 Dropdown으로 수정
- 색상은 미리 정한 색만 선택
- 특징은 잘못된 항목만 삭제 가능
- 자유 입력 금지

---

# 12. 문양 선택

초기에는 아무것도 선택하지 않는다.

```text
어떤 문양인가요?

○ Hoa sen
○ Rồng
○ Tre
○ 해당 없음
```

CTA:

```text
문양을 하나 선택해주세요.

[ 확인하고 계속 ]
```

선택 전에는 버튼 Disabled.

---

# 13. Confidence 표시

```text
High
→ 가장 비슷함

Medium
→ 비슷할 수 있음

Low
→ 낮은 확신도로 표시하며 숨기지 않음
```

모든 후보가 Low면:

```text
확실한 문양 후보를 찾지 못했습니다.

[ 해당 없음 ]
[ 전체 문양 보기 ]
```

---

# 14. Pattern Card

```text
[Thumbnail]

Hoa sen
Lotus

가장 비슷함

○ 선택     자세히 >
```

- 카드 선택 영역 → 문양 선택
- `자세히` → Bottom Sheet

전체 문양 목록에도 Thumbnail을 사용한다.

---

# 15. Pattern DB

필수 필드:

```json
{
  "id": "P01",

  "name_vi": "Hoa sen",
  "name_en": "Lotus",
  "name_ko": "연꽃",

  "meaning_vi": "...",
  "meaning_en": "...",
  "meaning_ko": "...",

  "image_url": "...",

  "image_source": {
    "url": "...",
    "license": "..."
  },

  "source": {
    "url": "..."
  }
}
```

---

# 16. Screen 4 — 장인 이야기

```text
이 작품에 대해 들려주세요.

[ 직접 입력 ] [ 음성으로 말하기 ]

[ Textarea ]

0 / 1000

[ 콘텐츠 만들기 ]
```

규칙:

- 최대 1000자
- `maxlength`로 자르지 않음
- 1000자 초과 시 CTA Disabled

---

# 17. 음성 입력

최대 녹음:

```text
60초
```

Flow:

```text
녹음
→ STT
→ 내용 확인
→ Textarea 적용
```

확인 화면:

```text
AI가 이렇게 들었어요.

“...”

[ 다시 녹음 ]
[ 이 내용 사용 ]
```

기존 글이 있으면:

```text
[ 뒤에 추가 ]
[ 기존 내용 바꾸기 ]
[ 취소 ]
```

---

# 18. Story 원문 규칙

원문은 반드시 사용자 입력값에서 가져온다.

```text
artisanStoryOriginal
```

AI 응답에서 원문을 가져오지 않는다.

따옴표 사용:

```text
장인이 확인한 원문
→ “직접 인용”
```

AI가 다듬거나 번역한 문장:

```text
일반 본문
```

---

# 19. 콘텐츠 생성

사용 데이터:

```text
확정 Product Type
확정 Colors
확정 Visual Features
선택 Pattern
Pattern DB
확정 Artisan Story
```

생성 중:

```text
작품의 이야기를 정리하고 있어요.
```

가짜 단계 Progress는 사용하지 않는다.

---

# 20. Result Header

```text
게시 전에 내용을 확인해주세요.

AI가 정리한 내용입니다.
복사하기 전에 사실과 표현을 확인해주세요.
```

MVP에서는 결과 직접 수정 기능은 넣지 않는다.

문제가 있으면:

```text
문양 수정
이야기 수정
다시 생성
```

---

# 21. 결과 구조

탭:

```text
제품 소개 | 스토리 | 문화 | SNS
```

## 제품 소개

- 상품명
- 짧은 설명
- 제품 설명
- 각 항목 복사
- 전체 복사

## 스토리

- 장인의 원문
- AI가 정리한 이야기

## 문화

- Pattern DB의 `meaning_*` 직접 표시
- AI 생성 문화 설명 사용 금지

## SNS

- SNS 게시물
- 복사

---

# 22. Pattern NONE

문양이 `NONE`이면:

```text
제품 소개 | 스토리 | SNS
```

문화 탭은 숨긴다.

---

# 23. 언어 전환

Header:

```text
VI | EN | KO
```

결과 탭과 모양을 다르게 한다.

- 언어 → Segmented Control
- 탭 → Underline Tab

이미 생성한 언어는 Cache한다.

```typescript
{
  vi?: GeneratedContent,
  en?: GeneratedContent,
  ko?: GeneratedContent
}
```

---

# 24. 다시 생성

다시 생성 시:

```text
모든 언어 Cache 삭제
→ 현재 언어만 새로 생성
```

다음 값이 바뀌어도 Cache 전체 삭제:

- Product Type
- Color
- Feature
- Pattern
- Story

---

# 25. 복사

전체 복사 형식:

```text
[상품명]
...

[짧은 소개]
...

[제품 설명]
...
```

성공:

```text
✓ 복사됨
```

`aria-live="polite"` 적용.

Clipboard 실패 시:

```text
자동 복사할 수 없습니다.
텍스트를 길게 눌러 복사해주세요.
```

---

# 26. 앱 언어

앱 기본 UI 언어:

```text
Vietnamese
```

콘텐츠 언어:

```text
VI / EN / KO
```

둘은 별개다.

---

# 27. 세션 유지

새로고침에도 작업이 유지되어야 한다.

`sessionStorage` 저장:

```text
imageId
previewUrl
productTypeId
colorIds
visualFeatureIds
patternId
artisanStoryOriginal
currentStep
selectedContentLanguage
generatedContentCache
```

사진 Binary는 저장하지 않고 서버 `image_id`만 저장한다.

---

# 28. 오류 처리

## 사진 분석 실패

```text
사진을 분석하지 못했습니다.

[ 다시 촬영 ]
[ 다른 사진 선택 ]
```

## 마이크 오류

```text
이 브라우저에서는 음성 녹음이 제한될 수 있습니다.

[ 브라우저에서 열기 안내 ]
[ 직접 입력 ]
```

## STT 실패

```text
음성을 정확하게 인식하지 못했습니다.

[ 다시 녹음 ]
[ 직접 입력 ]
```

## 콘텐츠 생성 실패

```text
콘텐츠를 만드는 중 문제가 발생했습니다.

[ 다시 시도 ]
[ 이야기 수정 ]
```

---

# 29. 모바일 QA

최소 테스트:

```text
Android Chrome
iPhone Safari
Zalo In-App Browser
Facebook In-App Browser
```

확인 항목:

```text
사진 업로드
HEIC
마이크
STT
Clipboard
Session Restore
언어 전환
```

---

# 30. MVP 제외

```text
회원가입
결제
SNS 자동 게시
쇼핑몰 자동 게시
사진 AI 보정
Background Removal
Fine-tuning
RAG
Vector DB
QR
Dark Mode
Result Inline Editing
Custom Color
Custom Feature
Custom Product Type
```

---

# 31. 최종 핵심 원칙

```text
AI는 정해진 ID 안에서만 관찰한다.

AI는 문양을 확정하지 않는다.
장인이 직접 선택한다.

문화 정보는 Pattern DB를 그대로 사용한다.

장인의 원문은 사용자 입력에서만 가져온다.

AI 결과는 바로 게시하지 않는다.
사용자가 마지막으로 확인한다.
```

## D + A 확인 화면 확장 (2026-09-29)

DEV.md 7~13의 상세 관찰 필드와 출처 검증 규칙을 따른다. 사진 + AI 관찰 영역과 각 후보의 출처 있는 참고 자료 영역을 분리한다. 새 자유문장 관찰은 확인용이며 기존 콘텐츠 생성 입력 계약을 바꾸지 않는다. `NONE`을 포함해 반환된 후보의 confidence를 표시한다. null 참고 자료는 한국어 “출처 있는 참고 자료가 아직 없습니다” 및 대응 베트남어 문구로 표시한다. 장인 선택은 계속 단일 선택이다.

관람객 화면은 DEV.md 48을 따른다. 공개 결과만 표시하며 3초마다 갱신한다.
