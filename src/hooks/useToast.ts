import { useState, useEffect } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id, duration: toast.duration || 5000 }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id)
    }, newToast.duration)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const toast = {
    success: (title: string, description?: string) => {
      addToast({ title, description, variant: 'default' })
    },
    error: (title: string, description?: string) => {
      addToast({ title, description, variant: 'destructive' })
    },
    info: (title: string, description?: string) => {
      addToast({ title, description, variant: 'default' })
    }
  }

  return { toasts, toast, removeToast }
}
