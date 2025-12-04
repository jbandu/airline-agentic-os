import { useEffect, useState } from 'react';
import { StatCard } from '../../components/stats/StatCard';
import { BuildProgress } from '../../components/stats/BuildProgress';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { api } from '../../lib/api';

interface OverviewStats {
  domains: number;
  subdomains: number;
  mcps: number;
  tools: number;
  agents: number;
  workflows: number;
}

interface BuildProgressData {
  counts: {
    built: number;
    inProgress: number;
    planned: number;
    total: number;
  };
  percentages: {
    built: number;
    inProgress: number;
    planned: number;
  };
}

interface DomainStat {
  id: string;
  name: string;
  icon: string;
  color: string;
  subdomainCount: number;
  mcpCount: number;
  toolCount: number;
  toolsByStatus: {
    built: number;
    inProgress: number;
    planned: number;
  };
}

export function CommandCenter() {
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [buildProgress, setBuildProgress] = useState<BuildProgressData | null>(null);
  const [domainStats, setDomainStats] = useState<DomainStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [overviewRes, progressRes, domainsRes] = await Promise.all([
          api.get('/api/stats/overview'),
          api.get('/api/stats/build-progress'),
          api.get('/api/stats/by-domain'),
        ]);

        setOverviewStats(overviewRes.data.data);
        setBuildProgress(progressRes.data.data);
        setDomainStats(domainsRes.data.data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading Command Center..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">{ error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage your airline's agentic operating system
          </p>
        </div>

        {/* Stats Grid */}
        {overviewStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Domains"
              value={overviewStats.domains}
              icon="🗂️"
              color="#3B82F6"
              link="/domains"
              subtitle={`${overviewStats.subdomains} subdomains`}
            />
            <StatCard
              title="MCPs"
              value={overviewStats.mcps}
              icon="🔧"
              color="#10B981"
              link="/mcps"
              subtitle={`${overviewStats.tools} tools`}
            />
            <StatCard
              title="Agents"
              value={overviewStats.agents}
              icon="🤖"
              color="#8B5CF6"
              link="/agents"
              subtitle="AI-powered automation"
            />
            <StatCard
              title="Workflows"
              value={overviewStats.workflows}
              icon="⚡"
              color="#F59E0B"
              link="/workflows"
              subtitle="Active processes"
            />
          </div>
        )}

        {/* Build Progress */}
        {buildProgress && (
          <div className="mb-8">
            <BuildProgress
              built={buildProgress.counts.built}
              inProgress={buildProgress.counts.inProgress}
              planned={buildProgress.counts.planned}
              total={buildProgress.counts.total}
            />
          </div>
        )}

        {/* Domain Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Domain Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {domainStats.map((domain) => (
              <div
                key={domain.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-3">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${domain.color}20`, color: domain.color }}
                  >
                    {domain.icon}
                  </div>
                  <h3 className="ml-3 text-sm font-semibold text-gray-900 line-clamp-2">
                    {domain.name}
                  </h3>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subdomains:</span>
                    <span className="font-semibold text-gray-900">{domain.subdomainCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">MCPs:</span>
                    <span className="font-semibold text-gray-900">{domain.mcpCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tools:</span>
                    <span className="font-semibold text-gray-900">{domain.toolCount}</span>
                  </div>
                </div>

                {/* Mini Progress */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Build Progress</span>
                    <span>
                      {domain.toolCount > 0
                        ? Math.round((domain.toolsByStatus.built / domain.toolCount) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden flex">
                    {domain.toolsByStatus.built > 0 && (
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${(domain.toolsByStatus.built / domain.toolCount) * 100}%`,
                        }}
                      ></div>
                    )}
                    {domain.toolsByStatus.inProgress > 0 && (
                      <div
                        className="bg-blue-500"
                        style={{
                          width: `${(domain.toolsByStatus.inProgress / domain.toolCount) * 100}%`,
                        }}
                      ></div>
                    )}
                    {domain.toolsByStatus.planned > 0 && (
                      <div
                        className="bg-gray-400"
                        style={{
                          width: `${(domain.toolsByStatus.planned / domain.toolCount) * 100}%`,
                        }}
                      ></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a
              href="/domains"
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-3xl mb-2">🗂️</span>
              <span className="text-sm font-medium text-gray-700">Explore Domains</span>
            </a>
            <a
              href="/mcps"
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <span className="text-3xl mb-2">🔧</span>
              <span className="text-sm font-medium text-gray-700">View MCPs</span>
            </a>
            <a
              href="/agents"
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <span className="text-3xl mb-2">🤖</span>
              <span className="text-sm font-medium text-gray-700">Agent Network</span>
            </a>
            <a
              href="/workflows"
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
            >
              <span className="text-3xl mb-2">⚡</span>
              <span className="text-sm font-medium text-gray-700">Workflows</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
