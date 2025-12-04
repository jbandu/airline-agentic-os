import type {
  Domain,
  MCP,
  ApiResponse,
  PaginatedResponse,
  CreateDomainInput,
  UpdateDomainInput,
  CreateMCPInput,
  UpdateMCPInput,
  MCPFilters,
  OverviewStats,
  BuildProgress,
  ResearchParams,
  ResearchResult,
  AuditLog,
  AuditFilters,
  DependencyCheckResult,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private actor: string = 'team@numberlabs.ai';

  setActor(actor: string) {
    this.actor = actor;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Actor': this.actor,
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || 'Request failed', response.status, data);
    }

    return data;
  }

  // Domains
  async getDomains() {
    return this.fetch<ApiResponse<Domain[]>>('/domains');
  }

  async getDomain(id: string) {
    return this.fetch<ApiResponse<Domain>>(`/domains/${id}`);
  }

  async createDomain(data: CreateDomainInput) {
    return this.fetch<ApiResponse<Domain>>('/domains', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDomain(id: string, data: UpdateDomainInput) {
    return this.fetch<ApiResponse<Domain>>(`/domains/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDomain(id: string, reason?: string) {
    return this.fetch<ApiResponse<void>>(`/domains/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  // MCPs
  async getMCPs(filters?: MCPFilters) {
    const params = new URLSearchParams(filters as any);
    return this.fetch<PaginatedResponse<MCP>>(`/mcps?${params}`);
  }

  async getMCP(id: string) {
    return this.fetch<ApiResponse<MCP>>(`/mcps/${id}`);
  }

  async createMCP(data: CreateMCPInput) {
    return this.fetch<ApiResponse<MCP>>('/mcps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMCP(id: string, data: UpdateMCPInput) {
    return this.fetch<ApiResponse<MCP>>(`/mcps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMCP(id: string, reason?: string) {
    return this.fetch<ApiResponse<void>>(`/mcps/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  }

  // Research
  async conductResearch(params: ResearchParams) {
    return this.fetch<ResearchResult>('/research/conduct', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async acceptSuggestion(id: string, modifications?: any) {
    return this.fetch<ApiResponse<any>>(`/research/suggestions/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ modifications }),
    });
  }

  async rejectSuggestion(id: string, reason: string) {
    return this.fetch<ApiResponse<void>>(`/research/suggestions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async explainBlock(checkResult: DependencyCheckResult) {
    return this.fetch<ApiResponse<{ explanation: string }>>('/research/explain-block', {
      method: 'POST',
      body: JSON.stringify({ checkResult }),
    });
  }

  // Stats
  async getOverviewStats() {
    return this.fetch<ApiResponse<OverviewStats>>('/stats/overview');
  }

  async getBuildProgress() {
    return this.fetch<ApiResponse<BuildProgress>>('/stats/build-progress');
  }

  // Audit
  async getAuditLogs(filters?: AuditFilters) {
    const params = new URLSearchParams(filters as any);
    return this.fetch<PaginatedResponse<AuditLog>>(`/audit?${params}`);
  }

  async getEntityHistory(entityType: string, entityId: string) {
    return this.fetch<ApiResponse<AuditLog[]>>(`/audit/entity/${entityType}/${entityId}`);
  }
}

export const api = new ApiClient();
export { ApiError };
