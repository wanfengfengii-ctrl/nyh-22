import type { CustomerSource, OrderStatus, ProductionStage, VisitStatus, RepurchaseIntention, MemberLevel } from './types'

export const customerSourceOptions = [
  { label: '老客户推荐', value: 'recommendation' },
  { label: '社交媒体', value: 'social_media' },
  { label: '线下门店', value: 'offline_store' },
  { label: '网络平台', value: 'online_platform' },
  { label: '展会活动', value: 'exhibition' },
  { label: '其他', value: 'other' }
]

export const orderStatusOptions = [
  { label: '待确认', value: 'pending', color: '#d03050' },
  { label: '设计中', value: 'designing', color: '#f0a020' },
  { label: '制作中', value: 'producing', color: '#18a058' },
  { label: '质检中', value: 'quality_check', color: '#2080f0' },
  { label: '待交付', value: 'ready', color: '#722ed1' },
  { label: '已交付', value: 'delivered', color: '#18a058' },
  { label: '已取消', value: 'cancelled', color: '#999' }
]

export const productionStageOptions = [
  { label: '需求确认', value: 'demand_confirm' },
  { label: '方案设计', value: 'design' },
  { label: '材料准备', value: 'material_prep' },
  { label: '主体制作', value: 'production' },
  { label: '组装调试', value: 'assembly' },
  { label: '质量检测', value: 'quality_check' },
  { label: '包装待发', value: 'packaging' }
]

export const visitStatusOptions = [
  { label: '待回访', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

export const repurchaseIntentionOptions = [
  { label: '高', value: 'high', color: '#d03050' },
  { label: '中', value: 'medium', color: '#f0a020' },
  { label: '低', value: 'low', color: '#18a058' },
  { label: '无', value: 'none', color: '#999' }
]

export const deliveryMethodOptions = [
  { label: '自提', value: 'self_pickup' },
  { label: '快递', value: 'express' },
  { label: '同城配送', value: 'local_delivery' }
]

export const paymentStatusOptions = [
  { label: '未付款', value: 'unpaid', color: '#d03050' },
  { label: '已付定金', value: 'deposit_paid', color: '#f0a020' },
  { label: '已付清', value: 'paid', color: '#18a058' }
]

export const visitTypeOptions = [
  { label: '电话回访', value: 'phone' },
  { label: '微信回访', value: 'wechat' },
  { label: '上门回访', value: 'onsite' }
]

export const taskTypeOptions = [
  { label: '交付回访', value: 'delivery_visit' },
  { label: '定期回访', value: 'periodic_visit' },
  { label: '投诉跟进', value: 'complaint_followup' }
]

export const budgetRangeOptions = [
  { label: '500元以下', min: 0, max: 500 },
  { label: '500-1000元', min: 500, max: 1000 },
  { label: '1000-2000元', min: 1000, max: 2000 },
  { label: '2000-5000元', min: 2000, max: 5000 },
  { label: '5000元以上', min: 5000, max: Infinity }
]

export const styleOptions = [
  '简约现代',
  '日式禅意',
  '森系自然',
  '中式古典',
  '梦幻童话',
  '极简主义',
  '复古怀旧',
  '其他'
]

export const memberLevelConfigs = [
  {
    level: 'bronze' as MemberLevel,
    name: '青铜会员',
    minPoints: 0,
    maxPoints: 999,
    discount: 1,
    color: '#cd7f32',
    benefits: ['注册即享', '生日积分双倍', '专属客服']
  },
  {
    level: 'silver' as MemberLevel,
    name: '白银会员',
    minPoints: 1000,
    maxPoints: 4999,
    discount: 0.95,
    color: '#c0c0c0',
    benefits: ['9.5折优惠', '生日积分双倍', '专属客服', '优先发货']
  },
  {
    level: 'gold' as MemberLevel,
    name: '黄金会员',
    minPoints: 5000,
    maxPoints: 19999,
    discount: 0.9,
    color: '#ffd700',
    benefits: ['9折优惠', '生日积分3倍', '专属客服', '优先发货', '新品优先体验']
  },
  {
    level: 'platinum' as MemberLevel,
    name: '铂金会员',
    minPoints: 20000,
    maxPoints: 49999,
    discount: 0.85,
    color: '#e5e4e2',
    benefits: ['8.5折优惠', '生日积分5倍', '1对1专属客服', '顺丰包邮', '新品优先体验', '专属活动邀请']
  },
  {
    level: 'diamond' as MemberLevel,
    name: '钻石会员',
    minPoints: 50000,
    maxPoints: Infinity,
    discount: 0.8,
    color: '#b9f2ff',
    benefits: ['8折优惠', '生日积分10倍', '1对1专属客服', '顺丰包邮', '新品优先体验', '专属活动邀请', '定制服务优先', '年度礼品']
  }
]

export const memberLevelOptions = [
  { label: '青铜会员', value: 'bronze' as MemberLevel, color: '#cd7f32', minPoints: 0, discount: 1 },
  { label: '白银会员', value: 'silver' as MemberLevel, color: '#c0c0c0', minPoints: 1000, discount: 0.95 },
  { label: '黄金会员', value: 'gold' as MemberLevel, color: '#ffd700', minPoints: 5000, discount: 0.9 },
  { label: '铂金会员', value: 'platinum' as MemberLevel, color: '#e5e4e2', minPoints: 20000, discount: 0.85 },
  { label: '钻石会员', value: 'diamond' as MemberLevel, color: '#b9f2ff', minPoints: 50000, discount: 0.8 }
]
