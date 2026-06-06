export function getStorageData<T>(key: string): T[] {
  const data = localStorage.getItem(key)
  if (!data) return []
  try {
    return JSON.parse(data) as T[]
  } catch {
    return []
  }
}

export function setStorageData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export function clearStorage(): void {
  localStorage.clear()
}

export function removeStorageItem(key: string): void {
  localStorage.removeItem(key)
}
