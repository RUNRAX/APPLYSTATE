# Shift from LinkedIn to Company Career Portals

The goal is to transition the job discovery mechanism away from LinkedIn and focus entirely on company career portals (ATS platforms like Lever, Greenhouse, Ashby, etc.). This avoids the high competition and traffic associated with LinkedIn Easy Apply.

## Proposed Changes

### 1. New Scraping Strategy
Create a new `company-portals.strategy.ts` which implements the required methods (`login`, `search`). 
- `login`: Can simply be a no-op or pass-through since most company portals do not require authentication to search.
- `search`: Will use search engines (e.g., Google or DuckDuckGo) with advanced operators (`site:lever.co OR site:boards.greenhouse.io`) or use direct ATS aggregation techniques to find roles matching the user's criteria.

### 2. Update Discovery Worker
Modify `src/workers/discovery.worker.ts` to:
- Remove the `LinkedinStrategy` dependency.
- Instantiate and use `CompanyPortalsStrategy` when the configured platform is invoked.
- Update log messages and status updates to reflect company portals instead of LinkedIn.

### 3. UI and Onboarding Updates
Remove LinkedIn terminology from the user interface:
- **Dashboard**: Update `DashboardClient.tsx` to display "Company Portals" instead of "LinkedIn".
- **Onboarding**: Update `src/app/dashboard/onboarding/page.tsx` to offer connecting to ATS/Company Portals rather than LinkedIn.
- **Connection Form**: Since company portals don't require user credentials to search, we can modify `ConnectForm.tsx` to either auto-connect or just act as a toggle (or use a dummy credential to satisfy the `PlatformCredential` DB model).

## User Review Required
> [!IMPORTANT]
> Company career portals generally do not require a login. The current database schema uses `PlatformCredential` to trigger the worker. Should we:
> A) Simply rename "LinkedIn" to "Company Portals" in the UI and allow users to "Connect" by just clicking a button (saving a dummy credential)?
> B) Or bypass credentials entirely for company portals, having the worker run automatically for any user with `autoApply` enabled? (I recommend A for minimal database changes).

## Verification Plan
1. **Automated / Local Testing**: I will trigger the `discovery.worker.ts` script to ensure it correctly initializes the new strategy, performs a search on an ATS platform, and extracts at least one job successfully.
2. **UI Verification**: Ensure all LinkedIn references are gone from the dashboard.
