import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

interface Domain {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Subdomain {
  id: string;
  name: string;
  description: string | null;
  status: string;
  domain: Domain;
}

interface ImpactResult {
  affectedDomains: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    bridgeCount: number;
  }>;
  bridges: any[];
  mcpDependencies: any[];
  totalImpact: number;
}

export function ImpactAnalysis() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedSubdomain, setSelectedSubdomain] = useState<string>('');
  const [impactResult, setImpactResult] = useState<ImpactResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      const [domainsRes, subdomainsRes] = await Promise.all([
        api.get('/api/domains'),
        api.get('/api/subdomains'),
      ]);

      setDomains(domainsRes.data);
      setSubdomains(subdomainsRes.data);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleDomainChange = (domainId: string) => {
    setSelectedDomain(domainId);
    setSelectedSubdomain('');
    setImpactResult(null);
  };

  const handleSubdomainChange = async (subdomainId: string) => {
    setSelectedSubdomain(subdomainId);

    if (!subdomainId) {
      setImpactResult(null);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/api/cross-domain/impact/${subdomainId}`);
      setImpactResult(response.data.data);
    } catch (error) {
      console.error('Error fetching impact analysis:', error);
      setImpactResult(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubdomains = selectedDomain
    ? subdomains.filter((s) => s.domain.id === selectedDomain)
    : subdomains;

  const selectedSubdomainData = subdomains.find((s) => s.id === selectedSubdomain);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Cross-Domain Impact Analysis</h3>
        <p className="text-sm text-gray-600 mt-1">
          Select a subdomain to analyze the ripple effect of changes across domains.
        </p>
      </div>

      {/* Selection Controls */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Domain Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Domain (Optional)
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => handleDomainChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Domains</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.icon} {domain.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subdomain Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subdomain <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubdomain}
              onChange={(e) => handleSubdomainChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Choose a subdomain...</option>
              {filteredSubdomains.map((subdomain) => (
                <option key={subdomain.id} value={subdomain.id}>
                  {subdomain.domain.icon} {subdomain.name} ({subdomain.domain.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSubdomainData && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-3xl">{selectedSubdomainData.domain.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{selectedSubdomainData.name}</div>
                <div className="text-sm text-gray-600">{selectedSubdomainData.domain.name}</div>
                {selectedSubdomainData.description && (
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedSubdomainData.description}
                  </div>
                )}
              </div>
              <div
                className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedSubdomainData.status === 'built'
                    ? 'bg-green-100 text-green-800'
                    : selectedSubdomainData.status === 'in-progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {selectedSubdomainData.status}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Analyzing impact...</div>
        </div>
      )}

      {/* Impact Results */}
      {!loading && impactResult && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{impactResult.totalImpact}</div>
              <div className="text-sm text-gray-600 mt-1">Affected Domains</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">{impactResult.bridges.length}</div>
              <div className="text-sm text-gray-600 mt-1">Cross-Domain Bridges</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {impactResult.mcpDependencies.length}
              </div>
              <div className="text-sm text-gray-600 mt-1">MCP Dependencies</div>
            </div>
          </div>

          {/* Affected Domains */}
          {impactResult.affectedDomains.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">
                Affected Domains ({impactResult.affectedDomains.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {impactResult.affectedDomains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-2xl">{domain.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{domain.name}</div>
                      <div className="text-xs text-gray-600">{domain.bridgeCount} connections</div>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: domain.color }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact Visualization */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Impact Ripple Effect</h4>
            <div className="space-y-3">
              {/* Source Subdomain */}
              <div className="flex items-center">
                <div className="w-32 text-sm font-medium text-gray-700">Source</div>
                <div className="flex-1">
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
                    style={{
                      backgroundColor: selectedSubdomainData?.domain.color + '20',
                      color: selectedSubdomainData?.domain.color,
                    }}
                  >
                    <span className="text-xl">{selectedSubdomainData?.domain.icon}</span>
                    <span>{selectedSubdomainData?.name}</span>
                  </div>
                </div>
              </div>

              {/* Bridges */}
              {impactResult.bridges.length > 0 && (
                <>
                  <div className="flex items-center">
                    <div className="w-32 text-sm font-medium text-gray-700">Via Bridges</div>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {impactResult.bridges.slice(0, 5).map((bridge, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium"
                        >
                          {bridge.name}
                        </div>
                      ))}
                      {impactResult.bridges.length > 5 && (
                        <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          +{impactResult.bridges.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* MCP Dependencies */}
              {impactResult.mcpDependencies.length > 0 && (
                <>
                  <div className="flex items-center">
                    <div className="w-32 text-sm font-medium text-gray-700">Via Dependencies</div>
                    <div className="flex-1 flex flex-wrap gap-2">
                      {impactResult.mcpDependencies.slice(0, 5).map((dep, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium"
                        >
                          {dep.dependencyType}
                        </div>
                      ))}
                      {impactResult.mcpDependencies.length > 5 && (
                        <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          +{impactResult.mcpDependencies.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Affected Domains */}
              <div className="flex items-center">
                <div className="w-32 text-sm font-medium text-gray-700">Impacts</div>
                <div className="flex-1 flex flex-wrap gap-2">
                  {impactResult.affectedDomains.map((domain) => (
                    <div
                      key={domain.id}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: domain.color + '20',
                        color: domain.color,
                      }}
                    >
                      <span>{domain.icon}</span>
                      <span>{domain.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {impactResult.totalImpact === 0 && (
              <div className="text-center text-gray-500 py-8">
                <div className="text-3xl mb-2">✓</div>
                <div className="font-medium">No cross-domain impact detected</div>
                <div className="text-sm">This subdomain operates independently</div>
              </div>
            )}
          </div>

          {/* Risk Assessment */}
          <div className="bg-gradient-to-r from-yellow-50 to-red-50 border border-yellow-200 rounded-lg p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>⚠️</span>
              <span>Risk Assessment</span>
            </h4>
            <div className="space-y-2 text-sm">
              {impactResult.totalImpact === 0 && (
                <div className="flex items-start gap-2">
                  <div className="text-green-600 font-bold">LOW</div>
                  <div className="text-gray-700">
                    Changes to this subdomain have minimal cross-domain impact. Safe to modify
                    independently.
                  </div>
                </div>
              )}
              {impactResult.totalImpact > 0 && impactResult.totalImpact <= 2 && (
                <div className="flex items-start gap-2">
                  <div className="text-yellow-600 font-bold">MEDIUM</div>
                  <div className="text-gray-700">
                    Changes will affect {impactResult.totalImpact} other domain(s). Coordinate with
                    affected teams before making major changes.
                  </div>
                </div>
              )}
              {impactResult.totalImpact > 2 && (
                <div className="flex items-start gap-2">
                  <div className="text-red-600 font-bold">HIGH</div>
                  <div className="text-gray-700">
                    This is a critical integration point affecting {impactResult.totalImpact} domains.
                    Requires careful planning and cross-team coordination for any changes.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Selection State */}
      {!loading && !impactResult && !selectedSubdomain && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <div className="text-4xl mb-4">💥</div>
          <div className="text-lg font-medium">Select a subdomain to analyze</div>
          <div className="text-sm">See how changes ripple across your system</div>
        </div>
      )}
    </div>
  );
}
