<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NSelect, NGrid, NGridItem, NSpace, NStatistic } from 'naive-ui'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  PieChart,
  BarChart,
  LineChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useLandscapeStore } from '@/stores/landscape'
import { landscapeStatusOptions, mossSpeciesOptions, careTypeOptions } from '@/types'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const store = useLandscapeStore()

const selectedLandscape = ref<string | null>(null)

const landscapeOptions = computed(() => {
  return store.landscapes.map(l => ({
    label: `${l.code} - ${l.mossSpecies}`,
    value: l.id
  }))
})

const totalCount = computed(() => store.landscapes.length)
const healthyCount = computed(() => store.getStatusCount('healthy'))
const yellowingCount = computed(() => store.getStatusCount('yellowing'))
const moldCount = computed(() => store.getStatusCount('mold'))
const soldCount = computed(() => store.getStatusCount('sold'))
const totalRecords = computed(() => store.careRecords.length)

const statusPieOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'horizontal',
    bottom: '5%'
  },
  series: [
    {
      name: '状态分布',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        formatter: '{b}\n{c}个'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      data: [
        { value: healthyCount.value, name: '生长正常', itemStyle: { color: '#18a058' } },
        { value: yellowingCount.value, name: '出现黄化', itemStyle: { color: '#f0a020' } },
        { value: moldCount.value, name: '出现霉斑', itemStyle: { color: '#d03050' } },
        { value: soldCount.value, name: '已售出', itemStyle: { color: '#888' } }
      ]
    }
  ]
}))

const speciesBarOption = computed(() => {
  const speciesMap: Record<string, { total: number; healthy: number; yellowing: number; mold: number; sold: number }> = {}
  
  store.landscapes.forEach(l => {
    if (!speciesMap[l.mossSpecies]) {
      speciesMap[l.mossSpecies] = { total: 0, healthy: 0, yellowing: 0, mold: 0, sold: 0 }
    }
    speciesMap[l.mossSpecies].total++
    speciesMap[l.mossSpecies][l.status as keyof typeof speciesMap[string]]++
  })

  const species = Object.keys(speciesMap).sort()

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['生长正常', '出现黄化', '出现霉斑', '已售出']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: species
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '生长正常',
        type: 'bar',
        stack: 'total',
        data: species.map(s => speciesMap[s].healthy),
        itemStyle: { color: '#18a058' }
      },
      {
        name: '出现黄化',
        type: 'bar',
        stack: 'total',
        data: species.map(s => speciesMap[s].yellowing),
        itemStyle: { color: '#f0a020' }
      },
      {
        name: '出现霉斑',
        type: 'bar',
        stack: 'total',
        data: species.map(s => speciesMap[s].mold),
        itemStyle: { color: '#d03050' }
      },
      {
        name: '已售出',
        type: 'bar',
        stack: 'total',
        data: species.map(s => speciesMap[s].sold),
        itemStyle: { color: '#888' }
      }
    ]
  }
})

const humidityTrendOption = computed(() => {
  if (!selectedLandscape.value) {
    return {
      title: {
        text: '请选择作品查看湿度趋势',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#999',
          fontSize: 14,
          fontWeight: 'normal'
        }
      },
      grid: { show: false },
      xAxis: { show: false },
      yAxis: { show: false },
      series: []
    }
  }

  const records = store.getRecordsByLandscapeId(selectedLandscape.value)
    .sort((a, b) => new Date(a.careDate).getTime() - new Date(b.careDate).getTime())

  const landscape = store.getLandscapeById(selectedLandscape.value)

  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['湿度记录', '目标区间'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: records.map(r => r.careDate)
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '湿度记录',
        type: 'line',
        smooth: true,
        data: records.map(r => r.humidity),
        itemStyle: { color: '#2080f0' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(32, 128, 240, 0.3)' },
              { offset: 1, color: 'rgba(32, 128, 240, 0.05)' }
            ]
          }
        }
      },
      {
        name: '目标区间上限',
        type: 'line',
        lineStyle: { type: 'dashed', color: '#18a058' },
        data: records.map(() => landscape?.humidityMax || 80),
        showSymbol: false
      },
      {
        name: '目标区间下限',
        type: 'line',
        lineStyle: { type: 'dashed', color: '#18a058' },
        data: records.map(() => landscape?.humidityMin || 60),
        showSymbol: false
      }
    ]
  }
})

const careTypePieOption = computed(() => {
  const typeMap: Record<string, number> = {}
  careTypeOptions.forEach(opt => {
    typeMap[opt.value] = 0
  })

  store.careRecords.forEach(r => {
    typeMap[r.careType] = (typeMap[r.careType] || 0) + 1
  })

  const data = careTypeOptions
    .map(opt => ({
      value: typeMap[opt.value] || 0,
      name: opt.label
    }))
    .filter(d => d.value > 0)

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}次 ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: '5%'
    },
    series: [
      {
        name: '养护类型',
        type: 'pie',
        radius: '60%',
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-800">数据分析</h2>
      <p class="text-sm text-gray-500 mt-1">查看苔藓微景观的整体数据和趋势分析</p>
    </div>

    <n-grid :cols="4" :x-gap="16" :y-gap="16">
      <n-grid-item>
        <n-card>
          <n-statistic label="作品总数" :value="totalCount" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="生长正常" :value="healthyCount" value-style="color: #18a058" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="异常状态" :value="yellowingCount + moldCount" value-style="color: #f0a020" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="养护记录" :value="totalRecords" value-style="color: #2080f0" />
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-grid :cols="2" :x-gap="16" :y-gap="16">
      <n-grid-item>
        <n-card title="状态分布">
          <v-chart :option="statusPieOption" style="height: 320px" autoresize />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card title="养护类型统计">
          <v-chart :option="careTypePieOption" style="height: 320px" autoresize />
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-card title="各品种状态分布">
      <v-chart :option="speciesBarOption" style="height: 360px" autoresize />
    </n-card>

    <n-card title="湿度变化趋势">
      <div class="mb-4">
        <n-select
          v-model:value="selectedLandscape"
          placeholder="选择作品查看湿度趋势"
          :options="landscapeOptions"
          style="width: 320px"
          clearable
        />
      </div>
      <v-chart :option="humidityTrendOption" style="height: 360px" autoresize />
    </n-card>
  </div>
</template>
