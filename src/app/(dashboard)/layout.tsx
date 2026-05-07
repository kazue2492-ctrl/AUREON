'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import ChatBot from '@/components/ChatBot'
import { AccountThemeProvider } from '@/components/AccountThemeProvider'
import { initializeData } from '@/lib/data'
import { apiFetch, getToken, setUser, type AuthUser } from '@/lib/clientAuth'

const SIDEBAR_STORAGE_KEY = 'walletHubSidebarExpanded'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login')
      return
    }

    let cancelled = false

    apiFetch<AuthUser>('/api/auth/me')
      .then((me) => {
        if (cancelled) return
        setUser(me)
        if (!me.setupCompleted) {
          router.replace('/setup')
          return
        }

        initializeData()
          .then(() => window.dispatchEvent(new Event('profileUpdated')))
          .catch(console.error)
        setReady(true)
      })
      .catch((err) => {
        console.error('auth check failed', err)
      })

    return () => { cancelled = true }
  }, [router])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (saved !== null) setSidebarExpanded(saved === 'true')
    } catch {}

    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ expanded: boolean }>).detail
      if (detail && typeof detail.expanded === 'boolean') {
        setSidebarExpanded(detail.expanded)
      }
    }
    window.addEventListener('sidebarToggled', onToggle)
    return () => window.removeEventListener('sidebarToggled', onToggle)
  }, [])

  if (!ready) return null

  return (
    <AccountThemeProvider>
      <div className="relative min-h-screen bg-mood-cream font-sans text-mood-ink transition-colors duration-300">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-mood-dots opacity-40" />
        <div
          className="pointer-events-none fixed inset-0 -z-10 transition-opacity"
          style={{
            background:
              'radial-gradient(circle at 18% 8%, rgba(var(--mood-glow-rgb), 0.07), transparent 45%), radial-gradient(circle at 92% 92%, rgba(var(--mood-shadow-rgb), 0.05), transparent 45%)',
          }}
        />
        <div className="flex min-h-screen">
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          <div
            className={`flex-1 transition-[margin-left] duration-300 ease-out ${
              sidebarExpanded ? 'lg:ml-64' : 'lg:ml-20'
            }`}
          >
            <main className="min-h-screen pb-24 lg:pb-8">
              {children}
            </main>
          </div>
          <div className="lg:hidden">
            <BottomNav />
          </div>
        </div>
        <ChatBot />
      </div>
    </AccountThemeProvider>
  )
}
