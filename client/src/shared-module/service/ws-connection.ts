import ReconnectingWebSocket from 'reconnecting-websocket';
import { ReplaySubject, take } from 'rxjs';
import { JobResult } from '../model/job-result';
import { WebSocketIncomingMessage, WebSocketOutGoingMessage } from '../model/websocket-messages';

const socket = new ReconnectingWebSocket('/ws');

const connected$ = new ReplaySubject<boolean>(1);
export const wsMsgReceived$ = new ReplaySubject<JobResult[]>(1);

socket.addEventListener('open', () => {
  connected$.next(true);
});

export const wsSendMsg = (msg: WebSocketOutGoingMessage) => {
  connected$.pipe(take(1)).subscribe(() => {
    socket.send(JSON.stringify({ ...msg, timestamp: Date.now(), reqId: crypto.randomUUID() }));
  });
};

socket.addEventListener('message', (event) => {
  wsMsgReceived$.next((JSON.parse(event.data) as WebSocketIncomingMessage).payload);
});
