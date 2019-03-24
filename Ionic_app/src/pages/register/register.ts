import { Component } from '@angular/core';
import { NavController, NavParams, IonicPage, AlertController } from 'ionic-angular';
import { LoaderProvider } from './../../providers/loader/loader';
import { RestApiProvider } from './../../providers/rest-api/rest-api';
import { ToastProvider } from './../../providers/toast/toast'


@IonicPage()
@Component({
  selector: 'page-register',
  templateUrl: 'register.html',
})

export class RegisterPage 
{
  private registrationDetails =
  {
    username: null,
    password: null,
    confirmPassword: null,
    email: null,
    confirmEmail: null
  };

  private observable;

  constructor(public navCtrl: NavController, public navParams: NavParams, private loader: LoaderProvider, private restApi: RestApiProvider,
    private toast: ToastProvider, private alertCtrl: AlertController)
  {
    this.observable = null;
  }

  submitRegistration()
  {
    if(this.registrationDetails.username && this.registrationDetails.password 
      && this.registrationDetails.confirmPassword && this.registrationDetails.email && this.registrationDetails.confirmEmail)
    {
      if(this.registrationDetails.email !== this.registrationDetails.confirmEmail)
      {
        this.toast.showError("The emails doesn't match!");
      }
      else if(this.registrationDetails.password !== this.registrationDetails.confirmPassword)
      {
        this.toast.showError("The passwords doesn't match!");
      }
      else if(this.registrationDetails.email.includes('@') && this.registrationDetails.email.includes('.'))
      {
        console.log(this.registrationDetails);
        this.loader.showLoad("Please wait ...");
        console.log("registering the user");
        this.restApi.register(this.registrationDetails)
          .then(response =>
          {
            let data = JSON.parse(response.data);
            if(data.status === "registered")
            {
              this.loader.hideLoad();
              let alert = this.alertCtrl.create({
                title: 'Congratulations',
                message: 'You are now registered',
                cssClass: 'alertCustomCss',
                buttons: [
                {
                  text: 'OK',
                  handler: () => 
                  {
                    this.navCtrl.setRoot('LoginPage');
                  }
                }]
              });
                alert.present();
            }
          })
          .catch(errorMsg =>
          {
            let error = JSON.parse(errorMsg.error);
            this.loader.hideLoad();
            console.log(error.detail);
            this.toast.showError(error.detail);
          });  
      }
      else
      {
        this.toast.showError("Email format error");
      }
    }
    else
    {
      this.toast.showError("Make sure all fields are filled in");
    }
  }

  filterInput(e)
  {
      const pattern = new RegExp('^[a-zA-Z0-9]+$');
      if (!pattern.test(e.key)) 
      {
        event.preventDefault();
      }
  }

  filterEmailInput(e)
  {
      const pattern = new RegExp('^[a-zA-Z0-9@.]+$');
      if (!pattern.test(e.key)) 
      {
        event.preventDefault();
      }
  }
}
