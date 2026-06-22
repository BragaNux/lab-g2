export interface User {
  id: string
  username: string
  email: string
  xp: number
  streak: number
  is_premium: boolean
  is_admin: boolean
  allow_ai: boolean
}


export interface Challenge {
  id: string
  passage_text: string
  difficulty: number
  points_available: number
  already_played: boolean
}

export interface SubmitResult {
  is_correct: boolean
  points_earned: number
  correct_answer: { title: string; author: string }
}

export interface RankingItem {
  position: number
  user_id: string
  username: string
  xp: number
  streak: number
  is_me: boolean
}

export interface HistoryChallenge {
  id: string
  date: string
  difficulty: number
}

export type Level = "Leitor" | "Bibliófilo" | "Erudito"

export function getLevel(xp: number): Level {
  if (xp >= 1000) return "Erudito"
  if (xp >= 300) return "Bibliófilo"
  return "Leitor"
}
