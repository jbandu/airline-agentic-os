import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphEdge } from '../../hooks/useGraphData';

interface SimpleForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
}

export function SimpleForceGraph({ nodes, edges, onNodeClick }: SimpleForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Validate edges reference existing nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    const validEdges = edges.filter(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as any)?.id;
      const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as any)?.id;
      const isValid = nodeIds.has(sourceId) && nodeIds.has(targetId);
      if (!isValid) {
        console.warn('Skipping invalid edge:', { source: sourceId, target: targetId });
      }
      return isValid;
    });

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create container group for zoom
    const g = svg.append('g');

    // Node colors by type
    const getNodeColor = (node: GraphNode) => {
      if (node.type === 'domain') return node.color || '#3B82F6';
      if (node.type === 'subdomain') return node.domainColor || '#8B5CF6';
      if (node.type === 'mcp') {
        if (node.status === 'built') return '#10B981';
        if (node.status === 'in-progress') return '#F59E0B';
        return '#6B7280';
      }
      return '#9CA3AF';
    };

    // Node sizes by type
    const getNodeRadius = (node: GraphNode) => {
      if (node.type === 'domain') return 20;
      if (node.type === 'subdomain') return 15;
      return 10;
    };

    // Create force simulation
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        'link',
        d3.forceLink(validEdges).id((d: any) => d.id).distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => getNodeRadius(d) + 5));

    // Draw edges
    const link = g
      .append('g')
      .selectAll('line')
      .data(validEdges)
      .join('line')
      .attr('stroke', (d) => (d.isCritical ? '#EF4444' : '#D1D5DB'))
      .attr('stroke-width', (d) => (d.isCritical ? 2 : 1))
      .attr('stroke-opacity', 0.6);

    // Draw nodes
    const node = g
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', getNodeRadius)
      .attr('fill', getNodeColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onNodeClick) onNodeClick(d);
      });

    // Add node labels
    const label = g
      .append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text((d) => d.name)
      .attr('font-size', (d) => (d.type === 'domain' ? 12 : 10))
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => getNodeRadius(d) + 15)
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, edges, onNodeClick]);

  return (
    <div className="w-full h-full relative bg-gray-50 rounded-lg border border-gray-200">
      <svg ref={svgRef} className="w-full h-full min-h-[500px]" />
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500">No data to visualize</p>
        </div>
      )}
    </div>
  );
}
