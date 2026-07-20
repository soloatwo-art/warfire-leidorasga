"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Search, Star } from "lucide-react";
import { api } from "@/lib/api";
import { MarkerBadge } from "@/components/ui/MarkerBadge";
import { ActivityBadge } from "@/components/ui/ActivityBadge";
import { cn } from "@/lib/utils";
import type { GuildMemberDto } from "@warfire/shared";

const columnHelper = createColumnHelper<GuildMemberDto>();

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "level", desc: true }]);
  const [onlineOnly, setOnlineOnly] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["guild", "members"],
    queryFn: () => api.get<GuildMemberDto[]>("/guild/members"),
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (onlineOnly && !m.online) return false;
      if (search && !m.characterName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [members, search, onlineOnly]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("characterName", {
        header: "Nome",
        cell: (info) => (
          <Link
            href={`/members/${encodeURIComponent(info.getValue())}`}
            className="flex items-center gap-1.5 font-medium text-ink hover:text-neon-soft"
          >
            {info.row.original.isPrincipal && <Star size={12} className="text-gold" />}
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("rank", { header: "Rank" }),
      columnHelper.accessor("vocation", { header: "Vocação" }),
      columnHelper.accessor("level", { header: "Level" }),
      columnHelper.accessor("world", { header: "Mundo" }),
      columnHelper.accessor("online", {
        header: "Status",
        cell: (info) => (
          <span className={cn("badge", info.getValue() ? "text-online border-online/40 bg-online/10" : "text-offline border-offline/40 bg-offline/10")}>
            {info.getValue() ? "Online" : "Offline"}
          </span>
        ),
      }),
      columnHelper.accessor("markerTag", {
        header: "Marker",
        cell: (info) => <MarkerBadge tag={info.getValue()} />,
      }),
      columnHelper.accessor("activityLevel", {
        header: "Atividade",
        cell: (info) => <ActivityBadge level={info.getValue()} />,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-bold text-ink">Membros ({filtered.length})</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input-field pl-8"
              placeholder="Buscar personagem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setOnlineOnly((v) => !v)}
            className={cn("btn-ghost text-xs", onlineOnly && "border-online/40 text-online")}
          >
            Só Online
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-white/10 text-left text-ink-faint">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer select-none whitespace-nowrap p-3"
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown size={11} />
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="p-4 text-ink-muted">
                  Carregando...
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap p-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
