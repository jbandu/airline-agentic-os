import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { api } from '../../lib/api';

interface CriticalMCP {
  id: string;
  name: string;
  incomingConnections: number;
  outgoingConnections: number;
  criticalityScore: number;
  domain: string;
}

interface MCPDependency {
  id: string;
  sourceMcpId: string;
  targetMcpId: string;
  dependencyType: string;
  description: string | null;
  sourceMcp: {
    id: string;
    name: string;
    subdomain: {
      domain: {
        id: string;
        name: string;
        color: string;
      };
    };
  };
  targetMcp: {
    id: string;
    name: string;
    subdomain: {
      domain: {
        id: string;
        name: string;
        color: string;
      };
    };
  };
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  domain: string;
  domainColor: string;
  criticalityScore: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

export function DependencyGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [criticalMcps, setCriticalMcps] = useState<CriticalMCP[]>([]);
  const [dependencies, setDependencies] = useState<MCPDependency[]>([]);
  const [selectedMcp, setSelectedMcp] = useState<CriticalMCP | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [criticalRes, depsRes] = await Promise.all([
        api.get('/api/cross-domain/critical-mcps'),
        api.get('/api/cross-domain/mcp-dependencies'),
      ]);

      setCriticalMcps(criticalRes.data.data);
      setDependencies(depsRes.data);
    } catch (error) {
      console.error('Error fetching dependency data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!svgRef.current || criticalMcps.length === 0 || dependencies.length === 0) return;

    // Clear previous visualization
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 900;
    const height = 600;

    svg.attr('width', width).attr('height', height);

    // Prepare nodes and links
    const nodes: GraphNode[] = criticalMcps.map((mcp) => ({
      id: mcp.id,
      name: mcp.name,
      domain: mcp.domain,
      domainColor: '#3B82F6', // Default color
      criticalityScore: mcp.criticalityScore,
    }));

    const links: GraphLink[] = dependencies.map((dep) => ({
      source: dep.sourceMcpId,
      target: dep.targetMcpId,
      type: dep.dependencyType,
    }));

    // Update node colors from dependencies data
    dependencies.forEach((dep) => {
      const sourceNode = nodes.find((n) => n.id === dep.sourceMcpId);
      const targetNode = nodes.find((n) => n.id === dep.targetMcpId);
      if (sourceNode) sourceNode.domainColor = dep.sourceMcp.subdomain.domain.color;
      if (targetNode) targetNode.domainColor = dep.targetMcp.subdomain.domain.color;
    });

    const container = svg.append('g').attr('class', 'container');

    // Setup zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Create arrow markers
    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94A3B8');

    // Critical path marker (red)
    defs
      .append('marker')
      .attr('id', 'arrowhead-critical')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#EF4444');

    // Create force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Draw links
    const link = container
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#94A3B8')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');

    // Draw nodes
    const node = container
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any
      );

    // Node circles
    node
      .append('circle')
      .attr('r', (d) => 10 + d.criticalityScore * 2)
      .attr('fill', (d) => d.domainColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Node labels
    node
      .append('text')
      .text((d) => d.name)
      .attr('x', 0)
      .attr('y', (d) => 15 + d.criticalityScore * 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#374151')
      .attr('pointer-events', 'none');

    // Node interactions
    node
      .on('mouseover', function (_event, d) {
        d3.select(this).select('circle').attr('stroke-width', 4);

        // Highlight connected links
        link
          .attr('stroke', (l) => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return sourceId === d.id || targetId === d.id ? '#EF4444' : '#94A3B8';
          })
          .attr('stroke-width', (l) => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return sourceId === d.id || targetId === d.id ? 3 : 2;
          })
          .attr('marker-end', (l) => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return sourceId === d.id || targetId === d.id
              ? 'url(#arrowhead-critical)'
              : 'url(#arrowhead)';
          });

        // Show MCP details
        const mcpData = criticalMcps.find((m) => m.id === d.id);
        if (mcpData) {
          setSelectedMcp(mcpData);
        }
      })
      .on('mouseout', function () {
        d3.select(this).select('circle').attr('stroke-width', 2);

        link
          .attr('stroke', '#94A3B8')
          .attr('stroke-width', 2)
          .attr('marker-end', 'url(#arrowhead)');

        setSelectedMcp(null);
      });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (typeof d.source === 'string' ? 0 : d.source.x || 0))
        .attr('y1', (d) => (typeof d.source === 'string' ? 0 : d.source.y || 0))
        .attr('x2', (d) => (typeof d.target === 'string' ? 0 : d.target.x || 0))
        .attr('y2', (d) => (typeof d.target === 'string' ? 0 : d.target.y || 0));

      node.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    function dragstarted(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [criticalMcps, dependencies]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading dependency graph...</div>
      </div>
    );
  }

  if (criticalMcps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-4xl mb-4">🔗</div>
        <div className="text-lg font-medium">No MCP dependencies found</div>
        <div className="text-sm">Create dependencies to see the graph</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">MCP Dependency Graph</h3>
          <p className="text-sm text-gray-600 mt-1">
            Directed graph showing MCP dependencies. Node size indicates criticality score. Hover to
            highlight critical paths.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">{criticalMcps.length}</div>
          <div className="text-xs text-gray-600">MCPs Analyzed</div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Graph */}
        <div className="flex-1">
          <svg ref={svgRef} className="border border-gray-200 rounded-lg bg-gray-50"></svg>
        </div>

        {/* Details Panel */}
        <div className="w-80 space-y-4">
          {/* Selected MCP Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">MCP Details</h4>

            {selectedMcp ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Name</div>
                  <div className="font-medium text-gray-900">{selectedMcp.name}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 mb-1">Domain</div>
                  <div className="text-sm text-gray-700">{selectedMcp.domain}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 mb-1">Criticality Score</div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-red-600">
                      {selectedMcp.criticalityScore}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedMcp.criticalityScore > 10
                        ? 'Critical'
                        : selectedMcp.criticalityScore > 5
                        ? 'Important'
                        : 'Normal'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Incoming</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {selectedMcp.incomingConnections}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Outgoing</div>
                    <div className="text-lg font-semibold text-green-600">
                      {selectedMcp.outgoingConnections}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-8">
                Hover over a node to see details
              </div>
            )}
          </div>

          {/* Top Critical MCPs */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Most Critical MCPs</h4>
            <div className="space-y-2">
              {criticalMcps.slice(0, 5).map((mcp, idx) => (
                <div key={mcp.id} className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-white ${
                      idx === 0
                        ? 'bg-red-500'
                        : idx === 1
                        ? 'bg-orange-500'
                        : idx === 2
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{mcp.name}</div>
                    <div className="text-gray-500 truncate">{mcp.domain}</div>
                  </div>
                  <div className="font-bold text-gray-700">{mcp.criticalityScore}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-900 mb-2">Visualization Guide</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div>• <span className="font-medium">Node size</span> = Criticality score</div>
              <div>• <span className="font-medium">Red arrows</span> = Critical path (on hover)</div>
              <div>• <span className="font-medium">Drag</span> to reposition nodes</div>
              <div>• <span className="font-medium">Scroll</span> to zoom</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
