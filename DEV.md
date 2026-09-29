# 베트남 도자기 AI 콘텐츠 서비스
## MVP Development Specification

---

# 1. 서비스 정의

베트남 도예가가 스마트폰으로 도자기 사진을 촬영하고 간단한 설명을 입력하면,

1. AI가 제품의 시각적 특징을 분석하고
2. 준비된 전통 문양 목록에서 후보를 제시하고
3. 도예가가 직접 문양을 확인한 뒤
4. 온라인 판매 및 홍보용 콘텐츠를 자동 생성하는

**AI Workflow Automation 기반 모바일 웹서비스**

---

# 2. 핵심 원칙

서비스 전체에서 다음 원칙을 지킨다.

### Rule 1
AI가 전통문화 정보를 임의로 만들어내지 않는다.

### Rule 2
AI가 문양을 최종 결정하지 않는다.

AI는 후보만 제시하고 최종 선택은 도예가가 한다.

### Rule 3
문화적 의미는 사전에 준비한 Pattern Database에서만 가져온다.

### Rule 4
장인이 말하지 않은 제작 의도, 제작 방식, 역사, 지역 등을 AI가 추측하지 않는다.

### Rule 5
이미지에서 관찰한 정보와 장인이 직접 말한 정보를 구분한다.

---

# 3. MVP 전체 Flow

```text
[1. 제품 사진 업로드]

        ↓

[2. OpenAI Vision 분석]

        ↓

제품 종류
색상
형태
시각적 특징
문양 후보

        ↓

[3. 장인 검증]

AI 추천 문양 확인
또는 수정
또는 "해당 없음"

        ↓

[4. 장인 설명]

텍스트 입력
또는
음성 → STT

        ↓

[5. 콘텐츠 생성]

        ↓

제품 소개
제품 Story
SNS Content

        ↓

[6. 언어 선택]

VI / EN / KO

        ↓

[7. 결과 확인 및 복사]
```

---

# 4. MVP 화면 구성

총 **5개 핵심 화면**으로 구성한다.

---

## Screen 1 — Home / 사진 입력

### 목적

도자기 제품 사진을 입력한다.

### UI

```text
--------------------------------

     AI Pottery Story

작품의 이야기를 시작해보세요.

[ 📷 사진 촬영 ]

[ 🖼 사진 선택 ]

--------------------------------
```

### 기능

- 카메라 촬영
- 갤러리 이미지 업로드
- JPG / PNG / WEBP 지원
- 업로드한 이미지 Preview

### 버튼

```text
[AI 분석 시작]
```

---

# 5. Screen 2 — AI 제품 분석

사진을 OpenAI Vision 모델에 전달한다.

## OpenAI에게 전달하는 것

### 1. 제품 이미지

### 2. Pattern Database 목록

예:

```json
[
  {
    "id": "P01",
    "name_vi": "Hoa sen",
    "name_en": "Lotus",
    "name_ko": "연꽃"
  },
  {
    "id": "P02",
    "name_vi": "Rồng",
    "name_en": "Dragon",
    "name_ko": "용"
  }
]
```

---

# 6. Vision 분석 규칙

AI는 자유롭게 문양 이름을 생성하지 않는다.

반드시 우리가 제공한 문양 ID 안에서 선택한다.

가능한 결과:

```text
P01
P02
...
P20
NONE
```

---

# 7. Vision Output Schema

기존 ID 필드는 유지하고 관찰 전용 필드를 추가한다. 응답에는 서버의 `image_id`도 포함한다.

```json
{
  "image_id": "서버에서 생성한 UUID",
  "product_type": "VASE",
  "main_colors": ["BLUE", "WHITE"],
  "visual_features": ["FLORAL_DECORATION"],
  "pattern_candidates": [{ "pattern_id": "P01", "confidence": "medium" }],
  "shape": "Thân phình, cổ hẹp",
  "surface_and_glaze": "not visible",
  "decoration_layout": "Hoa văn ở giữa thân",
  "decoration_elements": [{ "description": "Hoa nhiều cánh", "location": "Giữa thân" }],
  "composition": "not visible"
}
```

새 관찰 본문은 베트남어다. 문자열을 관찰할 수 없으면 정확히 `"not visible"`, 장식 요소를 볼 수 없으면 `decoration_elements: []`다. 사진으로 시대·가마·원산지·진위·제작 의도·문화적 의미를 판단하지 않는다. 상세 관찰은 확인 화면에 표시하며, 콘텐츠 생성 입력에는 자동으로 추가하지 않는다.

---

# 8. JSON Schema

구현: `src/lib/prompts.ts`의 `VISION_JSON_SCHEMA`와 `buildVisionJsonSchema(patternIds)`.
최종 스키마는 DB의 모든 ID와 `NONE`으로 `pattern_id.enum`을 동적으로 만든다.

- 최상위 필수 필드: `product_type`, `main_colors`, `visual_features`, `pattern_candidates`, `shape`, `surface_and_glaze`, `decoration_layout`, `decoration_elements`, `composition`.
- `decoration_elements`는 `{ description: string, location: string }[]`.
- `pattern_candidates`는 `{ pattern_id: enum, confidence: "high" | "medium" | "low" }[]`.
- 모든 object는 모든 속성을 `required`에 포함하고 `additionalProperties: false`를 지정한다.
- 기존 종류·색상·특징은 `src/types/index.ts`의 ID enum을 사용한다.
- Responses API는 `text.format`에 `type: "json_schema"`, `name`, `schema`, `strict: true`를 형제 속성으로 둔다.
- 분석 API는 한 번만 호출한다. 추가 AI 호출·검색·RAG는 없다.
- `NONE` 후보와 모든 confidence를 응답 및 화면까지 보존한다. 후보는 기존 최대 3개다.

공식 근거: https://developers.openai.com/api/docs/guides/structured-outputs
설치 SDK 확인: openai 6.49.0의 `ResponseFormatTextJSONSchemaConfig`.

---

# 9. Vision System Prompt

```text
You analyze Vietnamese ceramic products.

Your task is ONLY to describe visible characteristics
and select possible patterns from the provided pattern list.

IMPORTANT RULES:

1. Never invent a new traditional pattern name.

2. pattern_id MUST be selected from the provided pattern list.

3. If no listed pattern can be confidently identified,
return NONE.

4. Do not infer:
- cultural meaning
- artist intention
- manufacturing technique
- historical period
- origin
- production location

unless explicitly visible or provided.

5. visual_features must contain only observable features.

6. When uncertain, use lower confidence instead of guessing.

All new fields (shape, surface_and_glaze, decoration_layout,
decoration_elements, composition) MUST describe only what is directly
visible in the photo.
Do not state or imply the object's age, kiln, origin, authenticity,
artist intention, or cultural meaning.
If a field cannot be determined from the photo, use the string "not visible".
For decoration_elements, return [] if no elements can be observed.
Prefer specific, concrete descriptions (position, quantity, form)
over generic words like "beautiful" or "traditional".
```

---

# 10. Screen 3 — 문양 확인

사진 썸네일과 “AI가 사진에서 관찰한 것” 영역을 먼저 표시한다. 각 후보 카드에는 confidence와 DB의 description, meaning, origin, representative_works, 출처를 별도 참고 자료 영역에 표시한다. 빈 항목은 “출처 있는 참고 자료가 아직 없습니다”로 표시한다. Low 후보를 숨기지 않으며 단일 선택·전체 목록·해당 없음 동작을 유지한다.

Vision 결과를 바로 콘텐츠 생성으로 넘기지 않는다.

반드시 장인이 확인한다.

### UI 예시

```text
AI가 제품을 분석했습니다.

제품:
화병

색상:
Blue / White

AI가 발견한 문양:

● Hoa sen
  연꽃

Confidence: High

○ 다른 문양 선택

○ 해당 없음

--------------------------

[확인하고 계속]
```

---

# 11. 문양 변경

사용자가 AI 분석이 틀렸다고 생각하면 직접 다른 문양을 선택할 수 있다.

```text
문양 선택

○ Hoa sen
○ Rồng
○ Tre
○ Mây
○ ...
○ 해당 없음
```

### 중요

MVP에서는 자유 텍스트 문양 입력을 하지 않는다.

Reason:

```text
자유 입력
→ 데이터 검증 어려움
→ 문화 설명 hallucination 가능성 증가
```

---

# 12. Pattern Database

MVP에서는 약 **10~20개 문양**만 준비한다.

## 데이터 구조

```json
{
  "id": "P01",

  "name_vi": "Hoa sen",

  "name_en": "Lotus",

  "name_ko": "연꽃",

  "description_vi": "...",

  "description_en": "...",

  "description_ko": "...",

  "meaning_vi": "...",

  "meaning_en": "...",

  "meaning_ko": "...",

  "source": {
    "organization": "...",
    "title": "...",
    "url": "..."
  },

  "verified_at": null,
  "origin": null,
  "representative_works": null
}
```

---

# 13. 중요한 DB 규칙

각 문양에는 반드시

```text
출처
```

가 존재해야 한다.

출처 없는 문화 설명은 DB에 넣지 않는다.

`origin`은 null 또는 `{ text_vi, text_en, text_ko, source: { organization, title, url } }`이다. 텍스트는 string 또는 null이다.
`representative_works`는 null 또는 `{ title, holder, date, source_url }[]`이다.
`description_vi/en/ko`는 string 또는 null이다. 현재 새 자료는 모두 null이며 AI로 채우지 않는다.

`src/lib/patterns.ts`가 모듈 로딩 시 검증한다. 유래 텍스트가 있는데 source.url이 없거나 HTTP(S) URL이 아니면 `PATTERN_SOURCE_REQUIRED` 오류를 낸다. description/meaning 및 대표작도 출처 URL을 검증한다. 확인 화면은 기존 서버 페이지의 `getPatternList()`로 자료를 받으므로 추가 endpoint 호출이 필요 없다.

---

# 14. MVP Pattern 예시

```text
P01 Hoa sen
P02 Rồng
P03 Tre
P04 Mây
P05 Cá
...
P20 ...

NONE 해당 없음
```

실제 목록과 의미는 조사 담당자가 출처를 확인한 후 확정한다.

---

# 15. Screen 4 — 장인의 이야기 입력

문양 확인이 끝나면 장인의 이야기를 받는다.

### UI

```text
이 작품에 대해 이야기해주세요.

예:

"어릴 때 마을 연못에서 보았던
연꽃을 생각하면서 만든 작품입니다."

[ 🎙 녹음하기 ]

또는

[ 직접 입력 ]

--------------------------

[콘텐츠 만들기]
```

---

# 16. 음성 입력

음성은 **선택 기능**이다.

핵심 입력 방법은 항상 Text를 지원한다.

Flow:

```text
Microphone

↓

Audio File

↓

OpenAI Speech-to-Text

↓

Vietnamese Text

↓

사용자에게 보여줌

↓

사용자 수정 가능

↓

확정
```

---

# 17. STT 중요 규칙

STT 결과를 바로 콘텐츠 생성으로 넘기지 않는다.

예:

```text
AI가 다음과 같이 인식했습니다.

"이 작품은 제가 어린 시절 보았던
연꽃에서 영감을 받아 만들었습니다."

[수정]

[확인]
```

사용자가 확인한 텍스트만 최종 입력으로 사용한다.

---

# 18. STT 실패 처리

마이크 권한 거부:

```text
마이크를 사용할 수 없습니다.

직접 설명을 입력해주세요.

[텍스트 입력]
```

음성 인식 실패:

```text
음성을 정확하게 인식하지 못했습니다.

[다시 녹음]

[직접 입력]
```

---

# 19. Screen 5 — 콘텐츠 생성

최종 콘텐츠 생성에는 다음 데이터만 사용한다.

```text
① Vision에서 관찰된 제품 특징

② 장인이 최종 선택한 Pattern ID

③ Pattern DB 정보

④ 장인이 확인한 설명
```

---

# 20. Generation Input

아래는 백엔드가 Pattern DB를 조회한 뒤 **LLM Prompt에 실제로 넣는 데이터**의 형태다. 프론트엔드가 보내는 HTTP 요청 형식은 29번 항목의 `/api/generate-content` Input(간단히 `confirmed_pattern_id`만 전달)을 참고한다. 즉 흐름은 다음과 같다.

```text
Frontend → confirmed_pattern_id 전송 (29번 항목)
   ↓
Backend → Pattern DB에서 해당 ID 조회
   ↓
Backend → 조회한 pattern 전체 정보로 아래 형태의 Prompt Input 구성 (이 항목)
```

예:

```json
{
  "product": {
    "type": "VASE",

    "colors": [
      "BLUE",
      "WHITE"
    ],

    "visual_features": [
      "FLORAL_DECORATION",
      "SYMMETRICAL_PATTERN"
    ]
  },

  "pattern": {
    "name": "Hoa sen",

    "pattern_id": "P01"
  },

  "artisan_story": "어릴 때 마을 연못에서 본 연꽃을 생각하며 만든 작품입니다.",

  "target_language": "ko"
}
```

---

# 21. 콘텐츠 생성 핵심 Prompt

```text
You create product marketing content
for a Vietnamese ceramic artisan.

You MUST follow these rules.

FACTUAL RULES:

1. Never invent information.

2. Never invent the artisan's intention.

3. Never invent:
- production technique
- production year
- historical period
- production region
- material
- cultural meaning
- artisan background

4. Product visual features may only be described
as visually observed characteristics.

5. Cultural information may ONLY come from
PATTERN_DATABASE.

6. Artisan intention or inspiration may ONLY come from
ARTISAN_STORY.

7. If information is unavailable, omit it.

8. Never convert an observation into intention.

BAD:
"The artisan used blue to express peace."

GOOD:
"The piece features blue decorative elements."

9. Keep these information sources conceptually separate:

OBSERVATION
ARTISAN STORY
CULTURAL REFERENCE

10. Do not exaggerate authenticity,
historical significance, rarity, or traditional status.
```

---

# 22. 생성 콘텐츠 종류

한 번의 요청으로 다음 결과를 구조화해서 받는다.

```json
{
  "product_title": "",

  "short_description": "",

  "product_description": "",

  "artisan_story": "",

  "social_post": ""
}
```

---

# 23. 각 콘텐츠 역할

## product_title

짧은 상품명.

예:

```text
Blue Lotus Ceramic Vase
```

---

## short_description

매장 또는 QR용 짧은 설명.

약 1~2문장.

---

## product_description

온라인 판매 페이지용.

약 3~5문장.

---

## artisan_story

장인이 입력한 이야기를 읽기 좋은 형태로 정리.

새로운 사실을 추가하지 않는다.

---

## cultural_note

문화 설명은 생성 API 필드가 아니다. 서버에서 출처를 검증한 Pattern Database 값을 문화 탭과 참고 자료 영역에 직접 표시한다.

---

## social_post

Facebook / Instagram 등에 사용할 수 있는 짧은 홍보글.

---

# 24. 생성 Output Schema

```json
{
  "product_title": "string",

  "short_description": "string",

  "product_description": "string",

  "artisan_story": "string",

  "social_post": "string"
}
```

---

# 25. 언어 처리

MVP 지원 언어:

```text
VI
EN
KO
```

사용자가 결과 화면에서 선택한다.

```text
[ VI ] [ EN ] [ KO ]
```

---

# 26. 추천 구현 방식

콘텐츠를 먼저 베트남어로 만든 다음 번역하는 것보다,

최종 생성 API에

```text
target_language
```

를 넣는다.

예:

```json
{
  "target_language": "ko"
}
```

그러면 동일한 검증 데이터를 기반으로 해당 언어 콘텐츠를 생성한다.

### 언어 전환 동작 (명확화)

결과 화면 하단의 `VI | EN | KO` 버튼은 이미 생성된 텍스트를 번역하는 것이 아니다.

버튼을 누르면 같은 검증 데이터(Vision 관찰 + 확정 Pattern + Artisan Story)로 `target_language`만 바꿔서 `POST /api/generate-content`를 다시 호출한다.

기본 언어(최초 생성 시 target_language)는 **Vietnamese(vi)**로 한다. 장인이 결과를 가장 먼저 확인해야 하는 언어이기 때문이다.

---

# 27. 결과 화면

```text
--------------------------------

Tên sản phẩm

Bình gốm hoa sen xanh

[Copy]

--------------------------------

Mô tả sản phẩm

...

[Copy]

--------------------------------

Câu chuyện sản phẩm

...

[Copy]

--------------------------------

Ý nghĩa hoa văn

...

[Copy]

--------------------------------

Facebook / Instagram

...

[Copy]

--------------------------------

VI | EN | KO

--------------------------------
```

---

# 28. 전체 Backend API

Frontend에서 OpenAI API를 직접 호출하지 않는다.

```text
Browser
   ↓
Our Backend
   ↓
OpenAI API
```

API Key는 Backend 환경 변수에만 저장한다.

---

# 29. 자체 API Endpoint 설계

## 1.

```text
POST /api/analyze-product
```

### Input

```text
multipart/form-data

image 또는 먼저 업로드한 image_id
```

### Output

```json
{
  "product_type": "VASE",
  "shape": "not visible",
  "surface_and_glaze": "not visible",
  "decoration_layout": "not visible",
  "decoration_elements": [],
  "composition": "not visible",
  "main_colors": [],
  "visual_features": [],
  "pattern_candidates": [
    {
      "pattern_id": "P01",
      "confidence": "high"
    }
  ]
}
```

---

## 2.

```text
POST /api/transcribe
```

### Input

```text
audio file
```

### Output

```json
{
  "text": "..."
}
```

---

## 3.

```text
POST /api/generate-content
```

### Input

```json
{
  "product": { "type": "VASE", "colors": ["BLUE"], "visual_features": ["FLORAL_DECORATION"] },
  "confirmed_pattern_id": "P01",
  "artisan_story": "...",
  "target_language": "vi"
}
```

### Output

```json
{
  "product_title": "...",
  "short_description": "...",
  "product_description": "...",
  "artisan_story": "...",
  "cultural_note": "...",
  "social_post": "..."
}
```

---

# 30. Pattern DB Endpoint

Optional:

```text
GET /api/patterns
```

Output:

```json
[
  {
    "id": "P01",
    "name_vi": "Hoa sen",
    "name_en": "Lotus"
  }
]
```

---

# 31. 추천 Frontend State

```typescript
type ProductAnalysis = {
  productType: string;
  colors: string[];
  visualFeatures: string[];
  patternCandidates: PatternCandidate[];
};

type PatternCandidate = {
  patternId: string;
  confidence: "high" | "medium" | "low";
};

type ArtisanInput = {
  story: string;
};

type GeneratedContent = {
  productTitle: string;
  shortDescription: string;
  productDescription: string;
  artisanStory: string;
  socialPost: string;
};
```

---

# 32. 전체 호출 순서

```text
USER
 │
 │ 사진 선택
 ▼
FRONTEND
 │
 │ POST /api/analyze-product
 ▼
BACKEND
 │
 │ Image + Pattern List
 ▼
OPENAI
 │
 │ Structured JSON
 ▼
BACKEND
 │
 ▼
FRONTEND
 │
 │
 │ 장인이 문양 선택
 │
 │
 │ 음성 또는 Text
 │
 ▼
OPTIONAL STT
 │
 ▼
장인 Text 확인
 │
 │
 │ POST /api/generate-content
 ▼
BACKEND
 │
 │ Pattern DB 조회
 │
 │ Prompt 생성
 ▼
OPENAI
 │
 │ Structured Content JSON
 ▼
BACKEND
 │
 ▼
FRONTEND
 │
 ▼
결과 출력
```

---

# 33. 데이터 출처 분리

서버 내부에서도 데이터를 구분한다.

```text
VISION_DATA
ARTISAN_DATA
CULTURAL_DATABASE
```

예:

```json
{
  "vision_data": {},
  "artisan_data": {},
  "cultural_database": {}
}
```

이렇게 해야 Prompt에서도 정보 출처를 명확히 구분할 수 있다.

---

# 34. 절대 하지 말아야 할 것

### ❌ Vision 결과

```text
"연꽃은 장인의 어린 시절 추억을 상징한다."
```

불가능.

Vision은 장인의 기억을 알 수 없다.

---

### ❌ AI 추측

```text
"이 제품은 Bát Tràng에서 전통적인 방식으로 제작되었습니다."
```

장인이 말하지 않았다면 작성 금지.

---

### ❌ 의도 생성

```text
"파란색을 통해 평화를 표현했습니다."
```

장인이 말하지 않았다면 작성 금지.

---

### ✅ 올바른 표현

```text
"제품에는 파란색 장식이 사용되었습니다."
```

Vision Observation.

```text
"장인은 어린 시절 보았던 연꽃에서 영감을 받았다고 설명했습니다."
```

Artisan Story.

```text
"연꽃에 대한 문화적 설명은 Pattern Database의 자료를 기반으로 제공합니다."
```

Cultural Information.

---

# 35. 오류 처리

## Vision 분석 실패

```text
사진을 분석하지 못했습니다.

더 밝은 장소에서
제품 전체가 보이도록 다시 촬영해주세요.
```

---

## 문양 없음

```text
AI가 등록된 문양 중
일치하는 문양을 찾지 못했습니다.

[문양 없음]

[직접 목록에서 선택]
```

---

## OpenAI API 실패

```text
콘텐츠 생성 중 문제가 발생했습니다.

[다시 시도]
```

입력 데이터는 유지한다.

---

# 36. Loading UX

Vision:

```text
제품의 특징을 분석하고 있습니다...
```

Generation:

```text
작품의 이야기를 정리하고 있습니다...
```

Translation:

```text
선택한 언어로 콘텐츠를 만들고 있습니다...
```

---

# 37. 모바일 UX 원칙

해커톤 MVP는 Mobile First.

### 버튼 높이

약 48px 이상.

### 한 화면에 핵심 행동 하나.

예:

```text
사진 업로드
↓
분석 확인
↓
문양 확인
↓
스토리 입력
↓
결과
```

복잡한 Dashboard는 만들지 않는다.

---

# 38. MVP에서 구현하지 않는 기능

다음 기능은 제외한다.

```text
❌ 회원가입

❌ 결제

❌ Shopee 자동 업로드

❌ TikTok 자동 업로드

❌ Facebook 자동 업로드

❌ 사진 배경 제거

❌ 사진 AI 보정

❌ Fine-tuning

❌ RAG

❌ Vector DB

❌ 장기 사용자 Memory

❌ 완전 Autonomous Agent

❌ 자체 Model Training

❌ QR 시스템
```

QR은 시간이 남는 경우 추가한다.

---

# 39. 하루 구현 우선순위

## P0 — 반드시 구현

```text
사진 업로드
Vision 분석
문양 후보
문양 확인
Text Story 입력
콘텐츠 생성
VI / EN / KO
Copy
```

---

## P1 — 시간이 남으면

```text
음성 입력
STT
```

---

## P2 — 더 시간이 남으면

```text
QR Product Story
기존 결과 저장
```

---

# 40. 기술 Stack 예시

Frontend:

```text
Next.js
TypeScript
Tailwind CSS
```

Backend:

```text
Next.js API Route
또는
Node.js / Express
```

AI:

```text
OpenAI Responses API
→ Vision
→ Structured Output
→ Content Generation

OpenAI Audio Transcription API
→ Optional STT
```

Database:

MVP에서는 별도 DB 없이

```text
patterns.json
```

사용 가능.

예:

```text
/data/patterns.json
```

---

# 41. 프로젝트 구조 예시

```text
src/

├── app/
│   ├── page.tsx
│   ├── analyze/
│   ├── verify/
│   ├── story/
│   └── result/
│
├── api/
│   ├── analyze-product/
│   ├── generate-content/
│   └── transcribe/
│
├── components/
│   ├── ImageUploader.tsx
│   ├── PatternSelector.tsx
│   ├── StoryInput.tsx
│   └── ContentResult.tsx
│
├── data/
│   └── patterns.json
│
├── lib/
│   ├── openai.ts
│   └── prompts.ts
│
└── types/
    └── index.ts
```

---

# 42. 개발 순서

## STEP 1

UI 없이 OpenAI Vision API부터 테스트.

```text
도자기 사진
→ JSON
```

성공 여부 확인.

---

## STEP 2

Pattern 5개만 먼저 넣고 문양 선택 테스트.

20개를 모두 준비할 때까지 개발을 기다리지 않는다.

---

## STEP 3

Content Generation Prompt 구현.

다음 세 데이터가 섞이지 않는지 테스트.

```text
Observation
Artisan Story
Cultural Data
```

---

## STEP 4

Frontend 연결.

```text
Upload
→ Analyze
→ Verify
→ Generate
```

---

## STEP 5

VI / EN / KO 테스트.

베트남 팀원이 Vietnamese 출력 확인.

---

## STEP 6

실제 스마트폰 테스트.

```text
Android

iPhone 가능하면 테스트
```

---

## STEP 7

시간이 남으면 STT 추가.

---

# 43. 가장 먼저 해야 할 테스트

개발 시작 후 아래 테스트를 제일 먼저 한다.

### Test 1 — Vision

실제 도자기 사진 5~10장을 넣는다.

```text
AI 문양 후보
vs
사람이 판단한 문양
```

비교.

---

### Test 2 — Hallucination

입력을 일부러 아주 짧게 한다.

```text
"연꽃을 생각하면서 만들었다."
```

AI가

```text
제작 기법
지역
시대
색의 의도
```

를 만들어내는지 확인한다.

---

### Test 3 — NONE

등록되지 않은 문양 사진을 입력한다.

AI가 억지로 P01~P20 중 하나를 선택하는지 확인한다.

원하는 결과:

```text
NONE
```

---

# 44. MVP 성공 기준

데모에서 다음 시나리오가 끝까지 성공하면 MVP 성공.

```text
① 도자기 사진 촬영

② AI 분석

③ AI:
   "Hoa sen일 가능성이 높습니다."

④ 장인:
   Hoa sen 확인

⑤ 장인:
   "어릴 때 마을 연못에서 본
   연꽃을 생각하면서 만들었습니다."

⑥ AI:

   상품명
   제품 설명
   작품 이야기
   문화 설명
   SNS 문구

⑦ English 클릭

⑧ 영어 콘텐츠 출력

⑨ Copy
```

---

# 45. 발표에서 보여줄 핵심

Before:

```text
사진 촬영

↓
설명 직접 작성

↓
문화 내용 정리

↓
번역

↓
SNS 글 작성
```

After:

```text
사진
+
장인의 짧은 이야기

↓

AI Analysis

↓

장인 Validation

↓

AI Workflow Automation

↓

판매 콘텐츠
```

---

# 46. 서비스 최종 정의

> 베트남 도예가가 작품 사진과 짧은 설명을 입력하면 AI가 제품의 시각적 특징과 전통 문양 후보를 분석하고, 장인의 확인을 거쳐 온라인 판매와 홍보에 사용할 콘텐츠를 자동 생성하는 모바일 웹서비스.

---

# 47. 핵심 차별점

우리는

> **AI에게 베트남 전통문화의 의미를 판단시키는 것이 아니다.**

AI는

```text
보고
→ 후보를 제시하고
→ 글을 정리한다.
```

문화적 판단은

```text
출처가 있는 데이터
+
실제 장인의 확인
```

을 기반으로 한다.

즉,

> **AI가 장인을 대신하는 서비스가 아니라  
> 장인이 가진 지식과 작품의 이야기를 더 쉽게 전달하도록 돕는 서비스다.**

---

# 48. 관람객 공개 화면

- `/exhibit/[id]`: 공개한 사진, 상품명, 짧은 소개, 상세 설명, 작가 이야기, DB 참고 자료를 읽기 전용으로 표시한다.
- 결과 화면의 “확인한 결과 공개하기”로 최초 공개한다. 공개 후 결과 화면에서 생성된 변경 내용은 500ms 지연 후 저장하고, 관람객은 3초마다 다시 읽는다. 입력 중인 초안은 공개하지 않는다.
- VI/EN/KO는 이미 공개된 결과만 선택한다. 없는 언어는 미공개 안내를 표시하며 관람객 화면은 AI를 호출하지 않는다.
- `POST /api/exhibits`: `{ imageId, patternId, content }`를 저장한다. content는 언어별 GeneratedContent다. 응답은 `{ id, imageId, patternId, content, updatedAt, token }`이다.
- `GET /api/exhibits/[id]`: token/tokenHash 없이 공개 결과를 반환한다. 캐시는 `no-store`다.
- `PUT /api/exhibits/[id]`: 같은 본문과 `Authorization: Bearer <token>`으로 갱신한다. imageId는 바꿀 수 없다. 잘못된 권한은 403이다.
- 수정 토큰은 제작자 브라우저 sessionStorage에만 보관한다. 서버는 SHA-256 해시만 저장한다. 세션을 잃으면 기존 공개 주소의 수정 권한 복구 기능은 없다.
- `POTTERY_DATA_DIR`의 images/exhibits 폴더에 저장한다. 미설정 시 `.pottery-data`다. 상시 배포는 쓰기 가능한 영구 볼륨을 연결한 단일 Node 서버가 필요하다. 서버리스 임시 파일시스템으로 영구 보존을 보장하지 않는다.
- 기존 임시 이미지 파일은 조회 시 새 저장소로 복사한다. 공개 이미지가 자동 만료되지 않도록 기존 2시간 삭제를 제거했다.
- 로컬 실행: `npm run build` 후 `npm run start -- --hostname 127.0.0.1 --port 3100`.
- 이 공개 저장소는 수동 조사한 patterns.json의 변경을 런타임 편집하지 않는다. DB 파일 변경은 재빌드/재배포가 필요하다.
