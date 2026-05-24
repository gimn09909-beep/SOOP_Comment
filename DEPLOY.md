# 🚀 완전 무료 배포 가이드 (Zero-Cost Deployment)

이 가이드는 **Vercel**과 **Render**를 사용하여 앱을 완전 무료로 배포하는 방법을 설명합니다.

---

## 1. 준비 작업 (공통)
*   프로젝트 코드를 **GitHub** 저장소에 올리세요.
*   `frontend` 폴더와 `backend` 폴더가 포함된 전체 구조를 그대로 푸시(Push)하면 됩니다.

---

## 2. 백엔드 배포 (Render.com)
1.  [Render.com](https://render.com/)에 접속하여 로그인합니다.
2.  **New +** 버튼을 누르고 **Web Service**를 선택합니다.
3.  GitHub 저장소를 연결합니다.
4.  설정 화면에서 다음 내용을 입력합니다:
    *   **Name:** `soop-rank-api` (원하는 이름)
    *   **Root Directory:** (비워둠 — repo 최상위)
    *   **Runtime:** `Node`
    *   **Build Command:** `cd frontend && npm install && npm run build && cd ../backend && npm install`
    *   **Start Command:** `node backend/index.js`
5.  **Free Plan**을 선택하고 배포합니다.
6.  배포가 완료되면 `https://soop-rank-api.onrender.com` 같은 주소가 생성됩니다. **이 주소를 복사해두세요.**

---

## 3. 프론트엔드 배포 (Vercel.com)
1.  [Vercel.com](https://vercel.com/)에 접속하여 로그인합니다.
2.  **Add New...** -> **Project**를 선택합니다.
3.  GitHub 저장소를 연결(Import)합니다.
4.  설정 화면에서 다음 내용을 입력합니다:
    *   **Framework Preset:** `Vite`
    *   **Root Directory:** `frontend` (중요!)
5.  **Environment Variables** 섹션을 펼치고 다음 변수를 추가합니다:
    *   **Key:** `VITE_API_URL`
    *   **Value:** 위에서 복사한 **백엔드 주소** (예: `https://soop-rank-api.onrender.com`)
6.  **Deploy** 버튼을 누릅니다.

---

## 💡 주의사항 (Free Tier 제약)
*   **백엔드 수면 모드**: Render의 무료 플랜은 약 15분간 접속이 없으면 서버가 잠듭니다. 이 경우 첫 접속 시 서버가 깨어나는 데 약 30초~1분 정도 걸릴 수 있습니다. (앱이 고장 난 것이 아니니 잠시만 기다려주세요!)
*   **보안**: 현재는 모든 도메인에서의 접속을 허용(`CORS *`)하고 있습니다. 나중에 실제 운영 시에는 Vercel 주소만 허용하도록 `backend/index.js`의 CORS 설정을 변경하는 것이 좋습니다.

---

이제 전 세계 어디서든 링크만 있으면 당신의 앱에 접속할 수 있습니다! 🎉
