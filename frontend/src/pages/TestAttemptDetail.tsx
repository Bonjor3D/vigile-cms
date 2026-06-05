import { useEffect } from 'react'
import { useTestStore } from '../stores/tests.ts'

export function TestAttemptDetail({ testId, attemptId, onBack }: { testId: string; attemptId: string; onBack: () => void }) {
  const { currentAttemptDetail, fetchAttemptDetail } = useTestStore()

  useEffect(() => {
    fetchAttemptDetail(testId, attemptId)
  }, [testId, attemptId, fetchAttemptDetail])

  if (!currentAttemptDetail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  const { questions, answers } = currentAttemptDetail

  const getSelectedIds = (qId: string) => {
    const ans = answers?.find((a) => a.questionId === qId)
    return ans ? ans.selectedIds : []
  }

  const isQuestionCorrect = (qId: string) => {
    const question = questions?.find((q) => q.id === qId)
    if (!question) return false
    const correctIds = question.options.filter((o) => o.correct).map((o) => o.id)
    const selectedIds = getSelectedIds(qId)
    if (selectedIds.length === 0) return false
    return correctIds.length === selectedIds.length && correctIds.every((id) => selectedIds.includes(id))
  }

  const isQuestionSkipped = (qId: string) => getSelectedIds(qId).length === 0

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Attempt Detail</h1>
          <button onClick={onBack} className="text-sm px-3 py-1 border rounded hover:bg-gray-100">
            Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500">Group:</span> {currentAttemptDetail.group}</div>
            <div><span className="text-gray-500">Name:</span> {currentAttemptDetail.firstName} {currentAttemptDetail.lastName}</div>
            <div>
              <span className="text-gray-500">Score:</span>{' '}
              <span className="text-green-600">{currentAttemptDetail.correctCount} correct</span>
              {' | '}
              <span className="text-red-600">{currentAttemptDetail.failedCount} failed</span>
              {' | '}
              <span className="text-gray-400">{currentAttemptDetail.skippedCount} skipped</span>
            </div>
            <div>
              <span className="text-gray-500">Points:</span> {currentAttemptDetail.score} / {currentAttemptDetail.maxScore}
            </div>
            <div>
              <span className="text-gray-500">Tab switches:</span>{' '}
              <span className={currentAttemptDetail.tabSwitchCount > 0 ? 'text-amber-600' : ''}>
                {currentAttemptDetail.tabSwitchCount}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Completed:</span>{' '}
              {currentAttemptDetail.completedAt ? new Date(currentAttemptDetail.completedAt).toLocaleString() : '-'}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {questions?.map((q, qi) => {
            const selectedIds = getSelectedIds(q.id)
            const correct = isQuestionCorrect(q.id)
            const skipped = isQuestionSkipped(q.id)

            return (
              <div
                key={q.id}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  skipped ? 'border-l-gray-300' : correct ? 'border-l-green-500' : 'border-l-red-500'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">
                      {qi + 1}. {q.title}
                    </p>
                    {q.description && (
                      <p className="text-sm text-gray-500 mt-1">{q.description}</p>
                    )}
                    {q.type === 'multiple' && q.scoringMode && q.scoringMode !== 'all' && (
                      <p className="text-xs text-gray-400 mt-1">Scoring: {q.scoringMode}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ml-2 shrink-0 ${
                    skipped ? 'bg-gray-100 text-gray-500' : correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {skipped ? 'Skipped' : correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isSelected = selectedIds.includes(opt.id)
                    const isCorrectOpt = opt.correct

                    let optClass = 'flex items-center gap-3 p-3 rounded-lg border '
                    if (isSelected && isCorrectOpt) {
                      optClass += 'border-green-400 bg-green-50'
                    } else if (isSelected && !isCorrectOpt) {
                      optClass += 'border-red-400 bg-red-50'
                    } else if (!isSelected && isCorrectOpt) {
                      optClass += 'border-green-200 bg-green-50/50'
                    } else {
                      optClass += 'border-gray-200'
                    }

                    return (
                      <div key={opt.id} className={optClass}>
                        {q.type === 'single' ? (
                          <input type="radio" checked={isSelected} readOnly className="cursor-default" />
                        ) : (
                          <input type="checkbox" checked={isSelected} readOnly className="cursor-default rounded" />
                        )}
                        <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>{opt.text}</span>
                        {isCorrectOpt && (
                          <span className="ml-auto text-xs text-green-600 font-medium">Correct</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
