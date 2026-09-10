import { BaseRepository } from '../base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';
import { LicenseStatus } from './tenant-self.api';

export interface TenantPlanDto {
  key: string;
  name: string;
  description: string;
  maxUsers: number;
}

export interface TenantModuleSummaryDto {
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

export interface TenantOverviewDto {
  name: string;
  slug: string;
  plan: TenantPlanDto | null;
  licenseStatus: LicenseStatus;
  trialEndsAtUtc: string | null;
  licenseExpiresAtUtc: string | null;
  userCount: number;
  modules: TenantModuleSummaryDto[];
}

// Backed by TenantSelfController (api/v1/tenant), so it answers for "my own tenant" and needs no
// platform permission -- any authenticated member can load their own dashboard.
class TenantOverviewApi extends BaseRepository {
  constructor() {
    super('/tenant');
  }

  async getOverview(): Promise<TenantOverviewDto> {
    const res = await this.get<ApiResponse<TenantOverviewDto>>('/overview');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const tenantOverviewApi = new TenantOverviewApi();
