import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonTabs, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonTabButton, IonTabBar, IonTabs, IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent],
})
export class Tab1Page {
  constructor() {}
}
