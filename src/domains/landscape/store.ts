import { defineStore } from 'pinia'
import { createReactiveState } from './state'
import { createSelectors } from './selectors'
import { createActions } from './actions'

export const useLandscapeStore = defineStore('landscape', () => {
  const state = createReactiveState()
  const selectors = createSelectors(
    state.landscapes,
    state.careRecords,
    state.careRules,
    state.reminderTasks,
    state.abnormalRecords
  )
  const actions = createActions(
    state.landscapes,
    state.careRecords,
    state.careRules,
    state.reminderTasks,
    state.abnormalRecords,
    state.operationLogs,
    selectors
  )

  return {
    ...state,
    ...selectors,
    ...actions
  }
})
