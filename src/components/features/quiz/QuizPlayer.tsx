'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { useQuizSettings, useQuizQuestions, useQuizAttempts } from '@/hooks/queries/quiz'
import { useStartAttempt, useSubmitAttempt } from '@/hooks/mutations/quiz'
import type { Question, QuizAttempt, QuizAttemptResult, QuizAnswer } from '@/types/models'
import type { SubmitAnswerPayload } from '@/hooks/mutations/quiz'

// ─── Answer types ─────────────────────────────────────────────────────────────

type UserAnswer =
  | { kind: 'option'; optionId: string }
  | { kind: 'options'; optionIds: string[] }
  | { kind: 'text'; text: string }

// ─── Helper ───────────────────────────────────────────────────────────────────

function isAnswered(answer: UserAnswer | undefined): boolean {
  if (!answer) return false
  if (answer.kind === 'options') return answer.optionIds.length > 0
  if (answer.kind === 'text') return answer.text.trim().length > 0
  return true
}

// ─── Question option card ─────────────────────────────────────────────────────

interface OptionCardProps {
  text: string
  selected: boolean
  correct?: boolean | null // shown in results review
  incorrect?: boolean | null
  disabled?: boolean
  onClick: () => void
}

function OptionCard({ text, selected, correct, incorrect, disabled, onClick }: OptionCardProps) {
  const reviewMode = correct !== undefined
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors',
        reviewMode
          ? correct
            ? 'border-nexus-success bg-nexus-success/10 text-nexus-text'
            : incorrect
              ? 'border-destructive bg-destructive/10 text-nexus-text'
              : 'border-nexus-border bg-nexus-card text-nexus-text opacity-60'
          : selected
            ? 'border-nexus-accent bg-nexus-accent-muted text-nexus-accent font-medium'
            : 'border-nexus-border bg-nexus-card text-nexus-text hover:border-nexus-accent/50 hover:text-nexus-text'
      )}
    >
      <span className="flex items-center gap-3">
        {reviewMode && correct && (
          <CheckCircle2 className="text-nexus-success h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        {reviewMode && incorrect && (
          <XCircle className="text-destructive h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        {text}
      </span>
    </button>
  )
}

// ─── Question renderer ────────────────────────────────────────────────────────

interface QuestionViewProps {
  question: Question
  answer: UserAnswer | undefined
  onAnswer: (answer: UserAnswer) => void
  disabled?: boolean
  reviewAnswers?: QuizAnswer[] // shown in results
}

function QuestionView({ question, answer, onAnswer, disabled, reviewAnswers }: QuestionViewProps) {
  const inReview = !!reviewAnswers
  const sortedOptions = [...question.options].sort((a, b) => a.order - b.order)

  // Results: group answers by optionId for quick lookup
  const reviewAnswerMap = new Map<string, QuizAnswer>()
  if (reviewAnswers) {
    for (const a of reviewAnswers) {
      if (a.selectedOptionId) reviewAnswerMap.set(a.selectedOptionId, a)
    }
  }

  if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') {
    const selectedIds =
      answer?.kind === 'option'
        ? [answer.optionId]
        : answer?.kind === 'options'
          ? answer.optionIds
          : []

    return (
      <div className="space-y-2">
        {sortedOptions.map((opt) => {
          const selected = selectedIds.includes(opt.id)
          let correct: boolean | null = null
          let incorrect: boolean | null = null
          if (inReview) {
            if (opt.isCorrect) correct = true
            else if (reviewAnswerMap.has(opt.id) && !opt.isCorrect) incorrect = true
          }

          return (
            <OptionCard
              key={opt.id}
              text={opt.text}
              selected={selected}
              correct={inReview ? correct : undefined}
              incorrect={inReview ? incorrect : undefined}
              disabled={disabled}
              onClick={() => {
                if (disabled) return
                if (question.type === 'SINGLE_CHOICE') {
                  onAnswer({ kind: 'option', optionId: opt.id })
                } else {
                  const current = answer?.kind === 'options' ? answer.optionIds : []
                  const newIds = current.includes(opt.id)
                    ? current.filter((id) => id !== opt.id)
                    : [...current, opt.id]
                  onAnswer({ kind: 'options', optionIds: newIds })
                }
              }}
            />
          )
        })}
      </div>
    )
  }

  if (question.type === 'TRUE_FALSE') {
    const selectedId = answer?.kind === 'option' ? answer.optionId : null
    return (
      <div className="grid grid-cols-2 gap-3">
        {sortedOptions.map((opt) => {
          const selected = selectedId === opt.id
          let correct: boolean | null = null
          let incorrect: boolean | null = null
          if (inReview) {
            if (opt.isCorrect) correct = true
            else if (reviewAnswerMap.has(opt.id) && !opt.isCorrect) incorrect = true
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onAnswer({ kind: 'option', optionId: opt.id })}
              className={cn(
                'rounded-xl border py-4 text-base font-semibold transition-colors',
                inReview
                  ? correct
                    ? 'border-nexus-success bg-nexus-success/10 text-nexus-success'
                    : incorrect
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-nexus-border text-nexus-muted opacity-60'
                  : selected
                    ? 'border-nexus-accent bg-nexus-accent-muted text-nexus-accent'
                    : 'border-nexus-border bg-nexus-card text-nexus-text hover:border-nexus-accent/50'
              )}
            >
              {opt.text}
            </button>
          )
        })}
      </div>
    )
  }

  // SHORT_TEXT or LONG_TEXT
  const textValue = answer?.kind === 'text' ? answer.text : ''
  const firstReviewAnswer = reviewAnswers?.[0]

  return (
    <div className="space-y-2">
      <textarea
        value={textValue}
        onChange={(e) => !disabled && onAnswer({ kind: 'text', text: e.target.value })}
        disabled={disabled}
        rows={question.type === 'LONG_TEXT' ? 6 : 3}
        placeholder="Escribí tu respuesta..."
        className={cn(
          'w-full resize-none rounded-xl border px-4 py-3 text-sm',
          'border-nexus-border bg-nexus-bg text-nexus-text',
          'placeholder:text-nexus-muted/60',
          'focus:border-nexus-accent focus:ring-nexus-accent/30 focus:ring-2 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-60',
          'transition-colors'
        )}
      />
      {inReview && firstReviewAnswer && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
            firstReviewAnswer.isCorrect === null
              ? 'bg-nexus-accent/10 text-nexus-accent'
              : firstReviewAnswer.isCorrect
                ? 'bg-nexus-success/10 text-nexus-success'
                : 'bg-destructive/10 text-destructive'
          )}
        >
          {firstReviewAnswer.isCorrect === null ? (
            <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ) : firstReviewAnswer.isCorrect ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          )}
          {firstReviewAnswer.isCorrect === null
            ? 'Pendiente de revisión'
            : firstReviewAnswer.isCorrect
              ? 'Correcta'
              : 'Incorrecta'}
        </div>
      )}
    </div>
  )
}

// ─── Cryptographically secure Fisher-Yates shuffle ───────────────────────────
// Math.random() is not CSPRNG-seeded and could allow an attacker with knowledge
// of engine internals to predict question order. crypto.getRandomValues() uses
// the OS CSPRNG, which is unpredictable.

function cryptoShuffle<T>(arr: T[]): T[] {
  const array = [...arr]
  for (let i = array.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    // Modulo bias is negligible for array sizes << 2^32
    const j = buf[0] % (i + 1)
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// ─── Main component ───────────────────────────────────────────────────────────

interface QuizPlayerProps {
  lessonId: string
  nextLessonHref: string | null
}

export function QuizPlayer({ lessonId, nextLessonHref }: QuizPlayerProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<'intro' | 'taking' | 'results'>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({})
  const [activeAttempt, setActiveAttempt] = useState<QuizAttempt | null>(null)
  const [result, setResult] = useState<QuizAttemptResult | null>(null)
  const [displayQuestionIds, setDisplayQuestionIds] = useState<string[] | null>(null)
  const [scoreBarWidth, setScoreBarWidth] = useState(0)

  const { data: settings, isLoading: settingsLoading } = useQuizSettings(lessonId)
  const { data: rawQuestions, isLoading: questionsLoading } = useQuizQuestions(lessonId)
  const { data: attempts } = useQuizAttempts(lessonId)
  const { mutate: startAttempt, isPending: isStarting } = useStartAttempt(lessonId)
  const { mutate: submitAttempt, isPending: isSubmitting } = useSubmitAttempt(lessonId)

  // Score bar animation on results mount
  useEffect(() => {
    if (phase === 'results' && result) {
      const timer = setTimeout(() => setScoreBarWidth(result.score ?? 0), 150)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [phase, result])

  const displayQuestions: Question[] = displayQuestionIds
    ? displayQuestionIds
        .map((id) => rawQuestions?.find((q) => q.id === id))
        .filter((q): q is Question => !!q)
    : (rawQuestions ?? [])

  const currentQuestion = displayQuestions[currentIndex]
  const totalQuestions = displayQuestions.length
  const attemptsUsed = attempts?.length ?? 0
  const maxAttempts = settings?.maxAttempts ?? null
  const canStart = maxAttempts === null || attemptsUsed < maxAttempts
  const allAnswered = displayQuestions.every((q) => isAnswered(answers[q.id]))
  const passingScore = settings?.passingScore ?? null
  const alreadyPassed = attempts?.some((a) => a.passed === true) ?? false

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (settingsLoading || questionsLoading) {
    return (
      <div className="border-nexus-border bg-nexus-card rounded-xl border p-6">
        <LoadingSpinner rows={3} />
      </div>
    )
  }

  if (!settings || !rawQuestions?.length) {
    return (
      <div className="border-nexus-border bg-nexus-card rounded-xl border p-8 text-center">
        <HelpCircle className="text-nexus-muted/30 mx-auto mb-3 h-10 w-10" aria-hidden="true" />
        <p className="text-nexus-text text-sm font-medium">Quiz no disponible</p>
        <p className="text-nexus-muted mt-1 text-xs">No hay preguntas configuradas.</p>
      </div>
    )
  }

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handleStart() {
    if (!settings || !rawQuestions) return
    startAttempt(undefined, {
      onSuccess: (attempt) => {
        if (settings.shuffleQuestions) {
          const shuffled = cryptoShuffle(rawQuestions).map((q) => q.id)
          setDisplayQuestionIds(shuffled)
        } else {
          setDisplayQuestionIds(null)
        }
        setActiveAttempt(attempt)
        setAnswers({})
        setCurrentIndex(0)
        setScoreBarWidth(0)
        setPhase('taking')
      },
      onError: () => toast.error('No se pudo iniciar el quiz'),
    })
  }

  function handleAnswer(questionId: string, answer: UserAnswer) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  function handleSubmit() {
    if (!activeAttempt) return

    const answerPayload: SubmitAnswerPayload[] = displayQuestions.map((q) => {
      const answer = answers[q.id]
      if (!answer) return { questionId: q.id, selectedOptionId: null, textAnswer: null }
      if (answer.kind === 'option') {
        return { questionId: q.id, selectedOptionId: answer.optionId, textAnswer: null }
      }
      if (answer.kind === 'options') {
        return {
          questionId: q.id,
          selectedOptionIds: answer.optionIds,
          selectedOptionId: null,
          textAnswer: null,
        }
      }
      return { questionId: q.id, selectedOptionId: null, textAnswer: answer.text }
    })

    submitAttempt(
      { attemptId: activeAttempt.id, answers: answerPayload },
      {
        onSuccess: (r) => {
          setResult(r)
          setScoreBarWidth(0)
          setPhase('results')
          if (r.passed) {
            toast.success('✓ Lección completada')
            router.refresh()
          }
        },
        onError: () => toast.error('No se pudo enviar el quiz. Intentá de nuevo.'),
      }
    )
  }

  function handleRetry() {
    setResult(null)
    setDisplayQuestionIds(null)
    setAnswers({})
    setCurrentIndex(0)
    setPhase('intro')
  }

  // ── Intro ────────────────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className="border-nexus-border bg-nexus-card space-y-6 rounded-xl border p-6">
        <div className="flex items-start gap-4">
          <div className="bg-nexus-accent/15 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            <HelpCircle className="text-nexus-accent h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-nexus-text text-lg font-bold">Quiz</h2>
            <p className="text-nexus-muted mt-1 text-sm">
              {totalQuestions} pregunta{totalQuestions !== 1 && 's'}
            </p>
          </div>
        </div>

        {!alreadyPassed && (
          <p className="text-nexus-muted text-sm">Aprobá el quiz para completar esta lección</p>
        )}

        {/* Settings summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Intentos',
              value: maxAttempts === null ? 'Ilimitados' : `${attemptsUsed} / ${maxAttempts}`,
            },
            {
              label: 'Nota mínima',
              value: passingScore !== null ? `${passingScore}%` : 'Sin nota mínima',
            },
            {
              label: 'Preguntas',
              value: settings.shuffleQuestions ? 'Aleatorias' : 'Ordenadas',
            },
          ].map(({ label, value }) => (
            <div key={label} className="border-nexus-border bg-nexus-bg rounded-lg border p-3">
              <p className="text-nexus-muted text-[10px] font-semibold tracking-wide uppercase">
                {label}
              </p>
              <p className="text-nexus-text mt-0.5 text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {/* Previous attempts */}
        {!!attempts?.length && (
          <div>
            <h3 className="text-nexus-text mb-2 text-sm font-semibold">Intentos anteriores</h3>
            <div className="divide-nexus-border border-nexus-border divide-y rounded-xl border">
              {attempts.map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    {attempt.passed === true ? (
                      <CheckCircle2 className="text-nexus-success h-4 w-4" aria-hidden="true" />
                    ) : attempt.passed === false ? (
                      <XCircle className="text-destructive h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Clock className="text-nexus-muted h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="text-nexus-text text-sm">
                      Intento #{attempt.attemptNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {attempt.score !== null && (
                      <span
                        className={cn(
                          'text-sm font-semibold tabular-nums',
                          attempt.passed === true
                            ? 'text-nexus-success'
                            : attempt.passed === false
                              ? 'text-destructive'
                              : 'text-nexus-muted'
                        )}
                      >
                        {attempt.score.toFixed(0)}%
                      </span>
                    )}
                    <span className="text-nexus-muted text-xs">
                      {formatDate(attempt.startedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start button */}
        <Button
          onClick={handleStart}
          disabled={!canStart || isStarting}
          className="bg-nexus-accent hover:bg-nexus-accent-hover w-full text-white"
        >
          {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {!canStart
            ? 'Límite de intentos alcanzado'
            : isStarting
              ? 'Iniciando...'
              : attemptsUsed > 0
                ? 'Intentar de nuevo'
                : 'Iniciar quiz'}
        </Button>
      </div>
    )
  }

  // ── Taking ───────────────────────────────────────────────────────────────────

  if (phase === 'taking' && currentQuestion) {
    const progress = ((currentIndex + 1) / totalQuestions) * 100
    const currentAnswer = answers[currentQuestion.id]
    const isFirst = currentIndex === 0
    const isLast = currentIndex === totalQuestions - 1

    return (
      <div className="border-nexus-border bg-nexus-card space-y-6 rounded-xl border p-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="text-nexus-muted flex items-center justify-between text-xs">
            <span>
              Pregunta {currentIndex + 1} de {totalQuestions}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="bg-nexus-border h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-nexus-accent h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Question */}
        <div>
          <p className="text-nexus-text text-lg leading-snug font-semibold">
            {currentQuestion.text}
          </p>
          {currentQuestion.points > 1 && (
            <p className="text-nexus-muted mt-1 text-xs">{currentQuestion.points} puntos</p>
          )}
        </div>

        {/* Answer options */}
        <QuestionView
          question={currentQuestion}
          answer={currentAnswer}
          onAnswer={(ans) => handleAnswer(currentQuestion.id, ans)}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => i - 1)}
            disabled={isFirst}
            className={cn('border-nexus-border text-nexus-muted', isFirst && 'invisible')}
          >
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
            Anterior
          </Button>

          {isLast ? (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isSubmitting ? 'Enviando...' : 'Enviar respuestas'}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="bg-nexus-accent hover:bg-nexus-accent-hover text-white"
            >
              Siguiente
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>

        {!allAnswered && isLast && (
          <p className="text-nexus-muted text-center text-xs">
            Respondé todas las preguntas para enviar.
          </p>
        )}
      </div>
    )
  }

  // ── Results ──────────────────────────────────────────────────────────────────

  if (phase === 'results' && result) {
    const passed = result.passed ?? false
    const score = result.score ?? 0
    const attemptsLeft = maxAttempts === null ? true : attemptsUsed < maxAttempts

    // Group answers by questionId
    const answersByQuestion = new Map<string, QuizAnswer[]>()
    for (const a of result.answers) {
      const existing = answersByQuestion.get(a.questionId) ?? []
      answersByQuestion.set(a.questionId, [...existing, a])
    }

    return (
      <div className="border-nexus-border bg-nexus-card space-y-6 rounded-xl border p-6">
        {/* Score */}
        <div className="text-center">
          <p className="text-5xl font-bold tabular-nums">
            <span className={passed ? 'text-nexus-success' : 'text-destructive'}>
              {score.toFixed(0)}
            </span>
            <span className="text-nexus-muted text-2xl">%</span>
          </p>

          <span
            className={cn(
              'mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold',
              passed
                ? 'bg-nexus-success/15 text-nexus-success'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {passed ? '¡Aprobado!' : 'No aprobado'}
          </span>

          {passingScore !== null && (
            <p className="text-nexus-muted mt-2 text-xs">Nota mínima: {passingScore}%</p>
          )}
        </div>

        {/* Score bar */}
        <div className="space-y-1">
          <div className="bg-nexus-border h-3 overflow-hidden rounded-full">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-1000',
                passed ? 'bg-nexus-success' : 'bg-destructive'
              )}
              style={{ width: `${scoreBarWidth}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Per-question review */}
        <div className="space-y-4">
          <h3 className="text-nexus-text text-sm font-semibold">Revisión de respuestas</h3>
          {displayQuestions.map((q, qi) => {
            const qAnswers = answersByQuestion.get(q.id) ?? []
            const anyCorrect = qAnswers.some((a) => a.isCorrect === true)
            const anyIncorrect = qAnswers.some((a) => a.isCorrect === false)
            const isPending = qAnswers.every((a) => a.isCorrect === null)

            return (
              <div
                key={q.id}
                className={cn(
                  'rounded-xl border p-4',
                  isPending
                    ? 'border-nexus-accent/40 bg-nexus-accent/5'
                    : anyCorrect && !anyIncorrect
                      ? 'border-nexus-success/40 bg-nexus-success/5'
                      : 'border-destructive/40 bg-destructive/5'
                )}
              >
                <div className="mb-3 flex items-start gap-2">
                  {isPending ? (
                    <HelpCircle
                      className="text-nexus-accent mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                  ) : anyCorrect && !anyIncorrect ? (
                    <CheckCircle2
                      className="text-nexus-success mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      className="text-destructive mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <p className="text-nexus-text text-sm font-medium">
                    {qi + 1}. {q.text}
                  </p>
                </div>

                <QuestionView
                  question={q}
                  answer={answers[q.id]}
                  onAnswer={() => {}}
                  disabled
                  reviewAnswers={qAnswers}
                />
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {attemptsLeft && (
            <Button
              variant="outline"
              onClick={handleRetry}
              className="border-nexus-border text-nexus-muted hover:text-nexus-text"
            >
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Intentar de nuevo
            </Button>
          )}
          {nextLessonHref && (
            <Link
              href={nextLessonHref}
              className={buttonVariants({
                className: 'bg-nexus-accent hover:bg-nexus-accent-hover text-white',
              })}
            >
              Siguiente lección
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    )
  }

  return null
}
