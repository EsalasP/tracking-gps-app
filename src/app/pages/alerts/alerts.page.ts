import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { 
  checkmarkDone,
  shield,
  warning,
  informationCircle,
  car,
  location,
  flash,
  ellipse,
  notificationsOff,
  save,
  trash,
  refresh,
  notifications
} from 'ionicons/icons';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonList,
  IonItem,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonCheckbox,
  IonToast
} from '@ionic/angular/standalone';
import { NotificationsService, Alert, NotificationSettings } from '../../services/notifications.service';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.page.html',
  styleUrls: ['./alerts.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonLabel,
    IonList,
    IonItem,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonCheckbox,
    IonToast,
    CommonModule, 
    FormsModule
  ]
})
export class AlertsPage implements OnInit, OnDestroy {
  selectedFilter: string = 'all';
  alerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  
  criticalAlerts: number = 0;
  warningAlerts: number = 0;
  infoAlerts: number = 0;
  
  notificationSettings: NotificationSettings = {
    movement: true,
    geofence: true,
    speed: true,
    tamper: true,
    browserNotifications: true
  };

  // Toast
  isToastOpen = false;
  toastMessage = '';
  toastColor = 'primary';

  private alertsSubscription?: Subscription;

  constructor(private notificationsService: NotificationsService) {
  addIcons({
    'checkmark-done': checkmarkDone,
    shield,
    warning,
    'information-circle': informationCircle,
    car,
    location,
    flash,
    ellipse,
    'notifications-off': notificationsOff,
    notifications,
    save,
    trash,
    refresh
  });
}

  ngOnInit() {
    this.loadNotificationSettings();
    this.subscribeToAlerts();
    this.requestNotificationPermissions();
  }

  ngOnDestroy() {
    if (this.alertsSubscription) {
      this.alertsSubscription.unsubscribe();
    }
  }

  async requestNotificationPermissions(): Promise<void> {
    try {
      await this.notificationsService.checkNotificationPermission();
      this.showToast('Permisos de notificación configurados', 'success');
    } catch (error) {
      console.error('Error configurando permisos:', error);
      this.showToast('Error configurando notificaciones', 'danger');
    }
  }

  subscribeToAlerts(): void {
    this.alertsSubscription = this.notificationsService.alerts$.subscribe(alerts => {
      this.alerts = alerts;
      this.updateAlertCounts();
      this.filterAlerts({ detail: { value: this.selectedFilter } });
    });
  }

  loadNotificationSettings(): void {
    this.notificationSettings = this.notificationsService.getSettings();
  }

  updateAlertCounts(): void {
    this.criticalAlerts = this.alerts.filter(alert => alert.type === 'critical').length;
    this.warningAlerts = this.alerts.filter(alert => alert.type === 'warning').length;
    this.infoAlerts = this.alerts.filter(alert => alert.type === 'info').length;
  }

  filterAlerts(event: any): void {
    const filterValue = event.detail.value;
    this.selectedFilter = filterValue;
    
    if (filterValue === 'all') {
      this.filteredAlerts = [...this.alerts];
    } else {
      this.filteredAlerts = this.alerts.filter(alert => alert.type === filterValue);
    }
  }

  markAsRead(alert: Alert): void {
    this.notificationsService.markAsRead(alert.id);
    this.showToast('Alerta marcada como leída', 'success');
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
    this.showToast('Todas las alertas marcadas como leídas', 'success');
  }

  deleteAlert(alert: Alert): void {
    this.notificationsService.deleteAlert(alert.id);
    this.showToast('Alerta eliminada', 'medium');
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'critical':
        return 'shield';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  }

  getAlertColor(type: string): string {
    switch (type) {
      case 'critical':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'primary';
      default:
        return 'medium';
    }
  }

  getAlertTypeLabel(type: string): string {
    switch (type) {
      case 'critical':
        return 'Crítica';
      case 'warning':
        return 'Advertencia';
      case 'info':
        return 'Info';
      default:
        return 'Desconocido';
    }
  }

  saveNotificationSettings(): void {
    this.notificationsService.updateSettings(this.notificationSettings);
    this.showToast('Configuración guardada exitosamente', 'success');
  }

  // Funciones de prueba para alertas reales
  sendTestAlert(): void {
    const randomAlert = this.notificationsService.simulateRandomAlert();
    this.showToast(`Alerta de prueba enviada: ${randomAlert.title}`, 'tertiary');
  }

  // Simulación de alertas específicas
  simulateMovementAlert(): void {
    this.notificationsService.triggerMovementAlert('Estacionamiento Plaza de Armas');
    this.showToast('Alerta de movimiento simulada', 'danger');
  }

  simulateSpeedAlert(): void {
    this.notificationsService.triggerSpeedAlert(85, 60);
    this.showToast('Alerta de velocidad simulada', 'warning');
  }

  simulateGeofenceAlert(): void {
    const actions: ('enter' | 'exit')[] = ['enter', 'exit'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    this.notificationsService.triggerGeofenceAlert('Casa', randomAction);
    this.showToast('Alerta de zona de seguridad simulada', 'primary');
  }

  simulateTamperAlert(): void {
    this.notificationsService.triggerTamperAlert();
    this.showToast('Alerta de manipulación simulada', 'danger');
  }

  // Funciones de gestión
  clearAllAlerts(): void {
    this.alerts.forEach(alert => {
      this.notificationsService.deleteAlert(alert.id);
    });
    this.showToast('Todas las alertas eliminadas', 'medium');
  }

  refreshAlerts(): void {
    // Simular actualización
    this.subscribeToAlerts();
    this.showToast('Alertas actualizadas', 'success');
  }

  getUnreadCount(): number {
    return this.alerts.filter(alert => !alert.read).length;
  }

  // Control de toast
  private showToast(message: string, color: string): void {
    this.toastMessage = message;
    this.toastColor = color;
    this.isToastOpen = true;
  }

  setToastOpen(isOpen: boolean): void {
    this.isToastOpen = isOpen;
  }

  // Funciones adicionales para testing
  testBrowserNotification(): void {
    this.notificationsService.sendBrowserNotification(
      'Prueba de Notificación',
      'Esta es una notificación de prueba del sistema antiasalto GPS'
    );
    this.showToast('Notificación del navegador enviada', 'tertiary');
  }

  generateMultipleAlerts(): void {
    // Generar varias alertas para prueba
    setTimeout(() => this.notificationsService.simulateRandomAlert(), 100);
    setTimeout(() => this.notificationsService.simulateRandomAlert(), 500);
    setTimeout(() => this.notificationsService.simulateRandomAlert(), 1000);
    
    this.showToast('Múltiples alertas generadas', 'tertiary');
  }
// Función para optimizar el renderizado de la lista
  trackByAlertId(index: number, alert: Alert): number {
    return alert.id;
  }
}