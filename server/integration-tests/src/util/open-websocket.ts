import WebSocket from "ws";

export const openWebSocket = (): Promise<WebSocket> => {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket("ws://127.0.0.1:3001/ws");
    socket.onopen = () => {
      resolve(socket);
    };
    socket.onerror = (err) => {
      reject(err);
    };
  });
};
