import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { SessionModalPage } from './session-modal';

@NgModule({
  declarations: [
    SessionModalPage,
  ],
  imports: [
    IonicPageModule.forChild(SessionModalPage),
  ],
})
export class SessionModalPageModule {}
