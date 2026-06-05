import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTestStore } from '../stores/tests.ts'
import { TestAttemptDetail } from './TestAttemptDetail.tsx'

export function TestResults() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentTest, fetchTest, attempts, fetchAttempts, deleteAttempt } = useTestStore()
  const [detailAttemptId, setDetailAttemptId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchTest(id)
      fetchAttempts(id)
    }
  }, [id, fetchTest, fetchAttempts])

  const handleDelete = async (attemptId: string) => {
    if (!confirm('Delete this attempt?')) return
    if (id) await deleteAttempt(id, attemptId)
  }

  if (detailAttemptId && id) {
    return (
      <TestAttemptDetail
        testId={id}
        attemptId={detailAttemptId}
        onBack={() => setDetailAttemptId(null)}
      />
    )
  }

  if (!currentTest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Results: {currentTest.title}</h1>
          <button
            onClick={() => navigate('/admin/manager')}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
          >
            Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-3 text-sm font-medium text-gray-600">Group</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">First Name</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Last Name</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Correct</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Failed</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Skipped</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Score</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">%</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Status</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Tab Sw.</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Date</th>
                <th className="text-center p-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-gray-500">No attempts yet.</td>
                </tr>
              )}
              {attempts.map((attempt) => {
                const percentage = attempt.maxScore > 0 ? (attempt.score / attempt.maxScore) * 100 : 0
                const passed = percentage >= currentTest.passingScore

                return (
                  <tr key={attempt.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{attempt.group}</td>
                    <td className="p-3 text-sm">{attempt.firstName}</td>
                    <td className="p-3 text-sm">{attempt.lastName}</td>
                    <td className="p-3 text-sm text-center text-green-600">{attempt.correctCount}</td>
                    <td className="p-3 text-sm text-center text-red-600">{attempt.failedCount}</td>
                    <td className="p-3 text-sm text-center text-gray-400">{attempt.skippedCount}</td>
                    <td className="p-3 text-sm text-center">{attempt.score} / {attempt.maxScore}</td>
                    <td className="p-3 text-sm text-center">{Math.round(percentage)}%</td>
                    <td className="p-3 text-sm text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-center">
                      {attempt.tabSwitchCount > 0 ? (
                        <span className="text-amber-600 font-medium">{attempt.tabSwitchCount}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="p-3 text-sm text-center text-gray-500">
                      {attempt.completedAt ? new Date(attempt.completedAt).toLocaleString() : '-'}
                    </td>
                    <td className="p-3 text-sm text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setDetailAttemptId(attempt.id)}
                          className="text-indigo-500 hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(attempt.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
