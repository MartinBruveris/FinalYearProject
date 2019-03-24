import { NgModule } from '@angular/core';
import { InfoBarComponent } from './info-bar/info-bar';
import { IonicModule } from 'ionic-angular';
@NgModule({
	declarations: [InfoBarComponent,
    InfoBarComponent],
	imports: [
		IonicModule
	],
	exports: [InfoBarComponent,
    InfoBarComponent]
})
export class ComponentsModule {}
