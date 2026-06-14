/**
 * Bridge layer: re-exports types under the same names as models.ts, sourcing
 * from generated.ts where the shape is compatible.
 *
 * Migration tiers
 *   ✅ MAPPED   — generated type is shape-compatible; safe to migrate import
 *   ⚠  PARTIAL  — generated DTO exists but nullable fields are typed as
 *                  Record<string, never> instead of the real type (openapi-
 *                  typescript v7 limitation). Manual type is more precise.
 *   ❌ MANUAL   — no generated equivalent; field naming diverges too much
 *
 * Do NOT modify models.ts or any component imports yet.
 * Once this file is verified, swap '@/types/models' → '@/types/generated-mapped'
 * one file at a time and confirm pnpm type-check passes.
 */

import type { components } from './generated'

// ─── Enums ────────────────────────────────────────────────────────────────────
// ❌ MANUAL — openapi-typescript v7 does not extract enum values as named types;
//             they are inlined in each DTO. All enums re-exported from models.ts.

export type {
  UserRole,
  CourseStatus,
  EnrollmentType,
  EnrollmentStatus,
  LessonType,
  QuestionType,
  GradingType,
  RatingScale,
  NotificationType,
  CalendarEventType,
  GlobalAnnouncementType,
} from './models'

// ─── User ─────────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — UserResponseDto.avatarUrl: Record<string, never> | null
//             (manual has string | null — more precise)
export type { User, PublicUser } from './models'

// ─── Category ─────────────────────────────────────────────────────────────────
// ✅ MAPPED — CategoryResponseDto: { id, name, slug } — exact match
export type Category = components['schemas']['CategoryResponseDto']

// ─── Course ───────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — CourseResponseDto is missing enrollmentType, enrollmentPeriodStart,
//             enrollmentPeriodEnd fields present in the manual type
export type { Course, CourseDetail, CatalogCourse, CoursesFilter } from './models'

// ⚠ PARTIAL — EnrollmentCodeResponseDto.maxUses: Record<string, never> | null
export type { EnrollmentCode } from './models'

// ─── Module ───────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — ModuleResponseDto.description and .unlockAfterDays are
//             Record<string, never> | null (manual has string | null, number | null)
export type { CourseModule, CourseModuleDetail } from './models'

// ─── Lesson ───────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — LessonSummaryDto.duration: Record<string, never>
// ⚠ PARTIAL — LessonResponseDto.content/videoUrl/duration: Record<string, never> | null
export type { LessonSummary, Lesson, LessonDetail } from './models'

// ✅ MAPPED — LessonResourceDto: { id, title, url, type, createdAt } — exact match
export type LessonResource = components['schemas']['LessonResourceDto']

// ⚠ PARTIAL — LessonProgressResponseDto nullable timestamps are Record<string, never>
export type { LessonProgress } from './models'

// ─── Enrollment ───────────────────────────────────────────────────────────────
// ⚠ PARTIAL — EnrollmentResponseDto.completedAt: Record<string, never> | null
// ⚠ PARTIAL — ProgressSummaryDto.finalGrade: Record<string, never> | null
//             (also adds completedLessonIds not present in manual EnrollmentProgress)
export type { Enrollment, EnrollmentProgress, EnrollmentDetail } from './models'

// ─── Quiz ─────────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — QuizSettingsResponseDto.maxAttempts/passingScore: Record<string, never>
export type { QuizSettings } from './models'

// ✅ MAPPED — QuestionOptionResponseDto: { id, text, order, isCorrect? }
//             isCorrect?: boolean | null in generated vs boolean in manual — compatible
export type QuestionOption = components['schemas']['QuestionOptionResponseDto']

// ✅ MAPPED — QuestionResponseDto matches (uses QuestionOptionResponseDto for options)
export type Question = components['schemas']['QuestionResponseDto']

// ⚠ PARTIAL — AttemptSummaryDto.score/completedAt/passed: Record<string, never> | null
// ⚠ PARTIAL — AttemptAnswerDto.selectedOptionId/textAnswer/isCorrect: Record<string, never>
export type { QuizAttempt, QuizAnswer, QuizAttemptResult } from './models'

// ─── Assignment ───────────────────────────────────────────────────────────────
// ⚠ PARTIAL — AssignmentSettingsResponseDto has Record<string, never> for nullable fields
// ⚠ PARTIAL — SubmissionResponseDto has Record<string, never> for nullable fields
export type { AssignmentSettings, Submission } from './models'

// ─── Rubric ───────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — RubricLevelResponseDto adds criterionId (not in manual); description is Record<string, never>
// ⚠ PARTIAL — RubricCriterionResponseDto adds rubricId (not in manual)
// ⚠ PARTIAL — RubricResponseDto.description: Record<string, never> | null; criteria always present
// ⚠ PARTIAL — RubricAssessmentAnswerResponseDto: uses pointsAwarded/feedback vs score/comment
// ⚠ PARTIAL — RubricAssessmentResponseDto: uses totalScore vs score
export type {
  RubricLevel,
  RubricCriterion,
  Rubric,
  RubricAssessmentAnswer,
  RubricAssessment,
} from './models'

// ─── Gradebook ────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — GradebookItemResponseDto.weight: Record<string, never> (manual: number | null)
// Keep GradebookCategory and Gradebook manual for consistency with GradebookItem
export type { GradebookItem, GradebookCategory, Gradebook } from './models'

// ─── Groups ───────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — GroupResponseDto.description/maxMembers: Record<string, never>
export type { CourseGroup } from './models'

// ✅ MAPPED — GroupMemberResponseDto: { id, groupId, userId, joinedAt } — exact match
export type GroupMember = components['schemas']['GroupMemberResponseDto']

// ─── Forum ────────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — ThreadResponseDto.courseId: Record<string, never> | null
// ⚠ PARTIAL — PostResponseDto.parentId: Record<string, never> | null
export type { ForumThread, ForumPost, ForumThreadDetail } from './models'

// ─── Messages ─────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — MessageResponseDto.readAt: Record<string, never> | null
// ❌ MANUAL — Conversation has no generated equivalent
export type { Message, Conversation } from './models'

// ─── Notifications ────────────────────────────────────────────────────────────
// ⚠ PARTIAL — NotificationResponseDto.referenceId/referenceType: Record<string, never> | null
export type { Notification } from './models'

// ─── Ratings ─────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — RatingResponseDto.review: Record<string, never> | null
export type { CourseRating } from './models'

// ✅ MAPPED — RatingSummaryDto: { averageScore, totalRatings, scale } — exact match
export type RatingSummary = components['schemas']['RatingSummaryDto']

// ─── Announcements ────────────────────────────────────────────────────────────
// ✅ MAPPED — AnnouncementResponseDto: { id, courseId, instructorId, title, body, createdAt, updatedAt }
export type Announcement = components['schemas']['AnnouncementResponseDto']

// ─── Calendar ─────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — CalendarEventResponseDto has many Record<string, never> fields
//             (courseId, description, endDate, color, referenceId, referenceType)
export type { CalendarEvent } from './models'

// ─── Certificates ─────────────────────────────────────────────────────────────
// ⚠ PARTIAL — CertificateResponseDto.finalGrade: Record<string, never> | null
export type { Certificate } from './models'

// ─── Lesson Notes ─────────────────────────────────────────────────────────────
// ⚠ PARTIAL — NoteResponseDto is missing userId field
export type { LessonNote } from './models'

// ─── Bookmarks ────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — BookmarkResponseDto is flat { lessonTitle, lessonType, moduleId, ... }
//             vs manual nested { lesson: { id, title, type, ... } }
// ❌ MANUAL — CheckBookmarkResponseDto uses `bookmarked` (manual uses `isBookmarked`)
export type { Bookmark, BookmarkCheck } from './models'

// ─── Global Announcements ─────────────────────────────────────────────────────
// ⚠ PARTIAL — GlobalAnnouncementResponseDto.startsAt/endsAt: Record<string, never> | null
export type { GlobalAnnouncement } from './models'

// ─── Maintenance ──────────────────────────────────────────────────────────────
// ⚠ PARTIAL — MaintenanceResponseDto uses `enabled` (manual uses `isEnabled`);
//             message is string (not string | null); estimatedEnd is string (not string | null)
export type { MaintenanceStatus } from './models'

// ─── Student Grades ───────────────────────────────────────────────────────────
// ⚠ PARTIAL — ItemGradeDto.rawScore/percentageScore: Record<string, never>
// ⚠ PARTIAL — CategoryGradeDto.categoryScore: Record<string, never>
// ⚠ PARTIAL — StudentGradeResponseDto.finalGrade: Record<string, never>
export type { StudentGradeItem, StudentGradeCategory, StudentGrade } from './models'
