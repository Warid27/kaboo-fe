import type { GameState } from '@/types/game';

export type WSMessage =
  | { t: 'initial-peek'; cardIndex: number }
  | { t: 'ready' }
  | { t: 'draw-deck' }
  | { t: 'draw-discard' }
  | { t: 'discard' }
  | { t: 'swap'; cardIndex: number }
  | { t: 'call-kaboo' }
  | { t: 'snap'; cardIndex: number }
  | { t: 'peek-own'; cardIndex: number }
  | { t: 'spy-opponent'; targetPlayerId: string; cardIndex: number }
  | { t: 'swap-any'; card1: { playerId: string; cardIndex: number }; card2: { playerId: string; cardIndex: number } };

export type KabooSocketState = 'disconnected' | 'connecting' | 'connected' | 'lost';

export interface KabooSocketEvents {
  state: (state: GameState) => void;
  error: (payload: { message: string }) => void;
  kicked: () => void;
  connected: () => void;
  disconnected: () => void;
  lost: () => void;
}

type ServerMessage =
  | { t: 'state'; state: GameState }
  | { t: 'error'; message: string };

const HEARTBEAT_INTERVAL_MS = 25_000;
const PONG_TIMEOUT_MS = 5_000;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 10_000;

function resolveSocketUrl(roomCode: string, userId: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) {
    return `${base.replace(/\/+$/, '')}/${roomCode}/ws?userId=${encodeURIComponent(userId)}`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/${roomCode}/ws?userId=${encodeURIComponent(userId)}`;
}

export class KabooSocket {
  private ws: WebSocket | null = null;
  private roomCode = '';
  private userId = '';
  private currentState: KabooSocketState = 'disconnected';
  private listeners: { [K in keyof KabooSocketEvents]: KabooSocketEvents[K][] } = {
    state: [],
    error: [],
    kicked: [],
    connected: [],
    disconnected: [],
    lost: [],
  };
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private awaitingPong = false;
  private manualClose = false;
  private kicked = false;

  get state(): KabooSocketState {
    return this.currentState;
  }

  connect(roomCode: string, userId: string): void {
    this.roomCode = roomCode;
    this.userId = userId;
    this.manualClose = false;
    this.kicked = false;
    this.reconnectAttempts = 0;
    this.clearTimers();
    if (this.ws) {
      const old = this.ws;
      this.ws = null;
      old.onopen = null;
      old.onmessage = null;
      old.onclose = null;
      old.onerror = null;
      try {
        old.close();
      } catch {}
    }
    this.open();
  }

  disconnect(): void {
    this.manualClose = true;
    this.clearTimers();
    if (this.ws) {
      const old = this.ws;
      this.ws = null;
      old.onopen = null;
      old.onmessage = null;
      old.onclose = null;
      old.onerror = null;
      try {
        old.close();
      } catch {}
    }
    if (this.currentState !== 'disconnected') {
      this.currentState = 'disconnected';
      this.emit('disconnected');
    }
  }

  send(msg: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  on<K extends keyof KabooSocketEvents>(event: K, handler: KabooSocketEvents[K]): () => void {
    this.listeners[event].push(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof KabooSocketEvents>(event: K, handler: KabooSocketEvents[K]): void {
    const handlers = this.listeners[event];
    const index = handlers.indexOf(handler);
    if (index >= 0) {
      handlers.splice(index, 1);
    }
  }

  private open(): void {
    this.currentState = 'connecting';
    const ws = new WebSocket(resolveSocketUrl(this.roomCode, this.userId));
    this.ws = ws;
    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.reconnectAttempts = 0;
      this.currentState = 'connected';
      this.startHeartbeat();
      this.emit('connected');
    };
    ws.onmessage = (event) => {
      if (this.ws !== ws) return;
      this.handleMessage(event.data);
    };
    ws.onclose = (event) => {
      if (this.ws !== ws) return;
      this.ws = null;
      this.stopHeartbeat();
      if (event.code === 4001) {
        this.kicked = true;
        this.currentState = 'disconnected';
        this.emit('kicked');
        return;
      }
      if (this.manualClose) {
        this.currentState = 'disconnected';
        this.emit('disconnected');
        return;
      }
      if (this.currentState === 'connected') {
        this.currentState = 'disconnected';
        this.emit('disconnected');
      }
      this.scheduleReconnect();
    };
    ws.onerror = () => {};
  }

  private handleMessage(raw: unknown): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(typeof raw === 'string' ? raw : String(raw));
    } catch {
      return;
    }
    if (!parsed || typeof parsed !== 'object' || !('t' in parsed)) return;
    const msg = parsed as ServerMessage;
    if (this.awaitingPong) {
      this.awaitingPong = false;
      if (this.pongTimer) {
        clearTimeout(this.pongTimer);
        this.pongTimer = null;
      }
      if (msg.t === 'error' && msg.message === 'Invalid action') return;
    }
    if (msg.t === 'state') {
      this.emit('state', msg.state);
    } else if (msg.t === 'error') {
      this.emit('error', { message: msg.message });
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.awaitingPong = true;
        this.ws.send(JSON.stringify({ t: 'ping' }));
        this.pongTimer = setTimeout(() => {
          if (this.awaitingPong) {
            this.forceReconnect();
          }
        }, PONG_TIMEOUT_MS);
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
    this.awaitingPong = false;
  }

  private forceReconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      const old = this.ws;
      this.ws = null;
      old.onopen = null;
      old.onmessage = null;
      old.onclose = null;
      old.onerror = null;
      try {
        old.close();
      } catch {}
    }
    if (this.currentState === 'connected') {
      this.currentState = 'disconnected';
      this.emit('disconnected');
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.manualClose || this.kicked) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.currentState = 'lost';
      this.emit('lost');
      return;
    }
    this.currentState = 'connecting';
    const delay = Math.min(BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts), MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => this.open(), delay);
  }

  private clearTimers(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private emit<K extends keyof KabooSocketEvents>(event: K, ...args: Parameters<KabooSocketEvents[K]>): void {
    const handlers = this.listeners[event];
    for (const handler of handlers) {
      (handler as (...a: typeof args) => void)(...args);
    }
  }
}

export const kabooSocket = new KabooSocket();