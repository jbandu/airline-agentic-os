interface GraphNode {
  id: string;
  type: string;
  name: string;
}

interface GraphContainerProps {
  onNodeClick?: (node: GraphNode) => void;
}

// TODO: Refactor to use React Query hooks instead of direct api.get() calls
export function GraphContainer({ onNodeClick }: GraphContainerProps) {
  // Suppress unused variable warning
  void onNodeClick;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
      <p className="text-gray-500">Graph visualization temporarily disabled.</p>
      <p className="text-sm text-gray-400 mt-2">Coming back soon with improved data fetching.</p>
    </div>
  );
}
