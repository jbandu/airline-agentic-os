import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePersona, useDeletePersona, useCheckDelete } from '../hooks/useEntities';
import { ArrowLeft, Trash2, AlertCircle, Target, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { DependencyBlockModal } from '../components/dependencies/DependencyBlockModal';
import type { DependencyCheckResult } from '../types';

export function PersonaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: persona, isLoading } = usePersona(id);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [checkResult, setCheckResult] = useState<DependencyCheckResult | null>(null);

  const checkDelete = useCheckDelete();
  const deletePersona = useDeletePersona();

  const handleDeleteClick = async () => {
    if (!id || !persona) return;

    try {
      const result = await checkDelete.mutateAsync({
        entityType: 'persona',
        entityId: id,
      });
      setCheckResult(result);
      setShowDeleteModal(true);
    } catch (error) {
      console.error('Dependency check failed:', error);
    }
  };

  const handleDeleteConfirm = async (_reason: string) => {
    if (!id) return;

    try {
      await deletePersona.mutateAsync(id);
      setShowDeleteModal(false);
      navigate('/personas');
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCheckResult(null);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500">Loading persona...</p>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-500">Persona not found</p>
        <Link to="/personas" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Personas
        </Link>
      </div>
    );
  }

  const useCases = persona.useCases || [];

  // Calculate total ROI across all use cases
  const totalROI = useCases.reduce((sum: number, uc: any) => {
    const annualOccurrences = uc.estimatedAnnualOccurrences || 0;
    const costPer = (uc.estimatedCostPerOccurrence || 0) / 100;
    const currentCost = annualOccurrences * costPer;
    const proposedCost =
      annualOccurrences * costPer * ((uc.proposedTimeMinutes || 1) / (uc.currentTimeMinutes || 1));
    return sum + (currentCost - proposedCost);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/personas"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Personas
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {persona.icon && (
              <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center text-4xl">
                {persona.icon}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{persona.name}</h1>
              {persona.fullTitle && (
                <p className="text-gray-600 mt-1">{persona.fullTitle}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {persona.subdomain?.domain?.name} → {persona.subdomain?.name}
              </p>
            </div>
          </div>

          <button
            onClick={handleDeleteClick}
            disabled={checkDelete.isPending || deletePersona.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>

      {/* Description */}
      {persona.description && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <p className="text-gray-700">{persona.description}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-sm text-gray-500">Use Cases</div>
          <div className="text-2xl font-bold text-gray-900">{useCases.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-sm text-gray-500">Systems Used</div>
          <div className="text-2xl font-bold text-gray-900">
            {persona.systemsUsed?.length || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-sm text-gray-500">Pain Points</div>
          <div className="text-2xl font-bold text-red-600">
            {persona.painPoints?.length || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-green-200 bg-green-50">
          <div className="text-sm text-gray-500">Potential Annual Savings</div>
          <div className="text-2xl font-bold text-green-600">
            ${Math.round(totalROI).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pain Points */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="mr-2 text-red-500" size={20} />
              Pain Points
            </h2>
            {persona.painPoints && persona.painPoints.length > 0 ? (
              <ul className="space-y-3">
                {persona.painPoints.map((pain: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{pain}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No pain points documented</p>
            )}
          </div>

          {/* Goals */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="mr-2 text-blue-500" size={20} />
              Goals
            </h2>
            {persona.goals && persona.goals.length > 0 ? (
              <ul className="space-y-3">
                {persona.goals.map((goal: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700">{goal}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No goals documented</p>
            )}
          </div>

          {/* Systems Used */}
          {persona.systemsUsed && persona.systemsUsed.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Systems Used</h2>
              <div className="flex flex-wrap gap-2">
                {persona.systemsUsed.map((system: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {system}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Use Cases */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Use Cases</h2>
            {useCases.length > 0 ? (
              <div className="space-y-4">
                {useCases.map((useCase: any) => {
                  // Calculate ROI for this use case
                  const annualOccurrences = useCase.estimatedAnnualOccurrences || 0;
                  const costPer = (useCase.estimatedCostPerOccurrence || 0) / 100;
                  const currentCost = annualOccurrences * costPer;
                  const proposedCost =
                    annualOccurrences *
                    costPer *
                    ((useCase.proposedTimeMinutes || 1) / (useCase.currentTimeMinutes || 1));
                  const savings = currentCost - proposedCost;
                  const timeSavings =
                    ((useCase.currentTimeMinutes || 0) - (useCase.proposedTimeMinutes || 0)) *
                    annualOccurrences;

                  return (
                    <Link
                      key={useCase.id}
                      to={`/use-cases/${useCase.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {useCase.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{useCase.description}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${
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
                      </div>

                      {/* ROI Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        <div className="flex items-center text-sm">
                          <Clock className="mr-1.5 text-blue-500" size={16} />
                          <div>
                            <div className="text-xs text-gray-500">Time Savings</div>
                            <div className="font-semibold text-gray-900">
                              {Math.round(timeSavings / 60)}h/yr
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center text-sm">
                          <DollarSign className="mr-1.5 text-green-500" size={16} />
                          <div>
                            <div className="text-xs text-gray-500">Annual Savings</div>
                            <div className="font-semibold text-green-600">
                              ${Math.round(savings).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center text-sm">
                          <TrendingUp className="mr-1.5 text-purple-500" size={16} />
                          <div>
                            <div className="text-xs text-gray-500">Success Rate</div>
                            <div className="font-semibold text-gray-900">
                              {useCase.currentSuccessRate || 0}% → {useCase.proposedSuccessRate || 0}%
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center text-sm">
                          <Target className="mr-1.5 text-orange-500" size={16} />
                          <div>
                            <div className="text-xs text-gray-500">Priority</div>
                            <div className="font-semibold text-gray-900">
                              {useCase.priority}/5
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Steps count */}
                      <div className="mt-3 text-xs text-gray-500">
                        {useCase.steps?.length || 0} steps • {useCase.frequency} • Wave {useCase.implementationWave}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No use cases defined for this persona</p>
            )}
          </div>
        </div>
      </div>

      {/* Dependency Block Modal */}
      {showDeleteModal && checkResult && (
        <DependencyBlockModal
          checkResult={checkResult}
          entityName={persona.name}
          action="Delete"
          onCancel={handleDeleteCancel}
          onProceed={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
