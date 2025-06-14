import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { 
  play, 
  pause, 
  map, 
  car, 
  location, 
  speedometer, 
  trailSign, 
  time, 
  locate, 
  share, 
  archive, 
  home, 
  business, 
  settings,
  refresh,
  checkmarkCircle,
  closeCircle,
  layers, 
  addCircle, 
  list 
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
  IonToast,
  IonAlert
} from '@ionic/angular/standalone';
import { GpsService } from '../../services/gps.service';
import { NotificationsService } from '../../services/notifications.service';
import { MapService } from '../../services/map.service';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

interface GeofenceZone {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  color: string;
  enabled: boolean;
}

@Component({
  selector: 'app-tracking',
  templateUrl: './tracking.page.html',
  styleUrls: ['./tracking.page.scss'],
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
export class TrackingPage implements OnInit, OnDestroy, AfterViewInit {
  // Propiedades principales
  isTracking: boolean = false;
  currentLocation: string = 'Obteniendo ubicación...';
  lastUpdate: string = '';
  currentSpeed: number = 0;
  distanceTraveled: number = 0;
  travelTime: string = '00:00';
  accuracy: number = 0;
  
  // GPS real
  currentPosition: GPSPosition | null = null;
  
  // Control de tiempo
  private startTime: Date = new Date();
  private updateInterval: any;
  
  // Control de toast
  isToastOpen = false;
  toastMessage = '';
  toastColor = 'primary';

  // Propiedades para alertas automáticas
  private lastAlertTime: number = 0;
  private speedLimit: number = 60;
  private previousPosition: GPSPosition | null = null;
  private isFirstPosition: boolean = true;
  private lastGeofenceCheck: number = 0;

  // Propiedades del mapa
  private mapInitialized: boolean = false;
  private mapContainer: string = 'map';

  // Gestión de zonas
  geofenceZones: GeofenceZone[] = [
    {
      id: 1,
      name: 'Casa',
      latitude: -33.4281,
      longitude: -70.6862,
      radius: 0.1,
      color: '#28a745',
      enabled: true
    },
    {
      id: 2,
      name: 'Trabajo',
      latitude: -33.5695,
      longitude: -70.8131,
      radius: 0.2,
      color: '#007bff',
      enabled: true
    },
    {
      id: 3,
      name: 'Taller Mecánico',
      latitude: -33.4696,
      longitude: -70.6419,
      radius: 0.05,
      color: '#ffc107',
      enabled: false
    }
  ];

  // Control de modals/alerts
  isZoneAlertOpen = false;
  zoneAlertHeader = '';
  zoneAlertMessage = '';
  zoneAlertButtons: any[] = [];

  constructor(
    private gpsService: GpsService,
    private notificationsService: NotificationsService,
    private mapService: MapService
  ) {
    addIcons({
      map,
      refresh,
      locate,
      layers,
      location,
      speedometer,
      trailSign,
      time,
      share,
      archive,
      settings,
      addCircle,
      list,
      play,
      pause,
      car,
      home,
      business,
      checkmarkCircle,
      closeCircle
    });
  }

  async ngOnInit() {
    await this.checkGPSPermissions();
    await this.getCurrentLocation();
    this.updateLocationInfo();
  }

  ngAfterViewInit() {
    // El mapa se inicializará cuando tengamos la primera posición GPS
  }

  ngOnDestroy() {
    this.stopTracking();
    
    // Limpiar mapa
    if (this.mapInitialized) {
      this.mapService.destroy();
    }
  }

  // MÉTODOS DE GPS Y PERMISOS
  async checkGPSPermissions(): Promise<void> {
    try {
      const hasPermission = await this.gpsService.checkPermissions();
      
      if (!hasPermission) {
        this.showToast('Solicitando permisos de ubicación...', 'warning');
        const granted = await this.gpsService.requestPermissions();
        
        if (!granted) {
          this.showToast('Se necesitan permisos de ubicación para el seguimiento GPS', 'danger');
          return;
        }
      }
      
      this.showToast('GPS listo para usar', 'success');
    } catch (error) {
      console.error('Error con permisos GPS:', error);
      this.showToast('Error al configurar GPS', 'danger');
    }
  }

  async getCurrentLocation(): Promise<void> {
    try {
      this.currentLocation = 'Obteniendo ubicación...';
      const position = await this.gpsService.getCurrentPosition();
      this.currentPosition = position;
      
      // Convertir coordenadas a dirección (simulado)
      this.currentLocation = await this.coordinatesToAddress(position.latitude, position.longitude);
      this.accuracy = Math.round(position.accuracy);
      
      this.showToast('Ubicación obtenida exitosamente', 'success');
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      this.currentLocation = 'Error obteniendo ubicación';
      this.showToast('No se pudo obtener la ubicación', 'danger');
    }
  }

  // MÉTODOS DE TRACKING
  async startTracking(): Promise<void> {
    try {
      this.isTracking = true;
      this.startTime = new Date();
      this.distanceTraveled = 0;
      this.isFirstPosition = true;
      
      this.showToast('Iniciando seguimiento GPS...', 'primary');
      
      await this.gpsService.startTracking((position: GPSPosition) => {
        this.handleNewPosition(position);
      });
      
      // Actualizar información cada segundo
      this.updateInterval = setInterval(() => {
        this.updateLocationInfo();
      }, 1000);
      
    } catch (error) {
      console.error('Error iniciando tracking:', error);
      this.showToast('Error iniciando seguimiento', 'danger');
      this.isTracking = false;
    }
  }

  async stopTracking(): Promise<void> {
    this.isTracking = false;
    
    try {
      await this.gpsService.stopTracking();
      
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      
      this.showToast('Seguimiento detenido', 'medium');
    } catch (error) {
      console.error('Error deteniendo tracking:', error);
    }
  }

  async toggleTracking(): Promise<void> {
    if (this.isTracking) {
      await this.stopTracking();
    } else {
      await this.startTracking();
    }
  }

  handleNewPosition(position: GPSPosition): void {
    const previousPosition = this.currentPosition;
    this.currentPosition = position;
    
    // Inicializar mapa en la primera posición
    if (!this.mapInitialized) {
      setTimeout(() => {
        this.initializeMap();
      }, 100);
    }
    
    // Actualizar posición en el mapa
    if (this.mapInitialized) {
      this.mapService.updateVehiclePosition(
        position.latitude, 
        position.longitude, 
        {
          speed: this.currentSpeed,
          accuracy: this.accuracy,
          heading: position.heading
        }
      );
    }
    
    // Actualizar ubicación
    this.coordinatesToAddress(position.latitude, position.longitude)
      .then(address => {
        this.currentLocation = address;
      });
    
    // Calcular velocidad (convertir de m/s a km/h)
    if (position.speed !== null && position.speed !== undefined) {
      this.currentSpeed = Math.round(position.speed * 3.6);
      this.checkSpeedLimit(this.currentSpeed);
    }
    
    // Calcular distancia recorrida
    if (previousPosition) {
      const distance = this.gpsService.calculateDistance(previousPosition, position);
      this.distanceTraveled += distance;
      this.distanceTraveled = Math.round(this.distanceTraveled * 100) / 100;
      this.checkUnauthorizedMovement(distance);
    }
    
    // Actualizar precisión
    this.accuracy = Math.round(position.accuracy);
    this.checkGPSQuality();
    
    // Verificar zonas de seguridad
    const now = Date.now();
    if ((now - this.lastGeofenceCheck) > 30000) {
      this.checkGeofencing();
      this.lastGeofenceCheck = now;
    }
    
    this.previousPosition = position;
    this.isFirstPosition = false;
  }

  updateLocationInfo(): void {
    const now = new Date();
    this.lastUpdate = now.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Calcular tiempo de viaje
    const timeDiff = now.getTime() - this.startTime.getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    this.travelTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  async coordinatesToAddress(lat: number, lng: number): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const addresses = [
          `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
          `${lat.toFixed(4)}°, ${lng.toFixed(4)}° - Santiago, Chile`,
        ];
        resolve(addresses[Math.floor(Math.random() * addresses.length)]);
      }, 1000);
    });
  }

  // MÉTODOS DE MAPA
  private initializeMap(): void {
    if (!this.currentPosition || this.mapInitialized) return;

    try {
      this.mapService.initMap(this.mapContainer, {
        center: [this.currentPosition.latitude, this.currentPosition.longitude],
        zoom: 15
      });

      this.addGeofenceZones();
      
      this.mapInitialized = true;
      this.showToast('Mapa inicializado', 'success');
    } catch (error) {
      console.error('Error inicializando mapa:', error);
      this.showToast('Error inicializando mapa', 'danger');
    }
  }

  private addGeofenceZones(): void {
    this.geofenceZones.forEach(zone => {
      if (zone.enabled) {
        this.mapService.addGeofenceZone(
          zone.latitude,
          zone.longitude,
          zone.radius,
          zone.name,
          zone.color
        );
      }
    });
  }

  async centerMap(): Promise<void> {
    if (this.currentPosition) {
      this.showToast(`Centrando en: ${this.currentPosition.latitude.toFixed(4)}, ${this.currentPosition.longitude.toFixed(4)}`, 'primary');
    } else {
      await this.getCurrentLocation();
    }
  }

  centerMapOnVehicle(): void {
    if (this.mapInitialized) {
      this.mapService.centerMapOnVehicle();
      this.showToast('Mapa centrado en vehículo', 'primary');
    }
  }

  toggleMapLayer(): void {
    this.showToast('Cambio de capa - Función en desarrollo', 'medium');
  }

  // MÉTODOS DE COMPARTIR Y HISTORIAL
  shareLocation(): void {
    if (this.currentPosition) {
      const coords = `${this.currentPosition.latitude},${this.currentPosition.longitude}`;
      const mapsUrl = `https://maps.google.com/?q=${coords}`;
      
      window.open(mapsUrl, '_blank');
      this.showToast('Ubicación compartida', 'success');
    } else {
      this.showToast('No hay ubicación disponible para compartir', 'warning');
    }
  }

  viewHistory(): void {
    const history = this.gpsService.getPositionHistory();
    console.log('Historial de ubicaciones:', history);
    this.showToast(`Historial: ${history.length} ubicaciones guardadas`, 'primary');
  }

  // MÉTODOS DE GESTIÓN DE ZONAS
  manageZones(): void {
    this.showZoneManagementOptions();
  }

  private showZoneManagementOptions(): void {
    this.zoneAlertHeader = 'Gestionar Zonas GPS';
    this.zoneAlertMessage = '¿Qué acción desea realizar?';
    this.zoneAlertButtons = [
      {
        text: 'Ver Zonas',
        handler: () => {
          this.showZonesList();
        }
      },
      {
        text: 'Añadir Zona',
        handler: () => {
          this.addNewZone();
        }
      },
      {
        text: 'Configurar',
        handler: () => {
          this.configureZones();
        }
      },
      {
        text: 'Cancelar',
        role: 'cancel'
      }
    ];
    this.isZoneAlertOpen = true;
  }

  showZonesList(): void {
    const zonesInfo = this.geofenceZones.map(zone => 
      `${zone.name}: ${zone.enabled ? '✅ Activa' : '❌ Inactiva'} (${zone.radius * 1000}m)`
    ).join('\n');

    this.zoneAlertHeader = 'Zonas de Seguridad Configuradas';
    this.zoneAlertMessage = zonesInfo;
    this.zoneAlertButtons = [
      {
        text: 'Gestionar Zonas',
        handler: () => {
          this.showZoneActions();
        }
      },
      {
        text: 'Cerrar',
        role: 'cancel'
      }
    ];
    this.isZoneAlertOpen = true;
  }

  private showZoneActions(): void {
    this.zoneAlertHeader = 'Acciones de Zonas';
    this.zoneAlertMessage = 'Seleccione una acción:';
    this.zoneAlertButtons = [
      {
        text: 'Activar Casa',
        handler: () => {
          this.toggleZone(1, true);
        }
      },
      {
        text: 'Activar Trabajo',
        handler: () => {
          this.toggleZone(2, true);
        }
      },
      {
        text: 'Activar Taller',
        handler: () => {
          this.toggleZone(3, true);
        }
      },
      {
        text: 'Desactivar Todas',
        handler: () => {
          this.disableAllZones();
        }
      },
      {
        text: 'Cancelar',
        role: 'cancel'
      }
    ];
    this.isZoneAlertOpen = true;
  }

  private toggleZone(zoneId: number, enable: boolean): void {
    const zone = this.geofenceZones.find(z => z.id === zoneId);
    if (zone) {
      zone.enabled = enable;
      
      // Actualizar mapa si está inicializado
      if (this.mapInitialized) {
        this.updateMapZones();
      }
      
      const action = enable ? 'activada' : 'desactivada';
      this.showToast(`Zona "${zone.name}" ${action}`, enable ? 'success' : 'medium');
      
      // Generar alerta de configuración
      this.notificationsService.triggerSystemAlert(
        `Zona ${action}`,
        `La zona "${zone.name}" ha sido ${action}`,
        'info'
      );
    }
  }

  private disableAllZones(): void {
    this.geofenceZones.forEach(zone => zone.enabled = false);
    
    if (this.mapInitialized) {
      this.updateMapZones();
    }
    
    this.showToast('Todas las zonas desactivadas', 'warning');
    this.notificationsService.triggerSystemAlert(
      'Zonas desactivadas',
      'Todas las zonas de seguridad han sido desactivadas',
      'warning'
    );
  }

  addNewZone(): void {
    if (this.currentPosition) {
      const newZone: GeofenceZone = {
        id: Date.now(),
        name: `Zona ${this.geofenceZones.length + 1}`,
        latitude: this.currentPosition.latitude,
        longitude: this.currentPosition.longitude,
        radius: 0.1,
        color: '#6f42c1',
        enabled: true
      };
      
      this.geofenceZones.push(newZone);
      
      if (this.mapInitialized) {
        this.updateMapZones();
      }
      
      this.showToast(`Nueva zona "${newZone.name}" creada en ubicación actual`, 'success');
      this.notificationsService.triggerSystemAlert(
        'Nueva zona creada',
        `Se ha creado la zona "${newZone.name}" en su ubicación actual`,
        'info'
      );
    } else {
      this.showToast('No se puede crear zona: ubicación GPS no disponible', 'danger');
    }
  }

  private configureZones(): void {
    this.zoneAlertHeader = 'Configurar Zonas';
    this.zoneAlertMessage = 'Opciones de configuración:';
    this.zoneAlertButtons = [
      {
        text: 'Resetear a Predeterminadas',
        handler: () => {
          this.resetZonesToDefault();
        }
      },
      {
        text: 'Expandir Radios',
        handler: () => {
          this.expandZoneRadii();
        }
      },
      {
        text: 'Reducir Radios',
        handler: () => {
          this.reduceZoneRadii();
        }
      },
      {
        text: 'Eliminar Zonas Personalizadas',
        handler: () => {
          this.removeCustomZones();
        }
      },
      {
        text: 'Cancelar',
        role: 'cancel'
      }
    ];
    this.isZoneAlertOpen = true;
  }

  private resetZonesToDefault(): void {
    this.geofenceZones.forEach(zone => {
      if (zone.id <= 3) { // Zonas predeterminadas
        zone.enabled = zone.id <= 2; // Casa y Trabajo activas
      }
    });
    
    if (this.mapInitialized) {
      this.updateMapZones();
    }
    
    this.showToast('Zonas restablecidas a configuración predeterminada', 'primary');
  }

  private expandZoneRadii(): void {
    this.geofenceZones.forEach(zone => {
      zone.radius = Math.min(zone.radius * 1.5, 1); // Máximo 1km
    });
    
    if (this.mapInitialized) {
      this.updateMapZones();
    }
    
    this.showToast('Radios de zonas expandidos', 'primary');
  }

  private reduceZoneRadii(): void {
    this.geofenceZones.forEach(zone => {
      zone.radius = Math.max(zone.radius * 0.7, 0.05); // Mínimo 50m
    });
    
    if (this.mapInitialized) {
      this.updateMapZones();
    }
    
    this.showToast('Radios de zonas reducidos', 'primary');
  }

  private removeCustomZones(): void {
    const originalLength = this.geofenceZones.length;
    this.geofenceZones = this.geofenceZones.filter(zone => zone.id <= 3);
    const removedCount = originalLength - this.geofenceZones.length;
    
    if (removedCount > 0) {
      if (this.mapInitialized) {
        this.updateMapZones();
      }
      this.showToast(`${removedCount} zona(s) personalizada(s) eliminada(s)`, 'warning');
    } else {
      this.showToast('No hay zonas personalizadas para eliminar', 'medium');
    }
  }

  private updateMapZones(): void {
    // Esta función actualizará las zonas en el mapa
    // Por ahora, solo reiniciamos las zonas del mapa
    if (this.mapInitialized) {
      // Limpiar zonas existentes y añadir las actualizadas
      this.addGeofenceZones();
    }
  }

  // MÉTODOS DE ALERTAS
  private checkSpeedLimit(currentSpeed: number): void {
    const now = Date.now();
    if (currentSpeed > this.speedLimit && (now - this.lastAlertTime) > 30000) {
      this.notificationsService.triggerSpeedAlert(currentSpeed, this.speedLimit);
      this.lastAlertTime = now;
      this.showToast(`¡Exceso de velocidad! ${currentSpeed} km/h`, 'danger');
    }
  }

  private checkUnauthorizedMovement(distance: number): void {
    if (!this.isFirstPosition && distance > 0.1) {
      const now = new Date();
      const isNightTime = now.getHours() < 6 || now.getHours() > 22;
      
      if (isNightTime) {
        this.notificationsService.triggerMovementAlert(this.currentLocation);
        this.showToast('Movimiento detectado en horario inusual', 'warning');
      }
    }
  }

  private checkGPSQuality(): void {
    if (this.accuracy > 100) {
      this.notificationsService.triggerSystemAlert(
        'Señal GPS débil',
        `Precisión GPS baja: ±${this.accuracy}m. Verifique la conexión.`,
        'warning'
      );
    }
  }

  private checkGeofencing(): void {
    if (!this.currentPosition) return;
    
    this.geofenceZones.forEach(zone => {
      if (!zone.enabled) return;
      
      const zonePosition: GPSPosition = {
        latitude: zone.latitude,
        longitude: zone.longitude,
        accuracy: 1,
        speed: null,
        heading: null,
        timestamp: Date.now()
      };
      
      const distance = this.gpsService.calculateDistance(this.currentPosition!, zonePosition);
      
      if (distance <= zone.radius) {
        // Dentro de la zona
        this.notificationsService.triggerGeofenceAlert(zone.name, 'enter');
      } else if (distance > zone.radius && distance < (zone.radius + 0.05)) {
        // Saliendo de la zona (con un buffer de 50m)
        this.notificationsService.triggerGeofenceAlert(zone.name, 'exit');
      }
    });
  }

  changeSpeedLimit(newLimit: number): void {
    this.speedLimit = newLimit;
    this.showToast(`Límite de velocidad actualizado: ${newLimit} km/h`, 'primary');
  }

  testAutomaticAlerts(): void {
    this.checkSpeedLimit(85);
    this.checkGeofencing();
    this.showToast('Prueba de alertas automáticas ejecutada', 'tertiary');
  }

  // MÉTODOS DE CONTROL UI
  private showToast(message: string, color: string): void {
    this.toastMessage = message;
    this.toastColor = color;
    this.isToastOpen = true;
  }

  setToastOpen(isOpen: boolean): void {
    this.isToastOpen = isOpen;
  }

  setZoneAlertOpen(isOpen: boolean): void {
    this.isZoneAlertOpen = isOpen;
  }
}