export default function AdminWelcome() {
  return (
    <div className="p-6 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Admin Dashboard</h2>
        <p className="text-lg text-gray-600 mb-8">
          Select one of the management sections above to get started with configuring your tour.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📝 MCQ Manager</h3>
            <p className="text-blue-700">Create and manage multiple choice questions for participants.</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-2">🧩 Puzzle Manager</h3>
            <p className="text-green-700">Design engaging puzzles and challenges for the tour.</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">⚙️ Global Settings</h3>
            <p className="text-purple-700">Configure application-wide settings and preferences.</p>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-2">📊 Live Dashboard</h3>
            <p className="text-red-700">Monitor real-time activity and system status.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
