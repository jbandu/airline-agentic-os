export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>Airline Agentic Operating System</p>
            <p className="text-xs text-gray-500 mt-1">Built with AI-powered automation</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Powered by</span>
            <span className="text-sm font-semibold text-blue-600">Number Labs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
