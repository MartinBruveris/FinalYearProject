import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class AddressProvider {
  //apiUrl = '//10.0.2.2:8000';
  apiUrl = 'https://c14704801.eu';
  // apiUrl = 'http://127.0.0.1:8000';
  osrmUrl = 'http://138.68.133.148';
  constructor(public http: HttpClient) {
  }

  getAuthTokenAddress()
  {
    return this.apiUrl+'/get_auth_token/';
  }

  getSocketTicketAddress()
  {
    return this.apiUrl+'/get_socket_token/';
  }

  getRegistrationAddress()
  {
    return this.apiUrl+'/register/'; 
  }

  getOSRMAddress()
  {
    return this.osrmUrl+'/route/v1';
  }
}
