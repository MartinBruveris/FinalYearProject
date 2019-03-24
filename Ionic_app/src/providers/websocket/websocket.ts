import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { w3cwebsocket } from 'websocket';
import { Observable } from 'rxjs';


@Injectable()
export class WebsocketProvider {

  constructor(public http: HttpClient) 
  {
    console.log('Hello WebsocketProvider Provider');
  }

  openSocket(user_auth_token)
  {
    return Observable.webSocket({
      url: 'wss://c14704801.eu/socket_conn/'+user_auth_token+'/',
      // url: 'ws://127.0.0.1:8000/socket_conn/'+user_auth_token+'/',
      WebSocketCtor: w3cwebsocket,
    });
  }
}
