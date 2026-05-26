# 🚀 SOOP Comment Ranker

SOOP(구 아프리카TV) 스테이션 게시물의 댓글을 실시간으로 수집하고, 추천 수(UP) 및 최신순으로 정렬하여 분석할 수 있는 웹 도구입니다.

> **Vibe Coded** — 이 프로젝트는 AI 비서(Gemini CLI)와의 협업을 통해 제작되었습니다.

---

## ✨ 주요 기능

- **실시간 댓글 수집:** 3초 주기로 게시물의 댓글 데이터를 자동으로 새로고침합니다.
- **스마트 랭킹:** 
  - **추천순(UP):** 가장 호응이 좋은 댓글을 상단에 배치하며, 이전 순위 대비 변동 폭을 실시간으로 표시합니다.
  - **최신순:** 가장 최근에 작성된 댓글부터 확인 가능합니다.
- **댓글 검색 및 강조:** 키워드 검색을 통해 특정 댓글을 빠르게 찾고, 본문 내 검색어를 하이라이트합니다.
- **댓글 고정 (Pin):** 특정 댓글을 상단에 고정하여 순위 변화를 집중적으로 모니터링할 수 있습니다.
- **데이터 내보내기:** 현재 필터링된 댓글 목록(작성자, ID, 내용, 추천 수 등)을 하이퍼링크가 포함된 **Excel(.xlsx)** 파일로 저장합니다.
- **미디어 지원:** 댓글 내 이미지 미리보기와 이모티콘 렌더링을 지원합니다.
- **모던 디자인:** 다크 모드 지원 및 반응형 레이아웃으로 모바일과 데스크탑에서 최적화된 경험을 제공합니다.

---

## 🛠 기술 스택

### Frontend
- **React 19** & **TypeScript**
- **Tailwind CSS** (v4)
- **Vite** (Build Tool)
- **Iconify** (Icons)
- **XLSX** (Excel Export)
- **Jest** & **React Testing Library** (Unit Testing)

### Backend
- **Node.js** & **Express**
- **Axios** (Data Fetching)
- **Cheerio** (HTML Parsing)

---

## 🚀 시작하기

### 1. 프로젝트 클론
```bash
git clone https://github.com/gimn09909-beep/SOOP_Comment.git
cd SOOP_Comment
```

### 2. 백엔드 설정 및 실행
```bash
cd backend
npm install
node index.js
```
*서버는 기본적으로 `http://localhost:5000`에서 실행됩니다.*

### 3. 프론트엔드 설정 및 실행
```bash
cd ../frontend
npm install
npm run dev
```
*브라우저에서 `http://localhost:5173`으로 접속하세요.*

---

## 🧪 테스트 실행

### Frontend Tests
```bash
cd frontend
npx jest
```

### Backend Tests
```bash
cd backend
npm test
```

---

## 📁 프로젝트 구조

```text
SOOP_Comment/
├── backend/            # Express 서버 및 크롤링 로직
│   ├── tests/          # API 테스트
│   └── index.js        # 서버 엔트리 포인트
└── frontend/           # React 클라이언트 (Vite)
    ├── public/         # 정적 자산
    └── src/            # 소스 코드 (App.tsx, index.css 등)
```

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.
