// ==UserScript==
// @name         Warfire Leidorasga - Guild Sync
// @namespace    warfire-leidorasga
// @version      1.0
// @description  Sends the already-rendered guild page HTML to the Warfire Leidorasga Guild Control Center, from your own real logged-in browser (never blocked by RubinOT's Cloudflare bot protection, since there's no automation involved here — it's just your normal tab).
// @match        https://rubinot.com.br/guilds/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      *
// ==/UserScript==

(function () {
  "use strict";

  // ---- Configure these two before use ----
  const API_BASE = "http://localhost:3001"; // change to your deployed API URL later
  const INTERNAL_TOKEN = "local-dev-internal-token-change-me"; // must match INTERNAL_SYNC_TOKEN in .env
  // -----------------------------------------

  const SYNC_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes, matches GUILD_SCRAPE_CRON by default
  const TABLE_WAIT_TIMEOUT_MS = 15000;
  const TABLE_WAIT_POLL_MS = 300;

  function waitForTable() {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        const rows = document.querySelectorAll("table tbody tr").length;
        if (rows > 0 || Date.now() - start > TABLE_WAIT_TIMEOUT_MS) {
          resolve(rows);
          return;
        }
        setTimeout(check, TABLE_WAIT_POLL_MS);
      };
      check();
    });
  }

  function showBadge(text, color) {
    let badge = document.getElementById("wl-sync-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "wl-sync-badge";
      badge.style.cssText =
        "position:fixed;bottom:12px;right:12px;z-index:999999;padding:8px 14px;border-radius:8px;" +
        "font:12px/1.4 sans-serif;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.4);transition:background .2s;";
      document.body.appendChild(badge);
    }
    badge.textContent = text;
    badge.style.background = color;
  }

  function sendToBackend(html) {
    GM_xmlhttpRequest({
      method: "POST",
      url: `${API_BASE}/internal/ingest/guild-html`,
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": INTERNAL_TOKEN,
      },
      data: JSON.stringify({ html }),
      onload: (res) => {
        if (res.status >= 200 && res.status < 300) {
          try {
            const body = JSON.parse(res.responseText);
            showBadge(`✅ Sync OK (${body.members ?? "?"} membros) — ${new Date().toLocaleTimeString("pt-BR")}`, "#16a34a");
          } catch {
            showBadge(`✅ Sync OK — ${new Date().toLocaleTimeString("pt-BR")}`, "#16a34a");
          }
        } else {
          showBadge(`❌ Erro ${res.status} no sync`, "#dc2626");
          console.error("[Warfire Sync] Falha no envio:", res.status, res.responseText);
        }
      },
      onerror: (err) => {
        showBadge("❌ Falha ao conectar na API", "#dc2626");
        console.error("[Warfire Sync] Erro de rede:", err);
      },
    });
  }

  async function runSync() {
    showBadge("⏳ Sincronizando...", "#2563eb");
    const rowCount = await waitForTable();
    if (rowCount === 0) {
      showBadge("⚠️ Nenhuma tabela de membros encontrada", "#d97706");
      return;
    }
    const html = document.documentElement.outerHTML;
    sendToBackend(html);
  }

  // Run once on load, then keep syncing on an interval as long as this tab stays open.
  runSync();
  setInterval(runSync, SYNC_INTERVAL_MS);
})();
