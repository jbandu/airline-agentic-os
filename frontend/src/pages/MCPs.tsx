import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useMCPs, useCheckDelete, useDeleteMCP } from '../hooks/useEntities';
import { DependencyBlockModal } from '../components/dependencies/DependencyBlockModal';
import type { DependencyCheckResult } from '../types';

const statusColors = {
  built: 'bg-green-100 text-green-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  planned: 'bg-gray-100 text-gray-800',
};

export function MCPs() {
  const { data: mcps, isLoading } = useMCPs();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [checkResult, setCheckResult] = useState<DependencyCheckResult | null>(null);
  const [selectedMCP, setSelectedMCP] = useState<any>(null);

  const checkDelete = useCheckDelete();
  const deleteMCP = useDeleteMCP();

  const handleDeleteClick = async (mcp: any) => {
    setSelectedMCP(mcp);
    try {
      const result = await checkDelete.mutateAsync({
        entityType: 'mcp',
        entityId: mcp.id,
      });
      setCheckResult(result);
      setShowDeleteModal(true);
    } catch (error) {
      console.error('Dependency check failed:', error);
    }
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!selectedMCP) return;

    try {
      await deleteMCP.mutateAsync({ id: selectedMCP.id, reason });
      setShowDeleteModal(false);
      setSelectedMCP(null);
      setCheckResult(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedMCP(null);
    setCheckResult(null);
  };

  if (isLoading) {
    return <div>Loading MCPs...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Model Context Protocols (MCPs)
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your AI-powered context protocols and tools
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {mcps?.map((mcp: any) => (
            <li key={mcp.id}>
              <div className="px-6 py-5 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {mcp.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusColors[mcp.status as keyof typeof statusColors]
                          }`}
                        >
                          {mcp.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteClick(mcp)}
                        disabled={checkDelete.isPending || deleteMCP.isPending}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      {mcp.description}
                    </p>
                    <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                      <span>
                        Domain: {mcp.subdomain?.domain?.name || 'N/A'}
                      </span>
                      <span>
                        Subdomain: {mcp.subdomain?.name || 'N/A'}
                      </span>
                      {mcp.targetQuarter && (
                        <span>Target: {mcp.targetQuarter}</span>
                      )}
                      {mcp.owner && <span>Owner: {mcp.owner}</span>}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {mcp.tools?.length || 0} tools
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Dependency Block Modal */}
      {showDeleteModal && checkResult && selectedMCP && (
        <DependencyBlockModal
          checkResult={checkResult}
          entityName={selectedMCP.name}
          action="Delete"
          onCancel={handleDeleteCancel}
          onProceed={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
