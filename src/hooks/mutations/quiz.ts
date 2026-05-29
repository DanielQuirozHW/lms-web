import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { QuizAttempt, QuizAttemptResult } from '@/types/models'
import { quizKeys } from '@/hooks/queries/quiz'

export interface SubmitAnswerPayload {
  questionId: string
  selectedOptionId?: string | null
  selectedOptionIds?: string[] | null
  textAnswer?: string | null
}

export function useStartAttempt(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post<QuizAttempt>(`/lessons/${lessonId}/quiz/attempts`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.attempts(lessonId) })
    },
  })
}

export function useSubmitAttempt(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ attemptId, answers }: { attemptId: string; answers: SubmitAnswerPayload[] }) =>
      api
        .post<QuizAttemptResult>(`/lessons/${lessonId}/quiz/attempts/${attemptId}/submit`, {
          answers,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.attempts(lessonId) })
    },
  })
}
