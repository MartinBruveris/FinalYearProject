import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Keyboard } from '@ionic-native/keyboard';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any = 'LoginPage';

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, keyboard: Keyboard) {
    platform.ready().then(() => {
      statusBar.styleLightContent();
      statusBar.backgroundColorByHexString("#0d2434");
      splashScreen.hide();
      keyboard.disableScroll(true);
    });
  }
}
