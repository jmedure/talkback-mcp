# Talkback MCP

An MCP server that gives AI assistants real-time access to Ableton Live sessions. Read track data, analyze mixes, adjust parameters, and get spectral snapshots — all through natural conversation.

## How it works

Talkback has two parts:

1. **Talkback MCP** (this package) — an MCP server that exposes Ableton session data and controls as tools
2. **[Talkback Bridge](https://github.com/jmedure/talkback-mcp-bridge)** — a Max for Live device that reads Ableton's Live Object Model and streams it to the MCP server over WebSocket

```
Ableton Live ↔ M4L Bridge ↔ WebSocket ↔ MCP Server ↔ Claude / Cursor / etc.
```

## Quick start

### 1. Install the MCP server

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "talkback-mcp": {
      "command": "npx",
      "args": ["talkback-mcp"],
      "env": { "WS_PORT": "8765" }
    }
  }
}
```

Or for Claude Code:

```bash
claude mcp add talkback-mcp -- npx talkback-mcp
```

### 2. Install the bridge

Download the latest `.amxd` from [talkback-mcp-bridge releases](https://github.com/jmedure/talkback-mcp-bridge/releases) and drop it onto any track in your Ableton session. The bridge connects automatically.

### 3. Start mixing

Ask Claude about your session. The tools handle the rest.

## Tools

| Tool | Description |
|------|-------------|
| `get_session_context` | Full session snapshot — tracks, volumes, panning, sends, devices, routing |
| `get_track_details` | Deep dive into a specific track's device chain and parameters |
| `get_spectral_snapshot` | ~2 second spectral capture from the master bus (requires playback) |
| `get_plugin_library` | Lists all installed AU/VST3 plugins on the system |
| `analyze_mix` | Rule-based heuristic analysis for common mix issues |
| `set_device_parameter` | Adjust a device parameter (requires user consent) |
| `toggle_device_bypass` | Enable or bypass a device for A/B comparison |
| `create_group_track` | Group tracks together |
| `set_track_routing` | Change a track's output routing |
| `get_bridge_health` | Performance metrics from the M4L bridge |

## Requirements

- Ableton Live 11+ with Max for Live
- Node.js 18+
- An MCP client (Claude Desktop, Claude Code, Cursor, etc.)

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WS_PORT` | `8765` | WebSocket port for bridge connection |

## License

[PolyForm Shield 1.0.0](LICENSE) — free to use, modify, and distribute. You may not use this software to build a competing product.
