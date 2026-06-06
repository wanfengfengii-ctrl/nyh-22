import type { ComposeOption } from 'echarts/core'
import type {
  PieSeriesOption,
  BarSeriesOption,
  LineSeriesOption
} from 'echarts/charts'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  LegendComponentOption,
  GridComponentOption
} from 'echarts/components'

export type ECOption = ComposeOption<
  | PieSeriesOption
  | BarSeriesOption
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | GridComponentOption
>

export const baseChartTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'system-ui, -apple-system, sans-serif'
  }
}

export function createPieOption(data: Array<{ name: string; value: number; color?: string }>, opts?: {
  title?: string
  radius?: [string, string]
  showLegend?: boolean
  legendPosition?: 'left' | 'right' | 'top' | 'bottom'
}): ECOption {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: opts?.showLegend !== false
      ? { orient: 'vertical', left: opts?.legendPosition || 'left' }
      : undefined,
    series: [{
      type: 'pie',
      radius: opts?.radius || ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      data: data.map(d => ({
        value: d.value,
        name: d.name,
        itemStyle: d.color ? { color: d.color } : undefined
      }))
    }]
  }
}

export function createLineOption(
  categories: string[],
  series: Array<{ name: string; data: number[]; color?: string }>,
  opts?: {
    title?: string
    yAxisName?: string
    showLegend?: boolean
  }
): ECOption {
  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: opts?.showLegend !== false ? {} : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: categories
    },
    yAxis: {
      type: 'value',
      name: opts?.yAxisName
    },
    series: series.map(s => ({
      name: s.name,
      type: 'line',
      smooth: true,
      data: s.data,
      itemStyle: s.color ? { color: s.color } : undefined,
      lineStyle: s.color ? { color: s.color } : undefined
    }))
  }
}

export function createBarOption(
  categories: string[],
  series: Array<{ name: string; data: number[]; color?: string }>,
  opts?: {
    title?: string
    yAxisName?: string
    showLegend?: boolean
  }
): ECOption {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: opts?.showLegend !== false ? {} : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories
    },
    yAxis: {
      type: 'value',
      name: opts?.yAxisName
    },
    series: series.map(s => ({
      name: s.name,
      type: 'bar',
      data: s.data,
      itemStyle: s.color ? { color: s.color } : undefined
    }))
  }
}
