import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';
import { Clipboard } from '@ionic-native/clipboard';
import { ToastProvider } from '../../providers/toast/toast';


@IonicPage()
@Component({
  selector: 'page-session-modal',
  templateUrl: 'session-modal.html',
})
export class SessionModalPage 
{
  private session_id: string;
  constructor(private navCtrl: NavController, private navParams: NavParams, private clipboard: Clipboard, private toast: ToastProvider,
    private viewCtrl: ViewController) 
  {
  }

  ionViewDidLoad() 
  {
    this.session_id = this.navParams.get('session_id');
  }

  copySessionCode()
  {
    this.clipboard.copy(this.session_id);
    this.toast.infoToast("Session code was copied successfully");
  }

  share()
  {
    console.log("Share session was clicked");
    this.viewCtrl.dismiss(this.session_id);
  }
}
