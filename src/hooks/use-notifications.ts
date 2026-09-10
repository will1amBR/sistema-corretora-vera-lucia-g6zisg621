import { useEffect, useState, useCallback, useRef } from 'react'
import { toast } from '@/hooks/use-toast'
import useRealtime from '@/hooks/use-realtime'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
} from '@/services/notifications'
import type { AppNotification } from '@/types'

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const isInitialLoadRef = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const res = await getNotifications(30)
      setNotifications(res.items)
      setUnreadCount(res.items.filter((n) => !n.read).length)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh().then(() => {
      // Allow toasts on events arriving after initial fetch
      setTimeout(() => {
        isInitialLoadRef.current = false
      }, 1000)
    })
  }, [refresh])

  // Realtime subscription to the 'notifications' collection
  useRealtime<AppNotification>(
    'notifications',
    useCallback((data) => {
      if (data.action === 'create') {
        const newNotif = data.record
        setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)])
        setUnreadCount((c) => c + 1)

        // Show floating toast to Vera in real-time
        toast({
          title: newNotif.title,
          description: newNotif.message,
        })
      } else if (data.action === 'update') {
        setNotifications((prev) => prev.map((n) => (n.id === data.record.id ? data.record : n)))
        setNotifications((updated) => {
          setUnreadCount(updated.filter((n) => !n.read).length)
          return updated
        })
      } else if (data.action === 'delete') {
        setNotifications((prev) => prev.filter((n) => n.id !== data.record.id))
        setNotifications((updated) => {
          setUnreadCount(updated.filter((n) => !n.read).length)
          return updated
        })
      }
    }, []),
  )

  const markAsRead = async (id: string) => {
    try {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
      await markNotificationAsRead(id)
    } catch (err) {
      console.error('Failed to mark notification read:', err)
      refresh()
    }
  }

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
      await markAllNotificationsAsRead()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      refresh()
    }
  }

  const clearAll = async () => {
    try {
      setNotifications([])
      setUnreadCount(0)
      await clearAllNotifications()
    } catch (err) {
      console.error('Failed to clear notifications:', err)
      refresh()
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
    markAsRead,
    markAllAsRead,
    clearAll,
  }
}
