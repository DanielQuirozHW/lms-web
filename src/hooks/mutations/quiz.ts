import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  QuizAttempt,
  QuizAttemptResult,
  QuizSettings,
  Question,
  QuestionType,
} from '@/types/models'
import { quizKeys } from '@/hooks/queries/quiz'

// ─── Instructor mutations ─────────────────────────────────────────────────────

interface UpsertQuizSettingsPayload {
  maxAttempts?: number | null
  passingScore?: number | null
  blocksProgress?: boolean
  shuffleQuestions?: boolean
}

export function useUpsertQuizSettings(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpsertQuizSettingsPayload) =>
      api.post<QuizSettings>(`/lessons/${lessonId}/quiz/settings`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.settings(lessonId) })
    },
  })
}

export interface CreateQuestionPayload {
  text: string
  type: QuestionType
  points: number
  options?: { text: string; isCorrect: boolean }[]
}

export function useCreateQuestion(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateQuestionPayload) =>
      api.post<Question>(`/lessons/${lessonId}/quiz/questions`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.questions(lessonId) })
    },
  })
}

export function useUpdateQuestion(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      questionId,
      data,
    }: {
      questionId: string
      data: Partial<CreateQuestionPayload>
    }) =>
      api
        .patch<Question>(`/lessons/${lessonId}/quiz/questions/${questionId}`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.questions(lessonId) })
    },
  })
}

export function useDeleteQuestion(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (questionId: string) =>
      api.delete(`/lessons/${lessonId}/quiz/questions/${questionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.questions(lessonId) })
    },
  })
}

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
