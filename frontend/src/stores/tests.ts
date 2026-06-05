import { create } from 'zustand'
import { apiFetch } from '../api/client.ts'
import type { Test, TestAttempt, TestAttemptDetail, TestAnswer } from '../types/test.ts'

interface TestState {
  tests: Test[]
  currentTest: Test | null
  attempts: TestAttempt[]
  currentAttemptDetail: TestAttemptDetail | null
  isLoading: boolean
  fetchTests: () => Promise<void>
  fetchTest: (id: string) => Promise<Test | null>
  createTest: (title: string) => Promise<Test | null>
  updateTest: (test: Partial<Test> & { id: string }) => Promise<void>
  deleteTest: (id: string) => Promise<void>
  submitAttempt: (testId: string, group: string, firstName: string, lastName: string, answers: TestAnswer[], tabSwitchCount?: number) => Promise<any>
  fetchAttempts: (testId: string) => Promise<void>
  fetchAttemptDetail: (testId: string, attemptId: string) => Promise<TestAttemptDetail | null>
  deleteAttempt: (testId: string, attemptId: string) => Promise<void>
}

export const useTestStore = create<TestState>((set) => ({
  tests: [],
  currentTest: null,
  attempts: [],
  currentAttemptDetail: null,
  isLoading: false,

  fetchTests: async () => {
    set({ isLoading: true })
    try {
      const res = await apiFetch('/api/tests')
      if (res.ok) {
        const tests = await res.json()
        set({ tests, isLoading: false })
        return
      }
    } catch { /* ignore */ }
    set({ isLoading: false })
  },

  fetchTest: async (id) => {
    try {
      const res = await apiFetch(`/api/tests/${id}`)
      if (res.ok) {
        const test = await res.json()
        set({ currentTest: test })
        return test
      }
    } catch { /* ignore */ }
    return null
  },

  createTest: async (title) => {
    const res = await apiFetch('/api/tests', {
      method: 'POST',
      body: JSON.stringify({ title }),
    })
    if (res.ok) {
      const created = await res.json()
      set((s) => ({ tests: [...s.tests, created] }))
      return created
    }
    return null
  },

  updateTest: async (test) => {
    await apiFetch(`/api/tests/${test.id}`, {
      method: 'PUT',
      body: JSON.stringify(test),
    })
  },

  deleteTest: async (id) => {
    await apiFetch(`/api/tests/${id}`, { method: 'DELETE' })
    set((s) => ({ tests: s.tests.filter((t) => t.id !== id) }))
  },

  submitAttempt: async (testId, group, firstName, lastName, answers, tabSwitchCount = 0) => {
    const res = await apiFetch(`/api/tests/${testId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ group, firstName, lastName, answers, tabSwitchCount }),
    })
    if (res.ok) return await res.json()
    return null
  },

  fetchAttempts: async (testId) => {
    try {
      const res = await apiFetch(`/api/tests/${testId}/attempts`)
      if (res.ok) {
        const attempts = await res.json()
        set({ attempts })
      }
    } catch { /* ignore */ }
  },

  fetchAttemptDetail: async (testId, attemptId) => {
    try {
      const res = await apiFetch(`/api/tests/${testId}/attempts/${attemptId}`)
      if (res.ok) {
        const detail = await res.json()
        set({ currentAttemptDetail: detail })
        return detail
      }
    } catch { /* ignore */ }
    return null
  },

  deleteAttempt: async (testId, attemptId) => {
    await apiFetch(`/api/tests/${testId}/attempts/${attemptId}`, { method: 'DELETE' })
    set((s) => ({ attempts: s.attempts.filter((a) => a.id !== attemptId) }))
  },
}))
