import "@testing-library/jest-dom";
import { WebSocket } from 'ws';

// Polyfill WebSocket for Supabase Realtime in jsdom
// @ts-expect-error - WebSocket polyfill for test environment
global.WebSocket = WebSocket;

// Polyfill for Request in test environment
global.Request = Request;

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
