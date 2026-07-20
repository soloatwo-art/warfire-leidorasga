import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

/**
 * Gates routes meant to be called by a trusted automated caller (a
 * Cloudflare Worker Cron Trigger, in production) rather than a logged-in
 * browser session — those callers have no JWT cookie, just a shared secret.
 * Combine with `@Public()` on the same route so the normal JwtAuthGuard
 * doesn't also demand a session cookie.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const token = this.config.get<string>("internalSyncToken");
    if (!token) {
      throw new UnauthorizedException(
        "INTERNAL_SYNC_TOKEN não configurado — endpoint interno desabilitado.",
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers["x-internal-token"];
    if (provided !== token) {
      throw new UnauthorizedException("Token interno inválido.");
    }

    return true;
  }
}
