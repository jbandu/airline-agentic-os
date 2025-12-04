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
  Certification,
  CertificationEntityType,
  CertificationType,
  CertificationStatus,
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

  // Subdomains
  async getSubdomains() {
    return this.fetch<ApiResponse<any[]>>('/subdomains');
  }

  // Bridges
  async getBridges() {
    return this.fetch<any[]>('/cross-domain/bridges');
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

  // Dependencies
  async checkDelete(entityType: string, entityId: string) {
    return this.fetch<DependencyCheckResult>('/dependencies/check-delete', {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId }),
    });
  }

  async checkEdit(entityType: string, entityId: string, proposedChanges: any) {
    return this.fetch<DependencyCheckResult>('/dependencies/check-edit', {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId, proposedChanges }),
    });
  }

  // Personas
  async getPersonas(filters?: { subdomainId?: string; airlineType?: string }) {
    const params = new URLSearchParams(filters as any);
    return this.fetch<ApiResponse<any[]>>(`/personas?${params}`);
  }

  async getPersona(id: string) {
    return this.fetch<ApiResponse<any>>(`/personas/${id}`);
  }

  async createPersona(data: any) {
    return this.fetch<ApiResponse<any>>('/personas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePersona(id: string, data: any) {
    return this.fetch<ApiResponse<any>>(`/personas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePersona(id: string) {
    return this.fetch<ApiResponse<void>>(`/personas/${id}`, {
      method: 'DELETE',
    });
  }

  // Use Cases
  async getUseCases(filters?: {
    personaId?: string;
    status?: string;
    businessImpact?: string;
    implementationWave?: number;
    category?: string;
    minPriority?: number;
  }) {
    const params = new URLSearchParams(filters as any);
    return this.fetch<ApiResponse<any[]>>(`/use-cases?${params}`);
  }

  async getUseCase(id: string) {
    return this.fetch<ApiResponse<any>>(`/use-cases/${id}`);
  }

  async createUseCase(data: any) {
    return this.fetch<ApiResponse<any>>('/use-cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUseCase(id: string, data: any) {
    return this.fetch<ApiResponse<any>>(`/use-cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUseCase(id: string) {
    return this.fetch<ApiResponse<void>>(`/use-cases/${id}`, {
      method: 'DELETE',
    });
  }

  async getUseCaseROI(id: string) {
    return this.fetch<ApiResponse<any>>(`/use-cases/${id}/roi`);
  }

  async getUseCaseAutomationAnalysis(id: string) {
    return this.fetch<ApiResponse<any>>(`/use-cases/${id}/automation-analysis`);
  }

  // Certifications
  async getCertifications(filters?: {
    entityType?: CertificationEntityType;
    entityId?: string;
    certificationType?: CertificationType;
    status?: CertificationStatus;
  }) {
    const params = new URLSearchParams(filters as any);
    return this.fetch<Certification[]>(`/certifications?${params}`);
  }

  async getCertification(id: string) {
    return this.fetch<Certification>(`/certifications/${id}`);
  }

  async createCertification(data: Partial<Certification>) {
    return this.fetch<Certification>('/certifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCertification(id: string, data: Partial<Certification>) {
    return this.fetch<Certification>(`/certifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateCertificationStatus(
    id: string,
    status: CertificationStatus,
    changedBy?: string,
    reason?: string
  ) {
    return this.fetch<Certification>(`/certifications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, changedBy, reason }),
    });
  }

  async deleteCertification(id: string) {
    return this.fetch<void>(`/certifications/${id}`, {
      method: 'DELETE',
    });
  }

  async getCertificationHistory(id: string) {
    return this.fetch<any[]>(`/certifications/${id}/history`);
  }
}

export const api = new ApiClient();
export { ApiError };
