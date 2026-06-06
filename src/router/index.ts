import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/pages/CareDashboard.vue')
  },
  {
    path: '/landscapes',
    name: 'landscapes',
    component: () => import('@/pages/LandscapeList.vue')
  },
  {
    path: '/landscapes/:id',
    name: 'landscape-detail',
    component: () => import('@/pages/LandscapeDetail.vue')
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('@/pages/CareCalendar.vue')
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: () => import('@/pages/Analytics.vue')
  },
  {
    path: '/sold-archive',
    name: 'sold-archive',
    component: () => import('@/pages/SoldArchive.vue')
  },
  {
    path: '/operation-logs',
    name: 'operation-logs',
    component: () => import('@/pages/OperationLogs.vue')
  },
  {
    path: '/customer-center',
    name: 'customer-center',
    component: () => import('@/pages/CustomerCenter.vue')
  },
  {
    path: '/marketing-center',
    name: 'marketing-center',
    component: () => import('@/pages/MarketingCenter.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
