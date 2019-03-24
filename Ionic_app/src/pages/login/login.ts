import { Component } from '@angular/core';
import { NavController , IonicPage} from 'ionic-angular';
import { RestApiProvider } from './../../providers/rest-api/rest-api';
import { ToastProvider } from './../../providers/toast/toast';
import { LoaderProvider } from './../../providers/loader/loader';
import { AndroidPermissions } from '@ionic-native/android-permissions';

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  private credentials =
  {
    username: '',
    password: ''
  };

  private observable;

  constructor(public navCtrl: NavController, private restApi: RestApiProvider, private toast: ToastProvider,
    private loader: LoaderProvider, private permissions: AndroidPermissions) 
  {
    this.observable = null;
  }

  ionViewDidEnter()
  {
    this.permissions.requestPermissions([this.permissions.PERMISSION.ACCESS_FINE_LOCATION]);
  }

  login()
  {
    this.permissions.checkPermission(this.permissions.PERMISSION.ACCESS_FINE_LOCATION)
      .then(result => 
        {
          if(result.hasPermission)
          {
            this.loadLandingPage();
          }
          else
          {
            this.toast.showError("No Permission to use the device location");
          }
        },
        err => this.permissions.requestPermission(this.permissions.PERMISSION.ACCESS_FINE_LOCATION)
    );
  }

  register()
  {
    console.log("Register clicked");
    this.navCtrl.push('RegisterPage');
  }

  loadLandingPage()
  {
    this.loader.showLoad("Please wait ...");
    console.log("Login button pressed, retrieving the auth token");
    this.restApi.login(this.credentials)
    .then(response=>
    {
      let data = JSON.parse(response.data);
      this.navCtrl.setRoot('LandingPage', {authToken: data.token, username: this.credentials.username });
    })
    .catch(errorMsg=>
    {
      console.log(errorMsg);
      if(errorMsg.error)
      {
        let error = JSON.parse(errorMsg.error);
        this.loader.hideLoad();
        this.toast.showError(error.detail);
      }
    });
  }
}
