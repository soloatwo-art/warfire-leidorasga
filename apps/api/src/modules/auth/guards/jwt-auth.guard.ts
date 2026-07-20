import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { AuthenticatedUser } from "../types/authenticated-user";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.["access_token"];
    if (!token) throw new UnauthorizedException("Não autenticado.");

    try {
      const payload = this.jwt.verify<{ sub: string; login: string; role: string }>(token, {
        secret: this.config.get<string>("jwt.accessSecret"),
      });
      const user: AuthenticatedUser = {
        id: payload.sub,
        login: payload.login,
        name: payload.login,
        role: payload.role as AuthenticatedUser["role"],
        status: "APPROVED" as AuthenticatedUser["status"],
      };
      (request as Request & { user: AuthenticatedUser }).user = user;
      return true;
    } catch {
      throw new UnauthorizedException("Sessão expirada, faça login novamente.");
    }
  }
}
