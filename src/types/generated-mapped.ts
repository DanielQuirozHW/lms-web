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
// ✅ MAPPED — CourseResponseDto: description, coverUrl, price, categoryId,
//             enrollmentPeriodStart/End are now all required nullable — exact match
//             (enrollmentPeriodStart/End were optional in manual; required is stricter, OK)
export type Course = components['schemas']['CourseResponseDto']
// ✅ MAPPED — CourseDetailResponseDto: extends Course + lessonsCount + enrollmentsCount
export type CourseDetail = components['schemas']['CourseDetailResponseDto']

// ❌ MANUAL — CatalogCourse and CoursesFilter are frontend-only composite types
export type { CatalogCourse, CoursesFilter } from './models'

// ✅ MAPPED — EnrollmentCodeResponseDto: maxUses and expiresAt are now required nullable
export type EnrollmentCode = components['schemas']['EnrollmentCodeResponseDto']

// ─── Module ───────────────────────────────────────────────────────────────────
// ✅ MAPPED — ModuleResponseDto: description and unlockAfterDays are now required
//             (string | null and number | null) — exact match
export type CourseModule = components['schemas']['ModuleResponseDto']

// ✅ MAPPED — LessonSummaryDto.duration is now required (number | null) — exact match
export type LessonSummary = components['schemas']['LessonSummaryDto']

// ✅ MAPPED — ModuleDetailResponseDto: uses updated LessonSummaryDto (duration required)
export type CourseModuleDetail = components['schemas']['ModuleDetailResponseDto']

// ─── Lesson ───────────────────────────────────────────────────────────────────
// ✅ MAPPED — LessonResponseDto: content, videoUrl, duration are all required nullable
export type Lesson = components['schemas']['LessonResponseDto']

// ✅ MAPPED — LessonDetailResponseDto: quizSettings uses LessonQuizSettingsDto (now has
//             lessonId) and assignmentSettings uses LessonAssignmentSettingsDto (now has
//             isGroupAssignment, groupId, maxAttempts) — both structurally identical to
//             QuizSettingsResponseDto and AssignmentSettingsResponseDto respectively
export type LessonDetail = components['schemas']['LessonDetailResponseDto']

// ✅ MAPPED — LessonResourceDto: { id, title, url, type, createdAt } — exact match
export type LessonResource = components['schemas']['LessonResourceDto']

// ✅ MAPPED — LessonProgressResponseDto: startedAt, completedAt, lastWatchedAt,
//             watchedSeconds are now all required nullable — exact match
export type LessonProgress = components['schemas']['LessonProgressResponseDto']

// ─── Enrollment ───────────────────────────────────────────────────────────────
// ✅ MAPPED — EnrollmentResponseDto: completedAt is now required nullable — exact match
export type Enrollment = components['schemas']['EnrollmentResponseDto']

// ✅ MAPPED — ProgressSummaryDto: finalGrade and status are now required; has extra
//             completedLessonIds: string[] field (additive, structurally compatible)
export type EnrollmentProgress = components['schemas']['ProgressSummaryDto']

// ✅ MAPPED — EnrollmentDetailResponseDto: progress uses ProgressSummaryDto (now MAPPED)
export type EnrollmentDetail = components['schemas']['EnrollmentDetailResponseDto']

// ─── Quiz ─────────────────────────────────────────────────────────────────────
// ✅ MAPPED — QuizSettingsResponseDto: maxAttempts and passingScore are now required
//             nullable; lessonId present — exact match
export type QuizSettings = components['schemas']['QuizSettingsResponseDto']

// ✅ MAPPED — QuestionOptionResponseDto: { id, text, order, isCorrect? } — exact match
export type QuestionOption = components['schemas']['QuestionOptionResponseDto']

// ✅ MAPPED — QuestionResponseDto matches (uses QuestionOptionResponseDto for options)
export type Question = components['schemas']['QuestionResponseDto']

// ✅ MAPPED — AttemptSummaryDto: score, completedAt, passed are now required nullable
export type QuizAttempt = components['schemas']['AttemptSummaryDto']
// ✅ MAPPED — AttemptAnswerDto: selectedOptionId, textAnswer, isCorrect now required nullable
export type QuizAnswer = components['schemas']['AttemptAnswerDto']
// ✅ MAPPED — AttemptResultDto: extends AttemptSummaryDto + answers: AttemptAnswerDto[]
export type QuizAttemptResult = components['schemas']['AttemptResultDto']

// ─── Assignment ───────────────────────────────────────────────────────────────
// ✅ MAPPED — AssignmentSettingsResponseDto: passingScore, dueDate, groupId,
//             maxAttempts are now all required nullable — exact match
export type AssignmentSettings = components['schemas']['AssignmentSettingsResponseDto']

// ✅ MAPPED — SubmissionResponseDto: fileUrl, grade, feedback, gradedById,
//             gradedAt, groupId are now all required nullable — exact match
export type Submission = components['schemas']['SubmissionResponseDto']

// ─── Rubric ───────────────────────────────────────────────────────────────────
// ✅ MAPPED — RubricLevelResponseDto: description is now required nullable;
//             extra criterionId field is additive (structurally compatible)
export type RubricLevel = components['schemas']['RubricLevelResponseDto']

// ✅ MAPPED — RubricCriterionResponseDto: description is now required nullable;
//             extra rubricId field is additive (structurally compatible)
export type RubricCriterion = components['schemas']['RubricCriterionResponseDto']

// ✅ MAPPED — RubricResponseDto: description is now required nullable; criteria is
//             now required array (was optional in manual — stricter is OK)
export type Rubric = components['schemas']['RubricResponseDto']

// ✅ MAPPED — RubricAssessmentAnswerResponseDto: comment is now required nullable;
//             levelId is string | null (backend correction — null for open-ended questions);
//             extra assessmentId field is additive (structurally compatible)
//             Note: models.ts updated to align levelId: string → string | null
export type RubricAssessmentAnswer = components['schemas']['RubricAssessmentAnswerResponseDto']

// ✅ MAPPED — RubricAssessmentResponseDto: uses assessedAt (single timestamp) — models.ts
//             updated to align (removed createdAt/updatedAt, added assessedAt + feedback)
export type RubricAssessment = components['schemas']['RubricAssessmentResponseDto']

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
// ✅ MAPPED — ThreadResponseDto: courseId is now required nullable — exact match
export type ForumThread = components['schemas']['ThreadResponseDto']

// ✅ MAPPED — PostResponseDto: parentId is now required nullable — exact match
export type ForumPost = components['schemas']['PostResponseDto']

// ✅ MAPPED — ThreadDetailResponseDto: extends ThreadResponseDto + posts array
export type ForumThreadDetail = components['schemas']['ThreadDetailResponseDto']

// ─── Messages ─────────────────────────────────────────────────────────────────
// ✅ MAPPED — MessageResponseDto: readAt is now required nullable — exact match
export type Message = components['schemas']['MessageResponseDto']

// ❌ MANUAL — Conversation has no generated equivalent
export type { Conversation } from './models'

// ─── Notifications ────────────────────────────────────────────────────────────
// ✅ MAPPED — NotificationResponseDto: referenceId and referenceType are now
//             required nullable — exact match
export type Notification = components['schemas']['NotificationResponseDto']

// ─── Ratings ─────────────────────────────────────────────────────────────────
// ✅ MAPPED — RatingResponseDto: review is now required nullable — exact match
export type CourseRating = components['schemas']['RatingResponseDto']

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
