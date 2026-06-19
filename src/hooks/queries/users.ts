import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import type {
  User,
  OverallProgressStats,
  StreakStats,
  LastActiveLessonStats,
  DailyActivity,
} from '@/types/models'
import type { PaginatedData } from '@/types/api'

export const userKeys = {
  all: ['users'] as const,
  list: (page: number, limit: number) => [...userKeys.all, 'list', page, limit] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  overallProgress: () => ['users', 'me', 'stats', 'overall-progress'] as const,
  streak: () => ['users', 'me', 'stats', 'streak'] as const,
  lastActiveLesson: () => ['users', 'me', 'stats', 'last-active-lesson'] as const,
  weeklyActivity: () => ['users', 'me', 'stats', 'weekly-activity'] as const,
}

export function useUsers(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: userKeys.list(page, limit),
    queryFn: () =>
      api.get<PaginatedData<User>>('/users', { params: { page, limit } }).then((r) => r.data),
    staleTime: 60 * 1000,
  })
}

export function useOverallProgressStats() {
  return useQuery({
    queryKey: userKeys.overallProgress(),
    queryFn: () =>
      api.get<OverallProgressStats>('/users/me/stats/overall-progress').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useStreakStats() {
  return useQuery({
    queryKey: userKeys.streak(),
    queryFn: () => api.get<StreakStats>('/users/me/stats/streak').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLastActiveLessonStats() {
  return useQuery({
    queryKey: userKeys.lastActiveLesson(),
    queryFn: () =>
      api.get<LastActiveLessonStats>('/users/me/stats/last-active-lesson').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useWeeklyActivity() {
  return useQuery({
    queryKey: userKeys.weeklyActivity(),
    queryFn: () => api.get<DailyActivity[]>('/users/me/stats/weekly-activity').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
