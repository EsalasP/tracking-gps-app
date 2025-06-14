import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Alert {
  id: number;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
  timestamp: number;
}

export interface NotificationSettings {
  movement: boolean;
  geofence: boolean;
  speed: boolean;
  tamper: boolean;
  browserNotifications: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private alerts: Alert[] = [];
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  private settings: NotificationSettings = {
    movement: true,
    geofence: true,
    speed: true,
    tamper: true,
    browserNotifications: true
  };

  private notificationPermission: NotificationPermission = 'default';

  constructor() {
    this.checkNotificationPermission();
    this.loadSampleAlerts();
  }

  async checkNotificationPermission(): Promise<void> {
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
      
      if (this.notificationPermission === 'default') {
        try {
          this.notificationPermission = await Notification.requestPermission();
        } catch (error) {
          console.error('Error solicitando permisos de notificación:', error);
        }
      }
    }
  }

  async sendBrowserNotification(title: string, body: string, icon?: string): Promise<void> {
    if (!this.settings.browserNotifications) return;
    
    if ('Notification' in window && this.notificationPermission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: icon || '/assets/icon/favicon.png',
          badge: '/assets/icon/favicon.png',
          tag: 'antiasalto-gps',
          requireInteraction: true,
          silent: false
        });

        // Auto cerrar después de 5 segundos
        setTimeout(() => {
          notification.close();
        }, 5000);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Error enviando notificación del navegador:', error);
      }
    }
  }

  createAlert(type: 'critical' | 'warning' | 'info', title: string, message: string): Alert {
    const alert: Alert = {
      id: Date.now() + Math.random(),
      type,
      title,
      message,
      time: this.formatTime(new Date()),
      read: false,
      timestamp: Date.now()
    };

    this.alerts.unshift(alert);
    this.alertsSubject.next([...this.alerts]);

    // Enviar notificación del navegador
    if (type === 'critical' || type === 'warning') {
      this.sendBrowserNotification(title, message);
    }

    return alert;
  }

  // Alertas específicas del sistema antiasalto
  triggerMovementAlert(location: string): Alert {
    if (!this.settings.movement) return this.createAlert('info', 'Movimiento detectado', 'Sistema informativo');
    
    return this.createAlert(
      'critical',
      'Movimiento no autorizado detectado',
      `El vehículo se ha movido desde: ${location}`
    );
  }

  triggerSpeedAlert(speed: number, limit: number): Alert {
    if (!this.settings.speed) return this.createAlert('info', 'Velocidad detectada', 'Sistema informativo');
    
    return this.createAlert(
      'warning',
      'Exceso de velocidad detectado',
      `Velocidad actual: ${speed} km/h (Límite: ${limit} km/h)`
    );
  }

  triggerGeofenceAlert(zoneName: string, action: 'enter' | 'exit'): Alert {
    if (!this.settings.geofence) return this.createAlert('info', 'Zona detectada', 'Sistema informativo');
    
    const actionText = action === 'enter' ? 'entrado en' : 'salido de';
    return this.createAlert(
      'info',
      `Zona de seguridad: ${zoneName}`,
      `El vehículo ha ${actionText} la zona "${zoneName}"`
    );
  }

  triggerTamperAlert(): Alert {
    if (!this.settings.tamper) return this.createAlert('info', 'Sistema verificado', 'Sistema informativo');
    
    return this.createAlert(
      'critical',
      'Intento de manipulación detectado',
      'Se ha detectado un intento de interferir con el sistema GPS'
    );
  }

  triggerSystemAlert(title: string, message: string, type: 'critical' | 'warning' | 'info' = 'info'): Alert {
    return this.createAlert(type, title, message);
  }

  markAsRead(alertId: number): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.read = true;
      this.alertsSubject.next([...this.alerts]);
    }
  }

  markAllAsRead(): void {
    this.alerts.forEach(alert => alert.read = true);
    this.alertsSubject.next([...this.alerts]);
  }

  deleteAlert(alertId: number): void {
    this.alerts = this.alerts.filter(a => a.id !== alertId);
    this.alertsSubject.next([...this.alerts]);
  }

  getAlerts(): Alert[] {
    return [...this.alerts];
  }

  getUnreadCount(): number {
    return this.alerts.filter(alert => !alert.read).length;
  }

  getAlertsByType(type: 'critical' | 'warning' | 'info'): Alert[] {
    return this.alerts.filter(alert => alert.type === type);
  }

  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Configuración de notificaciones actualizada:', this.settings);
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  private formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-CL');
  }

  private loadSampleAlerts(): void {
    // Cargar algunas alertas de ejemplo
    this.createAlert('info', 'Sistema iniciado', 'El sistema antiasalto GPS está operativo');
    this.createAlert('info', 'GPS conectado', 'Señal GPS establecida correctamente');
  }

  // Monitoreo automático de velocidad
  monitorSpeed(currentSpeed: number, speedLimit: number = 60): void {
    if (this.settings.speed && currentSpeed > speedLimit) {
      // Evitar spam de alertas - solo una alerta cada 30 segundos
      const lastSpeedAlert = this.alerts.find(a => 
        a.title.includes('Exceso de velocidad') && 
        (Date.now() - a.timestamp) < 30000
      );
      
      if (!lastSpeedAlert) {
        this.triggerSpeedAlert(currentSpeed, speedLimit);
      }
    }
  }

  // Simulación de eventos para pruebas
  simulateRandomAlert(): Alert {
    const types: ('critical' | 'warning' | 'info')[] = ['critical', 'warning', 'info'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const alerts = {
      critical: [
        { title: 'Movimiento no autorizado', message: 'El vehículo ha sido movido sin autorización' },
        { title: 'Intento de manipulación', message: 'Se detectó interferencia con el sistema GPS' },
        { title: 'Emergencia activada', message: 'Botón de pánico activado manualmente' }
      ],
      warning: [
        { title: 'Exceso de velocidad', message: 'Velocidad detectada: 85 km/h en zona de 60 km/h' },
        { title: 'Zona de seguridad', message: 'El vehículo ha salido de la zona "Casa"' },
        { title: 'Batería baja', message: 'La batería del dispositivo está por debajo del 20%' }
      ],
      info: [
        { title: 'Llegada a destino', message: 'El vehículo ha llegado a "Trabajo"' },
        { title: 'Viaje iniciado', message: 'El seguimiento GPS ha comenzado' },
        { title: 'Sistema actualizado', message: 'Configuración sincronizada correctamente' }
      ]
    };
    
    const randomAlerts = alerts[randomType];
    const randomAlert = randomAlerts[Math.floor(Math.random() * randomAlerts.length)];
    
    return this.createAlert(randomType, randomAlert.title, randomAlert.message);
  }
}