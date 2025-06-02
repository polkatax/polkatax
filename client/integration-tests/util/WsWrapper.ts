import { Server, WebSocket } from 'ws';
import { firstValueFrom, ReplaySubject, skip } from 'rxjs';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';

const UP_ARROW = '⬆️';
const DOWN_ARROW = '⬇️';
const RESET = '\x1b[0m';

export class WsWrapper {
  wss: Server;
  ws: WebSocket | undefined = undefined;
  receivedMessages$ = new ReplaySubject<any>(20);
  receivedMessages: any[] = [];
  handledMessages = 0;

  constructor() {
    this.wss = new WebSocket.Server({ port: 3001 });
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WsWrapper connected');
      this.ws = ws;
      ws.on('message', async (msg) => {
        console.log(
          `${GREEN}${DOWN_ARROW}${RESET} WsWrapper received message: ${msg}`
        );
        this.receivedMessages.push(JSON.parse(msg.toString()));
        this.receivedMessages$.next(JSON.parse(msg.toString()));
      });
    });
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

  send(msg: any) {
    this.ws!.send(JSON.stringify(msg));
    console.log(
      `${RED}${UP_ARROW}${RESET} WsWrapper sent message: ${JSON.stringify(msg)}`
    );
  }

  async close() {
    if (this.wss) {
      this.wss.close();
    }
  }
}
