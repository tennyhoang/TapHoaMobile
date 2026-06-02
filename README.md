# TapHoa Mobile

React Native grocery delivery app built with Expo SDK 56.

## Architecture

- **Framework**: Expo (SDK 56) + Expo Router (file-based routing)
- **Language**: TypeScript
- **State**: React Context (auth, cart, wishlist)
- **API**: REST via `lib/api.ts` with JWT auth
- **Storage**: expo-secure-store (tokens) + AsyncStorage (preferences)
- **Monitoring**: Sentry
- **Testing**: Jest + @testing-library/react-native

## Project Structure

```
app/           # Screens (Expo Router file-based)
  (auth)/      # Login, register, forgot password
  (tabs)/      # Bottom tab screens
  admin/       # Admin portal
  agent/       # Hub agent portal
  driver/      # Driver portal
components/    # Reusable UI components
constants/     # Colors, shared constants
lib/           # Auth context, API client, utilities
locales/       # i18n translation files
services/      # API service layer
types/         # TypeScript type definitions
__tests__/     # Jest test suites
```

## Getting Started

### Prerequisites

- Node.js 22+
- Expo CLI: `npm install -g expo`
- EAS CLI: `npm install -g eas-cli`

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your values in .env

# Start development server
npx expo start
```

### Environment Variables

See `.env.example` for all required variables:

- `EXPO_PUBLIC_API_URL` — Backend API base URL
- `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` — Google OAuth (social login)
- `EXPO_PUBLIC_FACEBOOK_APP_ID` — Facebook OAuth (social login)
- `GOOGLE_MAPS_API_KEY` — Google Maps (hub picker, Android)
- `EXPO_PUBLIC_SENTRY_DSN` — Sentry error tracking

## Development

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Tests
npm test
npm run test:coverage

# Format
npm run format
```

## Building

```bash
# Development build (with dev client)
npx eas build --profile development --platform android

# Internal testing (APK)
npx eas build --profile preview --platform android

# Production
npx eas build --profile production --platform all
```

## User Roles

| Role     | Access                                        |
| -------- | --------------------------------------------- |
| Customer | Shopping, orders, wallet, wishlist            |
| Admin    | Dashboard, all orders, product images         |
| Agent    | Hub order management (arrive/complete pickup) |
| Driver   | Pickup, delivery, route optimization          |

## Testing

232 tests across 34 suites:

- **Services**: auth, cart, orders, products, profile, hubs, vouchers, driver, agent, articles, admin, notifications, reviews, addresses, wallet, flashsale, categories
- **Components**: ErrorScreen, OfflineBanner, ProductCard, ProductImage, Skeleton, TabBar, Toast
- **Screens**: Login, Orders, Profile, Cart, Checkout, Order Detail

```bash
npm test                    # run all tests
npm run test:coverage       # with coverage report
```

Coverage thresholds: branches 60%, functions 70%, lines 75%.
