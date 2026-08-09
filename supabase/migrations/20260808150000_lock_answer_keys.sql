-- Defense in depth for the answer key.
--
-- Supabase's default privileges grant client roles SELECT on every new table in
-- the public schema, so today answer_keys is readable-in-principle by anon and
-- authenticated and is kept empty for them only by RLS having no policies. That
-- is correct but single-layered: anyone who disables RLS on the table for a
-- moment exposes all 200 answers. Remove the grant as well, so the table is
-- unreachable by client roles regardless of RLS state.
--
-- submit_attempt() is security definer and runs as the owner, so grading is
-- unaffected. The seed script uses the service role, which is likewise
-- unaffected.

revoke all on public.answer_keys from anon, authenticated;
