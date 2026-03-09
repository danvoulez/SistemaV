# SistemaV

SistemaV is a modular, multi-tenant business management product foundation using Next.js + Supabase, designed for production evolution.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Postgres/Auth/Storage/Realtime/Edge Functions
- Vercel deployment target

## Product Areas
- `/admin` Backoffice for admins
- `/ops` Team operations for members
- `/client` Client self-service portal

## Multi-tenant Architecture
- Strict `tenant_id` isolation in relational tables
- `profiles` (auth identities) separated from `people` (business entities)
- Role model: `admin`, `member`, `client`
- Hardened client visibility policies for people/orders/deliveries/files
- Ownership invariant on `objects`: owned by person **or** tenant, never both/neither

## Data Model and SQL
- Main schema: `supabase/migrations/202603090001_initial_multitenant.sql`
- Storage/realtime: `supabase/migrations/202603090002_storage_realtime.sql`
- Workflow and RLS hardening: `supabase/migrations/202603090003_workflows_and_rls_hardening.sql`
- Seed: `supabase/seed/seed.sql`

## Edge Functions
Available workflow functions under `supabase/functions`:
- createTenant
- inviteUser
- createPerson
- createOrderDraft
- confirmOrder
- registerPayment
- createDelivery
- updateDeliveryStatus
- uploadLinkedFile
- recordInventoryMovement

Each function validates request payload and calls the corresponding SQL RPC (`api_*`) for transactional domain logic.

## Local Run
1. Install deps: `npm install`
2. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_DEMO_TENANT_ID` (optional)
3. Run dev server: `npm run dev`
4. Lint: `npm run lint`
