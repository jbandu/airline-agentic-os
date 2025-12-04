import { SimpleForceGraph } from './SimpleForceGraph';
import { useGraphData } from '../../hooks/useGraphData';
import type { GraphNode } from '../../hooks/useGraphData';

interface GraphContainerProps {
  onNodeClick?: (node: GraphNode) => void;
}

export function GraphContainer({ onNodeClick }: GraphContainerProps) {
  const { data, isLoading } = useGraphData();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center min-h-[500px] flex items-center justify-center">
        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading graph data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center min-h-[500px] flex items-center justify-center">
        <div>
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-sm text-gray-500 mb-4">
            The ecosystem graph is empty. The database has been seeded, but the graph may need time to load.
          </p>
          <p className="text-xs text-gray-400">
            Try refreshing the page, or check the browser console for errors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Ecosystem Graph</h3>
        <p className="text-sm text-gray-500">
          {data.nodes.length} nodes, {data.edges.length} connections
        </p>
      </div>
      <div className="w-full" style={{ height: '600px' }}>
        <SimpleForceGraph
          nodes={data.nodes}
          edges={data.edges}
          onNodeClick={onNodeClick}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500"></div>
          <span>Domains</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500"></div>
          <span>Subdomains</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>MCPs (Built)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
          <span>MCPs (In Progress)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-500"></div>
          <span>MCPs (Planned)</span>
        </div>
      </div>
    </div>
  );
}
