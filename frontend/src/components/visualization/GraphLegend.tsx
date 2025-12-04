const STATUS_COLORS = {
  built: '#10B981',
  'in-progress': '#3B82F6',
  planned: '#9CA3AF',
  active: '#10B981',
  inactive: '#6B7280',
};

export function GraphLegend() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Node Types</h3>
        <div className="space-y-2">
          <LegendItem
            label="Domain"
            description="Largest, fixed positions"
            render={() => (
              <div
                className="rounded-full border-2 border-gray-600 bg-blue-500 flex items-center justify-center text-white text-xs"
                style={{ width: 30, height: 30 }}
              >
                🗂️
              </div>
            )}
          />
          <LegendItem
            label="Subdomain"
            description="Orbits parent domain"
            render={() => (
              <div
                className="rounded-full border-2 border-gray-600 bg-green-400"
                style={{ width: 20, height: 20 }}
              />
            )}
          />
          <LegendItem
            label="MCP"
            description="Context Protocol"
            render={() => (
              <div
                className="rounded-full border-2 border-gray-600 bg-purple-500"
                style={{ width: 15, height: 15 }}
              />
            )}
          />
          <LegendItem
            label="Agent"
            description="AI agent (hexagon)"
            render={() => (
              <svg width="15" height="15" viewBox="0 0 20 20">
                <polygon
                  points="10,0 18.66,5 18.66,15 10,20 1.34,15 1.34,5"
                  fill="#8B5CF6"
                  stroke="#4B5563"
                  strokeWidth="2"
                />
              </svg>
            )}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Status Colors</h3>
        <div className="space-y-2">
          <StatusItem label="Built" color={STATUS_COLORS.built} />
          <StatusItem label="In Progress" color={STATUS_COLORS['in-progress']} />
          <StatusItem label="Planned" color={STATUS_COLORS.planned} />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Edge Types</h3>
        <div className="space-y-2">
          <EdgeItem label="Hierarchy" style="solid" color="#94A3B8" width={3} />
          <EdgeItem label="MCP-Agent" style="dashed" color="#CBD5E1" width={1.5} />
          <EdgeItem label="Cross-Domain" style="dashed" color="#F59E0B" width={2} />
          <EdgeItem label="Collaboration" style="dotted" color="#8B5CF6" width={1} />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Interactions</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• <span className="font-medium">Drag</span> to move nodes</div>
          <div>• <span className="font-medium">Scroll</span> to zoom</div>
          <div>• <span className="font-medium">Click</span> to select</div>
          <div>• <span className="font-medium">Double-click</span> domain to focus</div>
          <div>• <span className="font-medium">Hover</span> for details</div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({
  label,
  description,
  render,
}: {
  label: string;
  description: string;
  render: () => React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">{render()}</div>
      <div>
        <div className="text-xs font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </div>
  );
}

function StatusItem({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
      <div className="text-xs text-gray-700">{label}</div>
    </div>
  );
}

function EdgeItem({
  label,
  style,
  color,
  width,
}: {
  label: string;
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  width: number;
}) {
  const strokeDasharray = style === 'dashed' ? '10,5' : style === 'dotted' ? '2,2' : '0';

  return (
    <div className="flex items-center gap-2">
      <svg width="40" height="2">
        <line
          x1="0"
          y1="1"
          x2="40"
          y2="1"
          stroke={color}
          strokeWidth={width}
          strokeDasharray={strokeDasharray}
        />
      </svg>
      <div className="text-xs text-gray-700">{label}</div>
    </div>
  );
}
