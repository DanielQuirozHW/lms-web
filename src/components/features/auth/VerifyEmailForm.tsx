'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import api, { isApiError } from '@/lib/api'
import { cn } from '@/lib/utils'

const DIGIT_COUNT = 6
const RESEND_COOLDOWN = 60

export function VerifyEmailForm() {
  const router = useRouter()
  const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''))
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  // Auto-focus the first digit on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Countdown timer: decrements by 1 every second until 0
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  async function handleVerify(code: string) {
    if (isVerifying) return
    setIsVerifying(true)
    try {
      await api.post('/auth/verify-email', { code })
      toast.success('¡Email verificado!')
      router.push('/dashboard')
    } catch (error) {
      if (isApiError(error) && error.response?.data.statusCode === 400) {
        toast.error('Código inválido o expirado')
      } else {
        toast.error('Ocurrió un error. Intentá de nuevo.')
      }
      // Reset inputs so the user can try again
      setDigits(Array(DIGIT_COUNT).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)

    if (digit && index < DIGIT_COUNT - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when the last digit is filled
    if (digit && newDigits.every((d) => /^\d$/.test(d))) {
      void handleVerify(newDigits.join(''))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    // Move back on Backspace when the current input is already empty
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, DIGIT_COUNT)
    if (!pasted) return

    const newDigits = [...digits]
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i]
    }
    setDigits(newDigits)

    // Focus the last pasted position (or last input)
    inputRefs.current[Math.min(pasted.length, DIGIT_COUNT - 1)]?.focus()

    if (pasted.length === DIGIT_COUNT) {
      void handleVerify(pasted)
    }
  }

  async function handleResend() {
    setIsResending(true)
    try {
      await api.post('/auth/send-verification')
      setCountdown(RESEND_COOLDOWN)
      toast.success('Código reenviado')
    } catch {
      toast.error('No se pudo reenviar el código')
    } finally {
      setIsResending(false)
    }
  }

  const canResend = countdown === 0 && !isResending && !isVerifying

  return (
    <div className="space-y-6">
      {/* OTP digit inputs */}
      <div
        role="group"
        aria-label="Código de verificación de 6 dígitos"
        className="flex justify-center gap-2"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={isVerifying}
            aria-label={`Dígito ${index + 1} de ${DIGIT_COUNT}`}
            className={cn(
              'h-14 w-11 rounded-lg border text-center text-xl font-bold transition-colors',
              'border-nexus-border bg-nexus-card text-nexus-text',
              'focus:border-nexus-accent focus:ring-nexus-accent focus:ring-2 focus:outline-none',
              isVerifying && 'cursor-not-allowed opacity-50'
            )}
          />
        ))}
      </div>

      {/* Verifying indicator */}
      {isVerifying && (
        <div
          role="status"
          aria-live="polite"
          className="text-nexus-muted flex items-center justify-center gap-2"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="text-sm">Verificando...</span>
        </div>
      )}

      {/* Resend */}
      <div className="text-center">
        <p className="text-nexus-muted mb-2 text-sm">¿No recibiste el código?</p>
        <Button
          type="button"
          variant="ghost"
          onClick={handleResend}
          disabled={!canResend}
          className={cn(
            'text-sm',
            canResend
              ? 'text-nexus-accent hover:text-nexus-accent-hover hover:bg-nexus-card'
              : 'text-nexus-muted cursor-not-allowed'
          )}
        >
          {isResending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Enviando...
            </>
          ) : countdown > 0 ? (
            `Reenviar en ${countdown}s`
          ) : (
            'Reenviar código'
          )}
        </Button>
      </div>
    </div>
  )
}
