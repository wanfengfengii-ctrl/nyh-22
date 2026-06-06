import type { PointChangeType, CouponType, CampaignType, CampaignStatus, ReminderType } from './types'

export const pointChangeTypeOptions: { label: string; value: PointChangeType; isPositive: boolean }[] = [
  { label: '消费获得', value: 'earn_order', isPositive: true },
  { label: '注册赠送', value: 'earn_signup', isPositive: true },
  { label: '活动奖励', value: 'earn_activity', isPositive: true },
  { label: '生日赠送', value: 'earn_birthday', isPositive: true },
  { label: '兑换优惠券', value: 'spend_coupon', isPositive: false },
  { label: '兑换商品', value: 'spend_product', isPositive: false },
  { label: '活动报名', value: 'spend_activity', isPositive: false },
  { label: '调整', value: 'adjust', isPositive: false }
]

export const couponTypeOptions: { label: string; value: CouponType }[] = [
  { label: '折扣券', value: 'discount' },
  { label: '满减券', value: 'fixed_amount' },
  { label: '包邮券', value: 'free_shipping' },
  { label: '赠品券', value: 'gift' }
]

export const campaignTypeOptions: { label: string; value: CampaignType }[] = [
  { label: '促销活动', value: 'promotion' },
  { label: '会员日', value: 'membership_day' },
  { label: '节日活动', value: 'festival' },
  { label: '新品发布', value: 'new_product' },
  { label: '周年庆', value: 'anniversary' }
]

export const campaignStatusOptions: { label: string; value: CampaignStatus; color: string }[] = [
  { label: '草稿', value: 'draft', color: '#999' },
  { label: '进行中', value: 'active', color: '#18a058' },
  { label: '已结束', value: 'ended', color: '#2080f0' },
  { label: '已取消', value: 'cancelled', color: '#d03050' }
]

export const marketingReminderTypeOptions: { label: string; value: ReminderType }[] = [
  { label: '生日祝福', value: 'birthday' },
  { label: '节日问候', value: 'festival' },
  { label: '会员日提醒', value: 'member_day' },
  { label: '优惠券即将过期', value: 'coupon_expire' },
  { label: '活动提醒', value: 'activity_reminder' }
]
