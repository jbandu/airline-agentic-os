import { useState } from 'react';
import { StatCard } from '../../components/stats/StatCard';
import { BuildProgress } from '../../components/stats/BuildProgress';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { GraphContainer } from '../../components/visualization/GraphContainer';
import { useOverviewStats, useBuildProgress } from '../../hooks/useEntities';

export function CommandCenter() {
  const [showVisualization, setShowVisualization] = useState(false);

  const { data: overviewStats, isLoading: statsLoading, error: statsError } = useOverviewStats();
  const { data: buildProgressData, isLoading: progressLoading } = useBuildProgress();

  const loading = statsLoading || progressLoading;
  const error = statsError ? 'Failed to load dashboard data' : null;

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
        {buildProgressData && (
          <div className="mb-8">
            <BuildProgress
              built={buildProgressData.builtMCPs}
              inProgress={buildProgressData.inProgressMCPs}
              planned={buildProgressData.plannedMCPs}
              total={buildProgressData.totalMCPs}
            />
          </div>
        )}

        {/* Ecosystem Visualization */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Ecosystem Visualization</h2>
            <button
              onClick={() => setShowVisualization(!showVisualization)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>{showVisualization ? '📊 Hide' : '🌐 Show'} Graph</span>
            </button>
          </div>
          {showVisualization && (
            <GraphContainer
              onNodeClick={(node) => {
                console.log('Node clicked:', node);
                // Could navigate to detail page or show modal
              }}
            />
          )}
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
