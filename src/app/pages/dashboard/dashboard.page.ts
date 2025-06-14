import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonToast,
  IonAlert
} from '@ionic/angular/standalone';
import { NotificationsService } from '../../services/notifications.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
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
    IonToast,
    IonAlert,
    CommonModule, 
    FormsModule
  ]
})
export class DashboardPage implements OnInit {
  currentTime: string = '';
  
  // Nuevas propiedades
  isToastOpen = false;
  toastMessage = '';
  toastColor = 'primary';
  isAlertOpen = false;
  alertHeader = '';
  alertMessage = '';
  alertButtons: any[] = [];

  // Estado del sistema antiasalto
  systemStatus = {
    armed: false,
    vehicleLocked: false,
    alarmActive: false
  };

  constructor(
    private router: Router,  // <- Añadir
    private notificationsService: NotificationsService  // <- Añadir
  ) { }

  ngOnInit() {
    this.updateCurrentTime();
    setInterval(() => {
      this.updateCurrentTime();
    }, 60000);
  }

  updateCurrentTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // NUEVAS FUNCIONES IMPLEMENTADAS

  viewLocation() {
    console.log('Navegando a la página de seguimiento...');
    this.router.navigate(['/tabs/tracking']);
    this.showToast('Navegando al mapa GPS...', 'primary');
  }

  activateAlarm() {
    this.showConfirmAlert(
      'Activar Alarma de Emergencia',
      '¿Está seguro que desea activar la alarma de emergencia? Se notificará a sus contactos de emergencia.',
      () => {
        this.systemStatus.alarmActive = true;
        this.notificationsService.triggerSystemAlert(
          'ALARMA DE EMERGENCIA ACTIVADA',
          'Alarma activada manualmente desde el panel de control',
          'critical'
        );
        this.showToast('¡Alarma de emergencia activada!', 'danger');
      }
    );
  }

  lockVehicle() {
    if (this.systemStatus.vehicleLocked) {
      // Desbloquear vehículo
      this.showConfirmAlert(
        'Desbloquear Vehículo',
        '¿Desea desbloquear el vehículo? El sistema antiasalto seguirá activo.',
        () => {
          this.systemStatus.vehicleLocked = false;
          this.notificationsService.triggerSystemAlert(
            'Vehículo desbloqueado',
            'El vehículo ha sido desbloqueado remotamente',
            'info'
          );
          this.showToast('Vehículo desbloqueado', 'success');
        }
      );
    } else {
      // Bloquear vehículo
      this.showConfirmAlert(
        'Bloquear Vehículo',
        '¿Está seguro que desea bloquear el vehículo? No se podrá encender hasta desbloquearlo.',
        () => {
          this.systemStatus.vehicleLocked = true;
          this.notificationsService.triggerSystemAlert(
            'Vehículo bloqueado',
            'El vehículo ha sido bloqueado remotamente por seguridad',
            'warning'
          );
          this.showToast('Vehículo bloqueado correctamente', 'warning');
        }
      );
    }
  }

  // Funciones adicionales para el dashboard
  toggleSystemArmed() {
    if (this.systemStatus.armed) {
      this.disarmSystem();
    } else {
      this.armSystem();
    }
  }

  private armSystem() {
    this.systemStatus.armed = true;
    this.notificationsService.triggerSystemAlert(
      'Sistema armado',
      'El sistema antiasalto ha sido armado manualmente',
      'info'
    );
    this.showToast('Sistema antiasalto armado', 'success');
  }

  private disarmSystem() {
    this.systemStatus.armed = false;
    this.systemStatus.alarmActive = false;
    this.notificationsService.triggerSystemAlert(
      'Sistema desarmado',
      'El sistema antiasalto ha sido desarmado',
      'info'
    );
    this.showToast('Sistema antiasalto desarmado', 'medium');
  }

  refreshStatus() {
    this.updateCurrentTime();
    this.showToast('Estado del sistema actualizado', 'primary');
  }

  // Funciones auxiliares
  private showToast(message: string, color: string): void {
    this.toastMessage = message;
    this.toastColor = color;
    this.isToastOpen = true;
  }

  private showConfirmAlert(header: string, message: string, onConfirm: () => void): void {
    this.alertHeader = header;
    this.alertMessage = message;
    this.alertButtons = [
      {
        text: 'Cancelar',
        role: 'cancel',
        handler: () => {
          console.log('Acción cancelada');
        }
      },
      {
        text: 'Confirmar',
        handler: () => {
          onConfirm();
        }
      }
    ];
    this.isAlertOpen = true;
  }

  setToastOpen(isOpen: boolean): void {
    this.isToastOpen = isOpen;
  }

  setAlertOpen(isOpen: boolean): void {
    this.isAlertOpen = isOpen;
  }

  // Getters para la interfaz
  get systemStatusText(): string {
    if (this.systemStatus.alarmActive) return 'Alarma Activa';
    if (this.systemStatus.armed) return 'Sistema Armado';
    return 'Sistema Desarmado';
  }

  get systemStatusColor(): string {
    if (this.systemStatus.alarmActive) return 'danger';
    if (this.systemStatus.armed) return 'success';
    return 'medium';
  }

  get lockButtonText(): string {
    return this.systemStatus.vehicleLocked ? 'Desbloquear' : 'Bloquear';
  }

  get lockButtonColor(): string {
    return this.systemStatus.vehicleLocked ? 'success' : 'warning';
  }

  get alarmButtonText(): string {
    return this.systemStatus.alarmActive ? 'Desactivar Alarma' : 'Activar Alarma';
  }
}