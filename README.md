# 월간 기도나무 (95년 동기)

95년 동기 모임을 위한 월간 기도제목 아카이브 대시보드입니다.
Claude 아티팩트로 만들어졌고, 나뭇가지에 태그가 매달린 형태로 기도제목을 기록합니다.

## ⚠️ 중요: 저장소(storage) 관련 안내

이 컴포넌트는 `window.storage`라는 API를 사용해 데이터를 저장합니다.
이 API는 **claude.ai 아티팩트 환경에서만 동작**하며, GitHub Pages나 Vercel 같은
일반 웹 호스팅에 그대로 올리면 저장/불러오기가 작동하지 않습니다.

즉, 이 저장소는 두 가지 용도로 쓸 수 있어요:

1. **소스코드 백업/버전관리용** — 지금처럼 GitHub에 코드만 보관하고,
   실제 사용은 계속 claude.ai 아티팩트 링크로 하는 경우 (권장, 별도 작업 불필요)
2. **진짜 독립 웹사이트로 배포** — GitHub Pages 등에서 실제로 작동하게 하려면
   `window.storage` 부분을 Firebase, Supabase 같은 실제 백엔드 저장소로 바꾸는
   추가 작업이 필요합니다.

## 파일 구성

- `PrayerTree.jsx` — React 컴포넌트 전체 소스

## GitHub에 올리는 방법 (코드 백업용)

```bash
# 1. 새 저장소 폴더로 이동 (또는 git init)
git init prayer-tree
cd prayer-tree

# 2. 이 폴더의 파일들을 복사해 넣기

# 3. 커밋 & 푸시
git add .
git commit -m "월간 기도나무 대시보드 추가"
git branch -M main
git remote add origin https://github.com/<your-username>/prayer-tree.git
git push -u origin main
```
