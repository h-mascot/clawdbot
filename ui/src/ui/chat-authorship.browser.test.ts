import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ClawdbotApp } from "./app";

const originalConnect = ClawdbotApp.prototype.connect;

function mountApp(pathname: string) {
  window.history.replaceState({}, "", pathname);
  const app = document.createElement("clawdbot-app") as ClawdbotApp;
  document.body.append(app);
  return app;
}

beforeEach(() => {
  ClawdbotApp.prototype.connect = () => {
    // no-op: avoid real gateway WS connections in browser tests
  };
  window.__CLAWDBOT_CONTROL_UI_BASE_PATH__ = undefined;
  localStorage.clear();
  document.body.innerHTML = "";
});

afterEach(() => {
  ClawdbotApp.prototype.connect = originalConnect;
  window.__CLAWDBOT_CONTROL_UI_BASE_PATH__ = undefined;
  localStorage.clear();
  document.body.innerHTML = "";
});

describe("chat authorship highlighting", () => {
  it("highlights AI text when enabled", async () => {
    const app = mountApp("/chat");
    await app.updateComplete;

    app.chatMessages = [
      {
        role: "assistant",
        content: [{ type: "text", text: "Hello from the agent." }],
        timestamp: Date.now(),
      },
    ];

    await app.updateComplete;

    const highlighted = app.querySelector(".chat-text-section--ai");
    expect(highlighted).not.toBeNull();
    expect(highlighted?.textContent).toContain("Hello from the agent.");
  });

  it("hides AI highlight when disabled", async () => {
    localStorage.setItem(
      "clawdbot.control.settings.v1",
      JSON.stringify({ chatAuthorshipHighlight: false }),
    );

    const app = mountApp("/chat");
    await app.updateComplete;

    app.chatMessages = [
      {
        role: "assistant",
        content: [{ type: "text", text: "No highlight." }],
        timestamp: Date.now(),
      },
    ];

    await app.updateComplete;

    const highlighted = app.querySelector(".chat-text-section--ai");
    expect(highlighted).toBeNull();
  });
});
