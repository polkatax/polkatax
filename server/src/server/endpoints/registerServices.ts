import { asClass, AwilixContainer } from "awilix";
import { WebSocketManager } from "./websocket.manager";

export const registerServices = (container: AwilixContainer) => {
  container.register({
    webSocketManager: asClass(WebSocketManager)
  });
};
