import {
  WebSocketIncomingMessage,
  WebSocketOutgoingMessage,
} from "../../../src/server/model/web-socket-msg";
import WebSocket from "ws";

export const sendAndWaitForMessages = (
  socket: WebSocket,
  msg?: WebSocketIncomingMessage,
  expectedCount = 1,
  timeoutMs = 100000,
): Promise<WebSocketOutgoingMessage[]> => {
  const responses: WebSocketOutgoingMessage[] = [];
  return new Promise((resolve, reject) => {
    let received = 0;
    const timeout = setTimeout(() => {
      socket.off("message", onMessage);
      reject(new Error("Timeout waiting for response"));
    }, timeoutMs);
    const onMessage = (data: WebSocket.Data) => {
      received++;
      responses.push(JSON.parse(data.toString()));
      if (received >= expectedCount) {
        clearTimeout(timeout);
        socket.off("message", onMessage);
        resolve(responses);
      }
    };
    socket.on("message", onMessage);
    if (msg) {
      socket.send(JSON.stringify(msg));
    }
  });
};

export const waitForMessages = (
  socket: WebSocket,
  expectedCount = 1,
  timeoutMs = 5000,
): Promise<WebSocketOutgoingMessage[]> => {
  return sendAndWaitForMessages(socket, undefined, expectedCount, timeoutMs);
};
