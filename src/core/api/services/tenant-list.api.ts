import { BaseRepository } from '../base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface TenantSummaryDto {
  id: number;
  slug: string;
  name: string;
  isActive: boolean;
}

// Deliberately separate from the full admin tenantApi in TenantsPage.tsx: the header's tenant
// switcher must not drag that whole page (and its chunk) into the initial bundle.
class TenantListApi extends BaseRepository {
  constructor() {
    super('/tenants');
  }

  async getAll(): Promise<TenantSummaryDto[]> {
    const res = await this.get<ApiResponse<TenantSummaryDto[]>>('');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const tenantListApi = new TenantListApi();
