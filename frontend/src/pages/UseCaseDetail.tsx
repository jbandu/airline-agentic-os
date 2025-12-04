import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUseCase, useUseCaseROI, useDeleteUseCase, useCheckDelete } from '../hooks/useEntities';
import {
  ArrowLeft, Trash2, DollarSign, Target,
  CheckCircle, XCircle, AlertTriangle, Users, Zap
} from 'lucide-react';
import { useState } from 'react';
import { DependencyBlockModal } from '../components/dependencies/DependencyBlockModal';
import type { DependencyCheckResult } from '../types';

export function UseCaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: useCase, isLoading } = useUseCase(id);
  const { data: roiData } = useUseCaseROI(id);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [checkResult, setCheckResult] = useState<DependencyCheckResult | null>(null);

  const checkDelete = useCheckDelete();
  const deleteUseCase = useDeleteUseCase();

  const handleDeleteClick = async () => {
    if (!id || !useCase) return;

    try {
      const result = await checkDelete.mutateAsync({
        entityType: 'use_case',
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
      await deleteUseCase.mutateAsync(id);
      setShowDeleteModal(false);
      navigate('/use-cases');
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
        <p className="text-gray-500">Loading use case...</p>
      </div>
    );
  }

  if (!useCase) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-red-500">Use case not found</p>
        <Link to="/use-cases" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Use Cases
        </Link>
      </div>
    );
  }

  const steps = useCase.steps || [];
  const automationCandidateSteps = steps.filter((s: any) => s.canAutomate).length;
  const errorProneSteps = steps.filter((s: any) => s.errorProne).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/use-cases"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Use Cases
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{useCase.name}</h1>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  useCase.businessImpact === 'critical'
                    ? 'bg-red-100 text-red-800'
                    : useCase.businessImpact === 'high'
                    ? 'bg-orange-100 text-orange-800'
                    : useCase.businessImpact === 'medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {useCase.businessImpact} impact
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {useCase.status}
              </span>
            </div>
            <p className="text-gray-600 mb-2">{useCase.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <Link
                to={`/personas/${useCase.persona?.id}`}
                className="hover:text-blue-600 flex items-center"
              >
                <Users size={16} className="mr-1" />
                {useCase.persona?.name}
              </Link>
              <span>•</span>
              <span>{useCase.persona?.subdomain?.domain?.name} → {useCase.persona?.subdomain?.name}</span>
            </div>
          </div>

          <button
            onClick={handleDeleteClick}
            disabled={checkDelete.isPending || deleteUseCase.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>

      {/* ROI Summary - Primary Focus */}
      {roiData && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-lg p-6 mb-8 border-2 border-green-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <DollarSign className="mr-2 text-green-600" size={28} />
            ROI Analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-sm text-gray-500 mb-1">Annual Savings</div>
              <div className="text-3xl font-bold text-green-600">
                ${Math.round(roiData.roi?.annualSavings || 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {roiData.roi?.roiPercentage} ROI
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-sm text-gray-500 mb-1">Time Saved/Year</div>
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(roiData.roi?.annualTimeSavingsHours || 0)}h
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {roiData.estimatedAnnualOccurrences?.toLocaleString()} occurrences
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-sm text-gray-500 mb-1">Success Rate Gain</div>
              <div className="text-3xl font-bold text-blue-600">
                +{roiData.roi?.successRateImprovement || 0}%
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {roiData.currentState?.successRate}% → {roiData.proposedState?.successRate}%
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <div className="text-sm text-gray-500 mb-1">Time Per Case</div>
              <div className="text-3xl font-bold text-orange-600">
                {roiData.proposedState?.timePerOccurrenceMinutes}m
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {roiData.currentState?.timePerOccurrenceMinutes}m → {roiData.proposedState?.timePerOccurrenceMinutes}m
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Frequency</div>
          <div className="text-xl font-bold text-gray-900 capitalize">
            {useCase.frequency?.replace('_', ' ')}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Time Pressure</div>
          <div className="text-xl font-bold text-gray-900 capitalize">
            {useCase.timePressure}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Complexity</div>
          <div className="text-xl font-bold text-gray-900">
            {useCase.complexity}/5
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Automation Potential</div>
          <div className="text-xl font-bold text-green-600">
            {useCase.automationPotential}/5
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Pain Level</div>
          <div className="text-xl font-bold text-red-600">
            {useCase.currentPainLevel}/5
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Current vs Proposed Process */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Process */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <XCircle className="mr-2 text-red-500" size={20} />
              Current Process
            </h2>
            <p className="text-gray-700 whitespace-pre-line mb-4">
              {useCase.currentProcess || 'No current process documented'}
            </p>

            {useCase.currentToolsUsed && useCase.currentToolsUsed.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">Tools Used:</div>
                <div className="flex flex-wrap gap-2">
                  {useCase.currentToolsUsed.map((tool: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Proposed Process */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-green-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="mr-2 text-green-500" size={20} />
              Proposed Process (with AI)
            </h2>
            <p className="text-gray-700 whitespace-pre-line">
              {useCase.proposedProcess || 'No proposed process documented'}
            </p>
          </div>

          {/* Steps Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="mr-2 text-blue-500" size={20} />
              Process Steps ({steps.length})
            </h2>

            {steps.length > 0 && (
              <div className="mb-4 flex gap-4 text-sm">
                <span className="flex items-center">
                  <Zap className="mr-1 text-green-500" size={16} />
                  {automationCandidateSteps} can automate
                </span>
                <span className="flex items-center">
                  <AlertTriangle className="mr-1 text-red-500" size={16} />
                  {errorProneSteps} error prone
                </span>
              </div>
            )}

            {steps.length > 0 ? (
              <div className="space-y-3">
                {steps.map((step: any) => (
                  <div
                    key={step.id}
                    className={`border rounded-lg p-4 ${
                      step.canAutomate ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start flex-1">
                        <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 font-semibold">
                          {step.stepNumber}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{step.name}</h3>
                          {step.description && (
                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {step.canAutomate && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center whitespace-nowrap">
                            <Zap size={12} className="mr-1" />
                            Can Automate
                          </span>
                        )}
                        {step.errorProne && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center whitespace-nowrap">
                            <AlertTriangle size={12} className="mr-1" />
                            Error Prone
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-11 grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                      <div>
                        <span className="text-gray-500">Actor:</span>
                        <span className="ml-1 font-medium text-gray-900 capitalize">
                          {step.actor?.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Action:</span>
                        <span className="ml-1 font-medium text-gray-900 capitalize">
                          {step.actionType?.replace('_', ' ')}
                        </span>
                      </div>
                      {step.currentDurationSeconds && (
                        <div>
                          <span className="text-gray-500">Current:</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {Math.round(step.currentDurationSeconds / 60)}m
                          </span>
                        </div>
                      )}
                      {step.targetDurationSeconds && (
                        <div>
                          <span className="text-gray-500">Target:</span>
                          <span className="ml-1 font-medium text-green-600">
                            {Math.round(step.targetDurationSeconds / 60)}m
                          </span>
                        </div>
                      )}
                    </div>

                    {step.automationNotes && (
                      <div className="ml-11 mt-2 text-xs text-gray-600 italic bg-white p-2 rounded">
                        💡 {step.automationNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No steps documented</p>
            )}
          </div>
        </div>

        {/* Sidebar - Additional Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Implementation Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Implementation</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Wave</div>
                <div className="text-lg font-bold text-orange-600">
                  Wave {useCase.implementationWave}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Priority</div>
                <div className="text-lg font-bold text-gray-900">
                  {useCase.priority}/5
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Category</div>
                <div className="text-lg font-medium text-gray-900 capitalize">
                  {useCase.category?.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>

          {/* Triggers */}
          {useCase.triggers && useCase.triggers.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Triggers</h3>
              <ul className="space-y-2">
                {useCase.triggers.map((trigger: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start">
                    <span className="text-blue-500 mr-2">→</span>
                    {trigger}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Peak Times */}
          {useCase.peakTimes && useCase.peakTimes.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Times</h3>
              <div className="flex flex-wrap gap-2">
                {useCase.peakTimes.map((time: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
                    {time}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dependency Block Modal */}
      {showDeleteModal && checkResult && (
        <DependencyBlockModal
          checkResult={checkResult}
          entityName={useCase.name}
          action="Delete"
          onCancel={handleDeleteCancel}
          onProceed={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
