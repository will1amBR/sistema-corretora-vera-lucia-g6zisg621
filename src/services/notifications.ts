import pb from '@/lib/pocketbase/client'
import type { AppNotification } from '@/types'

export async function getNotifications(limit = 30) {
  return await pb.collection('notifications').getList<AppNotification>(1, limit, {
    sort: '-created',
  })
}

export async function markNotificationAsRead(id: string) {
  return await pb.collection('notifications').update<AppNotification>(id, { read: true })
}

export async function markAllNotificationsAsRead() {
  const unreadList = await pb.collection('notifications').getFullList<AppNotification>({
    filter: 'read = false',
  })
  await Promise.all(
    unreadList.map((item) =>
      pb
        .collection('notifications')
        .update(item.id, { read: true })
        .catch(() => {}),
    ),
  )
}

export async function clearAllNotifications() {
  const all = await pb.collection('notifications').getFullList<AppNotification>({
    fields: 'id',
  })
  await Promise.all(
    all.map((item) =>
      pb
        .collection('notifications')
        .delete(item.id)
        .catch(() => {}),
    ),
  )
}
