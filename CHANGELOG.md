# Changelog

All notable changes to **TapHoa Mobile** will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Storybook setup with `ProductCard` and `Skeleton` stories
- Coverage thresholds: branches 70%, functions 80%, lines/statements 85%
- Tests for admin, agent, driver screens

### Changed

- Home screen migrated from plain fetch to React Query (`useQuery` + `useMutation`)
- Products screen migrated to `useInfiniteQuery` for pagination
- Removed eslint-disable comment with non-existent rule in `TabBar.tsx`
- Cloudinary credentials read from env only (no hardcoded fallback)
- API URL read from env only (no hardcoded fallback)

### Fixed

- Copyright in `LICENSE` updated from "650 Industries" to "TapHoa"

## [1.0.0] - 2026-01-01

### Added

- Initial release (Expo SDK 56)
- Home, Products, Cart, Profile tabs
- Product detail, search, reviews
- Checkout with COD / bank transfer / wallet payment
- Order tracking with status updates
- Profile edit with avatar upload (Cloudinary)
- Wallet top-up and history
- Flash sale with countdown
- Wishlist, notifications
- Admin: products, orders, categories, warehouses
- Agent portal: hub management, order dispatch
- Driver portal: route map, delivery confirmation
- i18n (vi/en) — 341 keys
- Biometric authentication (Face ID / fingerprint)
- Push notifications
- Offline banner
