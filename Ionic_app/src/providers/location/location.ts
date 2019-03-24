import { Injectable } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation';
import 'rxjs/add/operator/filter';

@Injectable()
export class LocationProvider {
  constructor(public geoLocation: Geolocation) {
  }

  getInitialLocation()
  {
    return this.geoLocation.getCurrentPosition({enableHighAccuracy: true});
  }

  trackLocation()
  {
    return this.geoLocation.watchPosition({enableHighAccuracy: true});
  }

}
