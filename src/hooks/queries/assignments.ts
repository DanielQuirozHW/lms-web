import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type { AssignmentSettings, Submission } from '@/types/models'

// Extends Submission with instructor-visible student data
export interface SubmissionWithStudent extends Submission {
  student?: {
    firstName: string
    lastName: string
    email: string
    avatarUrl?: string | null
  } | null
}

export const assignmentKeys = {
  all: ['assignments'] as const,
  settings: (lessonId: string) => [...assignmentKeys.all, 'settings', lessonId] as const,
  // Student view (mine)
  submissions: (lessonId: string) => [...assignmentKeys.all, 'submissions', lessonId] as const,
  // Instructor view (all)
  allSubmissions: (lessonId: string) =>
    [...assignmentKeys.all, 'allSubmissions', lessonId] as const,
  submission: (lessonId: string, submissionId: string) =>
    [...assignmentKeys.all, 'submission', lessonId, submissionId] as const,
}

export function useAssignmentSettings(lessonId: string) {
  return useQuery({
    queryKey: assignmentKeys.settings(lessonId),
    queryFn: () =>
      api.get<AssignmentSettings>(`/lessons/${lessonId}/assignment/settings`).then((r) => r.data),
    enabled: !!lessonId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMySubmissions(lessonId: string) {
  return useQuery({
    queryKey: assignmentKeys.submissions(lessonId),
    queryFn: () =>
      api.get<Submission[]>(`/lessons/${lessonId}/assignment/submissions/mine`).then((r) => r.data),
    enabled: !!lessonId,
  })
}

// Instructor: all submissions for a lesson
export function useAllSubmissions(lessonId: string) {
  return useQuery({
    queryKey: assignmentKeys.allSubmissions(lessonId),
    queryFn: () =>
      api
        .get<SubmissionWithStudent[]>(`/lessons/${lessonId}/assignment/submissions`)
        .then((r) => r.data),
    enabled: !!lessonId,
  })
}

export function useSubmissionDetail(lessonId: string, submissionId: string) {
  return useQuery({
    queryKey: assignmentKeys.submission(lessonId, submissionId),
    queryFn: () =>
      api
        .get<Submission>(`/lessons/${lessonId}/assignment/submissions/${submissionId}`)
        .then((r) => r.data),
    enabled: !!lessonId && !!submissionId,
  })
}
