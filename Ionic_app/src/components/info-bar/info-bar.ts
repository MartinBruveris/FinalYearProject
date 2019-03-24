import { Component, EventEmitter, Output, Input } from '@angular/core';
import { Clipboard } from '@ionic-native/clipboard';
import { ToastProvider } from '../../providers/toast/toast';

@Component({
  selector: 'info-bar',
  templateUrl: 'info-bar.html'
})
export class InfoBarComponent {
  @Input() username:string;
  @Input() session_id: string;
  @Input() userCount: number;
  @Input() type: string;
  @Output()terminateSessionEmitter = new EventEmitter<string>();
  constructor(private clipboard: Clipboard, private toast: ToastProvider)
  {
    
  }
  copySessionId()
  {
    this.clipboard.copy(this.session_id);
    this.toast.infoToast("Session code was copied successfully");
  }
  terminateSession()
  {
    this.terminateSessionEmitter.emit();
  }
}
