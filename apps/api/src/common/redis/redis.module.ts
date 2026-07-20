import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>("redis.url")!;
        // rediss:// (TLS) is how Upstash's Redis-protocol endpoint is
        // exposed — ioredis needs an explicit `tls` object (not just the
        // scheme) for some providers' certificate chains to validate.
        const tls = url.startsWith("rediss://") ? {} : undefined;
        return new Redis(url, { maxRetriesPerRequest: null, tls });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
