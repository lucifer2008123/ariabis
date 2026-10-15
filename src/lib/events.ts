import { EventEmitter } from "events";

// Global event bus for pub/sub across SSE streams and webhook notifications
class AppEventEmitter extends EventEmitter {}

declare global {
  // eslint-disable-next-line no-var
  var globalEventBus: AppEventEmitter | undefined;
}

export const eventBus: AppEventEmitter =
  global.globalEventBus || new AppEventEmitter();

if (!global.globalEventBus) {
  eventBus.setMaxListeners(100);
  global.globalEventBus = eventBus;
}
