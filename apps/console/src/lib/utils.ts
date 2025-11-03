import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export const defaultOrganizationLogo = `https://www.flintapi.io/icon.png`

export const generateWebhookSecret = () => {
  const prefix = 'whs_'
  const random = crypto.randomUUID().replace(/-/g, '').substring(prefix.length)

  return `${prefix}${random}`
}
