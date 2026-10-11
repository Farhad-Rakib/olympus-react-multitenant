import { BaseRepository } from '../base.repository';
import { ApiResponse } from '../../../domain/dto/auth.dto';

export interface CacheFlushResult {
  distributedDeleted: number;
  redisDeleted: number | null; // null when Redis is not enabled on the server
}

class SystemCacheApi extends BaseRepository {
  constructor() {
    super('/System/cache');
  }

  // Flushes both server-side caches. The Redis flush returns 503 when Caching:UseRedis is off,
  // which is the normal local-dev configuration, so that failure is swallowed rather than surfaced.
  async flushAll(): Promise<CacheFlushResult> {
    const distributed = await this.delete<ApiResponse<{ deleted: number }>>('/distributed/flush');
    if (!distributed.success) throw new Error(distributed.message);

    let redisDeleted: number | null = null;
    try {
      const redis = await this.delete<ApiResponse<{ deleted: number }>>('/flush');
      if (redis.success) redisDeleted = redis.data.deleted;
    } catch {
      redisDeleted = null;
    }

    return { distributedDeleted: distributed.data.deleted, redisDeleted };
  }
}

export const systemCacheApi = new SystemCacheApi();
