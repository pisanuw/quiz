-- Drop the leaderboard views, phase two of two.
--
-- Apply this only after the rpc client (globalLeaderboard and quizLeaderboard
-- calling leaderboard_global() and leaderboard_quiz()) is deployed and verified
-- live. Until then the deployed client still selects these views. Dropping them
-- early is the exact DB-ahead-of-client skew that returned a 400 board three
-- times before.
--
-- Once these are gone the "Security Definer View" advisor finding clears, since
-- the read path is now a security definer function rather than a view.

drop view if exists public.leaderboard_global;
drop view if exists public.leaderboard_quiz;
