# 구현 상태 — 2026-09-29

## 완료

- 상세 Vision 관찰 5개 필드, nested strict schema, DB ID + NONE 동적 enum.
- NONE 보존, high/medium/low 전체 후보, 사진과 관찰/참고 자료 구분.
- DB description/origin/representative_works 필드 추가. 조사 전 값은 null.
- 로딩 시 출처 검증. 유래 텍스트에 source.url이 없으면 오류.
- 관람객 `/exhibit/[id]`, 공개/수정 API, 수정 토큰 보호, 공개 후 자동 저장, 3초 갱신.
- 사진/공개 결과 파일 저장 및 이전 임시 이미지 읽기 호환.
- 외부 배포 준비: `src/middleware.ts`가 장인 화면과 유료 API를 `MAKER_PASSWORD` Basic 인증으로 막고, 공개된 `/exhibit/<id>`·`/api/exhibits/<id>`·`/api/image/<id>` GET만 열어 둔다.
- `next start`가 호스팅 플랫폼의 `PORT`를 따르고, `outputFileTracingRoot`로 상위 디렉터리 lockfile 오탐을 제거했다.

## 검증

- `npm run build`: 성공 (Next.js 상위 디렉터리 lockfile 경고 있음).
- `npm run typecheck`: 성공.
- `node tests/contracts.cjs`: 성공. null 자료 20건, 출처 누락/위험 URL 거부, nested required/additionalProperties, 동적 enum, Low/NONE 렌더, 공개 입력 검증, 수정 권한, 토큰 제외, 저장 갱신.
- 로컬 HTTP: 테스트 이미지 업로드 → 공개 → VI/EN/KO 데이터 조회 → 무권한 PUT 403 → 허가된 갱신 → 관람객 페이지 200 성공.
- 관람객 브라우저: KO 전환 및 description/meaning/origin/대표작의 자료 없음 표시 확인.
- 프로덕션 서버 + `MAKER_PASSWORD` 실행: `/`, `/result`, `/api/patterns`, `POST /api/upload-image` 401, 잘못된 비밀번호 401, `/exhibit/<id>`·`/api/exhibits/<id>`·`/api/image/<id>` GET은 인증 없이 통과.
- 게이트 통과 후 종단 확인: 사진 업로드 → 공개 → 무인증 관람객 조회 200 → 장인 쿠키 + 수정 토큰으로 PUT 200 → 무인증 관람객 조회에 수정본 즉시 반영, 공개 응답에 토큰 없음.

## 미완료 / 제한

1. 실제 사진 5장 분석 및 not visible 정확도: 미검증. 업로드 폴더의 10개 파일은 중복 제거 시 5개이며 실제 도자기 사진은 1개, 나머지는 단색/도형/1픽셀 테스트 이미지다.
2. 미등록 문양 실제 Vision NONE 응답: 미검증. 앱은 NONE을 보존하지만 모델 정확도는 보장하지 않는다.
3. 실제 Vision → 선택 → 이야기 → 유료 콘텐츠 생성 → VI/EN/KO 종단 검증: 미검증. 유료 외부 호출은 자동 승인 검토가 거부해 실행하지 않았다. 로컬 테스트 데이터와 실제 AI 응답을 구분한다.
4. 외부 배포: 코드는 준비되었고 Railway(영구 볼륨 + `POTTERY_DATA_DIR`) 배포를 대상으로 한다. 실제 호스팅 계정 생성과 환경 변수 등록은 소유자가 수행해야 하며, 그 전까지 공개 URL은 없다. 서버리스(Vercel 등)는 로컬 파일 저장 방식과 맞지 않는다.
5. 공개 업데이트는 제작자가 결과 화면을 연 동안 생성 완료된 내용을 저장하는 방식이다. 브라우저를 닫은 뒤 백그라운드 편집/생성은 없다.
6. `.env.example`의 실제 키 형태 값은 placeholder로 교체했다. 해당 값이 담긴 커밋은 push 전에 정리해, 공개 저장소에 올라간 적이 없다. 키 자체는 소유자 판단으로 교체하지 않았고 `.env.local`에만 남아 있다.
7. 기존 음성 확정 전 직접 수정, 새 사진의 이전 이야기 유지 문제는 이번 D+A 범위 밖이므로 수정하지 않았다.

## 공식 API 근거

- 설치 SDK: openai 6.49.0, ResponseFormatTextJSONSchemaConfig.
- https://developers.openai.com/api/docs/guides/structured-outputs
- Responses text.format의 type/name/schema/strict를 형제 속성으로 사용.
