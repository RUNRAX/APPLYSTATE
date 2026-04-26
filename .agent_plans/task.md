# Fix Dashboard 404 & Production Deployment Issues

- [x] Phase 1: Fix Prisma Schema
  - [x] Add `url` and `directUrl` to `prisma/schema.prisma` datasource
- [x] Phase 2: Add Middleware
  - [x] Create `src/proxy.ts` (Next.js 16.2.4 convention) to protect routes
- [x] Phase 3: Update NextAuth Configuration
  - [x] Add `trustHost: true` to `src/features/auth/auth.ts`
- [x] Phase 4: Fix THREE.Clock Deprecation
  - [x] Pinned `three` version to `~0.183.0` in package.json
- [x] Phase 5: Verification
  - [x] Run `npx prisma generate` and `npx prisma db push`
  - [x] Run `npm run build`
