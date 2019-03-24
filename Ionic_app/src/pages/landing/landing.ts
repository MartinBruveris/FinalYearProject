import { Component } from '@angular/core';
import { NavController, MenuController ,NavParams, FabContainer, ModalController, IonicPage } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { AlertController } from 'ionic-angular';
import { ToastProvider } from './../../providers/toast/toast';
import { LocationProvider } from './../../providers/location/location';
import { LoaderProvider } from './../../providers/loader/loader';
import { RestApiProvider } from './../../providers/rest-api/rest-api';
import { WebsocketProvider } from './../../providers/websocket/websocket';
import { SocketDataProvider, initMsg, dataMsg, markerMsg } from './../../providers/socket-data/socket-data';
import { OtherUserProvider, otherUser } from './../../providers/other-user/other-user';
import { AlertProvider } from './../../providers/alert/alert';
import { IconProvider} from './../../providers/icon/icon';
import { AddressProvider } from '../../providers/address/address';
import { SocialSharing } from '@ionic-native/social-sharing';
import { Network } from '@ionic-native/network';
import { Insomnia } from '@ionic-native/insomnia';
import { BackgroundMode } from '@ionic-native/background-mode';

import L from "leaflet";
import "leaflet-routing-machine";
import 'rxjs/add/operator/filter';


@IonicPage()
@Component({
  selector: 'page-landing',
  templateUrl: 'landing.html',
})


export class LandingPage 
{
  private msgType=
  {
      msg_data: "exchangeData",
      msg_init_session: "startSession",
      msg_terminate_session: "stopSession",
      msg_join_session: "joinSession",
      msg_leave_session: "leaveSession",
      msg_share_destination: "shareDestination",
      msg_update_destination: "updateDestination",
      msg_remove_destination: "removeDestination",
      msg_reconnect: "reconnect"

  };
  
  private map: L.map;
  private locationObservable: any;
  private socket: any;
  private userToken : string;
  private shareBtnText: string;
  private joinBtnText: string;
  private username: string;
  private userType: string;
  private socketOpen: boolean;
  private joinedSession: boolean;
  private currentLocationData: any;
  private positionMarker: L.Marker;
  private destinationMarker: L.Marker;
  private locationShared: boolean;
  private dataMsg: dataMsg;
  private initMsg: initMsg;
  private markerMsg: markerMsg;
  private markerPos: any;
  private route: any;
  private session_id: string;
  private attribution: string;
  private otherUsers: otherUser[];
  private userInitiatedDrag: boolean;
  private driving: boolean;
  private disconnectSubscription: any;
  private connectSubscription: any;
  private wifiCheck: boolean;
  private socketSubscription: any;
  private dismissableToast: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public loc: LocationProvider,
    private nativeStorage: NativeStorage, public loader: LoaderProvider, public restApi: RestApiProvider,
    private websocketProvider: WebsocketProvider, private socketMessage: SocketDataProvider, private otherUserProvider: OtherUserProvider,
    public menuCtrl: MenuController, private alertCtrl: AlertController, private toast: ToastProvider, private alert: AlertProvider,
    private icon: IconProvider, private address: AddressProvider, private modal: ModalController, private socialSharing: SocialSharing,
    private network: Network, private insomnia: Insomnia, private backgroundMode: BackgroundMode) 
  {
    this.joinedSession = false;
    this.username = this.navParams.get('username');
    this.userType = null;
    this.shareBtnText = 'Create Session';
    this.joinBtnText = 'Join Session';
    this.otherUsers = [];
    this.dataMsg = null;
    this.initMsg = null;
    this.currentLocationData = null;
    this.socketOpen = false;
    this.locationShared = false;
    this.locationObservable = null;
    this.userToken = null;
    this.session_id = null;
    this.userInitiatedDrag = false;
    this.destinationMarker = null;
    this.markerMsg = null;
    this.markerPos = null;
    this.route = null;
    this.driving = false;
    this.wifiCheck = false;
    this.socketSubscription = null;
    this.dismissableToast = null;
    //this.nativeStorage.setItem('loginToken', this.navParams.get('authToken'));
    //this.nativeStorage.setItem('username', this.navParams.get('username'));
    this.attribution = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';

    this.disconnectSubscription = this.network.onDisconnect().subscribe(() => 
    {
      console.log("connection disconnected, close socket for this connection")
      this.wifiCheck = false;
      this.socketSubscription.complete();
      this.socketSubscription.unsubscribe()
      this.socket = null;
    });
    
    this.connectSubscription = this.network.onConnect().subscribe(() =>
    {
      if(this.wifiCheck === false && this.network.type === "wifi" || this.network.type !== "wifi")
      {
        //check to prevent wifi from calling onConnect() twice
        if(this.network.type !== "wifi")
        {
          this.wifiCheck = false;
        }
        else
        {
          this.wifiCheck = true;
        }
        setTimeout(() => 
        {
          if(!this.socket)
          {
            console.log("socket doesn't exist, open one");
            this.connectSocket(null, null, null);
          }
          else
          {
            console.log("socket exist, close it and open a new one");
            this.socketSubscription.complete()
            this.socketSubscription.unsubscribe();
            this.socket = null;
            this.connectSocket(null, null, null);
          }
          console.log("connect "+this.network.type);
        }, 10000);
      }
    });
  }

  ionViewDidLoad() 
  {
    console.log('ionViewDidLoad LandingPage');
    this.insomnia.keepAwake();
    this.backgroundMode.enable();
    // this.nativeStorage.getItem('loginToken').then(token => {
    //   console.log("got authorization token");
    //   console.log(token);
    //   this.userToken = token;
    //   this.initialPos().then(this.continuousTrack);
    // }, error => console.log('Error getting authorization token ' + error));


      
    //temp development code
    console.log("got authorization token");
    this.userToken = this.navParams.get('authToken');
    this.initialPos().then(this.continuousTrack);
    
  }

  ionViewWillLeave() {
    console.log("leaving the view, unsubscribe from all observables");
    if(this.locationObservable)
    {
      this.locationObservable.unsubscribe();
    }
    this.connectSubscription.unsubscribe();
    this.disconnectSubscription.unsubscribe();
    this.insomnia.allowSleepAgain();
    this.backgroundMode.disable();
  }

  initialPos = () => 
  {
    let promise = new Promise((resolve, reject) => 
    {
      this.loc.getInitialLocation().then(locationData => 
      {
        console.log("Got the initial position: " + locationData.coords.latitude + " " + locationData.coords.longitude);
        this.currentLocationData = locationData;
        let corner1 = L.latLng(55.490, -5.186); //bounding box coordinates for Ireland
        let corner2 = L.latLng(51.328, -11.265); //bounding box coordinates for Ireland
        let bounds = L.latLngBounds(corner1, corner2);

        this.map = L.map('map', {
          center: { lat: locationData.coords.latitude, lng: locationData.coords.longitude },
          zoomControl: false,
          attributionControl: true,
          zoom: 16,
          zoomsnap: 0.05,
          maxBounds: bounds,
          maxBoundsViscosity: 1.0
      });

      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        useCache: true,
        attribution: this.attribution,
        maxZoom: 18,
        minZoom: 7,
        updateInterval: 50,
        keepBuffer: 5
      }).addTo(this.map);

      console.log("Accuracy of initial position: " + locationData.coords.accuracy);
      this.positionMarker = new L.Marker([locationData.coords.latitude, locationData.coords.longitude], {icon: this.icon.getIconSelf()});
      this.map.invalidateSize();

      this.map.addLayer(this.positionMarker);
      this.loader.hideLoad();
          
        
      //longpress
      this.map.on('contextmenu', (coords)=>
      {
        if(this.locationShared)
        {
          this.addDestinationMarker(coords);
        }
      });


      this.map.on('drag', (e)=>
      {
        if(!this.userInitiatedDrag)
        {
          this.userInitiatedDrag = true;
          console.log("DRAG");
        }
      });

      resolve("map initialized");
      }, error => {
        console.log(error);
        reject("error while initializing");
      });
    });
    return promise;
  }

  recenterMap()
  {
    this.map.panTo(new L.LatLng(this.currentLocationData.coords.latitude, this.currentLocationData.coords.longitude));
    this.userInitiatedDrag = false;
  }

  continuousTrack = () => {
    console.log("Begin continuous location tracking");

    this.locationObservable = this.loc.trackLocation()
      .filter((data) => data.coords !== undefined)
      .filter((data) => data.coords.accuracy < 21)
      .filter((data)=> L.latLng(data.coords.latitude, data.coords.longitude).distanceTo(L.latLng(this.currentLocationData.coords.latitude, this.currentLocationData.coords.longitude)) > 5)
      .subscribe(locData => {
        this.currentLocationData = locData;
        this.manageMarker(locData);
        this.map.invalidateSize();
        if(this.destinationMarker && this.socket && this.currentLocationData.coords)
        {
          this.route.setWaypoints(
            [
              L.latLng(this.currentLocationData.coords.latitude, this.currentLocationData.coords.longitude),
              L.latLng(this.markerPos.lat, this.markerPos.lng)
            ]);
        }
      });
  }

  manageMarker(locData) {
    if(this.locationShared === true || this.joinedSession === true && this.socket)
    {
      let msg = this.socketMessage.createDataMsg(this.msgType.msg_data, locData.coords.latitude, locData.coords.longitude, 
        this.username, this.userToken, this.userType, this.session_id);
      this.socket.next(JSON.stringify(msg));
    }
    this.positionMarker.setLatLng([locData.coords.latitude, locData.coords.longitude]);
    if(!this.userInitiatedDrag)
    {
      this.map.panTo([locData.coords.latitude, locData.coords.longitude], 
      {
        animate: true,
        duration: 2
      });
    }
  }


  manageSession() 
  {
    this.menuCtrl.close();
    let title = '';
    let message = '';
    let confirmTxt = '';
    if (this.locationShared === false) {
      title = 'Share your location?';
      message = 'Would you like to share your location?';
      confirmTxt = 'Share location';
      this.manageSessionAlert(title, message, confirmTxt);
    }
    else 
    {
      title = 'Stop location sharing?';
      message = 'Would you like to stop sharing your location?';
      confirmTxt = 'Stop sharing';
      this.manageSessionAlert(title, message, confirmTxt);
    }
  }

  openSocket=(socketToken)=>
  {
    let socketPromise = new Promise((resolve, reject)=>
    {
      console.log("open socket using token "+socketToken);
      this.socket = this.websocketProvider.openSocket(socketToken);
      if(this.socket)
      {
        this.socketSubscription = this.socket.subscribe(
          (incommingData) => 
          {
            if(incommingData.type === "session.message")
            {
              switch(incommingData.clientAction)
              {
                case "exchange":
                {
                  this.processLocationData(incommingData);
                  break;
                }
                case "leave":
                {
                  this.removeFromTrackedUsers(incommingData.userId);
                  break;
                }
                case "terminateSession":
                {
                  console.log("received message to terminate the socket connection");
                  this.removeAllJoinedUsers();
                  this.hideInfoBar();
                  this.joinedSession = false;
                  this.joinBtnText = 'Join Session';
                  this.socketSubscription.complete();
                  this.socketSubscription.unsubscribe();
                  this.toast.infoToast("The session was terminated");

                  if(this.dismissableToast)
                  {
                    this.dismissableToast.dismiss();
                  }
                  break;
                }
                case "setDestination":
                {
                  if(this.username !== incommingData.userId)
                  {
                    this.receiveDestinationMarker(incommingData);
                  }
                  break;
                }
                case "updateDestination":
                {
                  if(this.destinationMarker)
                  {
                    this.updateDestinationMarker(incommingData.lat, incommingData.lng);
                  }
                  break;
                }
                case "removeDestination":
                {
                  if(this.destinationMarker)
                  {
                    this.removeDestinationMarker();
                  }
                  break;
                }
                case "getOtherUserPos":
                {
                  let otherUsers = JSON.parse(incommingData.userPositions);
                  otherUsers.map(userData=>
                  {
                    let data =
                    {
                      "userId": userData.user_id,
                      "lat": userData.lat,
                      "lng": userData.lng
                    };
                    this.processLocationData(data);
                  });
                  break;
                }
                default:
                {
                  console.log("client action type not recognized");
                  break;
                }
              }
            }
            else
            {
              switch(incommingData.status)
              {
                case "session_created":
                {
                  this.displaySessionId(incommingData.session_id);
                  break;
                }
                case "session_joined":
                {
                  if(incommingData.marker)
                  {
                    let markerCoords =
                    {
                      "lat": incommingData.marker[1], //[1]-lat
                      "lng": incommingData.marker[0] //[0]-lng
                    };
                    this.receiveDestinationMarker(markerCoords);
                  }
                  this.joinedSession =! this.joinedSession;
                  this.joinBtnText = "Leave Session";
                  this.loader.hideLoad();
                  this.showInfoBar();
                  break;
                }
                case "session_leave":
                {
                  this.hideInfoBar();
                  this.socketSubscription.complete();
                  this.socketSubscription.unsubscribe();
                  break;
                }
                case "error":
                {
                  this.loader.hideLoad();
                  let alert = this.alertCtrl.create({
                    cssClass: 'alertCustomCss',
                    title: "Error",
                    message: incommingData.errorMsg,
                    buttons: ["OK"]
                  });
                  alert.present();
                  break;
                }
                default:
                {
                  console.log("client status type not recognized");
                  break;
                }
              }
            }
          },
          (err) =>
          {
            console.log(err);
          },
          () => 
          {
              console.log('SOCKET OBSERVABLE COMPLETE');
              this.socket = null;
          });
        resolve(this.socket);
      }
      else
      {
        reject("Socket Error");
      }
    });
    return socketPromise;
  }


  displaySessionId(session_id)
  {
    this.loader.hideLoad();
    const modal = this.modal.create('SessionModalPage', {session_id}, {enableBackdropDismiss: true, showBackdrop: true});
    modal.onDidDismiss(session_id => 
    {
      this.dismissableToast = this.toast.hintToast("Longpress on the screen to add the destination marker");
      if(session_id)
      {
        this.shareSessionCode(session_id);
      }
      else
      {
        this.showInfoBar();
      }
    });
    modal.present();

    this.shareBtnText = 'Stop Session';
    this.locationShared = true;
    this.session_id = session_id;
    console.log("your session id is: "+session_id);
  }

  manageSessionAlert(title, message, confirmTxt)
  {
    let alert = this.alertCtrl.create({
      cssClass: 'alertCustomCss',
      title: title,
      message: message,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        },
        {
          text: confirmTxt,
          handler: data => {
            if (this.locationShared === false) 
            {
              this.loader.showLoad("Getting things ready...");
              this.userType = "host";
              this.connectSocket(this.positionMarker.getLatLng(), this.userType, this.msgType.msg_init_session);
            }
            else 
            {
              this.stopLocationSharing();
            }
          }
        }
      ]
    });
    alert.present();
  }

  stopLocationSharing() 
  {
    console.log("stop sharing, terminate the session");
    console.log("the session id was "+this.session_id);
    if(this.socket)
    {
      this.dataMsg = this.socketMessage.createDataMsg(this.msgType.msg_terminate_session, null, null, this.username, this.userToken, this.userType, this.session_id);
      this.socket.next(JSON.stringify(this.dataMsg));
    }
    this.removeAllJoinedUsers();
    this.hideInfoBar();
    this.locationShared = !this.locationShared;
    this.shareBtnText = 'Create Session';
  }

  joinSession()
  {
    let title = '';
    let message = '';
    let confirmTxt = '';
    if (this.joinedSession === false) {
      title = 'Enter Session ID';
      message = 'Would you like to share your location?';
      confirmTxt = 'Share location';
      this.manageJoinAlert(title);
    }
    else {
      title = 'Disconect from the session?';
      message = 'Would you like to stop sharing your location?';
      confirmTxt = 'Stop sharing';
      this.manageJoinAlert(title);
    }
  }

  manageJoinAlert(title)
  {
    let joinAlert = this.alertCtrl.create({
      title: title,
      cssClass: 'alertCustomCss',
      inputs: [
        {
          name: 'session_id',
          placeholder: 'Session ID',
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Join',
          handler: data => {
            console.log("data entered: " + data.session_id);
            this.loader.showLoad("Joining the session ...");
            let payload =
            {
              "session_id": data.session_id.toUpperCase(),
              "coords": this.positionMarker.getLatLng()
            };
            this.userType = "guest";
            this.connectSocket(payload, this.userType, this.msgType.msg_join_session);
            this.session_id = data.session_id.toUpperCase();
            this.menuCtrl.close();
          }
        }
      ]
    });

    let disconectAlert = this.alertCtrl.create({
      title: title,
      cssClass: 'alertCustomCss',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Disconnect',
          handler: data => {
            if(this.socket)
            {
              this.dataMsg = this.socketMessage.createDataMsg(this.msgType.msg_leave_session, null, null, this.username, this.userToken, this.userType, this.session_id);
              this.socket.next(JSON.stringify(this.dataMsg));
            }
            this.joinedSession =! this.joinedSession;
            this.hideInfoBar();
            this.joinBtnText = 'Join Session';
            this.menuCtrl.close();
            this.removeAllJoinedUsers();
          }
        }
      ]
    });
    if(this.joinedSession === false)
    {
      joinAlert.present();
    }
    else
    {
      disconectAlert.present();
    }
  }

  processLocationData(incommingData) 
  {
    if (incommingData.userId !== this.username) {
      //promise to check allready connected group users
      let userGroupPromise = new Promise((resolve, reject) =>
      {
        let userAlreadyConnected = false;
        for (let i = 0; i < this.otherUsers.length; i++) 
        {
          if (this.otherUsers[i].userId === incommingData.userId) 
          {
            userAlreadyConnected = true;
            break;
          }
        }
        resolve(userAlreadyConnected);
      });


      //if nobody is tracking me yet, add me to the tracking list immeadiately and create a marker 
      if (this.otherUsers.length === 0) 
      {
        this.addToTrackedUsers(incommingData);
        console.log("add " + incommingData.userId + " to the group and create a marker(other users are not connected)");
      }

      //some users are tracking me already
      else 
      {
        //check if I'm not one of them
        userGroupPromise.then(userAlreadyConnected => 
        {
          //I'm allready tracking this user
          if (userAlreadyConnected) 
          {
            //update my location marker
            this.updateTrackedUserLocations(incommingData);
            console.log("update " + incommingData.userId + "'s marker position");
          }

          //I'm not tracking this 
          else 
          {
            //add me to the user list and create marker for me
            this.addToTrackedUsers(incommingData);
            console.log("add " + incommingData.userId + " to the group and create marker (other users already connected)");
          }
        });
      }
    }
  }

  addToTrackedUsers(incommingData) 
  {
    console.log("add " + incommingData.userId + " to the user group");
    let marker = new L.Marker([incommingData.lat, incommingData.lng], {icon:this.icon.getIconOthers()})
      .bindTooltip(incommingData.userId,
      {
        permanent:true, 
        direction:'top', 
        className:"customTooltip"
      });

    let otherUser = this.otherUserProvider.createOtherUser(marker, incommingData.userId, "#77efa1");
    this.otherUsers.push(otherUser);
    this.map.addLayer(marker);
  }

  removeFromTrackedUsers(userId)
  {
    this.otherUsers
      .filter(user => user.userId === userId)
      .map(user=>this.map.removeLayer(user.marker));
    this.otherUsers = this.otherUsers.filter(user => user.userId !== userId);
  }

  updateTrackedUserLocations(incommingData) 
  {
    console.log("update " + incommingData.userId + " location");

    this.otherUsers.map(user=>
    {
      if (user.userId === incommingData.userId) 
      {
        let newPos = L.latLng(incommingData.lat, incommingData.lng);
        let previousPos = user.marker.getLatLng();
        if(!newPos.equals(previousPos))
        {
          user.marker.setLatLng([incommingData.lat, incommingData.lng]);
        }
      }
    });
  }

  removeAllJoinedUsers()
  {
    this.otherUsers.map(user=>
    {
      this.map.removeLayer(user.marker);
    });
    this.otherUsers = [];
    if(this.destinationMarker)
    {
      this.map.removeLayer(this.destinationMarker);
      this.destinationMarker = null;
    }
    if(this.route)
    {
      this.route.setWaypoints([]);
      this.route = null;
    }
  }

  addDestinationMarker(coords)
  {
    if(!this.destinationMarker && this.socket)
    {
      console.log("marker added");
      this.dismissableToast = this.toast.hintToast("Tap on the marker to edit");
      this.destinationMarker = new L.marker([coords.latlng.lat, coords.latlng.lng], {icon: this.icon.getIconDestination()});
      this.map.addLayer(this.destinationMarker);
      this.markerMsg = this.socketMessage.createMarkerMsg(this.msgType.msg_share_destination, coords.latlng.lat, coords.latlng.lng, this.userToken, this.session_id); 
      this.socket.next(JSON.stringify(this.markerMsg));
      this.markerPos = coords.latlng;
      this.createRoute();
      let dragged = false;
      let clicked = false;
      this.destinationMarker.on('click', ()=>
      {
        if(dragged === false && this.socket)
        {
          clicked = true;
          dragged = false;
          const markerAlert = this.alert.makeAlert().subscribe(selection=>
          {
            if(selection === true)
            {
              this.map.removeLayer(this.destinationMarker);
              this.markerMsg = this.socketMessage.createMarkerMsg(this.msgType.msg_remove_destination, this.markerPos.lat, this.markerPos.lng, this.userToken, this.session_id); 
              this.socket.next(JSON.stringify(this.markerMsg));
              if(this.route)
              {
                this.map.removeControl(this.route);
                this.route = null;
              }
              this.destinationMarker = null;  
              this.driving = false;
              markerAlert.unsubscribe();
            }
            else
            {
              this.destinationMarker.setIcon(this.icon.getIconDestinationEdit());
              this.destinationMarker.dragging.enable();
              this.destinationMarker.on('drag', (coords)=>
              {
                this.route.setWaypoints(
                  [
                    L.latLng(this.currentLocationData.coords.latitude, this.currentLocationData.coords.longitude),
                    L.latLng(coords.latlng.lat, coords.latlng.lng)
                  ]);
                this.markerPos = coords.latlng;
              });
               markerAlert.unsubscribe();
            }
          });
        }
        else
        {
          dragged = false;
          if(!this.socket)
          {
            this.toast.showErrorBottom("Marker can't be edited while you are offline");
          }
        }
      });

      this.destinationMarker.on('dragend', ()=>
      {
        if(clicked === true && dragged === false && this.socket)
        {
          this.markerMsg = this.socketMessage.createMarkerMsg(this.msgType.msg_update_destination, this.markerPos.lat, this.markerPos.lng, this.userToken, this.session_id); 
          this.socket.next(JSON.stringify(this.markerMsg));
          this.destinationMarker.setIcon(this.icon.getIconDestination());
          dragged = true;
          clicked = false;
          this.destinationMarker.dragging.disable();
        }
      });
    }
    else
    {
      console.log("destination allready exists");
      if(!this.socket)
      {
        this.toast.showErrorBottom("The destination can't be added, looks like you are offline");
      }
    }
  }

  receiveDestinationMarker(incommingData)
  {
    this.destinationMarker = new L.Marker([incommingData.lat, incommingData.lng], {icon: this.icon.getIconDestination()});
    this.map.addLayer(this.destinationMarker);
    this.markerPos = incommingData;
    if(this.socket)
    {
      this.createRoute();
    }
  }

  updateDestinationMarker(lat, lng)
  {
    console.log("Reposition the marker");
    this.destinationMarker.setLatLng([lat, lng]);
    if(this.socket && this.currentLocationData.coords)
    {
      this.route.setWaypoints(
      [
        L.latLng(this.currentLocationData.coords.latitude, this.currentLocationData.coords.longitude),
        L.latLng(lat, lng)
      ]);
    }
  }

  removeDestinationMarker()
  {
    console.log("remove the destination marker");
    this.route.setWaypoints([]);
    this.route = null;
    this.map.removeLayer(this.destinationMarker);
    this.destinationMarker = null;
  }

  createRoute()
  {
    this.route = L.Routing.control(
    {
      waypoints: [
        L.latLng(this.currentLocationData.coords.latitude, this.currentLocationData.coords.longitude),
        L.latLng(this.markerPos.lat, this.markerPos.lng)
      ],
      serviceUrl: this.address.getOSRMAddress(),
      show: false,
      autoRoute: true,
      profile: 'walking',
      summaryTemplate: '',
      createMarker: function() { return null; },
      addWaypoints: false,
      routeWhileDragging: true,
      lineOptions:
      {
        styles: [
          {color: 'orange', opacity: 0.2, weight: 16}, 
          {color: '#153a54', opacity: 0.4, weight: 8},//secondary color
          {color: '#337eb2', opacity: 0.8, weight: 2} //primary color
        ]
      }
    }).addTo(this.map);
  }

  changeMovementType(type: string, fab: FabContainer)
  {
    if(this.socket)
    {
      if(type === "drive")
      {
        this.driving = true;
        this.route.getRouter().options.profile = 'driving';
        this.route.route();
      }
      if(type === "walk")
      { 
        this.driving = false;
        this.route.getRouter().options.profile = 'walking';
        this.route.route();
      }
      fab.close();
    }
    else
    {
      this.toast.showErrorBottom("No routing information available, check your connection");
    }
  }

  logout()
  {
    this.navParams = null;
    if(this.locationObservable)
    {
      this.locationObservable.unsubscribe();
    }
    this.removeAllJoinedUsers();
    if(this.socket)
    {
      let msgType = null;
      if(this.locationShared)
      {
        msgType = this.msgType.msg_terminate_session;
      }
      if(this.joinedSession)
      {
        msgType = this.msgType.msg_leave_session;
      }
      this.dataMsg = this.socketMessage.createDataMsg(msgType, null, null, this.username, this.userToken, this.userType, this.session_id);
      this.socket.next(JSON.stringify(this.dataMsg));
      this.hideInfoBar();
    }
    if(this.dismissableToast)
    {
      this.dismissableToast.dismiss();
    }
    this.navCtrl.setRoot('LoginPage');
  }

  shareSessionCode(session_id)
  {
    this.socialSharing.share('Hi, join my location sharing session using the code '+session_id, 'Join my location share', null, null)
    .then(() => {
      console.log('The code was shared');
      }).catch((err) => {
        console.log('Error while sharing:', err);
    });
    this.showInfoBar()
  }

  showInfoBar()
  {
    let infobar = document.getElementById("infoBar");
    if(infobar)
    {
      infobar.style.display = "block";
    }
  }

  hideInfoBar()
  {
    let infobar = document.getElementById("infoBar");
    if(infobar)
    {
      infobar.style.display = "none";
    }
  }

  connectSocket(payload, userType, outgoingMsgType)
  {
    console.log("connect socket call was made");
    console.log("create new promise");
    let promise = this.restApi.getSocketTicket(this.userToken, this.username);

    console.log("the promise was made");
    promise.then(socketToken=>
      {
        console.log("the promise was resolved");
        let data = JSON.parse(socketToken.data);
        return this.openSocket(data.socket_ticket);
      })
      .then(socket=>
      {
        if(this.socket)
        {
          if(payload && userType)
          {
            this.initMsg = this.socketMessage.createSessionInitMsg(outgoingMsgType, this.userToken, payload);
            this.socket.next(JSON.stringify(this.initMsg));
            this.userType = userType;
            return;
          }
          else
          {
            console.log("send reconnect msg to the server");
            let lat = this.currentLocationData.coords.latitude;
            let lng = this.currentLocationData.coords.longitude;
            let reconnectMsg = this.socketMessage.createDataMsg(this.msgType.msg_reconnect, lat, lng, this.username, this.userToken, this.userType, this.session_id);
            this.socket.next(JSON.stringify(reconnectMsg));
          }
        }
      })
      .catch(error=>
      {
        console.log("connection to the socket promise error");
        console.log(error);
      });
  }
}