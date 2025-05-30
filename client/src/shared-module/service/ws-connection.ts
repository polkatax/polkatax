import ReconnectingWebSocket from 'reconnecting-websocket';
import { ErrorEvent } from 'reconnecting-websocket';
import { ReplaySubject, take, Subject } from 'rxjs';
import {
  WebSocketIncomingMessage,
  WebSocketOutGoingMessage,
} from '../model/websocket-messages';

const socket = new ReconnectingWebSocket('/ws');

const connected$ = new ReplaySubject<boolean>(1);
export const wsMsgReceived$ = new ReplaySubject<WebSocketIncomingMessage>(1);

export const wsError$ = new Subject<ErrorEvent>();
socket.addEventListener('error', (err) => wsError$.next(err));

socket.addEventListener('open', () => {
  connected$.next(true);
});

export const wsSendMsg = (msg: WebSocketOutGoingMessage) => {
  const reqId = crypto.randomUUID()
  connected$.pipe(take(1)).subscribe(() => {
    socket.send(
      JSON.stringify({
        ...msg,
        timestamp: Date.now(),
        reqId,
      })
    );
  });
  return reqId
};

socket.addEventListener('message', (event) => {
  wsMsgReceived$.next(JSON.parse(event.data) as WebSocketIncomingMessage);
});
