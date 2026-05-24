# SOOP Comment Ranker

SOOP 스테이션 게시물의 댓글을 추천순/최신순으로 정렬하고 엑셀 저장까지 지원하는 웹 앱입니다.

> **Vibe Coded** — AI 비서(opencode)와의 대화로 만들어진 프로젝트입니다.

## 기능

- 게시물 URL 입력 → 댓글 조회
- 추천순 / 최신순 정렬
- 실시간 자동 갱신 (3초)
- 댓글 검색 + 하이라이트
- 댓글 고정 (Pinned Monitoring)
- 댓글 확장 (전문 보기)
- 엑셀 다운로드
- 다크모드

## 구조

```
SOOP_Comment/
├── backend/
│   ├── index.js          # Express 서버 (API + 정적 파일)
│   ├── package.json
│   └── tests/
│       └── api.test.js   # API 통합 테스트
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # 메인 컴포넌트
│   │   ├── main.tsx       # 진입점
│   │   ├── index.css      # Tailwind + 스타일
│   │   ├── logic.test.ts  # 단위 테스트
│   │   └── setupTests.ts
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig*.json
│   ├── eslint.config.js
│   └── package.json
├── .gitignore
└── start.bat              # 로컬 실행 스크립트 (Windows)
```

## 기술 스택

| 계층 | 기술 |
|------|------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| Backend | Node.js, Express, Axios |
| 도구 | Vitest, Jest, Testing Library |
| 배포 | Render.com |

## 로컬 실행

```bash
cd frontend && npm install && npm run build
cd ../backend && npm install && node index.js
# http://localhost:5000
```

Windows: `start.bat` 실행

## 테스트

```bash
cd frontend && npx vitest run        # 단위 테스트
cd backend && npm test               # API 통합 테스트
```

## 환경 변수

- `VITE_API_URL` — API 주소 (기본값: `''`, 동일 출처)

## 배포 (Render)

- **Build**: `cd frontend && npm install && npm run build && cd ../backend && npm install`
- **Start**: `node backend/index.js`
- **Root**: 저장소 루트
