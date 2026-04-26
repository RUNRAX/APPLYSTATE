# Fix Dashboard 404 & Liquid Glass Overhaul

- [x] Phase 1: Fix 404 Errors & Links
  - [x] Fix `/onboarding` redirect in `dashboard/page.tsx`
  - [x] Remove `/demo` link in `src/app/page.tsx`
- [x] Phase 2: Aurora Background Integration
  - [x] Delete `BackgroundScene.tsx` and `ParticleField.tsx`
  - [x] Create `AuroraBackground.tsx`
  - [x] Update `src/app/layout.tsx` to use `AuroraBackground`
- [x] Phase 3: Liquid Glass Design System
  - [x] Update `globals.css` with new tokens and aurora animations
  - [x] Update `GlassCard.tsx`
  - [x] Update `Button.tsx` (pill shape, variants)
  - [x] Update `Input.tsx` (glass inputs)
  - [x] Update `Modal.tsx`
  - [x] Update landing page `<nav>` to be a glass panel
  - [x] Update `dashboard/layout.tsx` sidebar to be a glass panel
- [x] Phase 4: Clean up & Verification
  - [x] Remove Three.js packages from `package.json`
  - [x] Build and verify site visually
