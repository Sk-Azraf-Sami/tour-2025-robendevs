export default function LiveDashboard() {
  return (
    <div className="p-6">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Live Dashboard</h2>
        <p className="text-gray-600 mt-1">Real-time statistics and monitoring of tour activities</p>
      </div>

      <div className="space-y-6">
        {/* Live Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-green-600">Active Users</div>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-blue-600">Total Participants</div>
              </div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">0</div>
                <div className="text-sm text-yellow-600">Questions Answered</div>
              </div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-purple-600">Completed Tours</div>
              </div>
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>System is ready and waiting for participants</span>
                <span className="text-xs text-gray-400">Just now</span>
              </div>
              {/* Placeholder for more activities */}
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2">No recent activity</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
            <div className="space-y-3">
              {/* Placeholder for leaderboard */}
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="mt-2">No participants yet</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Database: Online</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">API: Healthy</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Storage: Available</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-4">
          <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
            Emergency Stop
          </button>
          <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors">
            Pause System
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            Start Tour
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Export Data
          </button>
        </div>
      </div>
    </div>
  )
}
