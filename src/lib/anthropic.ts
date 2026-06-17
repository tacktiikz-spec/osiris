// =====================================================================
//  Client de l'API Anthropic Messages.
//  Narration → Claude Sonnet 4.6 ; résumés → Claude Haiku 4.5.
//  Le prompt caching est activé sur la partie système stable.
//
//  Note : l'en-tête `anthropic-dangerous-direct-browser-access` autorise
//  l'appel depuis la webview (sinon CORS bloque). Aucune clé n'est exposée
//  à un tiers : l'appel part directement vers api.anthropic.com.
// =====================================================================

import type { GameState, ChatMessage } from "@/types/game";
import {
  buildStableSystem,
  buildDynamicSystem,
  SUMMARY_SYSTEM,
  buildSummaryUserPrompt,
} from "@/lib/prompts";

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

export const MODEL_NARRATION = "claude-sonnet-4-6";
export const MODEL_SUMMARY = "claude-haiku-4-5-20251001";

/** Taille de la fenêtre de messages récents renvoyés verbatim. */
export const RECENT_WINDOW = 14;

export class AnthropicError extends Error {
  readonly status?: number;
  readonly kind: "auth" | "rate" | "network" | "server" | "unknown";
  constructor(message: string, kind: AnthropicError["kind"], status?: number) {
    super(message);
    this.name = "AnthropicError";
    this.kind = kind;
    this.status = status;
  }
}

interface AnthropicBlock {
  type: string;
  text?: string;
  cache_control?: { type: "ephemeral" };
}

interface MessagesRequest {
  model: string;
  max_tokens: number;
  system: AnthropicBlock[];
  messages: { role: "user" | "assistant"; content: string }[];
  temperature?: number;
}

async function callMessages(apiKey: string, req: MessagesRequest): Promise<string> {
  if (!apiKey?.trim()) {
    throw new AnthropicError("Aucune clé API configurée.", "auth");
  }

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey.trim(),
        "anthropic-version": API_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(req),
    });
  } catch (e) {
    throw new AnthropicError(
      "Échec réseau : impossible de joindre l'API Anthropic. Vérifie ta connexion.",
      "network"
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message ?? "";
    } catch {
      /* ignore */
    }
    if (res.status === 401 || res.status === 403) {
      throw new AnthropicError(
        `Clé API refusée (${res.status}). Vérifie ta clé dans les Réglages.`,
        "auth",
        res.status
      );
    }
    if (res.status === 429) {
      throw new AnthropicError(
        "Quota ou limite de débit atteint (429). Réessaie dans un instant.",
        "rate",
        res.status
      );
    }
    if (res.status >= 500) {
      throw new AnthropicError(
        `Erreur serveur Anthropic (${res.status}). Réessaie.`,
        "server",
        res.status
      );
    }
    throw new AnthropicError(
      `Erreur API (${res.status})${detail ? ` : ${detail}` : ""}`,
      "unknown",
      res.status
    );
  }

  const data = await res.json();
  const text: string = (data?.content ?? [])
    .filter((b: AnthropicBlock) => b.type === "text")
    .map((b: AnthropicBlock) => b.text ?? "")
    .join("");
  return text.trim();
}

/** Convertit le log interne en messages d'API (récents uniquement). */
function buildRecentMessages(state: GameState): { role: "user" | "assistant"; content: string }[] {
  const recent = state.messages.slice(state.foldedTo);
  return recent.map((m: ChatMessage) => ({ role: m.role, content: m.content }));
}

/**
 * Appel de narration (Sonnet). `userInput` est l'action du joueur OU null
 * pour l'ouverture (auquel cas un prompt d'ouverture doit déjà être dans le log).
 */
export async function callNarration(
  apiKey: string,
  state: GameState,
  maxTokens = 1800
): Promise<string> {
  const system: AnthropicBlock[] = [
    // Partie STABLE → mise en cache (réutilisée à chaque tour).
    { type: "text", text: buildStableSystem(state), cache_control: { type: "ephemeral" } },
    // Partie DYNAMIQUE → change à chaque tour.
    { type: "text", text: buildDynamicSystem(state) },
  ];

  const messages = buildRecentMessages(state);
  if (messages.length === 0) {
    // Sécurité : il faut au moins un message utilisateur.
    messages.push({ role: "user", content: "Commence l'aventure." });
  }

  return callMessages(apiKey, {
    model: MODEL_NARRATION,
    max_tokens: maxTokens,
    system,
    messages,
    temperature: 0.9,
  });
}

/** Appel de résumé de mémoire (Haiku). */
export async function callSummary(
  apiKey: string,
  existingChronicle: string,
  transcript: string
): Promise<string> {
  return callMessages(apiKey, {
    model: MODEL_SUMMARY,
    max_tokens: 1200,
    system: [{ type: "text", text: SUMMARY_SYSTEM }],
    messages: [{ role: "user", content: buildSummaryUserPrompt(existingChronicle, transcript) }],
    temperature: 0.3,
  });
}

/**
 * Réponse d'un PNJ par téléphone (Sonnet, court). Reprend l'univers et la
 * fiche, mais demande une réponse dans la voix du contact.
 */
export async function callPhoneReply(
  apiKey: string,
  state: GameState,
  contactName: string,
  thread: { from: string; text: string }[]
): Promise<string> {
  const system: AnthropicBlock[] = [
    { type: "text", text: buildStableSystem(state), cache_control: { type: "ephemeral" } },
    {
      type: "text",
      text: `${buildDynamicSystem(state)}

=== MODE TÉLÉPHONE ===
Tu incarnes UNIQUEMENT le contact « ${contactName} » qui répond par message texte au joueur.
- Réponds en 1 à 3 messages courts, dans la voix et le caractère de ce PNJ.
- Style SMS : naturel, parfois abrégé, jamais de narration ni de description.
- Ne réponds RIEN d'autre que le(s) message(s) du PNJ, un par ligne.
- N'émets PAS de bloc [[ETAT]] ni de ligne « >>> ».`,
    },
  ];

  const messages = thread.map((m) => ({
    role: (m.from === "moi" ? "user" : "assistant") as "user" | "assistant",
    content: m.text,
  }));
  if (messages.length === 0) {
    messages.push({ role: "user", content: "(Le joueur ouvre la conversation.)" });
  }

  return callMessages(apiKey, {
    model: MODEL_NARRATION,
    max_tokens: 400,
    system,
    messages,
    temperature: 0.95,
  });
}

/** Test simple de validité de la clé API (appel minimal). */
export async function testApiKey(apiKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    await callMessages(apiKey, {
      model: MODEL_SUMMARY,
      max_tokens: 16,
      system: [{ type: "text", text: "Réponds en un mot." }],
      messages: [{ role: "user", content: "Dis simplement: OK" }],
    });
    return { ok: true, message: "Clé valide. Connexion à l'API réussie." };
  } catch (e) {
    const err = e as AnthropicError;
    return { ok: false, message: err.message ?? "Échec inconnu." };
  }
}
