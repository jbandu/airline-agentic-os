import { useEffect, useState } from 'react';
import { ForceGraph } from './ForceGraph';
import { GraphLegend } from './GraphLegend';
import { GraphNode, GraphEdge, GraphFilters, NodeType } from './types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { api } from '../../lib/api';

interface GraphContainerProps {
  onNodeClick?: (node: GraphNode) => void;
}

export function GraphContainer({ onNodeClick }: GraphContainerProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [filters, setFilters] = useState<GraphFilters>({
    nodeTypes: new Set<NodeType>(['domain']), // Default: only domains
    domains: new Set(),
    statuses: new Set(),
    searchQuery: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAgents, setShowAgents] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function fetchGraphData() {
      try {
        setLoading(true);
        const [domainsRes, subdomainsRes, mcpsRes, bridgesRes] = await Promise.all([
          api.get('/api/domains'),
          api.get('/api/subdomains'),
          api.get('/api/mcps'),
          api.get('/api/cross-domain/bridges'),
        ]);

        const domains = domainsRes.data;
        const subdomains = subdomainsRes.data.data || subdomainsRes.data;
        const mcps = mcpsRes.data;
        const bridges = bridgesRes.data;

        // Transform to graph nodes
        const graphNodes: GraphNode[] = [];
        const graphEdges: GraphEdge[] = [];

        // Add domain nodes
        domains.forEach((domain: any) => {
          graphNodes.push({
            id: domain.id,
            type: 'domain',
            name: domain.name,
            color: domain.color || '#3B82F6',
            icon: domain.icon,
            metadata: {
              subdomainCount: domain.subdomains?.length || 0,
            },
          });
        });

        // Add subdomain nodes and domain-subdomain edges
        subdomains.forEach((subdomain: any) => {
          graphNodes.push({
            id: subdomain.id,
            type: 'subdomain',
            name: subdomain.name,
            parentId: subdomain.domainId || subdomain.domain?.id,
            color: subdomain.domain?.color
              ? `${subdomain.domain.color}80`
              : '#10B98180',
          });

          if (subdomain.domainId || subdomain.domain?.id) {
            graphEdges.push({
              id: `domain-${subdomain.domainId || subdomain.domain?.id}-subdomain-${subdomain.id}`,
              source: subdomain.domainId || subdomain.domain?.id,
              target: subdomain.id,
              type: 'hierarchy',
            });
          }
        });

        // Add MCP nodes and subdomain-MCP edges
        mcps.forEach((mcp: any) => {
          if (mcp.subdomain?.id) {
            graphNodes.push({
              id: mcp.id,
              type: 'mcp',
              name: mcp.name,
              parentId: mcp.subdomain.id,
              status: mcp.status,
              color: '#8B5CF6',
              metadata: {
                toolCount: mcp.tools?.length || 0,
              },
            });

            graphEdges.push({
              id: `subdomain-${mcp.subdomain.id}-mcp-${mcp.id}`,
              source: mcp.subdomain.id,
              target: mcp.id,
              type: 'hierarchy',
            });
          }
        });

        // Add cross-domain bridge edges
        if (bridges && Array.isArray(bridges)) {
          bridges.forEach((bridge: any) => {
            if (bridge.sourceSubdomainId && bridge.targetSubdomainId) {
              graphEdges.push({
                id: `bridge-${bridge.id}`,
                source: bridge.sourceSubdomainId,
                target: bridge.targetSubdomainId,
                type: 'cross-domain',
                strength: bridge.strength,
              });
            }
          });
        }

        setNodes(graphNodes);
        setEdges(graphEdges);
      } catch (err) {
        console.error('Error fetching graph data:', err);
        setError('Failed to load visualization data');
      } finally {
        setLoading(false);
      }
    }

    fetchGraphData();
  }, []);

  // Fetch agents when enabled
  useEffect(() => {
    if (!showAgents) {
      // Remove agent nodes
      setNodes((prev) => prev.filter((n) => n.type !== 'agent'));
      setEdges((prev) => prev.filter((e) => e.type !== 'mcp-agent' && e.type !== 'collaboration'));
      return;
    }

    async function fetchAgents() {
      try {
        const agentsRes = await api.get('/api/agents');
        const agents = agentsRes.data;

        const newNodes = [...nodes.filter((n) => n.type !== 'agent')];
        const newEdges = [...edges.filter((e) => e.type !== 'mcp-agent' && e.type !== 'collaboration')];

        agents.forEach((agent: any) => {
          newNodes.push({
            id: agent.id,
            type: 'agent',
            name: agent.name,
            parentId: agent.mcpId,
            status: agent.active ? 'active' : 'inactive',
            color: agent.category?.color || '#8B5CF6',
            categoryCode: agent.category?.code,
            metadata: {
              autonomyLevel: agent.autonomyLevel,
            },
          });

          if (agent.mcpId) {
            newEdges.push({
              id: `mcp-${agent.mcpId}-agent-${agent.id}`,
              source: agent.mcpId,
              target: agent.id,
              type: 'mcp-agent',
            });
          }

          // Add collaboration edges
          if (agent.sourceCollaborations) {
            agent.sourceCollaborations.forEach((collab: any) => {
              newEdges.push({
                id: `collab-${collab.id}`,
                source: agent.id,
                target: collab.targetAgentId,
                type: 'collaboration',
                strength: collab.strength,
                bidirectional: collab.bidirectional,
              });
            });
          }
        });

        setNodes(newNodes);
        setEdges(newEdges);
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    }

    fetchAgents();
  }, [showAgents]);

  const toggleNodeType = (type: NodeType) => {
    setFilters((prev) => {
      const newTypes = new Set(prev.nodeTypes);
      if (newTypes.has(type)) {
        newTypes.delete(type);
      } else {
        newTypes.add(type);
      }
      return { ...prev, nodeTypes: newTypes };
    });
  };

  const resetView = () => {
    // Reset to domains-only view
    setFilters({
      nodeTypes: new Set<NodeType>(['domain']),
      domains: new Set(),
      statuses: new Set(),
      searchQuery: '',
    });
    setShowAgents(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <LoadingSpinner size="lg" message="Loading visualization..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">{error}</p>
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
    <div className={`space-y-4 ${isFullscreen ? 'p-6 bg-gray-900' : ''}`}>
      {/* Controls */}
      <div className={`border border-gray-200 rounded-lg p-4 ${isFullscreen ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className={`text-sm font-semibold mb-2 ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
              Layer Controls
            </h3>
            <div className="flex gap-2 flex-wrap">
              {(['domain', 'subdomain', 'mcp'] as NodeType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => toggleNodeType(type)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                    filters.nodeTypes.has(type)
                      ? 'bg-blue-500 border-blue-600 text-white shadow-lg'
                      : isFullscreen
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}s
                </button>
              ))}
              <button
                onClick={() => setShowAgents(!showAgents)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                  showAgents
                    ? 'bg-purple-500 border-purple-600 text-white shadow-lg'
                    : isFullscreen
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Agents {showAgents ? '✓' : ''}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`text-sm ${isFullscreen ? 'text-gray-300' : 'text-gray-600'}`}>
              <div>Nodes: <span className="font-semibold">{nodes.length}</span></div>
              <div>Edges: <span className="font-semibold">{edges.length}</span></div>
            </div>

            <div className="border-l border-gray-300 pl-3 flex gap-2">
              <button
                onClick={resetView}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  isFullscreen
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title="Reset to domains-only view"
              >
                🔄 Reset View
              </button>

              <button
                onClick={toggleFullscreen}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  isFullscreen
                    ? 'bg-red-600 border-red-700 text-white hover:bg-red-700'
                    : 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700'
                }`}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? '🗗 Exit Fullscreen' : '⛶ Fullscreen'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization */}
      <div className={isFullscreen ? 'flex gap-4' : 'grid grid-cols-1 lg:grid-cols-4 gap-4'}>
        <div className={isFullscreen ? 'flex-1' : 'lg:col-span-3'}>
          <ForceGraph
            nodes={nodes}
            edges={edges}
            filters={filters}
            onNodeClick={onNodeClick}
            width={isFullscreen ? window.innerWidth - 450 : 1000}
            height={isFullscreen ? window.innerHeight - 200 : 700}
          />
        </div>
        {!isFullscreen && (
          <div className="lg:col-span-1">
            <GraphLegend />
          </div>
        )}
        {isFullscreen && (
          <div className="w-80">
            <GraphLegend />
          </div>
        )}
      </div>
    </div>
  );
}
