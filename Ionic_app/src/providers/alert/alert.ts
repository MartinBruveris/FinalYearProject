import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { Observable } from "rxjs/Observable";

@Injectable()
export class AlertProvider 
{
  constructor(private alertCtrl: AlertController) 
  {
    console.log('Hello AlertProvider Provider');
  }

  makeAlert()
  {
    return new Observable((observer)=>
    {
      let alert = this.alertCtrl.create(
      {
        title: 'Edit Marker',
        message: 'Would you like to remove or reposition the marker?',
        cssClass: 'alertCustomCss',
        buttons: [
        {
          text: 'Remove',
          handler: () => 
          {
            observer.next(true);
          }
        },
        {
          text: 'Reposition',
          handler: () => 
          {
            observer.next(false);
          }
        }]
      });
      alert.present();
    });
  }
}
