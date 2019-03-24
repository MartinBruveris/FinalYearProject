import { Injectable } from '@angular/core';
import { ToastController } from 'ionic-angular';

@Injectable()
export class ToastProvider {

  constructor(public toastCtrl: ToastController) 
  {
  
  }

  showError(error)
  {
    let toast = this.toastCtrl.create({
      message: error,
      duration: 3000,
      position: 'top',
      cssClass: "alertToast",
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

  showErrorBottom(error)
  {
    let toast = this.toastCtrl.create({
      message: error,
      duration: 3000,
      position: 'bottom',
      cssClass: "alertToast",
    });

    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });

    toast.present();
  }

  infoToast(infoMsg)
  {
    let toast = this.toastCtrl.create({
      message: infoMsg,
      duration: 3000,
      position: 'bottom',
      cssClass: "alertToast",
    });
    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });
    toast.present();
  }

  hintToast(msg)
  {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'bottom',
      showCloseButton: true,
      cssClass: "alertToast",
    });
    toast.onDidDismiss(() => {
      console.log('Dismissed toast');
    });
    toast.present();
    return toast;
  }
}
