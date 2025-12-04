import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import {
  GraphNode,
  GraphEdge,
  ForceGraphProps,
  TooltipData,
} from './types';

const NODE_SIZES = {
  domain: 60,
  subdomain: 35,
  mcp: 25,
  agent: 18,
};

const STATUS_COLORS = {
  built: '#10B981',
  'in-progress': '#3B82F6',
  planned: '#9CA3AF',
  active: '#10B981',
  inactive: '#6B7280',
};

const EDGE_STYLES = {
  hierarchy: { width: 3, dash: '0', color: '#94A3B8' },
  'mcp-agent': { width: 1.5, dash: '5,5', color: '#CBD5E1' },
  'cross-domain': { width: 2, dash: '10,5', color: '#F59E0B' },
  collaboration: { width: 1, dash: '2,2', color: '#8B5CF6' },
};

export function ForceGraph({
  nodes,
  edges,
  filters,
  onNodeClick,
  onNodeHover,
  width = 1200,
  height = 800,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);

  // Filter nodes and edges based on filters
  const filteredNodes = useCallback(() => {
    if (!filters) return nodes;
    return nodes.filter((node) => {
      if (filters.nodeTypes.size > 0 && !filters.nodeTypes.has(node.type)) return false;
      if (filters.statuses.size > 0 && node.status && !filters.statuses.has(node.status))
        return false;
      if (filters.searchQuery && !node.name.toLowerCase().includes(filters.searchQuery.toLowerCase()))
        return false;
      return true;
    });
  }, [nodes, filters]);

  const filteredEdges = useCallback(() => {
    const nodeIds = new Set(filteredNodes().map((n) => n.id));
    return edges.filter((edge) => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
  }, [edges, filteredNodes]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const visibleNodes = filteredNodes();
    const visibleEdges = filteredEdges();

    // Create container for zoom
    const container = svg.append('g').attr('class', 'container');

    // Setup zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Create arrow markers for directed edges
    const defs = svg.append('defs');
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Create force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(visibleNodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphEdge>(visibleEdges)
          .id((d) => d.id)
          .distance((d) => {
            if (d.type === 'hierarchy') return 100;
            if (d.type === 'mcp-agent') return 50;
            if (d.type === 'cross-domain') return 200;
            return 80;
          })
          .strength((d) => (d.type === 'hierarchy' ? 0.8 : 0.3))
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide<GraphNode>().radius((d) => NODE_SIZES[d.type] + 5)
      );

    simulationRef.current = simulation;

    // Position domain nodes in a circle
    const domainNodes = visibleNodes.filter((n) => n.type === 'domain');
    const radius = Math.min(width, height) * 0.35;
    domainNodes.forEach((node, i) => {
      const angle = (i / domainNodes.length) * 2 * Math.PI;
      node.fx = width / 2 + radius * Math.cos(angle);
      node.fy = height / 2 + radius * Math.sin(angle);
    });

    // Draw edges
    const link = container
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(visibleEdges)
      .join('line')
      .attr('stroke', (d) => EDGE_STYLES[d.type].color)
      .attr('stroke-width', (d) => EDGE_STYLES[d.type].width)
      .attr('stroke-dasharray', (d) => EDGE_STYLES[d.type].dash)
      .attr('opacity', 0.6);

    // Animate cross-domain bridges
    link
      .filter((d) => d.type === 'cross-domain')
      .attr('stroke-dashoffset', 50)
      .transition()
      .duration(5000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0)
      .on('end', function repeat() {
        d3.select(this)
          .transition()
          .duration(5000)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0)
          .on('end', repeat);
      });

    // Draw nodes
    const node = container
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(visibleNodes)
      .join('g')
      .attr('class', 'node')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any
      );

    // Draw node shapes
    node.each(function (d) {
      const nodeGroup = d3.select(this);
      const size = NODE_SIZES[d.type];

      if (d.type === 'agent') {
        // Hexagon for agents
        const points = Array.from({ length: 6 }, (_, i) => {
          const angle = (i / 6) * 2 * Math.PI - Math.PI / 2;
          return `${size * Math.cos(angle)},${size * Math.sin(angle)}`;
        }).join(' ');

        nodeGroup
          .append('polygon')
          .attr('points', points)
          .attr('fill', d.color || '#8B5CF6')
          .attr('stroke', d.status ? STATUS_COLORS[d.status] : '#4B5563')
          .attr('stroke-width', 2);
      } else {
        // Circle for other node types
        nodeGroup
          .append('circle')
          .attr('r', size)
          .attr('fill', d.color || '#3B82F6')
          .attr('stroke', d.status ? STATUS_COLORS[d.status] : '#4B5563')
          .attr('stroke-width', d.type === 'domain' ? 3 : 2)
          .attr('opacity', getNodeOpacity(d));
      }

      // Add icon/label
      if (d.type === 'domain' || d.type === 'subdomain') {
        nodeGroup
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', d.type === 'domain' ? '.35em' : '.35em')
          .attr('font-size', d.type === 'domain' ? '24px' : '16px')
          .attr('pointer-events', 'none')
          .text(d.icon || d.name.slice(0, 2).toUpperCase());
      }
    });

    // Add labels for domain nodes
    node
      .filter((d) => d.type === 'domain')
      .append('text')
      .attr('y', (d) => NODE_SIZES[d.type] + 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .attr('pointer-events', 'none')
      .text((d) => d.name);

    // Node interactions
    node
      .on('mouseover', function (event, d) {
        const [x, y] = d3.pointer(event, svgRef.current);
        setTooltip({ node: d, x, y });
        if (onNodeHover) onNodeHover(d);

        // Highlight connected nodes
        d3.select(this).select('circle, polygon').attr('stroke-width', '4');

        link
          .attr('opacity', (l) => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return sourceId === d.id || targetId === d.id ? 1 : 0.1;
          })
          .attr('stroke-width', (l) => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return sourceId === d.id || targetId === d.id
              ? EDGE_STYLES[l.type].width * 1.5
              : EDGE_STYLES[l.type].width;
          });

        node.attr('opacity', (n) => {
          if (n.id === d.id) return 1;
          const connected = visibleEdges.some((l) => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return (sourceId === d.id && targetId === n.id) || (targetId === d.id && sourceId === n.id);
          });
          return connected ? 1 : 0.2;
        });
      })
      .on('mouseout', function (_event, d) {
        setTooltip(null);
        if (onNodeHover) onNodeHover(null);

        d3.select(this)
          .select('circle, polygon')
          .attr('stroke-width', d.type === 'domain' ? '3' : '2');

        link
          .attr('opacity', 0.6)
          .attr('stroke-width', (d) => EDGE_STYLES[d.type].width);

        node.attr('opacity', 1);
      })
      .on('click', function (event, d) {
        event.stopPropagation();
        if (onNodeClick) onNodeClick(d);
      })
      .on('dblclick', function (event, d) {
        event.stopPropagation();
        if (d.type === 'domain') {
          // Zoom to domain
          const scale = 1.5;
          const x = -d.x! * scale + width / 2;
          const y = -d.y! * scale + height / 2;

          svg
            .transition()
            .duration(750)
            .call(zoom.transform as any, d3.zoomIdentity.translate(x, y).scale(scale));
        }
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (typeof d.source === 'string' ? 0 : d.source.x || 0))
        .attr('y1', (d) => (typeof d.source === 'string' ? 0 : d.source.y || 0))
        .attr('x2', (d) => (typeof d.target === 'string' ? 0 : d.target.x || 0))
        .attr('y2', (d) => (typeof d.target === 'string' ? 0 : d.target.y || 0));

      node.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Drag functions
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
      if (d.type !== 'domain') {
        d.fx = null;
        d.fy = null;
      }
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height, filteredNodes, filteredEdges, onNodeClick, onNodeHover, filters]);

  function getNodeOpacity(node: GraphNode): number {
    if (!node.status) return 1;
    if (node.status === 'built') return 1;
    if (node.status === 'in-progress') return 0.7;
    if (node.status === 'planned') return 0.4;
    return 1;
  }

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} className="border border-gray-200 rounded-lg bg-gray-50">
        <rect width={width} height={height} fill="transparent" />
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 pointer-events-none z-50"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            maxWidth: '250px',
          }}
        >
          <div className="font-semibold text-gray-900 mb-1">{tooltip.node.name}</div>
          <div className="text-xs text-gray-600 mb-2 capitalize">{tooltip.node.type}</div>
          {tooltip.node.status && (
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[tooltip.node.status] }}
              ></div>
              <span className="text-xs text-gray-700 capitalize">{tooltip.node.status}</span>
            </div>
          )}
          {tooltip.node.metadata && (
            <div className="text-xs text-gray-600 mt-2 space-y-1">
              {tooltip.node.metadata.subdomainCount !== undefined && (
                <div>Subdomains: {tooltip.node.metadata.subdomainCount}</div>
              )}
              {tooltip.node.metadata.mcpCount !== undefined && (
                <div>MCPs: {tooltip.node.metadata.mcpCount}</div>
              )}
              {tooltip.node.metadata.toolCount !== undefined && (
                <div>Tools: {tooltip.node.metadata.toolCount}</div>
              )}
              {tooltip.node.metadata.autonomyLevel !== undefined && (
                <div>Autonomy: Level {tooltip.node.metadata.autonomyLevel}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-2">
        <button
          onClick={() => {
            const svg = d3.select(svgRef.current);
            svg.transition().duration(750).call(
              d3.zoom<SVGSVGElement, unknown>().transform as any,
              d3.zoomIdentity
            );
          }}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}
