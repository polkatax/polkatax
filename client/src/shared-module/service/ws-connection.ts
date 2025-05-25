import ReconnectingWebSocket from 'reconnecting-websocket';
import { ReplaySubject, take } from 'rxjs';

const socket = new ReconnectingWebSocket('/ws');

const connected$ = new ReplaySubject<boolean>(1);
export const wsMsgReceived$ = new ReplaySubject<any>(1);

socket.addEventListener('open', () => {
  connected$.next(true);
});

export const wsSendMsg = (data: any) => {
  connected$.pipe(take(1)).subscribe(() => {
    socket.send(JSON.stringify(data));
  });
};

socket.addEventListener('message', (event) => {
  wsMsgReceived$.next(event);
});
