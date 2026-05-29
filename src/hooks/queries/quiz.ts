import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { QuizSettings, Question, QuizAttempt } from '@/types/models'

export const quizKeys = {
  all: ['quiz'] as const,
  settings: (lessonId: string) => [...quizKeys.all, 'settings', lessonId] as const,
  questions: (lessonId: string) => [...quizKeys.all, 'questions', lessonId] as const,
  attempts: (lessonId: string) => [...quizKeys.all, 'attempts', lessonId] as const,
}

export function useQuizSettings(lessonId: string) {
  return useQuery({
    queryKey: quizKeys.settings(lessonId),
    queryFn: () => api.get<QuizSettings>(`/lessons/${lessonId}/quiz/settings`).then((r) => r.data),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useQuizQuestions(lessonId: string) {
  return useQuery({
    queryKey: quizKeys.questions(lessonId),
    queryFn: () => api.get<Question[]>(`/lessons/${lessonId}/quiz/questions`).then((r) => r.data),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useQuizAttempts(lessonId: string) {
  return useQuery({
    queryKey: quizKeys.attempts(lessonId),
    queryFn: () => api.get<QuizAttempt[]>(`/lessons/${lessonId}/quiz/attempts`).then((r) => r.data),
    enabled: !!lessonId,
  })
}
