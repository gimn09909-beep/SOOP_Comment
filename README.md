# SOOP Comment Ranker

SOOP 스테이션 게시물 댓글을 추천순/최신순으로 정렬하고 엑셀로 저장하는 도구입니다.

> **Vibe Coded** — AI 비서(opencode)와의 대화로 만들어진 프로젝트입니다.

## 주요 기능

- **댓글 랭킹:** 추천 수(UP) 기반 실시간 순위 추적 및 정렬 (3초 주기)
- **필터링:** 키워드 검색 및 텍스트 하이라이트
- **모니터링:** 특정 댓글 상단 고정 (Pin)
- **데이터 내보내기:** 하이퍼링크가 포함된 엑셀(XLSX) 저장
- **디자인:** 반응형 레이아웃 및 다크모드 지원

## 기술 스택

- **Frontend:** React, TypeScript, Tailwind CSS, Iconify
- **Backend:** Node.js, Express, Axios
- **Test:** Vitest, Jest

## 시작하기

### 로컬 실행
```bash
# Windows
./start.bat

# 수동 실행
cd frontend && npm install && npm run build
cd ../backend && npm install && node index.js
```

## 테스트
```bash
# 프론트엔드 단위 테스트
cd frontend && npx vitest run

# 백엔드 API 테스트
cd backend && npm test
```
