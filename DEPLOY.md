# 배포 가이드 (Railway)

사진과 공개된 전시 데이터를 서버 파일로 저장하므로, **영구 볼륨을 붙일 수 있는 호스팅**이 필요하다.
Vercel 같은 서버리스는 인스턴스마다 파일이 사라져 QR 링크가 깨질 수 있다.

## 1. 접근 권한 구조

| 경로 | 누구에게 열려 있나 |
| --- | --- |
| `/exhibit/<id>`, `GET /api/exhibits/<id>`, `GET /api/image/<id>` | 누구나 (관람객 QR) |
| 그 외 전부 (`/`, `/analyze`, `/story`, `/result`, 유료 OpenAI API, 공개·수정 API) | `MAKER_PASSWORD`를 아는 장인만 |

`MAKER_PASSWORD`가 비어 있으면 게이트가 꺼진다. 배포 환경에서는 반드시 채운다.
브라우저에서 사용자명 `maker`, 비밀번호는 아래에서 정한 값으로 한 번 로그인하면 쿠키로 유지된다.

## 2. Railway 설정

1. [railway.com](https://railway.com) 가입 → **Deploy from GitHub repo** → 이 저장소 선택.
2. 서비스 생성 후 **Variables** 탭에서 환경 변수 등록:

   | 이름 | 값 |
   | --- | --- |
   | `OPENAI_API_KEY` | 본인 OpenAI 키 (`.env.local`에서 복사) |
   | `OPENAI_MODEL` | `gpt-4.1-mini` |
   | `OPENAI_STT_MODEL` | `whisper-1` |
   | `MAKER_PASSWORD` | 길고 추측 불가능한 값 |
   | `POTTERY_DATA_DIR` | `/data` |

3. **Settings → Volumes → New Volume**, 마운트 경로 `/data`.
   이 볼륨이 있어야 재배포 후에도 사진과 공개된 전시가 남는다.
4. **Settings → Networking → Generate Domain** 으로 공개 주소 발급.
5. 배포 후 확인:
   - 공개 주소 접속 시 로그인 창이 뜨는지 (장인 화면 보호 확인)
   - 로그인 후 사진 업로드 → 생성 → 확인 → 게시까지 되는지
   - 발급된 QR 링크를 **로그아웃 상태(시크릿 창)** 에서 열었을 때 보이는지

## 3. 운영자 수정 → 관람객 즉시 반영

관람객 화면은 3초마다 `/api/exhibits/<id>`를 다시 읽는다.
장인이 결과 화면에서 내용을 고치고 **“확인한 수정 내용 게시”** 를 누르면,
같은 QR 링크를 열어 둔 관람객 화면이 새로고침 없이 3초 안에 바뀐다. QR은 다시 만들 필요가 없다.

## 4. 비용 주의

`/api/analyze-product`, `/api/generate-content`, `/api/transcribe`는 호출할 때마다 OpenAI 요금이 발생한다.
이 경로들은 모두 `MAKER_PASSWORD` 뒤에 있으므로, **비밀번호를 공유하는 범위가 곧 비용 위험 범위**다.
관람객에게는 QR 링크만 전달하고 비밀번호는 알리지 않는다.
