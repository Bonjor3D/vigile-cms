import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTestStore } from '../stores/tests.ts'
import type { TestQuestion, TestOption } from '../types/test.ts'

function generateId() {
  return crypto.randomUUID()
}

function createOption(text = ''): TestOption {
  return { id: generateId(), text, correct: false }
}

function createQuestion(): TestQuestion {
  return {
    id: generateId(),
    title: '',
    type: 'single',
    points: 1,
    sortOrder: 0,
    options: [createOption(''), createOption('')],
  }
}

export function TestEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentTest, fetchTest, updateTest } = useTestStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeLimit, setTimeLimit] = useState('')
  const [passingScore, setPassingScore] = useState(80)
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) fetchTest(id)
  }, [id, fetchTest])

  useEffect(() => {
    if (currentTest && currentTest.id === id) {
      setTitle(currentTest.title)
      setDescription(currentTest.description || '')
      setTimeLimit(currentTest.timeLimit?.toString() || '')
      setPassingScore(currentTest.passingScore)
      setShuffleQuestions(currentTest.shuffleQuestions)
      setQuestions(currentTest.questions || [])
    }
  }, [currentTest, id])

  const handleSave = useCallback(async () => {
    if (!id) return
    setSaving(true)
    await updateTest({
      id,
      title,
      description: description || undefined,
      timeLimit: timeLimit ? parseInt(timeLimit) : null,
      passingScore,
      shuffleQuestions,
      questions: questions.map((q, i) => ({ ...q, sortOrder: i })),
    })
    setSaving(false)
  }, [id, title, description, timeLimit, passingScore, shuffleQuestions, questions, updateTest])

  const addQuestion = () => {
    setQuestions((prev) => [...prev, { ...createQuestion(), sortOrder: prev.length }])
  }

  const removeQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== qId))
  }

  const updateQuestion = (qId: string, patch: Partial<TestQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, ...patch } : q)))
  }

  const addOption = (qId: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, options: [...q.options, createOption('')] } : q)))
  }

  const removeOption = (qId: string, optId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, options: q.options.filter((o) => o.id !== optId) } : q))
    )
  }

  const updateOption = (qId: string, optId: string, patch: Partial<TestOption>) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, options: q.options.map((o) => (o.id === optId ? { ...o, ...patch } : o)) }
          : q
      )
    )
  }

  const toggleCorrect = (qId: string, optId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q
        if (q.type === 'single') {
          return { ...q, options: q.options.map((o) => ({ ...o, correct: o.id === optId })) }
        }
        return { ...q, options: q.options.map((o) => (o.id === optId ? { ...o, correct: !o.correct } : o)) }
      })
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Test Editor</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/manager')}
              className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Test Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
              <input
                type="number"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                max="100"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Shuffle questions</span>
              </label>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Questions</h2>
          {questions.map((q, qi) => (
            <div key={q.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-500">Question {qi + 1}</span>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Question text"
                  value={q.title}
                  onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={q.description || ''}
                  onChange={(e) => updateQuestion(q.id, { description: e.target.value || undefined })}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  rows={2}
                />
                <div className="flex gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Type</label>
                    <select
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, { type: e.target.value as 'single' | 'multiple' })}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="single">Single</option>
                      <option value="multiple">Multiple</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Points</label>
                    <input
                      type="number"
                      value={q.points}
                      onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })}
                      className="w-20 px-3 py-2 border rounded-md text-sm"
                      min="0"
                    />
                  </div>
                </div>
                {q.type === 'multiple' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Scoring mode</label>
                    <select
                      value={q.scoringMode || 'all'}
                      onChange={(e) => updateQuestion(q.id, { scoringMode: e.target.value as 'all' | 'partial' | 'subtractive' })}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">All or nothing</option>
                      <option value="partial">Partial (proportional)</option>
                      <option value="subtractive">Subtractive (wrong penalized)</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  {q.options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2 mb-2">
                      {q.type === 'single' ? (
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={opt.correct}
                          onChange={() => toggleCorrect(q.id, opt.id)}
                          className="cursor-pointer"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={opt.correct}
                          onChange={() => toggleCorrect(q.id, opt.id)}
                          className="cursor-pointer rounded"
                        />
                      )}
                      <input
                        type="text"
                        placeholder="Option text"
                        value={opt.text}
                        onChange={(e) => updateOption(q.id, opt.id, { text: e.target.value })}
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                      />
                      <button
                        onClick={() => removeOption(q.id, opt.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(q.id)}
                    className="text-sm text-indigo-500 hover:underline mt-1"
                  >
                    + Add Option
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
          >
            + Add Question
          </button>
        </div>
      </div>
    </div>
  )
}
