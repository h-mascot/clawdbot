import { html } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

import { toSanitizedMarkdownHtml } from "../markdown";
import { resolveAgentIdFromSessionKey } from "../../../../src/routing/session-key.js";

const AUTHORED_SECTIONS_KEY = "__authorshipSections";

const AGENT_NAMES = ["Ada", "Spock", "Scotty"] as const;

type AgentName = (typeof AGENT_NAMES)[number];
type AuthorKind = "human" | "ai";

type AuthoredSection = {
  text: string;
  author: AuthorKind;
  agent?: AgentName;
};

type AuthoredSectionHost = {
  [AUTHORED_SECTIONS_KEY]?: AuthoredSection[];
};

type AuthoredMarkdownOptions = {
  message: unknown;
  markdown: string;
  showHighlight: boolean;
  sessionKey?: string;
  cache?: boolean;
};

function resolveAgentName(value: unknown): AgentName | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === "ada") return "Ada";
  if (normalized === "spock") return "Spock";
  if (normalized === "scotty") return "Scotty";
  return undefined;
}

function resolveAgentNameFromMessage(message: Record<string, unknown>): AgentName | undefined {
  const meta =
    message.meta && typeof message.meta === "object" ? (message.meta as Record<string, unknown>) : null;
  const candidates = [
    message.agent,
    message.agentName,
    message.agentId,
    message.agent_id,
    message.sourceName,
    message.source,
    meta?.agent,
    meta?.agentName,
    meta?.name,
  ];
  for (const candidate of candidates) {
    const resolved = resolveAgentName(candidate);
    if (resolved) return resolved;
  }
  return undefined;
}

function resolveAuthorKind(value: unknown): AuthorKind | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "human" || normalized === "user") return "human";
  if (normalized === "ai" || normalized === "assistant" || normalized === "system")
    return "ai";
  return undefined;
}

function inferAuthor(message: Record<string, unknown>): AuthorKind {
  const explicit = resolveAuthorKind(message.author ?? message.authorship);
  if (explicit) return explicit;
  const role = typeof message.role === "string" ? message.role.toLowerCase() : "";
  if (role === "user") return "human";
  if (role === "assistant") return "ai";
  if (role.startsWith("tool")) return "ai";
  if (role === "system") return "ai";
  return "human";
}

function splitMarkdownSections(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/);
  const sections: string[] = [];
  let buffer: string[] = [];
  let fence: "```" | "~~~" | null = null;

  const flush = () => {
    const text = buffer.join("\n").trim();
    buffer = [];
    if (text) sections.push(text);
  };

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(```|~~~)/);
    if (fenceMatch) {
      const marker = fenceMatch[1] as "```" | "~~~";
      if (!fence) fence = marker;
      else if (fence === marker) fence = null;
    }

    if (!fence && line.trim() === "") {
      flush();
      continue;
    }

    buffer.push(line);
  }

  flush();
  return sections.length ? sections : [markdown.trim()].filter(Boolean);
}

function resolveSessionAgentName(sessionKey?: string): AgentName | undefined {
  if (!sessionKey) return undefined;
  return resolveAgentName(resolveAgentIdFromSessionKey(sessionKey));
}

function buildSectionsFromContent(
  message: Record<string, unknown>,
  fallback: { author: AuthorKind; agent?: AgentName },
): AuthoredSection[] | null {
  const content = message.content;
  if (!Array.isArray(content)) return null;

  const sections: AuthoredSection[] = [];
  let hasExplicitAuthor = false;

  for (const entry of content) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    if (item.type !== "text" || typeof item.text !== "string") continue;
    const author = resolveAuthorKind(item.author ?? item.authorship ?? item.role);
    const agent = resolveAgentName(
      item.agent ?? item.agentName ?? item.sourceName ?? item.source,
    );
    if (author) hasExplicitAuthor = true;
    const resolvedAuthor = author ?? fallback.author;
    sections.push({
      text: item.text,
      author: resolvedAuthor,
      agent: resolvedAuthor === "ai" ? agent ?? fallback.agent : undefined,
    });
  }

  if (!sections.length) return null;
  if (hasExplicitAuthor || sections.length > 1) return sections;
  return null;
}

function buildAuthoredSections(
  message: unknown,
  markdown: string,
  opts: { sessionKey?: string; cache?: boolean },
): AuthoredSection[] {
  const host = message as AuthoredSectionHost & Record<string, unknown>;
  if (opts.cache && Array.isArray(host[AUTHORED_SECTIONS_KEY])) {
    return host[AUTHORED_SECTIONS_KEY] ?? [];
  }

  const author = inferAuthor(host);
  const agent =
    resolveAgentNameFromMessage(host) ??
    (author === "ai" ? resolveSessionAgentName(opts.sessionKey) : undefined);

  const fallback = { author, agent: author === "ai" ? agent : undefined };
  const explicitSections = buildSectionsFromContent(host, fallback);
  const sections = explicitSections ?? splitMarkdownSections(markdown).map((text) => ({
    text,
    author: fallback.author,
    agent: fallback.author === "ai" ? fallback.agent : undefined,
  }));

  if (opts.cache) host[AUTHORED_SECTIONS_KEY] = sections;
  return sections;
}

export function renderAuthoredMarkdown(opts: AuthoredMarkdownOptions) {
  const sections = buildAuthoredSections(opts.message, opts.markdown, {
    sessionKey: opts.sessionKey,
    cache: opts.cache !== false,
  });

  if (!opts.showHighlight) {
    return html`<div class="chat-text">${unsafeHTML(toSanitizedMarkdownHtml(opts.markdown))}</div>`;
  }

  return html`
    <div class="chat-text chat-text--sections">
      ${sections.map((section) => {
        const classes = ["chat-text-section"];
        if (opts.showHighlight && section.author === "ai") {
          classes.push("chat-text-section--ai");
          if (section.agent) {
            classes.push(`chat-text-section--agent-${section.agent.toLowerCase()}`);
          }
        }
        return html`
          <div
            class=${classes.join(" ")}
            data-author=${section.author}
            data-agent=${section.agent ?? ""}
          >
            ${unsafeHTML(toSanitizedMarkdownHtml(section.text))}
          </div>
        `;
      })}
    </div>
  `;
}

export type { AgentName, AuthorKind, AuthoredSection };
