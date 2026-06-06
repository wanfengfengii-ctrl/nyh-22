<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NDataTable,
  NButton,
  NInput,
  NSelect,
  NSpace,
  NCard,
  NTag,
  NPopconfirm,
  NIcon,
  NUpload,
  NDialog,
  NDropdown,
  useDialog,
  useMessage
} from 'naive-ui'
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Upload,
  Download,
  CheckSquare,
  Square,
  Settings
} from 'lucide-vue-next'
import { useLandscapeStore } from '@/stores/landscape'
import StatusTag from '@/components/StatusTag.vue'
import LandscapeForm from '@/components/LandscapeForm.vue'
import BatchOperationDialog from '@/components/BatchOperationDialog.vue'
import { landscapeStatusOptions, mossSpeciesOptions, containerTypeOptions } from '@/types'
import type { MicroLandscape, BatchImportItem } from '@/types'
import { message as discreteMessage } from '@/utils/discrete'
import { parseCSV } from '@/utils/storage'

const router = useRouter()
const store = useLandscapeStore()
const dialog = useDialog()
const message = useMessage()

const searchKeyword = ref('')
const filterSpecies = ref<string | null>(null)
const filterContainer = ref<string | null>(null)
const filterStatus = ref<string | null>(null)
const showForm = ref(false)
const editingLandscape = ref<MicroLandscape | null>(null)
const selectedRowKeys = ref<string[]>([])

const showBatchDialog = ref(false)
const batchOperationType = ref<'status_update' | 'care_record' | 'sold' | 'delete'>('status_update')

onMounted(() => {
  if (store.landscapes.length === 0) {
    initMockData()
  }
  store.initDefaultCareRules()
})

function initMockData() {
  const mockData = [
    {
      code: 'MS-001',
      containerType: '玻璃圆瓶',
      mossSpecies: '大灰藓',
      creationDate: '2025-01-15',
      lightCondition: '明亮散射光',
      humidityMin: 60,
      humidityMax: 80,
      status: 'healthy',
      isSold: false,
      notes: '',
      lastCareDate: '2025-03-28'
    },
    {
      code: 'MS-002',
      containerType: '玻璃方缸',
      mossSpecies: '白发藓',
      creationDate: '2025-02-20',
      lightCondition: '半阴环境',
      humidityMin: 50,
      humidityMax: 70,
      status: 'yellowing',
      isSold: false,
      notes: '底部少量黄化，已调整光照位置',
      lastCareDate: '2025-04-01'
    },
    {
      code: 'MS-003',
      containerType: '陶瓷盆',
      mossSpecies: '短绒藓',
      creationDate: '2025-03-05',
      lightCondition: '明亮散射光',
      humidityMin: 65,
      humidityMax: 85,
      status: 'healthy',
      isSold: false,
      notes: '',
      lastCareDate: '2025-03-30'
    },
    {
      code: 'MS-004',
      containerType: '悬挂玻璃瓶',
      mossSpecies: '大羽藓',
      creationDate: '2025-01-28',
      lightCondition: '人工补光',
      humidityMin: 55,
      humidityMax: 75,
      status: 'sold',
      isSold: true,
      notes: '客户定制作品，已售出',
      lastCareDate: '2025-03-15'
    },
    {
      code: 'MS-005',
      containerType: '生态瓶',
      mossSpecies: '仙鹤藓',
      creationDate: '2025-02-10',
      lightCondition: '半阴环境',
      humidityMin: 70,
      humidityMax: 90,
      status: 'mold',
      isSold: false,
      notes: '表面出现霉斑，已通风处理并喷洒稀释多菌灵',
      lastCareDate: '2025-04-02'
    }
  ]

  mockData.forEach((data) => {
    store.addLandscape(data as any)
  })

  const landscapeIds = store.landscapes.map(l => l.id)
  
  const mockRecords = [
    { landscapeIndex: 0, careDate: '2025-03-28', careType: 'spray', humidity: 72, statusBefore: 'healthy', statusAfter: 'healthy', notes: '日常喷雾养护' },
    { landscapeIndex: 0, careDate: '2025-03-20', careType: 'water', humidity: 75, statusBefore: 'healthy', statusAfter: 'healthy', notes: '补充水分' },
    { landscapeIndex: 1, careDate: '2025-04-01', careType: 'prune', humidity: 60, statusBefore: 'yellowing', statusAfter: 'yellowing', notes: '修剪黄化部分，调整光照' },
    { landscapeIndex: 1, careDate: '2025-03-25', careType: 'spray', humidity: 65, statusBefore: 'healthy', statusAfter: 'yellowing', notes: '发现底部少量黄化' },
    { landscapeIndex: 2, careDate: '2025-03-30', careType: 'spray', humidity: 78, statusBefore: 'healthy', statusAfter: 'healthy', notes: '日常养护' },
    { landscapeIndex: 2, careDate: '2025-03-22', careType: 'clean', humidity: 70, statusBefore: 'healthy', statusAfter: 'healthy', notes: '清洁瓶壁' },
    { landscapeIndex: 4, careDate: '2025-04-02', careType: 'other', humidity: 82, statusBefore: 'mold', statusAfter: 'mold', notes: '喷洒稀释多菌灵，加强通风' },
    { landscapeIndex: 4, careDate: '2025-03-28', careType: 'spray', humidity: 88, statusBefore: 'healthy', statusAfter: 'mold', notes: '发现表面霉斑' }
  ]

  mockRecords.forEach((record) => {
    const landscapeId = landscapeIds[record.landscapeIndex]
    if (landscapeId) {
      store.addCareRecord(landscapeId, {
        careDate: record.careDate,
        careType: record.careType as any,
        humidity: record.humidity,
        statusBefore: record.statusBefore as any,
        statusAfter: record.statusAfter as any,
        notes: record.notes
      })
    }
  })
}

const filteredLandscapes = computed(() => {
  let result = store.landscapes

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      l =>
        l.code.toLowerCase().includes(keyword) ||
        l.mossSpecies.includes(keyword) ||
        l.containerType.includes(keyword)
    )
  }

  if (filterSpecies.value) {
    result = result.filter(l => l.mossSpecies === filterSpecies.value)
  }

  if (filterContainer.value) {
    result = result.filter(l => l.containerType === filterContainer.value)
  }

  if (filterStatus.value) {
    result = result.filter(l => l.status === filterStatus.value)
  }

  return result
})

const selectedCount = computed(() => selectedRowKeys.value.length)

const columns = [
  {
    type: 'selection' as const,
    width: 50
  },
  {
    title: '作品编号',
    key: 'code',
    width: 100
  },
  {
    title: '容器类型',
    key: 'containerType',
    width: 110
  },
  {
    title: '苔藓品种',
    key: 'mossSpecies',
    width: 110
  },
  {
    title: '制作日期',
    key: 'creationDate',
    width: 120
  },
  {
    title: '光照条件',
    key: 'lightCondition',
    width: 120
  },
  {
    title: '湿度区间',
    key: 'humidity',
    width: 110,
    render(row: MicroLandscape) {
      return `${row.humidityMin}%~${row.humidityMax}%`
    }
  },
  {
    title: '当前状态',
    key: 'status',
    width: 110,
    render(row: MicroLandscape) {
      return h(StatusTag, { status: row.status })
    }
  },
  {
    title: '最近养护',
    key: 'lastCareDate',
    width: 120
  },
  {
    title: '操作',
    key: 'actions',
    width: 130,
    render(row: MicroLandscape) {
      return h(NSpace, { size: 'small' }, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              circle: true,
              onClick: () => router.push(`/landscapes/${row.id}`)
            },
            {
              default: () => h(NIcon, { size: 16 }, { default: () => h(Eye) })
            }
          ),
          h(
            NButton,
            {
              size: 'small',
              circle: true,
              disabled: row.isSold,
              onClick: () => handleEdit(row)
            },
            {
              default: () => h(NIcon, { size: 16 }, { default: () => h(Edit2) })
            }
          ),
          h(
            NPopconfirm,
            {
              disabled: row.isSold,
              onPositiveClick: () => handleDelete(row.id)
            },
            {
              default: () => row.isSold ? '已售出作品不可删除' : '确定要删除这个作品吗？',
              trigger: () => h(
                NButton,
                { size: 'small', type: 'error', circle: true, disabled: row.isSold },
                {
                  default: () => h(NIcon, { size: 16 }, { default: () => h(Trash2) })
                }
              )
            }
          )
        ]
      })
    }
  }
]

function handleAdd() {
  editingLandscape.value = null
  showForm.value = true
}

function handleEdit(landscape: MicroLandscape) {
  editingLandscape.value = landscape
  showForm.value = true
}

function handleDelete(id: string) {
  store.deleteLandscape(id)
  discreteMessage.success('删除成功')
}

function handleReset() {
  if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
    store.resetAllData()
    initMockData()
    discreteMessage.success('数据已重置')
  }
}

function handleBatchOperation(type: 'status_update' | 'care_record' | 'sold' | 'delete') {
  if (selectedRowKeys.value.length === 0) {
    discreteMessage.warning('请先选择作品')
    return
  }
  batchOperationType.value = type
  showBatchDialog.value = true
}

function handleBatchSuccess() {
  selectedRowKeys.value = []
}

function handleExportAll() {
  store.batchExport()
  discreteMessage.success('导出成功')
}

function handleExportSelected() {
  if (selectedRowKeys.value.length === 0) {
    discreteMessage.warning('请先选择作品')
    return
  }
  store.batchExport(selectedRowKeys.value)
  discreteMessage.success('导出成功')
}

function handleImportFile(options: { file: File; fileList: any[] }) {
  const file = options.file
  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(content)
        const items = Array.isArray(data) ? data : [data]
        const importItems = items.map((item: any) => ({
          code: item.code,
          containerType: item.containerType,
          mossSpecies: item.mossSpecies,
          creationDate: item.creationDate,
          lightCondition: item.lightCondition,
          humidityMin: item.humidityMin,
          humidityMax: item.humidityMax,
          status: item.status || 'healthy',
          notes: item.notes || '',
          lastCareDate: item.lastCareDate
        }))
        
        const result = store.batchImport(importItems)
        if (result.success) {
          discreteMessage.success(`导入成功 ${result.count} 个作品`)
        }
        if (result.errors.length > 0) {
          discreteMessage.error(`导入失败 ${result.errors.length} 条，详情请查看`)
          console.error('导入错误:', result.errors)
        }
      } else if (file.name.endsWith('.csv')) {
        const rows = parseCSV(content)
        const headers = rows[0]
        const items: BatchImportItem[] = []
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          const item: any = {}
          headers.forEach((header, index) => {
            item[header.trim()] = row[index] || ''
          })
          items.push({
            code: item.code,
            containerType: item.containerType,
            mossSpecies: item.mossSpecies,
            creationDate: item.creationDate,
            lightCondition: item.lightCondition,
            humidityMin: Number(item.humidityMin),
            humidityMax: Number(item.humidityMax),
            status: item.status as any || 'healthy',
            notes: item.notes,
            lastCareDate: item.lastCareDate
          })
        }
        
        const result = store.batchImport(items)
        if (result.success) {
          discreteMessage.success(`导入成功 ${result.count} 个作品`)
        }
        if (result.errors.length > 0) {
          discreteMessage.error(`导入失败 ${result.errors.length} 条`)
        }
      } else {
        discreteMessage.error('不支持的文件格式，请上传 JSON 或 CSV 文件')
      }
    } catch (err) {
      discreteMessage.error('文件解析失败，请检查文件格式')
      console.error(err)
    }
  }
  
  reader.readAsText(file)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">微景观列表</h2>
        <p class="text-sm text-gray-500 mt-1">管理所有苔藓微景观作品档案</p>
      </div>
      <div class="flex items-center gap-2">
        <n-button @click="handleReset">重置数据</n-button>
        <n-dropdown @select="handleBatchOperation">
          <n-button type="default" :disabled="selectedCount === 0">
            <template #icon>
              <n-icon><CheckSquare /></n-icon>
            </template>
            批量操作 ({{ selectedCount }})
          </n-button>
          <template #dropdown>
            <n-dropdown-option value="status_update">更新状态</n-dropdown-option>
            <n-dropdown-option value="care_record">批量养护</n-dropdown-option>
            <n-dropdown-option value="sold">标记售出</n-dropdown-option>
            <n-dropdown-option value="delete">批量删除</n-dropdown-option>
          </template>
        </n-dropdown>
        <n-button type="primary" @click="handleAdd">
          <template #icon>
            <n-icon><Plus /></n-icon>
          </template>
          新增作品
        </n-button>
      </div>
    </div>

    <n-card>
      <div class="flex flex-wrap gap-4 mb-6">
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索编号、品种、容器..."
          style="width: 280px"
          clearable
        >
          <template #prefix>
            <n-icon><Search /></n-icon>
          </template>
        </n-input>

        <n-select
          v-model:value="filterSpecies"
          placeholder="筛选品种"
          :options="mossSpeciesOptions.map(o => ({ label: o, value: o }))"
          style="width: 160px"
          clearable
        />

        <n-select
          v-model:value="filterContainer"
          placeholder="筛选容器"
          :options="containerTypeOptions.map(o => ({ label: o, value: o }))"
          style="width: 160px"
          clearable
        />

        <n-select
          v-model:value="filterStatus"
          placeholder="筛选状态"
          :options="landscapeStatusOptions"
          style="width: 160px"
          clearable
        />

        <div class="flex-1"></div>

        <n-upload
          :show-file-list="false"
          accept=".json,.csv"
          :custom-request="handleImportFile as any"
        >
          <n-button>
            <template #icon>
              <n-icon><Upload /></n-icon>
            </template>
            导入
          </n-button>
        </n-upload>

        <n-dropdown>
          <n-button>
            <template #icon>
              <n-icon><Download /></n-icon>
            </template>
            导出
          </n-button>
          <template #dropdown>
            <n-dropdown-option value="all" @click="handleExportAll">导出全部</n-dropdown-option>
            <n-dropdown-option
              value="selected"
              :disabled="selectedCount === 0"
              @click="handleExportSelected"
            >
              导出选中 ({{ selectedCount }})
            </n-dropdown-option>
          </template>
        </n-dropdown>
      </div>

      <div class="overflow-x-auto">
        <n-data-table
          v-model:checked-row-keys="selectedRowKeys"
          :columns="columns as any"
          :data="filteredLandscapes"
          :bordered="false"
          :single-line="false"
          striped
          style="min-width: 900px"
        />
      </div>
    </n-card>

    <LandscapeForm
      v-model:visible="showForm"
      :landscape="editingLandscape"
      @success="showForm = false"
    />

    <BatchOperationDialog
      v-model:visible="showBatchDialog"
      :selected-ids="selectedRowKeys"
      :operation-type="batchOperationType"
      @success="handleBatchSuccess"
    />
  </div>
</template>
