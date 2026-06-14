/**
 * Bridge layer: re-exports types under the same names as models.ts, sourcing
 * from generated.ts where the shape is compatible.
 *
 * Migration tiers
 *   ✅ MAPPED   — generated type is shape-compatible; safe to migrate import
 *   ⚠  PARTIAL  — generated DTO exists but has structural differences:
 *                  (a) nullable fields are optional (field?: T | null) where
 *                      the manual type requires them (field: T | null), or
 *                  (b) extra/missing fields, or field name divergence
 *   ❌ MANUAL   — no generated equivalent
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
// ✅ MAPPED — UserResponseDto: avatarUrl: string | null (was Record<string, never>)
export type User = components['schemas']['UserResponseDto']
// ✅ MAPPED — UserPublicResponseDto: avatarUrl: string | null (was Record<string, never>)
export type PublicUser = components['schemas']['UserPublicResponseDto']

// ─── Category ─────────────────────────────────────────────────────────────────
// ✅ MAPPED — CategoryResponseDto: { id, name, slug } — exact match
export type Category = components['schemas']['CategoryResponseDto']

// ─── Course ───────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — CourseResponseDto.description, coverUrl, price, categoryId are
//             optional (field?: T | null) vs required (field: T | null) in manual
// ❌ MANUAL — CatalogCourse and CoursesFilter are frontend-only composite types
export type { Course, CourseDetail, CatalogCourse, CoursesFilter } from './models'

// ⚠ PARTIAL — EnrollmentCodeResponseDto.maxUses and expiresAt are optional
//             vs required nullable in manual type
export type { EnrollmentCode } from './models'

// ─── Module ───────────────────────────────────────────────────────────────────
// ✅ MAPPED — ModuleResponseDto: description and unlockAfterDays are now required
//             (string | null and number | null) — exact match
export type CourseModule = components['schemas']['ModuleResponseDto']

// ⚠ PARTIAL — ModuleDetailResponseDto.lessons uses LessonSummaryDto which has
//             duration?: number | null (optional) vs required in LessonSummary
export type { CourseModuleDetail } from './models'

// ─── Lesson ───────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — LessonSummaryDto.duration is optional (duration?: number | null)
//             vs required (duration: number | null) in manual type
export type { LessonSummary } from './models'

// ✅ MAPPED — LessonResponseDto: content, videoUrl, duration are now all required
//             nullable (field: T | null) — exact match
export type Lesson = components['schemas']['LessonResponseDto']

// ⚠ PARTIAL — LessonDetailResponseDto.quizSettings and assignmentSettings are
//             optional; QuizSettingsDto lacks lessonId; AssignmentSettingsDto
//             lacks isGroupAssignment, groupId, maxAttempts
export type { LessonDetail } from './models'

// ✅ MAPPED — LessonResourceDto: { id, title, url, type, createdAt } — exact match
export type LessonResource = components['schemas']['LessonResourceDto']

// ✅ MAPPED — LessonProgressResponseDto: startedAt, completedAt, lastWatchedAt,
//             watchedSeconds are now all required nullable — exact match
export type LessonProgress = components['schemas']['LessonProgressResponseDto']

// ─── Enrollment ───────────────────────────────────────────────────────────────
// ✅ MAPPED — EnrollmentResponseDto: completedAt is now required nullable — exact match
export type Enrollment = components['schemas']['EnrollmentResponseDto']

// ⚠ PARTIAL — ProgressSummaryDto.finalGrade and status are still optional;
//             adds completedLessonIds not in manual EnrollmentProgress
// ⚠ PARTIAL — EnrollmentDetailResponseDto.progress uses ProgressSummaryDto above
export type { EnrollmentProgress, EnrollmentDetail } from './models'

// ─── Quiz ─────────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — QuizSettingsResponseDto.maxAttempts and passingScore are still
//             optional vs required nullable in manual type
export type { QuizSettings } from './models'

// ✅ MAPPED — QuestionOptionResponseDto: { id, text, order, isCorrect? }
//             isCorrect?: boolean | null in generated vs boolean in manual — compatible
export type QuestionOption = components['schemas']['QuestionOptionResponseDto']

// ✅ MAPPED — QuestionResponseDto matches (uses QuestionOptionResponseDto for options)
export type Question = components['schemas']['QuestionResponseDto']

// ⚠ PARTIAL — AttemptSummaryDto.score, completedAt, passed are still optional
//             vs required nullable in manual QuizAttempt type
// ⚠ PARTIAL — AttemptAnswerDto.selectedOptionId, textAnswer, isCorrect are still
//             optional vs required nullable in manual QuizAnswer type
export type { QuizAttempt, QuizAnswer, QuizAttemptResult } from './models'

// ─── Assignment ───────────────────────────────────────────────────────────────
// ⚠ PARTIAL — AssignmentSettingsResponseDto.passingScore, dueDate, groupId,
//             maxAttempts are still optional vs required nullable in manual type
// ⚠ PARTIAL — SubmissionResponseDto.fileUrl, grade, feedback, gradedById,
//             gradedAt, groupId are still optional vs required nullable in manual
export type { AssignmentSettings, Submission } from './models'

// ─── Rubric ───────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — RubricLevelResponseDto: extra criterionId field; description still optional
// ⚠ PARTIAL — RubricCriterionResponseDto: extra rubricId field; description still optional
// ⚠ PARTIAL — RubricResponseDto: description still optional; criteria required vs optional
// ⚠ PARTIAL — RubricAssessmentAnswerResponseDto: extra assessmentId; levelId is
//             optional string | null vs required string; comment still optional
// ⚠ PARTIAL — RubricAssessmentResponseDto: uses assessedAt instead of createdAt/updatedAt
export type {
  RubricLevel,
  RubricCriterion,
  Rubric,
  RubricAssessmentAnswer,
  RubricAssessment,
} from './models'

// ─── Gradebook ────────────────────────────────────────────────────────────────
// ✅ MAPPED — GradebookItemResponseDto: weight is now required (number | null) — exact match
export type GradebookItem = components['schemas']['GradebookItemResponseDto']
// ✅ MAPPED — GradebookCategoryResponseDto: exact match (items uses GradebookItemResponseDto)
export type GradebookCategory = components['schemas']['GradebookCategoryResponseDto']
// ✅ MAPPED — GradebookResponseDto: exact match (categories uses GradebookCategoryResponseDto)
export type Gradebook = components['schemas']['GradebookResponseDto']

// ─── Groups ───────────────────────────────────────────────────────────────────
// ✅ MAPPED — GroupResponseDto: description and maxMembers are now required nullable — exact match
export type CourseGroup = components['schemas']['GroupResponseDto']
// ✅ MAPPED — GroupMemberResponseDto: { id, groupId, userId, joinedAt } — exact match
export type GroupMember = components['schemas']['GroupMemberResponseDto']

// ─── Forum ────────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — ThreadResponseDto.courseId is still optional (courseId?: string | null)
//             vs required (courseId: string | null) in manual type
// ⚠ PARTIAL — PostResponseDto.parentId is still optional vs required nullable
export type { ForumThread, ForumPost, ForumThreadDetail } from './models'

// ─── Messages ─────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — MessageResponseDto.readAt is still optional vs required nullable
// ❌ MANUAL — Conversation has no generated equivalent
export type { Message, Conversation } from './models'

// ─── Notifications ────────────────────────────────────────────────────────────
// ⚠ PARTIAL — NotificationResponseDto.referenceId and referenceType are still
//             optional vs required nullable in manual type
export type { Notification } from './models'

// ─── Ratings ─────────────────────────────────────────────────────────────────
// ⚠ PARTIAL — RatingResponseDto.review is still optional vs required nullable
export type { CourseRating } from './models'

// ✅ MAPPED — RatingSummaryDto: { averageScore, totalRatings, scale } — exact match
export type RatingSummary = components['schemas']['RatingSummaryDto']

// ─── Announcements ────────────────────────────────────────────────────────────
// ✅ MAPPED — AnnouncementResponseDto: { id, courseId, instructorId, title, body, createdAt, updatedAt }
export type Announcement = components['schemas']['AnnouncementResponseDto']

// ─── Calendar ─────────────────────────────────────────────────────────────────
// ✅ MAPPED — CalendarEventResponseDto: all previously Record<string, never> fields
//             (courseId, description, endDate, color, referenceId, referenceType)
//             are now properly typed as required nullable — exact match
export type CalendarEvent = components['schemas']['CalendarEventResponseDto']

// ─── Certificates ─────────────────────────────────────────────────────────────
// ✅ MAPPED — CertificateResponseDto: finalGrade is now required (number | null);
//             course/instructor use nested DTOs matching manual shape — exact match
export type Certificate = components['schemas']['CertificateResponseDto']

// ─── Lesson Notes ─────────────────────────────────────────────────────────────
// ✅ MAPPED — NoteResponseDto: { id, lessonId, userId, content, createdAt, updatedAt }
export type LessonNote = components['schemas']['NoteResponseDto']

// ─── Bookmarks ────────────────────────────────────────────────────────────────
// ✅ MAPPED — BookmarkResponseDto: nested lesson structure matches manual type
// ✅ MAPPED — CheckBookmarkResponseDto: { isBookmarked: boolean }
export type Bookmark = components['schemas']['BookmarkResponseDto']
export type BookmarkCheck = components['schemas']['CheckBookmarkResponseDto']

// ─── Global Announcements ─────────────────────────────────────────────────────
// ✅ MAPPED — GlobalAnnouncementResponseDto: startsAt and endsAt are now required
//             (string | null) — exact match
export type GlobalAnnouncement = components['schemas']['GlobalAnnouncementResponseDto']

// ─── Maintenance ──────────────────────────────────────────────────────────────
// ✅ MAPPED — MaintenanceResponseDto: { isEnabled, message: string | null,
//             estimatedEnd: string | null } — exact match
export type MaintenanceStatus = components['schemas']['MaintenanceResponseDto']

// ─── Student Grades ───────────────────────────────────────────────────────────
// ✅ MAPPED — ItemGradeDto: rawScore and percentageScore are now required nullable — exact match
export type StudentGradeItem = components['schemas']['ItemGradeDto']
// ✅ MAPPED — CategoryGradeDto: categoryScore now required; items uses ItemGradeDto — exact match
export type StudentGradeCategory = components['schemas']['CategoryGradeDto']
// ✅ MAPPED — StudentGradeResponseDto: finalGrade now required; categories uses CategoryGradeDto
export type StudentGrade = components['schemas']['StudentGradeResponseDto']
