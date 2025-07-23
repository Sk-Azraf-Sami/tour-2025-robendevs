export default function PuzzleManager() {
  return (
    <div className="p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Puzzle Manager</h2>
        <p className="text-gray-600 mt-1">Create, edit, and manage puzzles and challenges for the tour</p>
      </div>

      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-green-600">Total Puzzles</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-blue-600">Active Puzzles</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <div className="text-sm text-yellow-600">Draft Puzzles</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-purple-600">Completed</div>
          </div>
        </div>

        {/* Puzzle Categories */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Puzzle Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Logic Puzzles</h4>
                  <p className="text-sm text-gray-500">0 puzzles</p>
                </div>
                <div className="text-2xl">🧩</div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Word Puzzles</h4>
                  <p className="text-sm text-gray-500">0 puzzles</p>
                </div>
                <div className="text-2xl">📝</div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Math Puzzles</h4>
                  <p className="text-sm text-gray-500">0 puzzles</p>
                </div>
                <div className="text-2xl">🔢</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            Create New Puzzle
          </button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
            Import Puzzles
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Puzzle Templates
          </button>
        </div>

        {/* Puzzles List Placeholder */}
        <div className="border border-gray-200 rounded-lg p-8 text-center bg-gray-50">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No puzzles found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first puzzle.</p>
        </div>
      </div>
    </div>
  )
}
