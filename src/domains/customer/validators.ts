import { isPhoneValid, isEmailValid, isBudgetValid, isDateNotPast } from '@/shared/utils'
import type { ValidationResult } from '@/shared/utils/validation'
import type {
  Customer,
  CustomOrder,
  AfterSaleVisit
} from './types'

export function validateCustomerCreate(data: Omit<Customer, 'id' | 'totalOrders' | 'totalAmount' | 'memberLevel' | 'points' | 'createdAt' | 'updatedAt'>, getCustomerByPhone: (phone: string) => Customer | undefined): ValidationResult {
  const errors: string[] = []

  if (!data.name.trim()) {
    errors.push('客户姓名不能为空')
  }
  if (!data.phone.trim()) {
    errors.push('手机号码不能为空')
  } else if (!isPhoneValid(data.phone)) {
    errors.push('请输入正确的手机号码')
  } else if (getCustomerByPhone(data.phone)) {
    errors.push('该手机号码已存在')
  }
  if (data.email && !isEmailValid(data.email)) {
    errors.push('请输入正确的邮箱地址')
  }

  return { valid: errors.length === 0, errors }
}

export function validateCustomerUpdate(id: string, data: Partial<Customer>, current: Customer, getCustomerByPhone: (phone: string) => Customer | undefined): ValidationResult {
  const errors: string[] = []

  if (data.phone !== undefined && data.phone !== current.phone) {
    if (!isPhoneValid(data.phone)) {
      errors.push('请输入正确的手机号码')
    } else if (getCustomerByPhone(data.phone)) {
      errors.push('该手机号码已存在')
    }
  }

  if (data.email !== undefined && data.email && !isEmailValid(data.email)) {
    errors.push('请输入正确的邮箱地址')
  }

  return { valid: errors.length === 0, errors }
}

export function validateCustomOrderCreate(data: Omit<CustomOrder, 'id' | 'orderNo' | 'progressPercent' | 'isOverdue' | 'landscapeIds' | 'designFiles' | 'createdAt' | 'updatedAt'>, getCustomerById: (id: string) => Customer | undefined): ValidationResult {
  const errors: string[] = []

  if (!data.customerId) {
    errors.push('请选择客户')
  } else if (!getCustomerById(data.customerId)) {
    errors.push('客户不存在')
  }
  if (!data.demandDescription.trim()) {
    errors.push('请填写定制需求描述')
  }
  if (!isBudgetValid(data.budgetMin, data.budgetMax)) {
    errors.push('预算区间填写不正确')
  }
  if (!data.appointmentDeliveryDate) {
    errors.push('请选择预约交付日期')
  } else if (!isDateNotPast(data.appointmentDeliveryDate)) {
    errors.push('预约交付日期不能早于今天')
  }

  return { valid: errors.length === 0, errors }
}

export function validateCustomOrderUpdate(id: string, data: Partial<CustomOrder>, current: CustomOrder): ValidationResult {
  const errors: string[] = []

  if (data.budgetMin !== undefined || data.budgetMax !== undefined) {
    const min = data.budgetMin ?? current.budgetMin
    const max = data.budgetMax ?? current.budgetMax
    if (!isBudgetValid(min, max)) {
      errors.push('预算区间填写不正确')
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validateAfterSaleVisit(data: Omit<AfterSaleVisit, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted'>): ValidationResult {
  const errors: string[] = []

  if (!data.orderId) {
    errors.push('请选择订单')
  }
  if (!data.customerId) {
    errors.push('客户信息缺失')
  }
  if (data.satisfactionScore < 1 || data.satisfactionScore > 5) {
    errors.push('满意度评分需在1-5之间')
  }

  return { valid: errors.length === 0, errors }
}
