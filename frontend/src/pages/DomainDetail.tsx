import { useParams, Link } from 'react-router-dom';
import { useDomain } from '../hooks/useEntities';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { ResearchPanel } from '../components/research/ResearchPanel';

export function DomainDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: domainResponse, isLoading } = useDomain(id);
  const [showResearch, setShowResearch] = useState(false);

  const domain = domainResponse;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading domain...</p>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-500">Domain not found</p>
        <Link to="/domains" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Domains
        </Link>
      </div>
    );
  }

  const subdomains = domain.subdomains || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/domains"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Domains
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${domain.color}20`, color: domain.color }}
            >
              {domain.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{domain.name}</h1>
              {domain.description && (
                <p className="text-gray-600 mt-1">{domain.description}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowResearch(!showResearch)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Lightbulb size={18} />
            {showResearch ? 'Hide' : 'AI Research'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-sm text-gray-500">Subdomains</div>
          <div className="text-2xl font-bold text-gray-900">{subdomains.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-sm text-gray-500">MCPs</div>
          <div className="text-2xl font-bold text-gray-900">
            {subdomains.reduce((sum: number, sub: any) => sum + (sub.mcps?.length || 0), 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-sm text-gray-500">Built MCPs</div>
          <div className="text-2xl font-bold text-green-600">
            {subdomains.reduce(
              (sum: number, sub: any) =>
                sum + (sub.mcps?.filter((m: any) => m.status === 'built').length || 0),
              0
            )}
          </div>
        </div>
      </div>

      {/* Research Panel */}
      {showResearch && (
        <div className="mb-8">
          <ResearchPanel domainId={id!} />
        </div>
      )}

      {/* Subdomains */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Subdomains</h2>
        {subdomains.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center border border-gray-200">
            <p className="text-gray-500">No subdomains yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subdomains.map((subdomain: any) => (
              <div
                key={subdomain.id}
                className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{subdomain.name}</h3>
                    {subdomain.description && (
                      <p className="text-sm text-gray-600 mt-1">{subdomain.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {subdomain.mcps?.length || 0} MCPs
                  </span>
                </div>

                {/* MCPs in this subdomain */}
                {subdomain.mcps && subdomain.mcps.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {subdomain.mcps.map((mcp: any) => (
                      <div
                        key={mcp.id}
                        className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{mcp.name}</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              mcp.status === 'built'
                                ? 'bg-green-100 text-green-800'
                                : mcp.status === 'in-progress'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {mcp.status}
                          </span>
                        </div>
                        {mcp.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{mcp.description}</p>
                        )}
                        {mcp.tools && mcp.tools.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {mcp.tools.length} tool{mcp.tools.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
