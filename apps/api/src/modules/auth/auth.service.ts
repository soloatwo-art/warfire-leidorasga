import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcryptjs";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UserRole, UserStatus, MarkerTag } from "@warfire/shared";
import { AuthenticatedUser } from "./types/authenticated-user";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { login: dto.login } });
    if (existing) {
      throw new ConflictException("Este login já está em uso.");
    }

    const existingCharacter = await this.prisma.character.findUnique({
      where: { name: dto.mainCharacterName },
    });
    if (existingCharacter?.userId) {
      throw new ConflictException("Este personagem já está vinculado a outro usuário.");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        discordTag: dto.discordTag,
        login: dto.login,
        passwordHash,
        role: UserRole.PENDING,
        status: UserStatus.PENDING_APPROVAL,
        characters: {
          connectOrCreate: [
            {
              where: { name: dto.mainCharacterName },
              create: {
                name: dto.mainCharacterName,
                world: dto.world,
                isPrincipal: true,
                markerTag: dto.isMainMarker ? MarkerTag.MAIN : MarkerTag.MARKER,
              },
            },
            ...(dto.secondaryCharacters ?? []).map((c) => ({
              where: { name: c.name },
              create: {
                name: c.name,
                world: c.world,
                isPrincipal: false,
                markerTag: c.markerTag,
              },
            })),
          ],
        },
      },
      include: { characters: true },
    });

    return user;
  }

  async login(dto: LoginDto): Promise<{ user: AuthenticatedUser; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({ where: { login: dto.login } });
    if (!user) throw new UnauthorizedException("Login ou senha inválidos.");

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) throw new UnauthorizedException("Login ou senha inválidos.");

    if (user.status !== UserStatus.APPROVED) {
      throw new UnauthorizedException(
        "Seu cadastro ainda está pendente de aprovação por um administrador.",
      );
    }

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      login: user.login,
      name: user.name,
      role: user.role as UserRole,
      status: user.status as UserStatus,
    };

    await this.prisma.auditLog.create({
      data: { actorUserId: user.id, action: "LOGIN", target: user.id },
    });

    return { user: authenticatedUser, tokens: this.issueTokens(authenticatedUser) };
  }

  issueTokens(user: AuthenticatedUser): TokenPair {
    const payload = { sub: user.id, login: user.login, role: user.role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>("jwt.accessSecret"),
      expiresIn: this.config.get<string>("jwt.accessExpiresIn"),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>("jwt.refreshSecret"),
      expiresIn: this.config.get<string>("jwt.refreshExpiresIn"),
    });

    return { accessToken, refreshToken };
  }

  async refreshFromToken(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>("jwt.refreshSecret"),
      });
    } catch {
      throw new UnauthorizedException("Refresh token inválido ou expirado.");
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== UserStatus.APPROVED) {
      throw new UnauthorizedException("Usuário não encontrado ou não aprovado.");
    }

    return this.issueTokens({
      id: user.id,
      login: user.login,
      name: user.name,
      role: user.role as UserRole,
      status: user.status as UserStatus,
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { characters: true },
    });
    if (!user) throw new NotFoundException("Usuário não encontrado.");
    return user;
  }

  async listPending() {
    return this.prisma.user.findMany({
      where: { status: UserStatus.PENDING_APPROVAL },
      include: { characters: true },
      orderBy: { createdAt: "asc" },
    });
  }

  async approve(userId: string, approvedById: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Usuário não encontrado.");

    await this.prisma.auditLog.create({
      data: { actorUserId: approvedById, action: "USER_APPROVED", target: userId },
    });

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.APPROVED,
        role: UserRole.MEMBER,
        approvedById,
        approvedAt: new Date(),
      },
    });
  }

  async reject(userId: string, rejectedById: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("Usuário não encontrado.");

    await this.prisma.auditLog.create({
      data: { actorUserId: rejectedById, action: "USER_REJECTED", target: userId },
    });

    return this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.REJECTED },
    });
  }
}
