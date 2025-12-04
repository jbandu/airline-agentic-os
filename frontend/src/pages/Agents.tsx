import { useAgents } from '../hooks/useEntities';

export function Agents() {
  const { data: agents, isLoading } = useAgents();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
        <p className="mt-2 text-gray-600">
          Manage your AI agents and their configurations
        </p>
      </div>

      {!agents || agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No agents configured yet.</p>
          <p className="text-sm text-gray-400 mt-2">Agent management coming soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {agents.map((agent: any) => (
          <div
            key={agent.id}
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{agent.category?.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {agent.name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {agent.category?.name}
                  </span>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  agent.active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {agent.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <p className="mt-4 text-sm text-gray-600">{agent.description}</p>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Code: {agent.code}</span>
                <span>Level: {agent.autonomyLevel}/5</span>
              </div>
            </div>

            {agent.mcp && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-xs text-gray-500">Powered by:</span>
                <p className="text-sm font-medium text-blue-600">
                  {agent.mcp.name}
                </p>
              </div>
            )}
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
