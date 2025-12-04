import { useState } from 'react';
import { X, AlertCircle, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { useExplainBlock } from '../../hooks/useEntities';
import type { DependencyCheckResult } from '../../types';

interface DependencyBlockModalProps {
  checkResult: DependencyCheckResult;
  entityName: string;
  action: string;
  onCancel: () => void;
  onProceed?: (reason: string) => void;
}

export function DependencyBlockModal({
  checkResult,
  entityName,
  action,
  onCancel,
  onProceed,
}: DependencyBlockModalProps) {
  const [reason, setReason] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');

  const explainBlock = useExplainBlock();

  const hasHardBlocks = checkResult.hardBlocks.length > 0;
  const hasSoftBlocks = checkResult.softBlocks.length > 0;
  const canProceed = !hasHardBlocks && hasSoftBlocks;

  const handleExplain = async () => {
    setShowExplanation(true);
    try {
      const result = await explainBlock.mutateAsync(checkResult);
      setExplanation(result.data?.explanation || 'No explanation available.');
    } catch (error) {
      setExplanation('Failed to get explanation. Please try again.');
    }
  };

  const handleProceed = () => {
    if (canProceed && onProceed) {
      if (reason.trim().length < 10) {
        alert('Please provide a reason (at least 10 characters)');
        return;
      }
      onProceed(reason);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 border-b ${hasHardBlocks ? 'bg-red-50' : 'bg-yellow-50'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {hasHardBlocks ? (
                <AlertCircle className="text-red-600" size={24} />
              ) : (
                <AlertTriangle className="text-yellow-600" size={24} />
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {hasHardBlocks ? 'Action Blocked' : 'Warning'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {action} "{entityName}"
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Hard Blocks */}
          {hasHardBlocks && (
            <div className="mb-6">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertCircle size={18} />
                Critical Issues (Cannot Proceed)
              </h3>
              <div className="space-y-3">
                {checkResult.hardBlocks.map((block, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="font-medium text-red-900 mb-1">{block.ruleId}</div>
                    <div className="text-sm text-red-700">{block.message}</div>
                    {block.affectedEntities.length > 0 && (
                      <div className="mt-2 text-xs text-red-600">
                        Affected: {block.affectedEntities.map(e => e.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Soft Blocks */}
          {hasSoftBlocks && (
            <div className="mb-6">
              <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={18} />
                Warnings (Can Proceed with Reason)
              </h3>
              <div className="space-y-3">
                {checkResult.softBlocks.map((block, idx) => (
                  <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="font-medium text-yellow-900 mb-1">{block.ruleId}</div>
                    <div className="text-sm text-yellow-700">{block.warning}</div>
                    <div className="text-sm text-yellow-600 mt-1">Impact: {block.impact}</div>
                    {block.affectedEntities.length > 0 && (
                      <div className="mt-2 text-xs text-yellow-600">
                        Affected: {block.affectedEntities.map(e => e.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependency Graph Summary */}
          {checkResult.dependencyGraph && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Dependency Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Nodes:</span>{' '}
                  <span className="font-medium">{checkResult.dependencyGraph.nodes.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Connections:</span>{' '}
                  <span className="font-medium">{checkResult.dependencyGraph.edges.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Ask Claude Why Button */}
          <button
            onClick={handleExplain}
            disabled={explainBlock.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-6"
          >
            {explainBlock.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Asking Claude...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Ask Claude Why
              </>
            )}
          </button>

          {/* Claude Explanation */}
          {showExplanation && explanation && (
            <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Sparkles size={16} />
                Claude's Explanation
              </h3>
              <div className="text-sm text-purple-800 whitespace-pre-wrap">{explanation}</div>
            </div>
          )}

          {/* Reason Input (for soft blocks) */}
          {canProceed && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Proceeding (Required)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                rows={3}
                placeholder="Explain why you need to proceed despite the warnings..."
              />
              <div className="text-xs text-gray-500 mt-1">
                Minimum 10 characters. This will be logged in the audit trail.
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          {canProceed && onProceed && (
            <button
              onClick={handleProceed}
              className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Proceed Anyway
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
