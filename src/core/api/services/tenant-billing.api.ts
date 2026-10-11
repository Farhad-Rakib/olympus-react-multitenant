import { BaseRepository } from '../base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

// Matches the backend BillingInterval enum order exactly (Domain/Enums/BillingInterval.cs).
// The API serialises enums as numbers, so the frontend must too.
export enum BillingInterval {
  None = 0,
  Monthly = 1,
  Yearly = 2,
}

export interface TenantBillingConfigDto {
  provider: string;
  // false under the "manual" provider or while Payment:Enabled is off -- there is no hosted
  // checkout to send anyone to, and the UI should say so rather than show a dead button.
  checkoutAvailable: boolean;
  defaultCurrency: string;
}

export interface PurchasablePlanDto {
  key: string;
  name: string;
  description: string;
  maxUsers: number;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
  isCurrent: boolean;
}

export interface HostedUrlDto {
  url: string;
}

// Self-service billing for "my own tenant" (TenantBillingController, api/v1/tenant/billing).
// Every endpoint is reachable while the licence is Expired/Suspended -- that is the whole point.
class TenantBillingApi extends BaseRepository {
  constructor() {
    super('/tenant/billing');
  }

  async getConfig(): Promise<TenantBillingConfigDto> {
    const res = await this.get<ApiResponse<TenantBillingConfigDto>>('/config');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getPlans(): Promise<PurchasablePlanDto[]> {
    const res = await this.get<ApiResponse<PurchasablePlanDto[]>>('/plans');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async startCheckout(planKey: string): Promise<HostedUrlDto> {
    const res = await this.post<ApiResponse<HostedUrlDto>>('/checkout', { planKey });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async openPortal(): Promise<HostedUrlDto> {
    const res = await this.post<ApiResponse<HostedUrlDto>>('/portal', {});
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const tenantBillingApi = new TenantBillingApi();
