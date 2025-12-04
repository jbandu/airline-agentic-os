import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../lib/api';
import type {
  CreateDomainInput,
  UpdateDomainInput,
  CreateMCPInput,
  UpdateMCPInput,
  MCPFilters,
  ResearchParams,
  AuditFilters,
  DependencyCheckResult,
} from '../types';

// ============================================================================
// DOMAINS
// ============================================================================

export function useDomains() {
  return useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const response = await api.getDomains();
      return response.data || [];
    },
  });
}

export function useDomain(id: string | undefined) {
  return useQuery({
    queryKey: ['domains', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.getDomain(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDomainInput) => api.createDomain(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Domain created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create domain');
    },
  });
}

export function useUpdateDomain(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateDomainInput) => api.updateDomain(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['domains', id] });
      toast.success('Domain updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update domain');
    },
  });
}

export function useDeleteDomain() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.deleteDomain(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Domain deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete domain');
    },
  });
}

// ============================================================================
// SUBDOMAINS
// ============================================================================

export function useSubdomains() {
  return useQuery({
    queryKey: ['subdomains'],
    queryFn: async () => {
      const response = await api.getSubdomains();
      return response.data || [];
    },
  });
}

// ============================================================================
// MCPs
// ============================================================================

export function useMCPs(filters?: MCPFilters) {
  return useQuery({
    queryKey: ['mcps', filters],
    queryFn: async () => {
      const response = await api.getMCPs(filters);
      return response.data || [];
    },
  });
}

export function useMCP(id: string | undefined) {
  return useQuery({
    queryKey: ['mcps', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.getMCP(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateMCP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMCPInput) => api.createMCP(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('MCP created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create MCP');
    },
  });
}

export function useUpdateMCP(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateMCPInput) => api.updateMCP(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
      queryClient.invalidateQueries({ queryKey: ['mcps', id] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('MCP updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update MCP');
    },
  });
}

export function useDeleteMCP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.deleteMCP(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('MCP deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete MCP');
    },
  });
}

// ============================================================================
// CROSS-DOMAIN BRIDGES
// ============================================================================

export function useBridges() {
  return useQuery({
    queryKey: ['bridges'],
    queryFn: async () => {
      const response = await api.getBridges();
      return response || [];
    },
  });
}

// ============================================================================
// RESEARCH
// ============================================================================

export function useConductResearch() {
  return useMutation({
    mutationFn: (params: ResearchParams) => api.conductResearch(params),
    onSuccess: () => {
      toast.success('Research completed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Research failed');
    },
  });
}

export function useAcceptSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, modifications }: { id: string; modifications?: any }) =>
      api.acceptSuggestion(id, modifications),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcps'] });
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Suggestion accepted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to accept suggestion');
    },
  });
}

export function useRejectSuggestion() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.rejectSuggestion(id, reason),
    onSuccess: () => {
      toast.success('Suggestion rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject suggestion');
    },
  });
}

export function useExplainBlock() {
  return useMutation({
    mutationFn: (checkResult: DependencyCheckResult) => api.explainBlock(checkResult),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to get explanation');
    },
  });
}

// ============================================================================
// STATS
// ============================================================================

export function useOverviewStats() {
  return useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: async () => {
      const response = await api.getOverviewStats();
      return response.data;
    },
  });
}

export function useBuildProgress() {
  return useQuery({
    queryKey: ['stats', 'build-progress'],
    queryFn: async () => {
      const response = await api.getBuildProgress();
      return response.data;
    },
  });
}

// ============================================================================
// DEPENDENCIES
// ============================================================================

export function useCheckDelete() {
  return useMutation({
    mutationFn: ({ entityType, entityId }: { entityType: string; entityId: string }) =>
      api.checkDelete(entityType, entityId),
  });
}

export function useCheckEdit() {
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      proposedChanges,
    }: {
      entityType: string;
      entityId: string;
      proposedChanges: any;
    }) => api.checkEdit(entityType, entityId, proposedChanges),
  });
}

// ============================================================================
// AUDIT
// ============================================================================

export function useAuditLogs(filters?: AuditFilters) {
  return useQuery({
    queryKey: ['audit', filters],
    queryFn: async () => {
      const response = await api.getAuditLogs(filters);
      return response.data || [];
    },
  });
}

export function useEntityHistory(entityType: string | undefined, entityId: string | undefined) {
  return useQuery({
    queryKey: ['audit', 'entity', entityType, entityId],
    queryFn: async () => {
      if (!entityType || !entityId) return [];
      const response = await api.getEntityHistory(entityType, entityId);
      return response.data || [];
    },
    enabled: !!entityType && !!entityId,
  });
}

// ============================================================================
// PERSONAS
// ============================================================================

export function usePersonas(filters?: { subdomainId?: string; airlineType?: string }) {
  return useQuery({
    queryKey: ['personas', filters],
    queryFn: async () => {
      const response = await api.getPersonas(filters);
      return response.data || [];
    },
  });
}

export function usePersona(id: string | undefined) {
  return useQuery({
    queryKey: ['personas', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.getPersona(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.createPersona(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      queryClient.invalidateQueries({ queryKey: ['subdomains'] });
      toast.success('Persona created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create persona');
    },
  });
}

export function useUpdatePersona(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.updatePersona(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      queryClient.invalidateQueries({ queryKey: ['personas', id] });
      toast.success('Persona updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update persona');
    },
  });
}

export function useDeletePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deletePersona(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      queryClient.invalidateQueries({ queryKey: ['subdomains'] });
      toast.success('Persona deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete persona');
    },
  });
}

// ============================================================================
// USE CASES
// ============================================================================

export function useUseCases(filters?: {
  personaId?: string;
  status?: string;
  businessImpact?: string;
  implementationWave?: number;
  category?: string;
  minPriority?: number;
}) {
  return useQuery({
    queryKey: ['use-cases', filters],
    queryFn: async () => {
      const response = await api.getUseCases(filters);
      return response.data || [];
    },
  });
}

export function useUseCase(id: string | undefined) {
  return useQuery({
    queryKey: ['use-cases', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.getUseCase(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useUseCaseROI(id: string | undefined) {
  return useQuery({
    queryKey: ['use-cases', id, 'roi'],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.getUseCaseROI(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateUseCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.createUseCase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['use-cases'] });
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      toast.success('Use case created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create use case');
    },
  });
}

export function useUpdateUseCase(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.updateUseCase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['use-cases'] });
      queryClient.invalidateQueries({ queryKey: ['use-cases', id] });
      toast.success('Use case updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update use case');
    },
  });
}

export function useDeleteUseCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteUseCase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['use-cases'] });
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      toast.success('Use case deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete use case');
    },
  });
}
