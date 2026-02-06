# Entity vs Proof - Feature Comparison

**Source:** Every CEO's live stream demo (https://www.youtube.com/watch?v=5YBjll9XJlw)
**Date:** 2026-02-06
**Analyst:** Ada

---

## Quick Summary

**Proof** is an agent-native markdown editor built by the Every team. The demo showcased features that Entity should absolutely adopt.

**The killer difference:** Proof tracks **human vs AI authorship** visually - AI text shows purple, human text is normal. Combined with **follow mode** (auto-scroll to agent), it's a game-changer for watching agents work.

---

## Feature Comparison Table

| Feature | Proof | Entity | Action |
|---------|-------|--------|--------|
| **Human vs AI authorship** | ✅ Purple/white highlighting | ❌ No | **P0 - MUST HAVE** |
| **Follow mode** | ✅ Auto-scroll to agent | ❌ No | **P0 - MUST HAVE** |
| **Follow glow** | ✅ Purple border glow | ❌ No | **P0 - MUST HAVE** |
| **Track changes** | ✅ Suggest edits | ❌ No | **P1 - Add** |
| **Comments** | ✅ Inline comments | ❌ No | **P1 - Add** |
| **Agent presence UI** | ✅ Logos + toast popups | Partial | **P1 - Improve** |
| **Style guide review** | ✅ Runs checks on content | ❌ No | **P1 - Add** |
| **External agent connection** | ✅ Claude/Codex connect | N/A - Entity agents ARE the agents | **Not needed** |
| **Auto-save** | ? | ✅ Yes | Same |
| **File browser** | ❌ No | ✅ Yes | Entity wins |
| **WebSocket sync** | ? | ✅ Yes | Entity wins |
| **Agent sidebar** | Partial | ✅ Yes | Entity wins |

---

## P0 Features - MUST HAVE

### 1. Human vs AI Authorship Tracking

**Proof's approach:**
- AI-written text shows **purple** highlighting
- Human-written text stays **normal/white**
- Toggle with command shortcut
- Plan written entirely by AI shows all purple
- You can see what you've reviewed vs haven't

**Why it matters:**
- At a glance, know who wrote what
- Track what you've approved vs AI auto-generated
- Critical for "watch mode" - see agent contributions
- Prevents accidentally shipping AI content without review

**Implementation:**
```typescript
// Store authorship metadata per paragraph/section
interface TextSection {
  content: string;
  author: 'human' | 'ai' | 'mixed';
  agent?: string;  // Which agent if AI
  timestamp: number;
  reviewed: boolean;
}

// Render with styling
<div className={section.author === 'ai' ? 'text-purple-300' : 'text-white'}>
  {section.content}
</div>
```

---

### 2. Follow Mode

**Proof's approach:**
- When agent is working, auto-scroll to their cursor/position
- User can "attach" to an agent and watch it work
- Essential for "watch mode" - follow journey

**Why it matters:**
- Core to the "watch AI work" experience
- Don't miss what the agent is doing
- Builds trust - see the work happening

**Implementation:**
```typescript
// Track agent cursor position via WebSocket
useEffect(() => {
  ws.on('agent:cursor', ({ agentId, position }) => {
    if (followingAgent === agentId) {
      scrollToPosition(position);
    }
  });
}, [followingAgent]);
```

---

### 3. Follow Glow

**Proof's approach:**
- When following an agent, document border **glows purple**
- Like Claude's orange glow in Chrome
- Visual cue that you're "attached" to an agent

**Why it matters:**
- At-a-glance confirmation of state
- Creates "presence" feeling
- Users know they're in watch mode

**Implementation:**
```css
.following-agent {
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.6); /* Purple glow */
  border: 1px solid rgba(168, 85, 247, 0.4);
}
```

---

## P1 Features - Should Have

### 4. Track Changes

**Proof:** Google Docs/Word style suggest mode with accept/reject UI.

**Entity implementation:**
- Store original vs suggested text
- Accept/reject buttons inline
- Visual diff for suggestions

---

### 5. Comments System

**Proof:** Inline comments like Google Docs, threaded conversations on sections.

**Entity implementation:**
- Add comment button on selected text
- Threaded comments stored with position metadata
- @mention agents in comments

---

### 6. Agent Presence UI Improvements

**Proof shows:**
- Agent logos (Claude, Codex, etc.) when active
- Toast popup when agent joins/leaves
- Hidden when no agents active (clean UI)

**Entity's approach (key difference from Proof):**
- Entity's agents ARE the agents (Ada 🔮, Spock 🖖, Scotty 🔧) - NOT external Claude/Codex connections
- Show YOUR crew's avatars/logos in the document gutter
- Toast notifications for join/leave/finish
- Follow mode follows YOUR agents, not generic third-party cursors
- No external agent protocol needed - agents are native to Entity

**Improvement:**
- Show agent avatars (Ada/Spock/Scotty) in document gutter when editing
- Toast notifications for agent join/leave/finish
- Hide "Active Agents" label when empty

---

### 7. Style Guide Review System

**Proof:** `/run review style-guide` checks document against rules.

**Entity implementation:**
- Create review skills as markdown files
- `/run review` command triggers agent check
- Show suggestions inline with highlights

---

## P2 Features - Nice to Have

### 8. Native Agent Integration (NOT external connection)

**Key distinction:** Unlike Proof (which connects to external Claude/Codex), Entity's agents (Ada, Spock, Scotty) ARE the agents. No external protocol needed.

**Current:** @mention webhook to OpenClaw triggers agent work

**Enhancement:**
- WebSocket for bidirectional real-time agent edits
- Agent can push edits directly into document
- See agent cursor in real-time (Ada's cursor, Spock's cursor, etc.)
- Each agent has its own color/avatar in the doc

---

### 9. Work Trees / Branches

**Proof:** Support multiple work trees (like git worktrees) for experiments.

**Entity:** Could use Mission Control for this.

---

### 10. Voice Dictation

**Proof:** Monologue integration - voice to text, paste into editor.

**Entity:** Phase 5 TUI covers this.

---

## What Entity Has That Proof Doesn't

| Feature | Entity | Proof |
|---------|--------|-------|
| File browser | ✅ Reads Obsidian vault | ❌ No |
| WebSocket real-time | ✅ | ? |
| Agent sidebar | ✅ Full status | Partial |
| Task panel | ✅ Mission Control | ❌ No |
| Mobile app | ✅ Expo | ❌ No |
| QuickSwitcher | ✅ Cmd+P | ? |

---

## Implementation Order

### Week 1: Authorship + Follow Mode
1. Add `authorship` metadata to text sections
2. Purple highlighting for AI-written content
3. Follow mode - track agent cursor positions
4. Follow glow - CSS border effect

### Week 2: Presence + Review
5. Agent logo display in sidebar
6. Toast notifications for agent events
7. Style guide review system

### Week 3: Collaboration
8. Track changes UI
9. Comments system
10. Enhanced @mention with real-time

---

## The Vision

Proof validates the core thesis: **agent-native markdown is the future**.

The key insight is **visual authorship** - knowing instantly who wrote what changes everything. Combined with **follow mode**, it's how humans trust AI collaborators.

Entity already has the infrastructure (WebSocket, agent sidebar, file browser). Adding these 3 P0 features makes it competitive with Proof and differentiated (file browser, Obsidian integration).

---

*This analysis generated from live stream transcript. Features verified from 10:00-28:00 segment.*
