import { ref, computed, type Ref } from 'vue'

export interface UseDialogFormOptions<T> {
  initialData: T
  onSubmit?: (data: T, mode: 'add' | 'edit') => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string }
  onSuccess?: () => void
  onError?: (message: string) => void
  resetOnClose?: boolean
}

export interface UseDialogFormReturn<T> {
  visible: Ref<boolean>
  mode: Ref<'add' | 'edit'>
  formData: Ref<T>
  editingItem: Ref<T | null>
  isSubmitting: Ref<boolean>
  openAdd: () => void
  openEdit: (item: T) => void
  close: () => void
  submit: () => Promise<void>
  resetForm: () => void
}

export function useDialogForm<T extends object>(options: UseDialogFormOptions<T>): UseDialogFormReturn<T> {
  const visible = ref(false)
  const mode = ref<'add' | 'edit'>('add')
  const formData = ref<T>({ ...options.initialData } as T)
  const editingItem = ref<T | null>(null)
  const isSubmitting = ref(false)

  function resetForm() {
    formData.value = { ...options.initialData } as T
    editingItem.value = null
  }

  function openAdd() {
    mode.value = 'add'
    resetForm()
    visible.value = true
  }

  function openEdit(item: T) {
    mode.value = 'edit'
    editingItem.value = item
    formData.value = { ...item } as T
    visible.value = true
  }

  function close() {
    visible.value = false
    if (options.resetOnClose !== false) {
      resetForm()
    }
  }

  async function submit() {
    if (!options.onSubmit) return

    isSubmitting.value = true
    try {
      const result = await options.onSubmit(formData.value, mode.value)
      if (result.success) {
        options.onSuccess?.()
        close()
      } else {
        options.onError?.(result.message || '操作失败')
      }
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    visible: visible as Ref<boolean>,
    mode: mode as Ref<'add' | 'edit'>,
    formData: formData as Ref<T>,
    editingItem: editingItem as Ref<T | null>,
    isSubmitting: isSubmitting as Ref<boolean>,
    openAdd,
    openEdit,
    close,
    submit,
    resetForm
  }
}
