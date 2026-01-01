# express-typescript template

| Type     | 용도                    |
| -------- | ----------------------- |
| feat     | 새 기능                 |
| fix      | 버그 수정               |
| docs     | 문서 변경               |
| style    | 포맷팅 (코드 변경 없음) |
| refactor | 리팩토링                |
| test     | 테스트 추가/수정        |
| chore    | 빌드, 설정 변경         |
| perf     | 성능 개선               |

    # husky 훅 건너뛰기

git commit --no-verify -m "feat: 급한 수정"

팀원 누군가 --no-verify로 커밋하면 검사 없이 푸시됨

    1. package.json 스크립트 추가

"lint:check": "eslint src --ext .ts", // CI용 (수정 안 함)
"format:check": "prettier --check \"src/\*_/_.ts\"", // CI용 (수정 안 함)

2. .github/workflows/ci.yml

PR/Push to main
│
▼
┌─────────────────┐
│ lint-and-typecheck │
│ - ESLint │
│ - Prettier │
│ - TypeScript │
└────────┬────────┘
│
┌────┴────┐
▼ ▼
┌──────┐ ┌───────┐
│ Test │ │ Build │
└──────┘ └───────┘

| Job                | 검사 내용                   |
| ------------------ | --------------------------- |
| lint-and-typecheck | ESLint, Prettier, 타입 체크 |
| test               | Jest 테스트 실행            |
| build              | tsc + tsc-alias 빌드        |

---

참고: CI가 동작하려면 package-lock.json이 필요합니다. .gitignore에서 제거하고 커밋해야 npm ci가 작동합니다.

변경 내용 정리

---

역할 분담

| 환경               | 역할      | 동작           |
| ------------------ | --------- | -------------- |
| 로컬 (lint-staged) | 자동 수정 | --fix, --write |
| CI                 | 검사만    | 통과/실패 판정 |

---

CI가 검사만 하는 이유

1. 책임 소재 명확 - "네가 고쳐서 다시 푸시해"
2. 코드 리뷰 가능 - 수정된 내용을 개발자가 확인
3. 의도치 않은 변경 방지 - CI가 몰래 코드 바꾸면 위험

---

흐름 예시

개발자: 포맷 안 맞는 코드 푸시
↓
CI: ❌ "Prettier check 실패"
↓
개발자: npm run format:fix 실행
↓
개발자: 다시 푸시
↓
CI: ✅ 통과

CI는 문지기, 고치는 건 개발자 몫입니다.

package.json 스크립트

| 스크립트   | 명령어                     | 용도                   |
| ---------- | -------------------------- | ---------------------- |
| lint       | eslint src --ext .ts       | 검사만 (CI용)          |
| lint:fix   | eslint src --ext .ts --fix | 자동 수정 (로컬용)     |
| format     | prettier --check           | 검사만 (CI용)          |
| format:fix | prettier --write           | 자동 수정 (로컬용)     |
| start      | node dist/server.js        | 경로 수정 (app→server) |

삭제: lint:check (중복)

---

네이밍 규칙

lint → 검사만
lint:fix → 자동 수정

format → 검사만
format:fix → 자동 수정

일관성 있게 :fix 접미사로 통일했습니다.
