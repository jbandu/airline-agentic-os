import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Command Center', icon: '🎯' },
    { path: '/domains', label: 'Domains', icon: '🗂️' },
    { path: '/mcps', label: 'MCPs', icon: '🔧' },
    { path: '/agents', label: 'Agents', icon: '🤖' },
    { path: '/workflows', label: 'Workflows', icon: '⚡' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <span className="text-3xl">✈️</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Airline Agentic OS</h1>
                <p className="text-xs text-gray-500">Command Center</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
