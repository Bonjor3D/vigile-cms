export interface TestQuestion {
  id: string
  title: string
  description?: string
  type: 'single' | 'multiple'
  points: number
  sortOrder: number
  options: TestOption[]
  scoringMode?: 'all' | 'partial' | 'subtractive'
}

export interface TestOption {
  id: string
  text: string
  correct: boolean
}

export interface Test {
  id: string
  title: string
  description: string
  timeLimit: number | null
  passingScore: number
  shuffleQuestions: boolean
  questions: TestQuestion[]
  createdAt: string
  updatedAt: string
}

export interface TestAttempt {
  id: string
  group: string
  firstName: string
  lastName: string
  score: number
  maxScore: number
  correctCount: number
  failedCount: number
  skippedCount: number
  tabSwitchCount: number
  startedAt: string
  completedAt: string | null
}

export interface TestAttemptDetail extends TestAttempt {
  answers: { questionId: string; selectedIds: string[] }[]
  questions: TestQuestion[]
}

export interface TestAnswer {
  questionId: string
  selectedIds: string[]
}
