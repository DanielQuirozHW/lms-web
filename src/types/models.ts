// ─── Enums (match backend exactly) ────────────────────────────────────────────

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
export type LessonType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT'
export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'SINGLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
export type GradingType = 'AUTOMATIC' | 'MANUAL'
export type RatingScale = 'STARS_5' | 'NUMERIC_10' | 'NUMERIC_100'
export type NotificationType =
  | 'ENROLLMENT'
  | 'NEW_LESSON'
  | 'FORUM_REPLY'
  | 'ASSIGNMENT_GRADED'
  | 'QUIZ_PASSED'
  | 'QUIZ_FAILED'
  | 'COURSE_COMPLETED'
  | 'ANNOUNCEMENT'
export type CalendarEventType =
  | 'ASSIGNMENT_DUE'
  | 'QUIZ_DUE'
  | 'LESSON_AVAILABLE'
  | 'COURSE_START'
  | 'COURSE_END'
  | 'CUSTOM'

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: UserRole[]
  avatarUrl: string | null
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface PublicUser {
  id: string
  firstName: string
  lastName: string
  avatarUrl: string | null
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  slug: string
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface Course {
  id: string
  title: string
  slug: string
  description: string | null
  coverUrl: string | null
  status: CourseStatus
  price: number | null
  instructorId: string
  categoryId: string | null
  createdAt: string
  updatedAt: string
}

export interface CourseDetail extends Course {
  lessonsCount: number
  enrollmentsCount: number
}

// ─── Module ───────────────────────────────────────────────────────────────────

export interface CourseModule {
  id: string
  courseId: string
  title: string
  description: string | null
  order: number
  isPublished: boolean
  unlockAfterDays: number | null
  createdAt: string
  updatedAt: string
}

export interface CourseModuleDetail extends CourseModule {
  lessons: LessonSummary[]
}

// ─── Lesson ───────────────────────────────────────────────────────────────────

export interface LessonSummary {
  id: string
  title: string
  order: number
  type: LessonType
  duration: number | null
  isPreview: boolean
  isPublished: boolean
}

export interface Lesson extends LessonSummary {
  moduleId: string
  content: string | null
  videoUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface LessonDetail extends Lesson {
  resources: LessonResource[]
  quizSettings: QuizSettings | null
  assignmentSettings: AssignmentSettings | null
}

export interface LessonResource {
  id: string
  title: string
  url: string
  type: string
  createdAt: string
}

export interface LessonProgress {
  id: string
  enrollmentId: string
  lessonId: string
  isLocked: boolean
  startedAt: string | null
  completedAt: string | null
  lastWatchedAt: string | null
  watchedSeconds: number | null
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  status: EnrollmentStatus
  completedAt: string | null
  enrolledAt: string
  updatedAt: string
}

export interface EnrollmentProgress {
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  finalGrade: number | null
  status: EnrollmentStatus
}

export interface EnrollmentDetail extends Enrollment {
  progress: EnrollmentProgress
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizSettings {
  id: string
  lessonId: string
  maxAttempts: number | null
  passingScore: number | null
  blocksProgress: boolean
  shuffleQuestions: boolean
}

export interface QuestionOption {
  id: string
  text: string
  order: number
  isCorrect?: boolean
}

export interface Question {
  id: string
  lessonId: string
  text: string
  type: QuestionType
  order: number
  points: number
  options: QuestionOption[]
}

export interface QuizAttempt {
  id: string
  lessonId: string
  enrollmentId: string
  attemptNumber: number
  score: number | null
  startedAt: string
  completedAt: string | null
  passed: boolean | null
}

export interface QuizAnswer {
  id: string
  questionId: string
  selectedOptionId: string | null
  textAnswer: string | null
  isCorrect: boolean | null
}

export interface QuizAttemptResult extends QuizAttempt {
  answers: QuizAnswer[]
}

// ─── Assignment ───────────────────────────────────────────────────────────────

export interface AssignmentSettings {
  id: string
  lessonId: string
  gradingType: GradingType
  maxScore: number
  passingScore: number | null
  dueDate: string | null
  allowLateSubmission: boolean
  isGroupAssignment: boolean
  groupId: string | null
  maxAttempts: number | null
}

export interface Submission {
  id: string
  enrollmentId: string
  lessonId: string
  content: string
  fileUrl: string | null
  submittedAt: string
  attemptNumber: number
  grade: number | null
  feedback: string | null
  gradedById: string | null
  gradedAt: string | null
  groupId: string | null
}

// ─── Rubric ───────────────────────────────────────────────────────────────────

export interface RubricLevel {
  id: string
  title: string
  description: string | null
  points: number
  order: number
}

export interface RubricCriterion {
  id: string
  title: string
  description: string | null
  order: number
  points: number
  levels: RubricLevel[]
}

export interface Rubric {
  id: string
  courseId: string
  title: string
  description: string | null
  totalPoints: number
  createdAt: string
  updatedAt: string
  criteria?: RubricCriterion[]
}

export interface RubricAssessmentAnswer {
  id: string
  criterionId: string
  levelId: string
  score: number
  comment: string | null
}

export interface RubricAssessment {
  id: string
  rubricId: string
  submissionId: string
  score: number
  assessorId: string
  createdAt: string
  updatedAt: string
  answers: RubricAssessmentAnswer[]
}

// ─── Gradebook ────────────────────────────────────────────────────────────────

export interface GradebookItem {
  id: string
  categoryId: string
  lessonId: string
  weight: number | null
  maxScore: number
  isExtraCredit: boolean
}

export interface GradebookCategory {
  id: string
  courseId: string
  name: string
  weight: number
  order: number
  items: GradebookItem[]
}

export interface Gradebook {
  courseId: string
  categories: GradebookCategory[]
  totalWeight: number
}

// ─── Global Announcements ─────────────────────────────────────────────────────

export type GlobalAnnouncementType = 'INFO' | 'WARNING' | 'MAINTENANCE' | 'SUCCESS'

export interface GlobalAnnouncement {
  id: string
  title: string
  message: string
  type: GlobalAnnouncementType
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

export interface MaintenanceStatus {
  isEnabled: boolean
  message: string | null
  estimatedEnd: string | null
}

export interface StudentGradeItem {
  itemId: string
  lessonId: string
  rawScore: number | null
  maxScore: number
  percentageScore: number | null
  isExtraCredit: boolean
}

export interface StudentGradeCategory {
  categoryId: string
  categoryName: string
  categoryWeight: number
  categoryScore: number | null
  items: StudentGradeItem[]
}

export interface StudentGrade {
  enrollmentId: string
  courseId: string
  finalGrade: number | null
  categories: StudentGradeCategory[]
}

// ─── Groups ───────────────────────────────────────────────────────────────────

export interface CourseGroup {
  id: string
  courseId: string
  name: string
  description: string | null
  maxMembers: number | null
  memberCount: number
  createdAt: string
  updatedAt: string
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  joinedAt: string
}

// ─── Forum ────────────────────────────────────────────────────────────────────

export interface ForumThread {
  id: string
  title: string
  authorId: string
  courseId: string | null
  isPinned: boolean
  isClosed: boolean
  postCount: number
  lastActivityAt: string
  createdAt: string
  updatedAt: string
}

export interface ForumPost {
  id: string
  threadId: string
  authorId: string
  content: string
  parentId: string | null
  isAcceptedAnswer: boolean
  voteScore: number
  createdAt: string
  updatedAt: string
}

export interface ForumThreadDetail extends ForumThread {
  posts: ForumPost[]
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  readAt: string | null
  createdAt: string
}

export interface Conversation {
  partnerId: string
  lastMessage: Message
  unreadCount: number
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  referenceId: string | null
  referenceType: string | null
  createdAt: string
}

// ─── Ratings ─────────────────────────────────────────────────────────────────

export interface CourseRating {
  id: string
  userId: string
  courseId: string
  score: number
  review: string | null
  createdAt: string
  updatedAt: string
}

export interface RatingSummary {
  averageScore: number
  totalRatings: number
  scale: RatingScale
}

// ─── Announcements ────────────────────────────────────────────────────────────

export interface Announcement {
  id: string
  courseId: string
  instructorId: string
  title: string
  body: string
  createdAt: string
  updatedAt: string
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string
  courseId: string | null
  userId: string
  title: string
  description: string | null
  type: CalendarEventType
  startDate: string
  endDate: string | null
  allDay: boolean
  color: string | null
  referenceId: string | null
  referenceType: string | null
  createdAt: string
  updatedAt: string
}
