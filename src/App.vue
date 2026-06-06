<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NLayout,
  NLayoutSider,
  NLayoutContent,
  NMenu,
  NIcon,
  NMessageProvider,
  NDialogProvider,
  NDivider
} from 'naive-ui'
import {
  LayoutDashboard,
  Leaf,
  Calendar,
  BarChart3,
  Archive,
  ScrollText,
  Users,
  Megaphone
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const menuOptions = [
  {
    label: '养护看板',
    key: 'dashboard',
    icon: () => h(NIcon, null, { default: () => h(LayoutDashboard) })
  },
  {
    label: '微景观列表',
    key: 'landscapes',
    icon: () => h(NIcon, null, { default: () => h(Leaf) })
  },
  {
    label: '养护日历',
    key: 'calendar',
    icon: () => h(NIcon, null, { default: () => h(Calendar) })
  },
  {
    label: '数据分析',
    key: 'analytics',
    icon: () => h(NIcon, null, { default: () => h(BarChart3) })
  },
  {
    type: 'divider',
    key: 'divider1'
  },
  {
    label: '已售出归档',
    key: 'sold-archive',
    icon: () => h(NIcon, null, { default: () => h(Archive) })
  },
  {
    type: 'divider',
    key: 'divider2'
  },
  {
    label: '客户定制中心',
    key: 'customer-center',
    icon: () => h(NIcon, null, { default: () => h(Users) })
  },
  {
    label: '营销运营中心',
    key: 'marketing-center',
    icon: () => h(NIcon, null, { default: () => h(Megaphone) })
  },
  {
    label: '操作日志',
    key: 'operation-logs',
    icon: () => h(NIcon, null, { default: () => h(ScrollText) })
  }
]

const activeKey = computed(() => {
  const path = route.path
  if (path === '/' || path === '/dashboard') return 'dashboard'
  if (path.startsWith('/landscapes/')) return 'landscapes'
  if (path === '/landscapes') return 'landscapes'
  if (path === '/calendar') return 'calendar'
  if (path === '/analytics') return 'analytics'
  if (path === '/sold-archive') return 'sold-archive'
  if (path === '/customer-center') return 'customer-center'
  if (path === '/marketing-center') return 'marketing-center'
  if (path === '/operation-logs') return 'operation-logs'
  return 'dashboard'
})

function handleMenuSelect(key: string) {
  if (key === 'dashboard') {
    router.push('/')
  } else {
    router.push(`/${key}`)
  }
}
</script>

<template>
  <n-message-provider>
    <n-dialog-provider>
      <n-layout style="height: 100vh" has-sider>
        <n-layout-sider
          bordered
          collapse-mode="width"
          :width="240"
          :collapsed-width="64"
          show-trigger
        >
          <div class="p-4 flex items-center gap-3 border-b border-gray-200">
            <div class="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold text-lg">
              苔
            </div>
            <div class="sidebar-title">
              <h1 class="text-lg font-bold text-gray-800">苔藓工作室</h1>
              <p class="text-xs text-gray-500">微景观养护管理</p>
            </div>
          </div>
          <n-menu
            :value="activeKey"
            :options="menuOptions"
            @update:value="handleMenuSelect"
            class="mt-2"
          />
        </n-layout-sider>
        <n-layout content-style="padding: 24px; height: 100%; overflow-y: auto;">
          <router-view />
        </n-layout>
      </n-layout>
    </n-dialog-provider>
  </n-message-provider>
</template>

<style scoped>
.sidebar-title {
  min-width: 0;
}
</style>
