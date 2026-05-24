-- Partial index for anonymous-user rate limiting (count requests by IP).
-- Prisma's schema DSL can't express WHERE clauses on indexes.
CREATE INDEX "idx_analytics_anonymous_ip"
  ON "analytics" ("ip_address", "created_at" DESC)
  WHERE "user_id" IS NULL;
