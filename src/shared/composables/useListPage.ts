import { ref, computed, type Ref, type ComputedRef } from 'vue'

export interface UseListPageOptions<T, F> {
  fetchData?: () => Promise<T[]> | T[]
  filterFn?: (item: T, filters: F, keyword: string) => boolean
  sortFn?: (a: T, b: T) => number
  pageSize?: number
}

export interface UseListPageReturn<T, F> {
  dataList: Ref<T[]>
  filteredList: ComputedRef<T[]>
  paginatedList: ComputedRef<T[]>
  searchKeyword: Ref<string>
  filters: Ref<F>
  currentPage: Ref<number>
  pageSize: Ref<number>
  total: ComputedRef<number>
  totalPages: ComputedRef<number>
  selectedIds: Ref<string[]>
  isAllSelected: ComputedRef<boolean>
  isIndeterminate: ComputedRef<boolean>
  refresh: () => void
  resetFilters: () => void
  goToPage: (page: number) => void
  toggleSelectAll: () => void
  toggleSelect: (id: string) => void
  clearSelection: () => void
  setData: (data: T[]) => void
  getId?: (item: T) => string
}

export function useListPage<T extends { id?: string }, F extends object>(
  options: UseListPageOptions<T, F> & { initialFilters: F; getId?: (item: T) => string }
): UseListPageReturn<T, F> {
  const dataList = ref<T[]>([]) as Ref<T[]>
  const searchKeyword = ref('')
  const filters = ref<F>({ ...options.initialFilters }) as Ref<F>
  const currentPage = ref(1)
  const pageSize = ref(options.pageSize || 10)
  const selectedIds = ref<string[]>([])

  const getId = options.getId || ((item: T) => (item as any).id)

  const filteredList = computed(() => {
    let result = [...dataList.value]

    if (searchKeyword.value.trim() && options.filterFn) {
      result = result.filter(item =>
        options.filterFn!(item, filters.value, searchKeyword.value.trim())
      )
    }

    if (options.sortFn) {
      result.sort(options.sortFn)
    }

    return result
  })

  const total = computed(() => filteredList.value.length)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

  const paginatedList = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredList.value.slice(start, end)
  })

  const isAllSelected = computed(() => {
    if (filteredList.value.length === 0) return false
    return filteredList.value.every(item => selectedIds.value.includes(getId(item)))
  })

  const isIndeterminate = computed(() => {
    const selectedCount = filteredList.value.filter(item =>
      selectedIds.value.includes(getId(item))
    ).length
    return selectedCount > 0 && selectedCount < filteredList.value.length
  })

  function refresh() {
    if (options.fetchData) {
      const result = options.fetchData()
      if (result instanceof Promise) {
        result.then(data => {
          dataList.value = data
        })
      } else {
        dataList.value = result
      }
    }
  }

  function resetFilters() {
    filters.value = { ...options.initialFilters }
    searchKeyword.value = ''
    currentPage.value = 1
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  function toggleSelectAll() {
    if (isAllSelected.value) {
      const filteredIds = filteredList.value.map(item => getId(item))
      selectedIds.value = selectedIds.value.filter(id => !filteredIds.includes(id))
    } else {
      const newIds = filteredList.value
        .map(item => getId(item))
        .filter(id => !selectedIds.value.includes(id))
      selectedIds.value = [...selectedIds.value, ...newIds]
    }
  }

  function toggleSelect(id: string) {
    const index = selectedIds.value.indexOf(id)
    if (index > -1) {
      selectedIds.value.splice(index, 1)
    } else {
      selectedIds.value.push(id)
    }
  }

  function clearSelection() {
    selectedIds.value = []
  }

  function setData(data: T[]) {
    dataList.value = data
  }

  return {
    dataList,
    filteredList,
    paginatedList,
    searchKeyword,
    filters,
    currentPage,
    pageSize,
    total,
    totalPages,
    selectedIds,
    isAllSelected,
    isIndeterminate,
    refresh,
    resetFilters,
    goToPage,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    setData,
    getId
  }
}
