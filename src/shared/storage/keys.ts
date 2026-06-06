export const STORAGE_KEYS = {
  landscapes: 'moss_landscapes',
  careRecords: 'moss_care_records',
  careRules: 'moss_care_rules',
  reminderTasks: 'moss_reminder_tasks',
  abnormalRecords: 'moss_abnormal_records',
  operationLogs: 'moss_operation_logs',
  customers: 'moss_customers',
  customOrders: 'moss_custom_orders',
  productionRecords: 'moss_production_records',
  deliveryConfirms: 'moss_delivery_confirms',
  afterSaleVisits: 'moss_after_sale_visits',
  visitTasks: 'moss_visit_tasks',
  pointRecords: 'moss_point_records',
  coupons: 'moss_coupons',
  couponRedemptions: 'moss_coupon_redemptions',
  marketingCampaigns: 'moss_marketing_campaigns',
  campaignRegistrations: 'moss_campaign_registrations',
  marketingReminders: 'moss_marketing_reminders',
  customerSegments: 'moss_customer_segments',
  campaignVisitTracks: 'moss_campaign_visit_tracks'
} as const

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]
