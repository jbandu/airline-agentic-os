import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { api } from '../../lib/api';

interface Domain {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Bridge {
  id: string;
  name: string;
  sourceSubdomainId: string;
  targetSubdomainId: string;
  bridgeType: string;
  strength: number;
  sourceSubdomain: {
    id: string;
    name: string;
    domain: Domain;
  };
  targetSubdomain: {
    id: string;
    name: string;
    domain: Domain;
  };
}

export function BridgeMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [bridges, setBridges] = useState<Bridge[]>([]);
  const [selectedBridge, setSelectedBridge] = useState<Bridge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBridges();
  }, []);

  const fetchBridges = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/cross-domain/bridges');
      setBridges(response.data);
    } catch (error) {
      console.error('Error fetching bridges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!svgRef.current || bridges.length === 0) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Process data for chord diagram
    const domainMap = new Map<string, Domain>();
    bridges.forEach((bridge) => {
      domainMap.set(bridge.sourceSubdomain.domain.id, bridge.sourceSubdomain.domain);
      domainMap.set(bridge.targetSubdomain.domain.id, bridge.targetSubdomain.domain);
    });

    const domains = Array.from(domainMap.values());
    const domainIndexMap = new Map(domains.map((d, i) => [d.id, i]));

    // Create adjacency matrix
    const matrix = Array(domains.length)
      .fill(0)
      .map(() => Array(domains.length).fill(0));

    bridges.forEach((bridge) => {
      const sourceIdx = domainIndexMap.get(bridge.sourceSubdomain.domain.id);
      const targetIdx = domainIndexMap.get(bridge.targetSubdomain.domain.id);
      if (sourceIdx !== undefined && targetIdx !== undefined) {
        matrix[sourceIdx][targetIdx] += bridge.strength;
        matrix[targetIdx][sourceIdx] += bridge.strength; // Make symmetric
      }
    });

    // Render chord diagram
    const width = 700;
    const height = 700;
    const outerRadius = Math.min(width, height) * 0.5 - 80;
    const innerRadius = outerRadius - 30;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const ribbon = d3.ribbon().radius(innerRadius);

    const chords = chord(matrix);

    // Draw groups (domains)
    const group = svg
      .append('g')
      .selectAll('g')
      .data(chords.groups)
      .join('g');

    group
      .append('path')
      .style('fill', (d) => domains[d.index].color)
      .style('stroke', (d) => d3.rgb(domains[d.index].color).darker().toString())
      .attr('d', arc as any)
      .on('mouseover', function () {
        d3.select(this).style('opacity', 0.8);
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 1);
      });

    // Add domain labels
    group
      .append('text')
      .each(function (d: any) {
        d.angle = (d.startAngle + d.endAngle) / 2;
      })
      .attr('dy', '.35em')
      .attr('transform', (d: any) => {
        const angle = (d.angle * 180) / Math.PI - 90;
        return `rotate(${angle}) translate(${outerRadius + 20}) ${angle > 90 ? 'rotate(180)' : ''}`;
      })
      .style('text-anchor', (d: any) => ((d.angle * 180) / Math.PI > 90 ? 'end' : 'start'))
      .text((d) => domains[d.index].name)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#374151');

    // Draw ribbons (connections)
    svg
      .append('g')
      .attr('fill-opacity', 0.6)
      .selectAll('path')
      .data(chords)
      .join('path')
      .attr('d', ribbon as any)
      .style('fill', (d) => domains[d.source.index].color)
      .style('stroke', (d) => d3.rgb(domains[d.source.index].color).darker().toString())
      .on('mouseover', function (_event, d) {
        d3.select(this).style('fill-opacity', 0.8);

        // Find bridges between these domains
        const sourceDomain = domains[d.source.index];
        const targetDomain = domains[d.target.index];
        const relevantBridges = bridges.filter(
          (b) =>
            (b.sourceSubdomain.domain.id === sourceDomain.id &&
              b.targetSubdomain.domain.id === targetDomain.id) ||
            (b.sourceSubdomain.domain.id === targetDomain.id &&
              b.targetSubdomain.domain.id === sourceDomain.id)
        );

        if (relevantBridges.length > 0) {
          setSelectedBridge(relevantBridges[0]);
        }
      })
      .on('mouseout', function () {
        d3.select(this).style('fill-opacity', 0.6);
        setSelectedBridge(null);
      })
      .append('title')
      .text(
        (d) =>
          `${domains[d.source.index].name} ↔ ${domains[d.target.index].name}\nStrength: ${d.source.value}`
      );
  }, [bridges]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading bridge map...</div>
      </div>
    );
  }

  if (bridges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <div className="text-4xl mb-4">🌉</div>
        <div className="text-lg font-medium">No cross-domain bridges found</div>
        <div className="text-sm">Create bridges to see domain connections</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Cross-Domain Bridge Map</h3>
          <p className="text-sm text-gray-600 mt-1">
            Chord diagram showing connections between domains. Hover over ribbons to see bridge details.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{bridges.length}</div>
          <div className="text-xs text-gray-600">Total Bridges</div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Chord Diagram */}
        <div className="flex-1 flex justify-center">
          <svg ref={svgRef} className="border border-gray-200 rounded-lg bg-gray-50"></svg>
        </div>

        {/* Bridge Details Panel */}
        <div className="w-80">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Bridge Details</h4>

            {selectedBridge ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Bridge Name</div>
                  <div className="font-medium text-gray-900">{selectedBridge.name}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 mb-1">Connection</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>{selectedBridge.sourceSubdomain.domain.icon}</span>
                    <span className="font-medium">{selectedBridge.sourceSubdomain.domain.name}</span>
                    <span className="text-gray-400">→</span>
                    <span>{selectedBridge.targetSubdomain.domain.icon}</span>
                    <span className="font-medium">{selectedBridge.targetSubdomain.domain.name}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 mb-1">Subdomains</div>
                  <div className="text-sm">
                    <div className="text-gray-700">{selectedBridge.sourceSubdomain.name}</div>
                    <div className="text-gray-400 text-xs">↓</div>
                    <div className="text-gray-700">{selectedBridge.targetSubdomain.name}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 mb-1">Type</div>
                  <div className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    {selectedBridge.bridgeType.replace('_', ' ').toUpperCase()}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600 mb-1">Strength</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(selectedBridge.strength / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{selectedBridge.strength}/10</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-8">
                Hover over a ribbon to see bridge details
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-gray-900 mb-2">Bridge Types</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div>• <span className="font-medium">Data Flow</span> - Data exchange</div>
              <div>• <span className="font-medium">Process Handoff</span> - Workflow transition</div>
              <div>• <span className="font-medium">Shared Resource</span> - Common asset</div>
              <div>• <span className="font-medium">Dependency</span> - Required connection</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
