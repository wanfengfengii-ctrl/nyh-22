<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NModal,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NCheckbox,
  NButton,
  NSpace,
  NDataTable,
  NIcon,
  NPopconfirm,
  NTag,
  NMessageProvider,
  useMessage
} from 'naive-ui'
import { Plus, Edit2, Trash2, Settings } from 'lucide-vue-next'
import { useLandscapeStore } from '@/stores/landscape'
import { lightRiskLevelOptions, mossSpeciesOptions } from '@/types'
import type { CareRuleConfig } from '@/types'
import { h } from 'vue'
import { message as discreteMessage } from '@/utils/discrete'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const store = useLandscapeStore()

const showForm = ref(false)
const editingRule = ref<CareRuleConfig | null>(null)
const formData = ref({
  name: '',
  sprayIntervalDays: 3,
  humidityWarningMin: 50,
  humidityWarningMax: 90,
  lightRiskLevel: 'medium' as 'low' | 'medium' | 'high',
  isDefault: false,
  applicableSpecies: [] as string[]
})

const columns = [
  {
    title: '规则名称',
    key: 'name',
    width: 160
  },
  {
    title: '喷雾间隔',
    key: 'sprayIntervalDays',
    width: 100,
    render(row: CareRuleConfig) {
      return `${row.sprayIntervalDays} 天`
    }
  },
  {
    title: '湿度预警',
    key: 'humidity',
    width: 140,
    render(row: CareRuleConfig) {
      return `${row.humidityWarningMin}% ~ ${row.humidityWarningMax}%`
    }
  },
  {
    title: '光照风险',
    key: 'lightRiskLevel',
    width: 100,
    render(row: CareRuleConfig) {
      const types: Record<string, 'success' | 'warning' | 'error'> = { low: 'success', medium: 'warning', high: 'error' }
      const labels: Record<string, string> = { low: '低风险', medium: '中风险', high: '高风险' }
      return h(NTag, { type: types[row.lightRiskLevel] }, {
        default: () => labels[row.lightRiskLevel]
      })
    }
  },
  {
    title: '适用品种',
    key: 'applicableSpecies',
    render(row: CareRuleConfig) {
      if (row.applicableSpecies.length === 0) {
        return '通用'
      }
      return row.applicableSpecies.join('、')
    }
  },
  {
    title: '默认',
    key: 'isDefault',
    width: 80,
    render(row: CareRuleConfig) {
      return row.isDefault ? h(NTag, { type: 'success' }, { default: () => '是' }) : '否'
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render(row: CareRuleConfig) {
      return h(NSpace, { size: 'small' }, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => handleEdit(row)
            },
            {
              default: () => h(NIcon, { size: 16 }, { default: () => h(Edit2) })
            }
          ),
          h(
            NPopconfirm,
            {
              onPositiveClick: () => handleDelete(row.id)
            },
            {
              default: () => '确定删除此规则吗？',
              trigger: () => h(
                NButton,
                { size: 'small', type: 'error' },
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
  editingRule.value = null
  formData.value = {
    name: '',
    sprayIntervalDays: 3,
    humidityWarningMin: 50,
    humidityWarningMax: 90,
    lightRiskLevel: 'medium',
    isDefault: false,
    applicableSpecies: []
  }
  showForm.value = true
}

function handleEdit(rule: CareRuleConfig) {
  editingRule.value = rule
  formData.value = {
    name: rule.name,
    sprayIntervalDays: rule.sprayIntervalDays,
    humidityWarningMin: rule.humidityWarningMin,
    humidityWarningMax: rule.humidityWarningMax,
    lightRiskLevel: rule.lightRiskLevel,
    isDefault: rule.isDefault,
    applicableSpecies: [...rule.applicableSpecies]
  }
  showForm.value = true
}

function handleDelete(id: string) {
  store.deleteCareRule(id)
  discreteMessage.success('删除成功')
}

function handleSubmit() {
  if (!formData.value.name.trim()) {
    discreteMessage.error('规则名称不能为空')
    return
  }
  if (formData.value.humidityWarningMin >= formData.value.humidityWarningMax) {
    discreteMessage.error('湿度预警下限必须小于上限')
    return
  }

  if (editingRule.value) {
    const result = store.updateCareRule(editingRule.value.id, formData.value)
    if (result.success) {
      discreteMessage.success('更新成功')
      showForm.value = false
    } else {
      discreteMessage.error(result.message || '更新失败')
    }
  } else {
    const result = store.addCareRule(formData.value as any)
    if (result.success) {
      discreteMessage.success('添加成功')
      showForm.value = false
    } else {
      discreteMessage.error(result.message || '添加失败')
    }
  }
}
</script>

<template>
  <n-modal
    :show="visible"
    preset="card"
    title="养护规则配置"
    :mask-closable="false"
    style="width: 900px"
    @update:show="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">养护提醒规则</h3>
        <n-button type="primary" @click="handleAdd">
          <template #icon>
            <n-icon><Plus /></n-icon>
          </template>
          新增规则
        </n-button>
      </div>

      <n-data-table
        :columns="columns"
        :data="store.careRules"
        :bordered="false"
        :single-line="false"
        striped
      />

      <n-modal
        v-model:show="showForm"
        preset="card"
        :title="editingRule ? '编辑规则' : '新增规则'"
        style="width: 500px"
        :mask-closable="false"
      >
        <n-form label-placement="left" label-width="120px">
          <n-form-item label="规则名称" required>
            <n-input v-model:value="formData.name" placeholder="请输入规则名称" />
          </n-form-item>
          <n-form-item label="喷雾间隔(天)" required>
            <n-input-number
              v-model:value="formData.sprayIntervalDays"
              :min="1"
              :max="30"
              style="width: 100%"
            />
          </n-form-item>
          <n-form-item label="湿度预警下限(%)" required>
            <n-input-number
              v-model:value="formData.humidityWarningMin"
              :min="0"
              :max="100"
              style="width: 100%"
            />
          </n-form-item>
          <n-form-item label="湿度预警上限(%)" required>
            <n-input-number
              v-model:value="formData.humidityWarningMax"
              :min="0"
              :max="100"
              style="width: 100%"
            />
          </n-form-item>
          <n-form-item label="光照风险等级" required>
            <n-select
              v-model:value="formData.lightRiskLevel"
              :options="lightRiskLevelOptions.map(o => ({ label: o.label, value: o.value }))"
            />
          </n-form-item>
          <n-form-item label="适用品种">
            <n-select
              v-model:value="formData.applicableSpecies"
              multiple
              :options="mossSpeciesOptions.map(o => ({ label: o, value: o }))"
              placeholder="留空表示通用规则"
            />
          </n-form-item>
          <n-form-item label="设为默认">
            <n-checkbox v-model:checked="formData.isDefault">设为默认规则</n-checkbox>
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showForm = false">取消</n-button>
            <n-button type="primary" @click="handleSubmit">确定</n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </n-modal>
</template>
