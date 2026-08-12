-- Close the profiles read hole.
--
-- 20260812191703 gated avatar_url behind show_avatar in the leaderboard views,
-- but public.profiles still carried a "readable by everyone" policy, so anyone
-- could select display_name and avatar_url straight off the table and recover
-- the photo of every player who had opted out. The gating was decorative.
--
-- Nobody needs to read the profiles table directly except a player reading
-- their own row: the boards are served by the two leaderboard views, which are
-- owned by the table owner and therefore bypass row level security.

drop policy if exists "profiles are readable by everyone" on public.profiles;

create policy "you can read your own profile"
  on public.profiles for select using (auth.uid() = id);
