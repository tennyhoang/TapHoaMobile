# Contributing to TapHoa Mobile

## Prerequisites

- Node.js 22+
- npm 10+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode 16+ (macOS only)
- Android: Android Studio + emulator / physical device

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env
cp .env.example .env
# → fill EXPO_PUBLIC_API_URL, EXPO_PUBLIC_CLOUDINARY_*, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID

# 3. Start Expo dev server
npm start          # opens Expo Go QR code
npm run ios        # iOS simulator
npm run android    # Android emulator
```

## Branch & commit conventions

| Branch prefix | Purpose                |
| ------------- | ---------------------- |
| `feat/`       | New feature            |
| `fix/`        | Bug fix                |
| `chore/`      | Tooling / dependencies |
| `docs/`       | Documentation only     |

Commits follow **Conventional Commits** (validated by commitlint via Husky):

```
feat(home): migrate data fetching to React Query
fix(tabbar): remove invalid eslint-disable comment
```

## Pull Request checklist

- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run type-check` passes
- [ ] New screens/components have tests in `__tests__/`
- [ ] New user-facing text added to `locales/vi.json` and `locales/en.json`
- [ ] CHANGELOG.md updated under `[Unreleased]`

## Code style

- **React Query** for all data fetching — no plain `useEffect` + `fetch`
- All user-visible text uses `useTranslation()` — no hardcoded Vietnamese
- Env variables via `process.env.EXPO_PUBLIC_*` — no hardcoded fallback values
- Components in `components/`, screens in `app/`
- Write stories in `components/stories/` for any reusable UI component

## Running tests

```bash
npm test                  # run once
npm run test:watch        # watch mode
npm run test:coverage     # with coverage report
```

## Storybook

```bash
npm run storybook         # launch Storybook on port 7007
```

## i18n

When adding new text:

1. Add key to `locales/vi.json`
2. Add key to `locales/en.json`
3. Use `const { t } = useTranslation()` in the component
