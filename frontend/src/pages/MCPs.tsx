import { useMCPs } from '../hooks/useEntities';

const statusColors = {
  built: 'bg-green-100 text-green-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  planned: 'bg-gray-100 text-gray-800',
};

export function MCPs() {
  const { data: mcps, isLoading } = useMCPs();

  if (isLoading) {
    return <div>Loading MCPs...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Model Context Protocols (MCPs)
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your AI-powered context protocols and tools
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {mcps?.map((mcp: any) => (
            <li key={mcp.id}>
              <div className="px-6 py-5 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {mcp.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[mcp.status as keyof typeof statusColors]
                        }`}
                      >
                        {mcp.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {mcp.description}
                    </p>
                    <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                      <span>
                        Domain: {mcp.subdomain?.domain?.name || 'N/A'}
                      </span>
                      <span>
                        Subdomain: {mcp.subdomain?.name || 'N/A'}
                      </span>
                      {mcp.targetQuarter && (
                        <span>Target: {mcp.targetQuarter}</span>
                      )}
                      {mcp.owner && <span>Owner: {mcp.owner}</span>}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {mcp.tools?.length || 0} tools
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
