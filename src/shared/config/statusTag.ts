import type { LandscapeStatus, OrderStatus, TaskPriority, TaskStatus, VisitStatus, CouponStatus, CampaignStatus } from '@/types'

export interface StatusTagConfig {
  label: string
  type: 'success' | 'warning' | 'error' | 'info' | 'default'
  color?: string
}

export const landscapeStatusMap: Record<LandscapeStatus, StatusTagConfig> = {
  healthy: { label: '生长正常', type: 'success' },
  yellowing: { label: '出现黄化', type: 'warning' },
  mold: { label: '出现霉斑', type: 'error' },
  sold: { label: '已售出', type: 'default' }
}

export const orderStatusMap: Record<OrderStatus, StatusTagConfig> = {
  pending: { label: '待确认', type: 'error', color: '#d03050' },
  designing: { label: '设计中', type: 'warning', color: '#f0a020' },
  producing: { label: '制作中', type: 'success', color: '#18a058' },
  quality_check: { label: '质检中', type: 'info', color: '#2080f0' },
  ready: { label: '待交付', type: 'info', color: '#722ed1' },
  delivered: { label: '已交付', type: 'success', color: '#18a058' },
  cancelled: { label: '已取消', type: 'default', color: '#999' }
}

export const taskPriorityMap: Record<TaskPriority, StatusTagConfig> = {
  high: { label: '高优先级', type: 'error', color: '#d03050' },
  medium: { label: '中优先级', type: 'warning', color: '#f0a020' },
  low: { label: '低优先级', type: 'success', color: '#18a058' }
}

export const taskStatusMap: Record<TaskStatus, StatusTagConfig> = {
  pending: { label: '待处理', type: 'warning' },
  in_progress: { label: '进行中', type: 'info' },
  completed: { label: '已完成', type: 'success' }
}

export const visitStatusMap: Record<VisitStatus, StatusTagConfig> = {
  pending: { label: '待回访', type: 'warning' },
  in_progress: { label: '进行中', type: 'info' },
  completed: { label: '已完成', type: 'success' },
  cancelled: { label: '已取消', type: 'default' }
}

export const couponStatusMap: Record<CouponStatus, StatusTagConfig> = {
  active: { label: '进行中', type: 'success' },
  inactive: { label: '未激活', type: 'default' },
  expired: { label: '已过期', type: 'warning' }
}

export const campaignStatusMap: Record<CampaignStatus, StatusTagConfig> = {
  draft: { label: '草稿', type: 'default', color: '#999' },
  active: { label: '进行中', type: 'success', color: '#18a058' },
  ended: { label: '已结束', type: 'info', color: '#2080f0' },
  cancelled: { label: '已取消', type: 'error', color: '#d03050' }
}

export function getStatusLabel<T extends string>(map: Record<T, StatusTagConfig>, status: T): string {
  return map[status]?.label || status
}

export function getStatusType<T extends string>(map: Record<T, StatusTagConfig>, status: T): string {
  return map[status]?.type || 'default'
}

export function getStatusColor<T extends string>(map: Record<T, StatusTagConfig>, status: T): string | undefined {
  return map[status]?.color
}
