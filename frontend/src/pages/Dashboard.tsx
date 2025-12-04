import { useDomains, useMCPs } from '../hooks/useEntities';
import { Plane, Database, Bot, GitBranch } from 'lucide-react';

export function Dashboard() {
  const { data: domains } = useDomains();
  const { data: mcps } = useMCPs();

  // TODO: Implement agents and workflows hooks
  const agents: any[] = [];
  const workflows: any[] = [];

  const stats = [
    {
      name: 'Domains',
      value: domains?.length || 0,
      icon: Plane,
      color: 'bg-blue-500',
    },
    {
      name: 'MCPs',
      value: mcps?.length || 0,
      icon: Database,
      color: 'bg-purple-500',
    },
    {
      name: 'Agents',
      value: agents?.length || 0,
      icon: Bot,
      color: 'bg-green-500',
    },
    {
      name: 'Workflows',
      value: workflows?.length || 0,
      icon: GitBranch,
      color: 'bg-orange-500',
    },
  ];

  const activeMcps = mcps?.filter((m: any) => m.status === 'built').length || 0;
  const activeAgents = agents?.filter((a: any) => a.active).length || 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your airline agentic operating system
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            MCP Status
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Built</span>
              <span className="text-sm font-semibold text-green-600">
                {activeMcps}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">In Progress</span>
              <span className="text-sm font-semibold text-yellow-600">
                {mcps?.filter((m: any) => m.status === 'in-progress').length || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Planned</span>
              <span className="text-sm font-semibold text-gray-600">
                {mcps?.filter((m: any) => m.status === 'planned').length || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Agent Status
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Agents</span>
              <span className="text-sm font-semibold text-green-600">
                {activeAgents}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Inactive Agents</span>
              <span className="text-sm font-semibold text-gray-600">
                {(agents?.length || 0) - activeAgents}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Workflows</span>
              <span className="text-sm font-semibold text-blue-600">
                {workflows?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
