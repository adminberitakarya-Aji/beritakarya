const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

interface FailedAttempt {
  count: number
  lastAttempt: Date
}

const failedAttempts = new Map<string, FailedAttempt>()

export function checkAccountLockout(email: string): boolean {
  const attempt = failedAttempts.get(email)
  if (!attempt) return false
  
  const timeSinceLastAttempt = Date.now() - attempt.lastAttempt.getTime()
  if (timeSinceLastAttempt > LOCKOUT_DURATION) {
    failedAttempts.delete(email)
    return false
  }
  
  return attempt.count >= MAX_ATTEMPTS
}

export function recordFailedAttempt(email: string): void {
  const attempt = failedAttempts.get(email) || { count: 0, lastAttempt: new Date() }
  attempt.count++
  attempt.lastAttempt = new Date()
  failedAttempts.set(email, attempt)
}

export function resetFailedAttempts(email: string): void {
  failedAttempts.delete(email)
}