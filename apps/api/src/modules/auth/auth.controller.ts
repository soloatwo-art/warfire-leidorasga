import { Body, Controller, Get, Param, Post, Req, Res, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { AuthService, TokenPair } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Public } from "./decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UserRole } from "@warfire/shared";
import type { AuthenticatedUser } from "./types/authenticated-user";

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post("register")
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return {
      message:
        "Cadastro recebido. Um administrador precisa aprovar sua conta antes que você possa entrar.",
      userId: user.id,
    };
  }

  @Public()
  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.authService.login(dto);
    this.setAuthCookies(res, tokens);
    return { user };
  }

  @Public()
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.["refresh_token"];
    if (!refreshToken) throw new UnauthorizedException("Refresh token ausente.");

    const tokens = await this.authService.refreshFromToken(refreshToken);
    this.setAuthCookies(res, tokens);
    return { message: "Sessão renovada." };
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    return { message: "Sessão encerrada." };
  }

  @Get("me")
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @Get("pending")
  async pending() {
    return this.authService.listPending();
  }

  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @Post("approve/:userId")
  async approve(@Param("userId") userId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.approve(userId, user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.MASTER)
  @Post("reject/:userId")
  async reject(@Param("userId") userId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.reject(userId, user.id);
  }

  private setAuthCookies(res: Response, tokens: TokenPair) {
    const domain = this.config.get<string>("cookieDomain");
    const isProduction = process.env.NODE_ENV === "production";

    // Local dev: frontend/backend share "localhost" as a real cookie
    // domain, so "lax" + an explicit domain works fine.
    // Split-host deploys (Render, Cloudflare Pages+Container, etc.): the
    // frontend and API live on two unrelated hosts (often subdomains of a
    // shared *public* suffix like onrender.com, where browsers refuse a
    // domain-wide cookie anyway). In that case we omit `domain` entirely —
    // the cookie just scopes to the API's own host, which is all that's
    // needed since the frontend only ever talks to that one host — and use
    // "none" so it's still sent on the frontend's cross-origin fetch calls.
    const crossSite = isProduction && domain !== "localhost";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: crossSite ? ("none" as const) : ("lax" as const),
      domain: crossSite ? undefined : domain,
    };

    res.cookie("access_token", tokens.accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    });
    res.cookie("refresh_token", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
      path: "/auth/refresh",
    });
  }
}
