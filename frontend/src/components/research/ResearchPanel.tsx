import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { useConductResearch, useAcceptSuggestion, useRejectSuggestion } from '../../hooks/useEntities';
import { SuggestionCard } from './SuggestionCard';

interface ResearchPanelProps {
  domainId: string;
  subdomainId?: string;
}

export function ResearchPanel({ domainId, subdomainId }: ResearchPanelProps) {
  const [researchType, setResearchType] = useState<'mcps' | 'agents' | 'workflows'>('mcps');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string>('');

  const conductResearch = useConductResearch();
  const acceptSuggestion = useAcceptSuggestion();
  const rejectSuggestion = useRejectSuggestion();

  const handleResearch = async () => {
    try {
      const result = await conductResearch.mutateAsync({
        domainId,
        subdomainId,
        researchType,
      });

      setSuggestions(result.suggestions || []);
      setAnalysis(result.context?.analysis || 'Research completed successfully.');
    } catch (error) {
      console.error('Research failed:', error);
    }
  };

  const handleAccept = async (suggestionId: string) => {
    try {
      await acceptSuggestion.mutateAsync({ id: suggestionId });
      setSuggestions(suggestions.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Failed to accept suggestion:', error);
    }
  };

  const handleReject = async (suggestionId: string, reason: string) => {
    try {
      await rejectSuggestion.mutateAsync({ id: suggestionId, reason });
      setSuggestions(suggestions.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-lg p-6 border border-purple-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
          <Sparkles className="text-white" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Research Assistant</h2>
          <p className="text-sm text-gray-600">Powered by Claude</p>
        </div>
      </div>

      {/* Research Controls */}
      <div className="bg-white rounded-lg p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What would you like to research?
        </label>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setResearchType('mcps')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              researchType === 'mcps'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            MCPs
          </button>
          <button
            onClick={() => setResearchType('agents')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              researchType === 'agents'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Agents
          </button>
          <button
            onClick={() => setResearchType('workflows')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              researchType === 'workflows'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Workflows
          </button>
        </div>

        <button
          onClick={handleResearch}
          disabled={conductResearch.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Search size={18} />
          {conductResearch.isPending ? 'Researching...' : 'Start AI Research'}
        </button>
      </div>

      {/* Analysis */}
      {analysis && (
        <div className="bg-white rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Analysis</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysis}</p>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">
            Suggestions ({suggestions.length})
          </h3>
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAccept={() => handleAccept(suggestion.id)}
                onReject={(reason) => handleReject(suggestion.id, reason)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
