import { supabase } from './supabase'

export async function listQuizzes() {
  const { data, error } = await supabase
    .from('quizzes')
    .select('id, slug, title, blurb')
    .order('id')
  if (error) throw error
  return data
}

export async function getQuiz(id) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('id, slug, title, blurb')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getQuestions(quizId) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, position, prompt, choices')
    .eq('quiz_id', quizId)
    .order('position')
  if (error) throw error
  return data
}

// answers: { [questionId]: chosenIndex }
export async function submitAttempt(quizId, answers, durationMs) {
  const { data, error } = await supabase.rpc('submit_attempt', {
    p_quiz_id: quizId,
    p_answers: answers,
    p_duration_ms: durationMs ?? null
  })
  if (error) throw error
  return data
}

export async function globalLeaderboard(limit = 100) {
  const { data, error } = await supabase
    .from('leaderboard_global')
    .select('user_id, display_name, avatar_url, total_score, quizzes_completed, attempts, max_score, rank')
    .order('rank')
    .limit(limit)
  if (error) throw error
  return data
}

export async function quizLeaderboard(quizId, limit = 100) {
  const { data, error } = await supabase
    .from('leaderboard_quiz')
    .select('user_id, display_name, avatar_url, avg_score, total, attempts, rank')
    .eq('quiz_id', quizId)
    .order('rank')
    .limit(limit)
  if (error) throw error
  return data
}

export async function myChapterScores(userId) {
  const { data, error } = await supabase
    .from('leaderboard_quiz')
    .select('quiz_id, avg_score, total, attempts, rank')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function updateDisplayName(userId, displayName) {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)
  if (error) throw error
}

// The board only receives a photo URL for players who turned it on, so this
// flag is the whole mechanism, not a client side hint.
export async function updateShowAvatar(userId, showAvatar) {
  const { error } = await supabase
    .from('profiles')
    .update({ show_avatar: showAvatar })
    .eq('id', userId)
  if (error) throw error
}
