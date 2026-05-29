import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Submission, AssignmentSettings, GradingType } from '@/types/models'
import { assignmentKeys } from '@/hooks/queries/assignments'

// ─── Instructor mutations ─────────────────────────────────────────────────────

interface UpsertAssignmentSettingsPayload {
  gradingType?: GradingType
  maxScore?: number
  passingScore?: number | null
  dueDate?: string | null
  allowLateSubmission?: boolean
  maxAttempts?: number | null
}

export function useUpsertAssignmentSettings(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpsertAssignmentSettingsPayload) =>
      api
        .post<AssignmentSettings>(`/lessons/${lessonId}/assignment/settings`, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.settings(lessonId) })
    },
  })
}

export function useGradeSubmission(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      submissionId,
      grade,
      feedback,
    }: {
      submissionId: string
      grade: number
      feedback?: string
    }) =>
      api
        .patch<Submission>(`/lessons/${lessonId}/assignment/submissions/${submissionId}/grade`, {
          grade,
          feedback,
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.allSubmissions(lessonId) })
    },
  })
}

interface SubmitAssignmentPayload {
  content: string
  fileUrl?: string | null
}

export function useSubmitAssignment(lessonId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubmitAssignmentPayload) =>
      api.post<Submission>(`/lessons/${lessonId}/assignment/submit`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.submissions(lessonId) })
    },
  })
}

export function useUploadAssignmentFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      // Axios auto-sets multipart/form-data with boundary from FormData
      const r = await api.post<{ url: string }>('/upload/assignment-file', form)
      return r.data.url
    },
  })
}
