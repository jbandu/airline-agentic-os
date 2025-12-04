const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  planned: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
};

export function Workflows() {
  // TODO: Implement workflows API endpoints and hooks
  const workflows: any[] = [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
        <p className="mt-2 text-gray-600">
          Manage automated workflows and their execution
        </p>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No workflows configured yet.</p>
          <p className="text-sm text-gray-400 mt-2">Workflow management coming soon.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {workflows.map((workflow: any) => (
          <div
            key={workflow.id}
            className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {workflow.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      statusColors[workflow.status as keyof typeof statusColors]
                    }`}
                  >
                    {workflow.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {workflow.description}
                </p>
              </div>
              <div className="ml-4 text-right">
                <div className="text-sm text-gray-500">Wave</div>
                <div className="text-2xl font-bold text-blue-600">
                  {workflow.implementationWave}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div>
                <div className="text-xs text-gray-500">Complexity</div>
                <div className="mt-1 flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 mr-1 rounded-sm ${
                        i < workflow.complexity
                          ? 'bg-orange-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Agentic Potential</div>
                <div className="mt-1 flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 mr-1 rounded-sm ${
                        i < workflow.agenticPotential
                          ? 'bg-purple-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">MCPs</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {workflow.workflowMcps?.length || 0}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Agents</div>
                <div className="mt-1 text-lg font-semibold text-gray-900">
                  {workflow.workflowAgents?.length || 0}
                </div>
              </div>
            </div>

            {workflow.expectedRoi && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">Expected ROI</div>
                <div className="mt-1 text-sm font-medium text-green-600">
                  {workflow.expectedRoi}
                </div>
              </div>
            )}
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
