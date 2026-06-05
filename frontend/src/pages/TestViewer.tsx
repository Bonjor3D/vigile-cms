import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTestStore } from '../stores/tests.ts'
import { useSettingsStore } from '../stores/settings.ts'
import { Renderer, ResponsiveStyles } from '../renderer/Renderer.tsx'
import type { TestAnswer } from '../types/test.ts'

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function TestViewer() {
  const { id } = useParams<{ id: string }>()
  const { currentTest, fetchTest, submitAttempt } = useTestStore()
  const { fetchSettings, header, footer } = useSettingsStore()

  const [loaded, setLoaded] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [phase, setPhase] = useState<'start' | 'test' | 'result'>('start')
  const [group, setGroup] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [timeWarningAck, setTimeWarningAck] = useState(false)

  // Test state
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [result, setResult] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  // Tab switch tracking
  useEffect(() => {
    if (phase !== 'test') return
    const handle = () => {
      if (document.hidden) setTabSwitchCount((c) => c + 1)
    }
    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [phase])

  // Timer
  useEffect(() => {
    if (phase !== 'test' || !currentTest?.timeLimit) return

    if (timerRef.current) clearInterval(timerRef.current)

    const total = currentTest.timeLimit * 60
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const remaining = Math.max(0, total - elapsed)
      setTimeLeft(remaining)

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        handleSubmit()
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, currentTest?.timeLimit])

  useEffect(() => {
    fetchSettings()
    if (id) {
      setLoaded(false)
      setNotFound(false)
      fetchTest(id).then((t) => {
        setLoaded(true)
        if (!t) setNotFound(true)
      })
    }
  }, [id, fetchTest, fetchSettings])

  const handleSelect = useCallback((questionId: string, optionId: string, type: 'single' | 'multiple') => {
    setAnswers((prev) => {
      if (type === 'single') {
        return { ...prev, [questionId]: [optionId] }
      }
      const current = prev[questionId] || []
      return {
        ...prev,
        [questionId]: current.includes(optionId)
          ? current.filter((o) => o !== optionId)
          : [...current, optionId],
      }
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!id || submitting) return
    setSubmitting(true)

    const answerList: TestAnswer[] = Object.entries(answers).map(([questionId, selectedIds]) => ({
      questionId,
      selectedIds,
    }))

    const res = await submitAttempt(id, group, firstName, lastName, answerList, tabSwitchCount)
    if (res) {
      setResult(res)
      setPhase('result')
      if (timerRef.current) clearInterval(timerRef.current)
    }
    setSubmitting(false)
  }, [id, submitting, answers, group, firstName, lastName, tabSwitchCount, submitAttempt])

  const startTest = () => {
    setPhase('test')
    setQuestionIndex(0)
  }

  const isAnswered = (qId: string) => (answers[qId] || []).length > 0

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (notFound || !currentTest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-300 mb-2">404</h1>
          <p className="text-gray-500">Test not found</p>
        </div>
      </div>
    )
  }

  const hasTimeLimit = !!currentTest.timeLimit && currentTest.timeLimit > 0
  const questions = currentTest.questions
  const totalQuestions = questions.length
  const currentQuestion = questions[questionIndex]
  const canStart = group.trim() && firstName.trim() && lastName.trim() && (!hasTimeLimit || timeWarningAck)

  // Start screen
  if (phase === 'start') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {header && <><ResponsiveStyles node={header} /><Renderer node={header} /></>}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-lg">
            <h1 className="text-2xl font-bold mb-2">{currentTest.title}</h1>
            {currentTest.description && (
              <p className="text-gray-600 mb-6">{currentTest.description}</p>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                <input
                  type="text"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Group"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Doe"
                />
              </div>
            </div>

            {hasTimeLimit && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                <p className="text-amber-800 text-sm font-medium mb-2">Time limit: {currentTest.timeLimit} minutes</p>
                <p className="text-amber-700 text-sm mb-2">
                  This test has a time limit. Once you start, the timer will count down and the test will auto-submit when time runs out.
                </p>
                <label className="flex items-center gap-2 text-sm text-amber-700">
                  <input
                    type="checkbox"
                    checked={timeWarningAck}
                    onChange={(e) => setTimeWarningAck(e.target.checked)}
                    className="rounded"
                  />
                  I understand
                </label>
              </div>
            )}

            <button
              onClick={startTest}
              disabled={!canStart}
              className="w-full bg-indigo-500 text-white py-3 rounded-md hover:bg-indigo-600 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Test
            </button>
          </div>
        </div>
        {footer && <><ResponsiveStyles node={footer} /><Renderer node={footer} /></>}
      </div>
    )
  }

  // Result screen
  if (phase === 'result' && result) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {header && <><ResponsiveStyles node={header} /><Renderer node={header} /></>}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-lg text-center">
            <div className={`text-6xl mb-4 ${result.passed ? 'text-green-500' : 'text-red-500'}`}>
              {result.passed ? '✓' : '✗'}
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {result.passed ? 'Test Passed!' : 'Test Failed'}
            </h1>

            <div className="space-y-2 mb-4">
              <p className="text-gray-600">
                Score: {result.score} / {result.maxScore} ({Math.round(result.percentage)}%)
              </p>
              <p className="text-gray-600">
                Correct: {result.correctCount} | Failed: {result.failedCount} | Skipped: {result.skippedCount}
              </p>
              {result.tabSwitchCount > 0 && (
                <p className="text-amber-600 text-sm">
                  Tab switches detected: {result.tabSwitchCount}
                </p>
              )}
              <p className="text-gray-500 text-sm">
                Passing score: {currentTest.passingScore}%
              </p>
            </div>
          </div>
        </div>
        {footer && <><ResponsiveStyles node={footer} /><Renderer node={footer} /></>}
      </div>
    )
  }

  // Test screen
  return (
    <div className="min-h-screen bg-gray-50/80 flex flex-col">
      {header && <><ResponsiveStyles node={header} /><Renderer node={header} /></>}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-md w-full sm:max-w-2xl flex flex-col" style={{ maxHeight: '95vh' }}>
          {/* Header: question number + timer */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b shrink-0">
            <span className="text-sm font-medium text-gray-600">
              Question {questionIndex + 1} of {totalQuestions}
            </span>
            {hasTimeLimit && timeLeft !== null && (
              <span className={`text-sm font-mono font-bold ${timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
                {formatTime(timeLeft)}
              </span>
            )}
          </div>

          {/* Question body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <p className="text-lg font-medium mb-1">
              {currentQuestion.title}
              <span className="text-sm text-gray-400 ml-2">({currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''})</span>
            </p>
            {currentQuestion.description && (
              <p className="text-sm text-gray-500 mb-4">{currentQuestion.description}</p>
            )}
            {currentQuestion.type === 'multiple' && currentQuestion.scoringMode && currentQuestion.scoringMode !== 'all' && (
              <p className="text-xs text-amber-600 mb-3">Scoring: {currentQuestion.scoringMode === 'partial' ? 'Partial credit' : 'Subtractive'}</p>
            )}

            <div className="space-y-3">
              {currentQuestion.options.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    (answers[currentQuestion.id] || []).includes(opt.id)
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {currentQuestion.type === 'single' ? (
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      checked={(answers[currentQuestion.id] || []).includes(opt.id)}
                      onChange={() => handleSelect(currentQuestion.id, opt.id, 'single')}
                      className="cursor-pointer"
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={(answers[currentQuestion.id] || []).includes(opt.id)}
                      onChange={() => handleSelect(currentQuestion.id, opt.id, 'multiple')}
                      className="cursor-pointer rounded"
                    />
                  )}
                  <span className="text-sm sm:text-base">{opt.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t shrink-0">
            <button
              onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
              disabled={questionIndex === 0}
              className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex gap-2">
              {questionIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setQuestionIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
                >
                  {isAnswered(currentQuestion.id) ? 'Next' : 'Skip'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 text-sm bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Finish'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {footer && <><ResponsiveStyles node={footer} /><Renderer node={footer} /></>}
    </div>
  )
}
