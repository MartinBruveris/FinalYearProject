import { Injectable } from '@angular/core';
import L from "leaflet";

@Injectable()
export class IconProvider {

  constructor() 
  {
  }

  getIconSelf()
  {
    let icon = L.icon({
      iconUrl: 'assets/imgs/icon_self.png',
      iconSize:     [46, 46], // size of the icon
      iconAnchor:   [23, 46], // point of the icon which will correspond to marker's location
    });
    return icon;
  }

  getIconOthers()
  {
    let icon = L.icon({
      iconUrl: 'assets/imgs/icon_others.png',
      iconSize:     [32, 32], // size of the icon
      iconAnchor:   [16, 32], // point of the icon which will correspond to marker's location
      tooltipAnchor: [0, -26] // point from which the popup should open relative to the iconAnchor
    });
    return icon;
  }

  getIconDestination()
  {
    let icon = L.icon({
      iconUrl: 'assets/imgs/icon_dest.png',
      iconSize:     [64, 64], // size of the icon
      iconAnchor:   [32, 64], // point of the icon which will correspond to marker's location
    });
    return icon;
  }

  getIconDestinationEdit()
  {
    let icon = L.icon({
      iconUrl: 'assets/imgs/icon_dest_mov.png',
      iconSize:     [64, 64], // size of the icon
      iconAnchor:   [32, 64], // point of the icon which will correspond to marker's location
    });
    return icon;
  }

}
