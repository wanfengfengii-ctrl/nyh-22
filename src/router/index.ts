import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
