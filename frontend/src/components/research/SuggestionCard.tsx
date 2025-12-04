import { useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

interface SuggestionCardProps {
  suggestion: any;
  onAccept: () => void;
  onReject: (reason: string) => void;
}

export function SuggestionCard({ suggestion, onAccept, onReject }: SuggestionCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = () => {
    if (rejectReason.trim().length < 10) {
      alert('Please provide a reason (at least 10 characters)');
      return;
    }
    onReject(rejectReason);
    setShowRejectModal(false);
  };

  const data = suggestion.suggestedData || {};
  const priority = data.priority || 3;

  return (
    <>
      <div className="bg-white rounded-lg border-2 border-purple-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">
                {data.suggestedName || 'Unnamed Suggestion'}
              </h4>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  priority >= 4
                    ? 'bg-red-100 text-red-800'
                    : priority >= 3
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                Priority {priority}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Type: {data.entityType || suggestion.suggestionType}
            </div>
          </div>
        </div>

        {data.reasoning && (
          <p className="text-sm text-gray-700 mb-3">{data.reasoning}</p>
        )}

        {data.dependencies && data.dependencies.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <AlertCircle size={12} />
              Dependencies
            </div>
            <div className="flex flex-wrap gap-2">
              {data.dependencies.map((dep: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={onAccept}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Check size={16} />
            Accept
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <X size={16} />
            Reject
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Suggestion</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this suggestion (minimum 10 characters):
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
              placeholder="e.g., Not aligned with current priorities..."
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
