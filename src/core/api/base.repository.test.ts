import { describe, it, expect, beforeEach } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import { BaseRepository } from './base.repository';
import { AppConfig } from '../config/app.config';

// Runs the request interceptor the way axios would, without a network.
const headersFor = (state: Record<string, unknown>) => {
  localStorage.setItem(AppConfig.auth.tokenKey, JSON.stringify({ state, version: 0 }));
  const repo = new BaseRepository('/x');
  const handler = (repo as unknown as { client: { interceptors: { request: { handlers: Array<{ fulfilled: (c: InternalAxiosRequestConfig) => InternalAxiosRequestConfig }> } } } })
    .client.interceptors.request.handlers[0];
  const config = handler.fulfilled({ headers: {} } as unknown as InternalAxiosRequestConfig);
  return config.headers as unknown as Record<string, string | undefined>;
};

describe('BaseRepository tenant header', () => {
  beforeEach(() => localStorage.clear());

  it('sends the home tenant by default', () => {
    expect(headersFor({ tenantSlug: 'home', accessToken: 't' })['X-Tenant-Id']).toBe('home');
  });

  it('prefers the acting tenant when a platform admin has switched', () => {
    expect(headersFor({ tenantSlug: 'home', actingTenantSlug: 'acme', accessToken: 't' })['X-Tenant-Id']).toBe('acme');
  });

  it('sends no header when there is no tenant at all', () => {
    expect(headersFor({ accessToken: 't' })['X-Tenant-Id']).toBeUndefined();
  });
});
