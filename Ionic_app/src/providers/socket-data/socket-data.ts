import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface dataMsg
{
  command: string,
  lat: number,
  lng: number,
  userId: string,
  userToken: string,
  userType: string,
  sessionId: string
}

export interface initMsg
{
  command: string,
  userToken: string,
  payload: any
}

export interface markerMsg
{
  command: string,
  lat: number,
  lng: number,
  userToken: string,
  sessionId: string
}

@Injectable()
export class SocketDataProvider {

  private dataMsg:dataMsg;
  private initMsg:initMsg;
  private markerMsg:markerMsg;

  constructor(public http: HttpClient)
  {
  }

  createDataMsg(cmnd: string, lattitude:number, longitude:number, user:string, token:string, type:string, sessionId:string):dataMsg
  {
    this.dataMsg = {
      command: cmnd,
      lat: lattitude,
      lng: longitude,
      userId: user,
      userToken: token,
      userType: type,
      sessionId: sessionId
    }
    return this.dataMsg;
  }

  createSessionInitMsg(cmnd:string, token:string, payload:any):initMsg
  {
    this.initMsg = 
    {
      command: cmnd,
      userToken: token,
      payload: payload
    }
    return this.initMsg;
  }

  createMarkerMsg(cmnd: string, lattitude:number, longitude:number, token:string, sessionId:string):markerMsg
  {
    this.markerMsg = 
    {
      command: cmnd,
      lat: lattitude,
      lng: longitude,
      userToken: token,
      sessionId: sessionId
    }
    return this.markerMsg;
  }
}
