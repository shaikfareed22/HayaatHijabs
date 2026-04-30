# Production Readiness Checklist

This project has a strong base, but use this checklist before go-live.

## 1) Environment & Secrets
- [ ] Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for each environment.
- [ ] Keep Supabase service role key out of frontend code.
- [ ] Configure domain, TLS, and deployment target.

## 2) Database & Security
- [ ] Review RLS policies for every table with write operations.
- [ ] Ensure only admins can mutate catalog/order management tables.
- [ ] Verify admin assignment process in `user_profiles.role`.
- [ ] Enable database backups and test restore.

## 3) Application Reliability
- [ ] CI passes on every PR (lint, test, build).
- [ ] Add staging environment and release promotion process.
- [ ] Define rollback strategy and release notes format.

## 4) Commerce Integrity
- [ ] Move sensitive checkout operations to trusted backend/Edge Functions.
- [ ] Validate coupon logic server-side.
- [ ] Add idempotency for order placement.
- [ ] Confirm stock updates are transactional and race-safe.

## 5) Monitoring
- [ ] Add frontend error monitoring.
- [ ] Add server/function logs and alerts.
- [ ] Track conversion and checkout failures.

## 6) Performance & SEO
- [ ] Optimize images and caching strategy.
- [ ] Verify metadata for products and collections.
- [ ] Validate robots/sitemap behavior.

## 7) Operational Readiness
- [ ] Confirm admin workflows for product, stock, coupons, and order updates.
- [ ] Document support runbooks (refunds, failed payments, inventory fixes).
- [ ] Define on-call and incident response process.
