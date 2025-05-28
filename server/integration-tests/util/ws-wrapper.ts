import {
  WebSocketIncomingMessage,
  WebSocketOutgoingMessage,
} from "../../src/server/model/web-socket-msg";
import WebSocket from "ws";
import { firstValueFrom, ReplaySubject, skip } from "rxjs";

export class WsWrapper {
  webSocket: WebSocket;
  receivedMessages$ = new ReplaySubject<WebSocketOutgoingMessage>(20);
  receivedMessages: WebSocketOutgoingMessage[] = [];
  handledMessages = 0;

  connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      this.webSocket = new WebSocket("ws://127.0.0.1:3001/ws");
      this.webSocket.on("message", (msg) => this.onMessage(msg));
      this.webSocket.onopen = () => {
        resolve(this.webSocket);
      };
      this.webSocket.onerror = (err) => {
        reject(err);
      };
    });
  }

  private onMessage(data: WebSocket.Data) {
    const json = JSON.parse(data.toString());
    this.receivedMessages.push(json);
    this.receivedMessages$.next(json);
  }

  ithMessage(i: number) {
    if (i > 0) {
      return firstValueFrom(this.receivedMessages$.pipe(skip(i - 1)));
    } else {
      return firstValueFrom(this.receivedMessages$);
    }
  }

  waitForNMessages(i: number) {
    const toSkip = this.handledMessages + i - 1;
    this.handledMessages += i;
    return firstValueFrom(this.receivedMessages$.pipe(skip(toSkip)));
  }

  send(msg: WebSocketIncomingMessage) {
    this.webSocket.send(JSON.stringify(msg));
  }

  async close() {
    if (this.webSocket) {
      this.webSocket.close();
      await new Promise((resolve) => this.webSocket.on("close", resolve));
    }
  }
}
