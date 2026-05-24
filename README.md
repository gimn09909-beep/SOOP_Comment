# SOOP Comment Ranker

SOOP 스테이션 게시물의 댓글을 추천순/최신순으로 정렬하고, 엑셀 저장까지 지원하는 웹 애플리케이션입니다.

> **Vibe Coded** — 이 프로젝트는 AI 비서(opencode)와의 채팅을 통해 만들어졌습니다.

## 기능

- SOOP 스테이션 게시물 댓글 조회 (URL 입력)
- 추천순 / 최신순 정렬
- 댓글 검색 및 하이라이트
- 댓글 고정 (Pinned Monitoring)
- 댓글 확장 (전체 내용 보기)
- 엑셀 다운로드
- 다크모드
- 3초 자동 새로고침 (실시간 업데이트)

## 기술 스택

- **Frontend**: React, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express, Axios
- **Deploy**: Render.com

## 로컬 실행

```bash
# 1. 프론트엔드 빌드
cd frontend && npm install && npm run build

# 2. 백엔드 실행
cd ../backend && npm install && node index.js

# http://localhost:5000 접속
```

또는 `start.bat` 실행 (Windows)

## 환경 변수

- `VITE_API_URL` — API 서버 주소 (기본값: `''`, 동일 출처)

## 배포 (Render)

- **Build Command**: `cd frontend && npm install && npm run build && cd ../backend && npm install`
- **Start Command**: `node backend/index.js`
- **Root Directory**: (repo root, backend 아님)
