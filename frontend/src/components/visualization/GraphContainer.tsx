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
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Loading graph data...</p>
      </div>
    );
  }

  if (data.nodes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-sm text-gray-500 mb-4">
          The ecosystem graph is empty. Add domains, subdomains, and MCPs to see the visualization.
        </p>
        <p className="text-xs text-gray-400">
          Hint: Use the navigation menu to create your first domain.
        </p>
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
      <SimpleForceGraph
        nodes={data.nodes}
        edges={data.edges}
        onNodeClick={onNodeClick}
      />
      <div className="mt-4 flex gap-4 text-xs">
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
