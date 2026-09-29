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

Structured Output을 사용한다.

```json
{
  "product_type": "vase",
  "main_colors": [
    "blue",
    "white"
  ],
  "visual_features": [
    "floral decoration",
    "symmetrical pattern"
  ],
  "pattern_candidates": [
    {
      "pattern_id": "P01",
      "confidence": "high"
    }
  ]
}
```

---

# 8. JSON Schema

```json
{
  "type": "object",
  "properties": {
    "product_type": {
      "type": "string"
    },

    "main_colors": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },

    "visual_features": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },

    "pattern_candidates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "pattern_id": {
            "type": "string"
          },

          "confidence": {
            "type": "string",
            "enum": [
              "high",
              "medium",
              "low"
            ]
          }
        },

        "required": [
          "pattern_id",
          "confidence"
        ]
      }
    }
  },

  "required": [
    "product_type",
    "main_colors",
    "visual_features",
    "pattern_candidates"
  ]
}
```

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
```

---

# 10. Screen 3 — 문양 확인

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

  "verified_at": "2026-09-29"
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

예:

```json
{
  "product": {
    "type": "vase",

    "colors": [
      "blue",
      "white"
    ],

    "visual_features": [
      "floral decoration",
      "symmetrical pattern"
    ]
  },

  "pattern": {
    "name": "Hoa sen",

    "meaning": "DB에서 가져온 설명",

    "source": "..."
  },

  "artisan_story": "어릴 때 마을 연못에서 본 연꽃을 생각하며 만든 작품입니다."
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

  "cultural_note": "",

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

Pattern Database에서 제공한 문화적 정보만 사용한다.

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

  "cultural_note": "string",

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

image
```

### Output

```json
{
  "product_type": "...",
  "main_colors": [],
  "visual_features": [],
  "pattern_candidates": []
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
  "product": {},
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
  culturalNote: string;
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