export default function MCQManager() {
  return (
    <div className="p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">MCQ Manager</h2>
        <p className="text-gray-600 mt-1">Create, edit, and manage multiple choice questions for the tour</p>
      </div>

      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-blue-600">Total Questions</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-green-600">Active Questions</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <div className="text-sm text-yellow-600">Draft Questions</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Add New Question
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            Import Questions
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            Export Questions
          </button>
        </div>

        {/* Questions List Placeholder */}
        <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No questions found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first MCQ question.</p>
        </div>
      </div>
    </div>
  )
}
