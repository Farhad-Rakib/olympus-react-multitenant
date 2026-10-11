import { BaseRepository } from '../base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface TranslationBundleDto {
  language: string;
  // Flat: { "common.save": "Enregistrer" }. Nested into i18next's shape by core/i18n.
  entries: Record<string, string>;
}

export interface TranslationEntryDto {
  key: string;
  value: string;
}

export interface UpsertTranslationsResultDto {
  created: number;
  updated: number;
  deleted: number;
}

// Backed by TranslationsController. GET is anonymous (tenant from host / X-Tenant-Id) so the
// login page can already be translated; PUT/DELETE need translations.manage.
class TranslationApi extends BaseRepository {
  constructor() {
    super('/translations');
  }

  async getBundle(language: string): Promise<TranslationBundleDto> {
    const res = await this.get<ApiResponse<TranslationBundleDto>>(`/${encodeURIComponent(language)}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async getLanguages(): Promise<string[]> {
    const res = await this.get<ApiResponse<string[]>>('/languages');
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async upsert(language: string, entries: TranslationEntryDto[]): Promise<UpsertTranslationsResultDto> {
    const res = await this.put<ApiResponse<UpsertTranslationsResultDto>>(`/${encodeURIComponent(language)}`, { entries });
    if (!res.success) throw new Error(res.message);
    return res.data;
  }

  async deleteLanguage(language: string): Promise<number> {
    const res = await this.delete<ApiResponse<number>>(`/${encodeURIComponent(language)}`);
    if (!res.success) throw new Error(res.message);
    return res.data;
  }
}

export const translationApi = new TranslationApi();
