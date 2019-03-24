import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import L from "leaflet";

export interface otherUser
{
  marker: L.circleMarker;
  userId: string;
  color: string; 
}
@Injectable()
export class OtherUserProvider {

  constructor(public http: HttpClient) {

  }

  createOtherUser(mark:L.circleMarker, user: string, col: string):otherUser
  {
    let otherUser={
      marker: mark,
      userId: user,
      color: col
    }
    return otherUser;
  }
}
