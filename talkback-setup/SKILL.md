---
name: talkback-setup
description: Set up talkback-mcp — connect AI assistants to Ableton Live via MCP. Use when the user wants to install, configure, or troubleshoot talkback, or mentions connecting to Ableton.
license: PolyForm Shield 1.0.0
compatibility: Requires Node.js 18+ and macOS or Windows. Works with any MCP-compatible agent.
metadata:
  author: jmedure
  version: "1.0"
---

# Talkback Setup

You are setting up **talkback** — an MCP server + Max for Live device that gives AI assistants real-time access to Ableton Live sessions. Be proactive. Don't ask questions you can answer by checking. Move fast, explain as you go.

## Approach

Act, don't ask. Check the environment yourself, fix what you can, and only pause for things you literally cannot do (like downloading a file or dragging a device in Ableton). The user may be a music producer who has never used Terminal — keep language plain and celebrate progress.

## Step 0: Check for existing setup

Before doing anything, check if talkback is already configured:

1. **Check for talkback tools.** If you already have access to tools like `get_session_context`, `analyze_mix`, or `get_track_details`, talkback is already configured in this client. Skip straight to **Verify** below.

2. **Check MCP config files.** Search the config paths in the table below for `"talkback-mcp"`. If it's already there, tell the user: "Talkback is already configured in [client]. Let me verify the connection..." and skip to **Verify**.

3. **Check for a global install.** Run `npm list -g talkback-mcp 2>/dev/null`. If installed, note it — the user may just need a config entry pointing to it.

If nothing is found, continue from Step 1.

## Step 1: Check Node.js

Run `node --version`. If Node 18+ is present, report it and move on. If not:

- Tell the user: "Talkback needs Node.js — it's a behind-the-scenes tool that powers the connection. You won't interact with it directly."
- Direct them to https://nodejs.org — "Click the big green LTS button, run the installer, then come back."
- If you can detect a package manager (`brew`, `nvm`, `fnm`), offer the one-liner instead.
- Stop here until Node is available. Everything else depends on it.

## Step 2: Detect your environment

Figure out which MCP client you're running in. You usually know this from your own context — use that. If uncertain, check for config files:

| Client | Config path |
|--------|------------|
| Claude Desktop (macOS) | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%\Claude\claude_desktop_config.json` |
| Claude Code | Has `claude` CLI available |
| Cursor | `.cursor/mcp.json` in project root or global settings |
| Windsurf | `~/.windsurf/mcp.json` or via Settings > MCP Servers |

Report what you found: "Looks like we're in [client name]..."

## Step 3: Configure the MCP server

Based on the detected client, write the config. The talkback MCP server entry is:

```json
{
  "mcpServers": {
    "talkback-mcp": {
      "command": "npx",
      "args": ["-y", "talkback-mcp"],
      "env": { "WS_PORT": "8765" }
    }
  }
}
```

### If you can write files:

- **Claude Desktop:** Read the existing config file. If it has other `mcpServers` entries, merge — don't overwrite. Write the updated file.
- **Claude Code:** Run `claude mcp add --transport stdio talkback-mcp -- npx -y talkback-mcp`
- **Cursor / Windsurf:** Write the JSON to the appropriate config path, merging with any existing entries.

**nvm/fnm users (Claude Desktop only):** Claude Desktop doesn't source shell profiles. Run `which npx` to get the absolute path and use that as `"command"` instead of `"npx"`.

### If you can't write files:

Show the user the exact JSON block and the exact file path. Tell them to paste it and save. Be specific: "Open this file, paste this, save it."

Report what you did: "Configured talkback in [client]. You'll need to restart [client] for it to take effect."

## Step 4: Max for Live device

You cannot download or install the M4L device — the user has to do this manually. Be direct:

"One thing I can't do for you: download the Max for Live device. Here's the link — save it and drag it onto your **master track** in Ableton."

**Download:** https://talkback.createwcare.com/downloads/talkback-bridge-v1.5.amxd

"Let me know when it's on your master track and I'll verify the connection."

## Verify

Run through these checks and report each result:

1. **Node.js:** `node --version` — need 18+
2. **Config exists:** Check the detected client's config path for a `talkback-mcp` entry
3. **Port available:** `lsof -i :8765` — should be empty (no conflict) or show talkback's process
4. **Tools available:** Check if talkback tools (`get_session_context`, `analyze_mix`, etc.) are available to you
5. **Bridge connected:** Call `get_session_context` — if it returns track data, the M4L device is connected and everything works

Report results clearly:
- All pass: "Everything looks good. I can see [N] tracks in your session. You're all set."
- Tools missing: "Talkback isn't showing up in my tools yet. Try restarting [client] — the server loads on startup."
- Bridge not connected: "The MCP server is running but can't reach the M4L device. Make sure the talkback device is on your master track in Ableton and toggled on (green indicator)."

## Troubleshooting

If verify fails, check these in order:

1. `node --version` — must be 18+
2. Port 8765 not in use by something else — `lsof -i :8765`
3. MCP client was restarted after config change
4. M4L device is on the master track and toggled on (green indicator)
5. If using nvm/fnm with Claude Desktop, the config must use the absolute npx path (run `which npx`)

For more: https://talkback.createwcare.com/docs/troubleshooting
