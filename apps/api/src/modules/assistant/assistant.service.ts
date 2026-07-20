import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StatsService } from "../stats/stats.service";
import { AssistantAnswerDto, GuildEventType } from "@warfire/shared";

interface Rule {
  patterns: RegExp[];
  handle: () => Promise<AssistantAnswerDto>;
}

/**
 * Rule-based "guild assistant" — deliberately not an LLM. It answers a fixed
 * set of guild-management questions by querying data we actually have. The
 * interface (ask -> AssistantAnswerDto) is designed so a real LLM could be
 * swapped in later without touching callers.
 */
@Injectable()
export class AssistantService {
  private readonly rules: Rule[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: StatsService,
  ) {
    this.rules = [
      {
        patterns: [/mais upou hoje/i, /subiu.*hoje/i],
        handle: async () => {
          const top = await this.stats.levelGainLeaderboard("day", 5);
          return this.leaderboardAnswer(top, "levels ganhos hoje", "Ninguém subiu de level hoje ainda.");
        },
      },
      {
        patterns: [/mais upou.*semana/i, /mais upou essa semana/i],
        handle: async () => {
          const top = await this.stats.levelGainLeaderboard("week", 5);
          return this.leaderboardAnswer(top, "levels ganhos essa semana", "Ninguém subiu de level essa semana ainda.");
        },
      },
      {
        patterns: [/mais upou.*m[eê]s/i],
        handle: async () => {
          const top = await this.stats.levelGainLeaderboard("month", 5);
          return this.leaderboardAnswer(top, "levels ganhos esse mês", "Ninguém subiu de level esse mês ainda.");
        },
      },
      {
        patterns: [/quem (est[aá] )?inativ/i, /sem atividade/i],
        handle: async () => {
          const radar = await this.stats.inactivityRadar(5);
          if (radar.length === 0) {
            return { answer: "Ninguém está inativo no momento — a guild está agitada!" };
          }
          const lines = radar.map(
            (m) =>
              `${m.characterName} (${m.daysSinceLastActivity ?? "?"} dias sem atividade detectada)`,
          );
          return { answer: `Membros mais inativos:\n${lines.join("\n")}`, data: radar };
        },
      },
      {
        patterns: [/offline h[aá] mais tempo/i, /mais tempo offline/i],
        handle: async () => {
          const radar = await this.stats.inactivityRadar(5);
          return this.leaderboardStyleFromRadar(radar);
        },
      },
      {
        patterns: [/mais joga/i, /mais online/i, /mais tempo online/i],
        handle: async () => {
          const top = await this.stats.mostOnlineSessionsLeaderboard("week", 5);
          return this.leaderboardAnswer(
            top,
            "sessões online essa semana (aproximação — não temos duração exata de sessão)",
            "Ainda não há dados de sessões online suficientes esta semana.",
          );
        },
      },
      {
        patterns: [/entrou recentemente/i, /novos membros/i, /quem entrou/i],
        handle: async () => {
          const recentJoins = await this.prisma.guildEvent.findMany({
            where: { type: GuildEventType.JOIN },
            orderBy: { occurredAt: "desc" },
            take: 5,
          });
          if (recentJoins.length === 0) {
            return { answer: "Não há registros de novos membros recentes." };
          }
          const lines = recentJoins.map(
            (e) => `${e.characterName} — ${e.occurredAt.toLocaleString("pt-BR")}`,
          );
          return { answer: `Últimos membros que entraram:\n${lines.join("\n")}`, data: recentJoins };
        },
      },
      {
        patterns: [/mais morreu/i, /mais mortes/i, /morreu mais/i],
        handle: async () => {
          const top = await this.stats.deathsLeaderboard("week", 5);
          return this.leaderboardAnswer(top, "mortes essa semana", "Ninguém morreu essa semana ainda.");
        },
      },
      {
        patterns: [/ca[cç]ando/i, /hunting/i],
        handle: async () => {
          return {
            answer:
              "Não temos como saber quem está caçando agora — o RubinOT não publica essa informação publicamente. Posso te dizer quem está online, isso sim.",
          };
        },
      },
      {
        patterns: [/quem (est[aá] )?online/i],
        handle: async () => {
          const online = await this.prisma.guildMember.findMany({
            where: { online: true },
            orderBy: { level: "desc" },
            take: 20,
          });
          if (online.length === 0) {
            return { answer: "Ninguém da guild está online no momento." };
          }
          const lines = online.map((m) => `${m.characterName} (level ${m.level})`);
          return { answer: `Online agora (${online.length}):\n${lines.join("\n")}`, data: online };
        },
      },
    ];
  }

  async ask(question: string): Promise<AssistantAnswerDto> {
    for (const rule of this.rules) {
      if (rule.patterns.some((p) => p.test(question))) {
        return rule.handle();
      }
    }

    return {
      answer:
        "Não entendi essa pergunta ainda. Tente algo como: \"quem mais upou hoje?\", \"quem está inativo?\", \"quem está online?\", \"quem mais morreu essa semana?\".",
    };
  }

  private leaderboardAnswer(
    top: { characterName: string; value: number }[],
    label: string,
    emptyMessage: string,
  ): AssistantAnswerDto {
    if (top.length === 0) return { answer: emptyMessage };
    const lines = top.map((r, i) => `${i + 1}. ${r.characterName} — ${r.value} ${label}`);
    return { answer: lines.join("\n"), data: top };
  }

  private leaderboardStyleFromRadar(
    radar: { characterName: string; daysSinceLastActivity: number | null }[],
  ): AssistantAnswerDto {
    if (radar.length === 0) return { answer: "Todo mundo apareceu recentemente." };
    const lines = radar.map(
      (m, i) => `${i + 1}. ${m.characterName} — ${m.daysSinceLastActivity ?? "?"} dias offline`,
    );
    return { answer: lines.join("\n"), data: radar };
  }
}
