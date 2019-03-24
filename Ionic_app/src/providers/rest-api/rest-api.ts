import { Injectable } from '@angular/core';
//import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AddressProvider } from './../../providers/address/address';
import { HTTP } from '@ionic-native/http';

@Injectable()
export class RestApiProvider 
{
  private httpOptions: object;
  constructor(public http: HTTP, public address: AddressProvider) 
  {
    this.http.setDataSerializer('json');
    this.httpOptions=
    {
      'Content-Type': 'application/json; charset=utf-8',
    };
  }

  login(credentials)
  {
    let params = 
    {
      'username': credentials.username,
      'password': credentials.password
    }
    return this.http.post(this.address.getAuthTokenAddress(), params, this.httpOptions);
  }

  register(registrationDetails)
  {
    let params = 
    {
      'username': registrationDetails.username,
      'password': registrationDetails.password,
      'email': registrationDetails.email
    }
    return this.http.post(this.address.getRegistrationAddress(), params, this.httpOptions);
  }

  getSocketTicket(auth_token, username)
  {
    console.log(auth_token);
    let params = 
    {
      'auth_token': auth_token,
      'username': username
    }

    return this.http.post(this.address.getSocketTicketAddress(), params, this.httpOptions);
  }

}
