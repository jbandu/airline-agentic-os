import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUseCases } from '../hooks/useEntities';
import { ChevronRight, Briefcase, DollarSign, Clock, TrendingUp, Filter } from 'lucide-react';

export function UseCases() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [impactFilter, setImpactFilter] = useState<string>('');
  const [waveFilter, setWaveFilter] = useState<string>('');

  const { data: useCases, isLoading } = useUseCases();

  if (isLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading use cases...</div>;
  }

  // Apply filters
  const filteredUseCases = useCases?.filter((uc: any) => {
    if (statusFilter && uc.status !== statusFilter) return false;
    if (impactFilter && uc.businessImpact !== impactFilter) return false;
    if (waveFilter && uc.implementationWave.toString() !== waveFilter) return false;
    return true;
  });

  // Calculate total ROI
  const totalAnnualSavings = filteredUseCases?.reduce((sum: number, uc: any) => {
    const annualOccurrences = uc.estimatedAnnualOccurrences || 0;
    const costPer = (uc.estimatedCostPerOccurrence || 0) / 100;
    const currentCost = annualOccurrences * costPer;
    const proposedCost = annualOccurrences * costPer * ((uc.proposedTimeMinutes || 1) / (uc.currentTimeMinutes || 1));
    return sum + (currentCost - proposedCost);
  }, 0) || 0;

  const totalTimeSavings = filteredUseCases?.reduce((sum: number, uc: any) => {
    const timeSaved = (uc.currentTimeMinutes || 0) - (uc.proposedTimeMinutes || 0);
    const occurrences = uc.estimatedAnnualOccurrences || 0;
    return sum + (timeSaved * occurrences / 60); // Convert to hours
  }, 0) || 0;

  const avgSuccessRateImprovement = (filteredUseCases?.length ?? 0) > 0
    ? (filteredUseCases?.reduce((sum: number, uc: any) => {
        return sum + ((uc.proposedSuccessRate || 0) - (uc.currentSuccessRate || 0));
      }, 0) ?? 0) / (filteredUseCases?.length ?? 1)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Use Cases</h1>
        <p className="mt-2 text-gray-600">
          Specific tasks personas perform - with ROI analysis and automation potential
        </p>
      </div>

      {/* ROI Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Use Cases</p>
              <p className="text-3xl font-semibold text-gray-900">
                {filteredUseCases?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-2 border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Annual Savings</p>
              <p className="text-3xl font-semibold text-green-600">
                ${Math.round(totalAnnualSavings).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Time Saved/Year</p>
              <p className="text-3xl font-semibold text-gray-900">
                {Math.round(totalTimeSavings).toLocaleString()}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Avg Success Gain</p>
              <p className="text-3xl font-semibold text-gray-900">
                +{Math.round(avgSuccessRateImprovement)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center">
            <Filter size={18} className="text-gray-500 mr-2" />
            <span className="text-sm font-semibold text-gray-700">Filters:</span>
          </div>

          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Business Impact</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="identified">Identified</option>
            <option value="analyzed">Analyzed</option>
            <option value="designing">Designing</option>
            <option value="building">Building</option>
            <option value="testing">Testing</option>
            <option value="deployed">Deployed</option>
            <option value="measuring">Measuring</option>
          </select>

          <select
            value={waveFilter}
            onChange={(e) => setWaveFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Waves</option>
            <option value="1">Wave 1</option>
            <option value="2">Wave 2</option>
            <option value="3">Wave 3</option>
          </select>

          {(statusFilter || impactFilter || waveFilter) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setImpactFilter('');
                setWaveFilter('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Use Cases List */}
      <div className="space-y-4">
        {filteredUseCases?.map((useCase: any) => {
          // Calculate ROI for this use case
          const annualOccurrences = useCase.estimatedAnnualOccurrences || 0;
          const costPer = (useCase.estimatedCostPerOccurrence || 0) / 100;
          const currentCost = annualOccurrences * costPer;
          const proposedCost = annualOccurrences * costPer * ((useCase.proposedTimeMinutes || 1) / (useCase.currentTimeMinutes || 1));
          const savings = currentCost - proposedCost;
          const timeSavings = ((useCase.currentTimeMinutes || 0) - (useCase.proposedTimeMinutes || 0)) * annualOccurrences;
          const roiPercent = currentCost > 0 ? ((savings / currentCost) * 100) : 0;

          return (
            <Link
              key={useCase.id}
              to={`/use-cases/${useCase.id}`}
              className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {useCase.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        useCase.businessImpact === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : useCase.businessImpact === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : useCase.businessImpact === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {useCase.businessImpact}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {useCase.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{useCase.description}</p>
                  <p className="text-xs text-gray-500">
                    {useCase.persona?.name} • {useCase.persona?.subdomain?.name}
                  </p>
                </div>
                <ChevronRight
                  size={24}
                  className="text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-4"
                />
              </div>

              {/* ROI Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Annual Savings</div>
                  <div className="text-lg font-bold text-green-600">
                    ${Math.round(savings).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(roiPercent)}% ROI
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Time Saved/Year</div>
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round(timeSavings / 60)}h
                  </div>
                  <div className="text-xs text-gray-500">
                    {useCase.currentTimeMinutes}m → {useCase.proposedTimeMinutes}m
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Success Rate</div>
                  <div className="text-lg font-bold text-blue-600">
                    {useCase.proposedSuccessRate || 0}%
                  </div>
                  <div className="text-xs text-gray-500">
                    +{(useCase.proposedSuccessRate || 0) - (useCase.currentSuccessRate || 0)}% gain
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Frequency</div>
                  <div className="text-lg font-bold text-gray-900">
                    {useCase.frequency?.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-gray-500">
                    ~{annualOccurrences.toLocaleString()}/year
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Implementation</div>
                  <div className="text-lg font-bold text-orange-600">
                    Wave {useCase.implementationWave}
                  </div>
                  <div className="text-xs text-gray-500">
                    Priority {useCase.priority}/5
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {(!filteredUseCases || filteredUseCases.length === 0) && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No use cases</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter || impactFilter || waveFilter
              ? 'No use cases match your filters. Try adjusting them.'
              : 'Get started by creating your first use case.'}
          </p>
        </div>
      )}
    </div>
  );
}
