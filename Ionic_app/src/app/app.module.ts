import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { HttpClientModule } from '@angular/common/http';
import { HTTP } from '@ionic-native/http';
import { NativeStorage } from '@ionic-native/native-storage';
import { Geolocation } from '@ionic-native/geolocation';

import { MyApp } from './app.component';
import { RestApiProvider } from '../providers/rest-api/rest-api';
import { ToastProvider } from '../providers/toast/toast';
import { LocationProvider } from '../providers/location/location';
import { LoaderProvider } from '../providers/loader/loader';
import { AddressProvider } from '../providers/address/address';
import { WebsocketProvider } from '../providers/websocket/websocket';
import { SocketDataProvider } from '../providers/socket-data/socket-data';
import { OtherUserProvider } from '../providers/other-user/other-user';
import { Keyboard } from '@ionic-native/keyboard';
import { AlertProvider } from '../providers/alert/alert';
import { IconProvider } from '../providers/icon/icon';
import { Clipboard } from '@ionic-native/clipboard';
import { SocialSharing } from '@ionic-native/social-sharing';
import { ComponentsModule } from '../components/components.module';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Network } from '@ionic-native/network';
import { Insomnia } from '@ionic-native/insomnia';
import { BackgroundMode } from '@ionic-native/background-mode';

@NgModule({
  declarations: [
    MyApp,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ComponentsModule,
    IonicModule.forRoot(MyApp,
    {
      scrollPadding: false,
      scrollAssist: true,
      autoFocusAssist: false,
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    RestApiProvider,
    ToastProvider,
    NativeStorage,
    Keyboard,
    LocationProvider,
    Geolocation,
    LoaderProvider,
    AddressProvider,
    HTTP,
    WebsocketProvider,
    SocketDataProvider,
    OtherUserProvider,
    AlertProvider,
    IconProvider,
    Clipboard,
    SocialSharing,
    AndroidPermissions,
    Network,
    Insomnia,
    BackgroundMode
  ]
})
export class AppModule {}
