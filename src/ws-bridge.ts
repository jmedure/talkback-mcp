import { WebSocketServer, WebSocket } from "ws";
import { EventEmitter } from "events";
import { execSync } from "child_process";
import type {
  RawSessionSnapshot,
  SessionCache,
  BridgeCommand,
  SpectralSnapshot,
} from "./types.js";

export class WsBridge extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private m4lSocket: WebSocket | null = null;
  private pendingSpectralResolve: ((data: SpectralSnapshot) => void) | null =
    null;

  readonly cache: SessionCache = {
    raw: null,
    lastUpdated: null,
    isConnected: false,
  };

  async start(port: number): Promise<void> {
    // Kill any stale process on this port before binding
    try {
      const pids = execSync(`lsof -ti:${port}`, { encoding: "utf8" }).trim();
      if (pids) {
        const myPid = process.pid.toString();
        for (const pid of pids.split("\n")) {
          if (pid && pid !== myPid) {
            console.error(`[ws-bridge] Killing stale process ${pid} on port ${port}`);
            try { execSync(`kill ${pid}`); } catch {}
          }
        }
        // Brief wait for port release
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch {
      // lsof returns non-zero if no process found — that's fine
    }

    this.wss = await new Promise<WebSocketServer>((resolve, reject) => {
      const server = new WebSocketServer({ port });
      server.on("listening", () => resolve(server));
      server.on("error", (err: NodeJS.ErrnoException) => {
        server.close();
        reject(err);
      });
    });

    this.wss.on("connection", (ws) => {
      console.error("[ws-bridge] M4L device connected");
      this.m4lSocket = ws;
      this.cache.isConnected = true;
      this.emit("connected");

      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(msg);
        } catch (err) {
          console.error("[ws-bridge] Failed to parse message:", err);
        }
      });

      ws.on("close", () => {
        console.error("[ws-bridge] M4L device disconnected");
        this.m4lSocket = null;
        this.cache.isConnected = false;
        this.emit("disconnected");
      });

      ws.on("error", (err) => {
        console.error("[ws-bridge] WebSocket error:", err);
      });
    });

    console.error(`[ws-bridge] WebSocket server listening on :${port}`);
  }

  private handleMessage(msg: unknown): void {
    const typed = msg as { type: string };

    if (typed.type === "session_snapshot") {
      const snapshot = msg as RawSessionSnapshot;
      this.cache.raw = snapshot.payload;
      this.cache.lastUpdated = snapshot.timestamp;
      this.emit("session_updated", snapshot.payload);
    } else if (typed.type === "spectral_snapshot") {
      const spectral = msg as { type: string; data: SpectralSnapshot };
      if (this.pendingSpectralResolve) {
        this.pendingSpectralResolve(spectral.data);
        this.pendingSpectralResolve = null;
      }
      this.emit("spectral", spectral.data);
    } else if (typed.type === "command_result") {
      this.emit("command_result", msg);
    }
  }

  sendCommand(command: BridgeCommand): boolean {
    if (!this.m4lSocket || this.m4lSocket.readyState !== WebSocket.OPEN) {
      console.warn("[ws-bridge] Cannot send command — M4L not connected");
      return false;
    }
    this.m4lSocket.send(JSON.stringify(command));
    return true;
  }

  requestSpectral(source: string, timeoutMs = 5000): Promise<SpectralSnapshot> {
    return new Promise((resolve, reject) => {
      if (!this.sendCommand({ type: "request_spectral", source })) {
        reject(new Error("M4L bridge not connected"));
        return;
      }

      const timer = setTimeout(() => {
        this.pendingSpectralResolve = null;
        reject(new Error("Spectral snapshot request timed out"));
      }, timeoutMs);

      this.pendingSpectralResolve = (data) => {
        clearTimeout(timer);
        resolve(data);
      };
    });
  }

  stop(): void {
    this.wss?.close();
  }
}
