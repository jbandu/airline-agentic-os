import { useState } from 'react';
import { BridgeMap } from './BridgeMap';
import { DependencyGraph } from './DependencyGraph';
import { ImpactAnalysis } from './ImpactAnalysis';

type TabType = 'bridges' | 'dependencies' | 'impact';

interface CrossDomainViewProps {
  className?: string;
}

export function CrossDomainView({ className = '' }: CrossDomainViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('bridges');

  const tabs = [
    {
      id: 'bridges' as TabType,
      label: 'Bridge Map',
      icon: '🌉',
      description: 'Domain-to-domain connections',
    },
    {
      id: 'dependencies' as TabType,
      label: 'Dependency Graph',
      icon: '🔗',
      description: 'MCP dependencies & critical paths',
    },
    {
      id: 'impact' as TabType,
      label: 'Impact Analysis',
      icon: '💥',
      description: 'Ripple effect analysis',
    },
  ];

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">{tab.icon}</span>
                <div>
                  <div className="font-semibold">{tab.label}</div>
                  <div className="text-xs text-gray-500">{tab.description}</div>
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'bridges' && <BridgeMap />}
        {activeTab === 'dependencies' && <DependencyGraph />}
        {activeTab === 'impact' && <ImpactAnalysis />}
      </div>
    </div>
  );
}
