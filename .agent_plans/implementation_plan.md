# Liquid Lumina Design System Alignment

This plan addresses the discrepancies between the current `APPLYSTATE` application and the reference `liquid-lumina` design system. The previous implementation incorrectly used standard frosted glassmorphism (`backdrop-filter: blur`), whereas the authentic design relies on a translucent liquid aesthetic with NO backdrop blur, allowing the vibrant spheres to show through clearly.

## Open Questions

None at this moment. The goal is to perfectly mirror the CSS techniques and layout structures found in the `RUNRAX/liquid-lumina` repository.

## Proposed Changes

### Core Styles
We will replace the incorrectly implemented glass classes in `globals.css` with the exact, authentic techniques from the repo.

#### [MODIFY] [globals.css](file:///d:/APPLYSTATE/src/app/globals.css)
- **Colors:** Ensure all HSL CSS variables perfectly match `liquid-lumina/src/index.css`.
- **Glass Utilities:**
  - Remove `backdrop-filter: blur(12px) saturate(180%)`.
  - Implement authentic `.glass` using `linear-gradient` backgrounds with low opacity.
  - Add the `::before` pseudo-element with `mask-composite: exclude` to create sharp, premium inner borders.
  - Implement `.glass-strong` with radial gradient backgrounds.
  - Update `.glass-input` and `.glass-pill` to exactly match the repository's styling.

### UI Components
We will adjust the component styles to match the padding, sizing, and specific variants used in the reference repository, while retaining `framer-motion` for interactions (since we do not have `tailwindcss` configured).

#### [MODIFY] [GlassCard.tsx](file:///d:/APPLYSTATE/src/components/ui/GlassCard.tsx)
- Reduce inline padding from `2rem` to `1.5rem` (to match Tailwind's `p-6`).

#### [MODIFY] [Button.tsx](file:///d:/APPLYSTATE/src/components/ui/Button.tsx)
- Match hover states (scale `1.02`).

#### [MODIFY] [AuroraBackground.tsx](file:///d:/APPLYSTATE/src/components/ui/AuroraBackground.tsx)
- Check `aurora.css` and align sizes with `liquid-lumina` `LiquidBackground.tsx`.

## Verification Plan

### Manual Verification
- We will visually inspect the application dashboard.
- The background spheres should be perfectly clear when seen through the cards (no blurring).
- The inner borders of the cards should look sharp and premium due to the `mask-composite` technique.
- Padding and sizing will match the reference layout.
