
import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';

@Injectable()
export class LoaderProvider {
  loading = null;
  constructor(public loader: LoadingController) {
  }

  showLoad(messageText)
  {
    console.log('Displayed loading spinner');
    this.loading = this.loader.create({
    content: messageText
    });

    this.loading.onDidDismiss(() => {
      console.log('Dismissed loading spinner');
    });

    this.loading.present();

    setTimeout(() => {this.loading.dismiss();}, 30000);
  }

  hideLoad()
  {
    this.loading.dismiss();
  }

}
