import { Injectable } from '@angular/core';
import * as L from 'leaflet';

// Fix para iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface MapOptions {
  center: [number, number];
  zoom: number;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map!: L.Map;
  private vehicleMarker!: L.Marker;
  private routePolyline!: L.Polyline;
  private routePoints: L.LatLng[] = [];
  
  // NUEVA FUNCIONALIDAD: Auto-seguimiento
  private autoFollow: boolean = true;
  private lastAutoFollowTime: number = 0;
  private userInteractionTime: number = 0;
  private readonly AUTO_FOLLOW_DELAY = 3000; // 3 segundos después de interacción del usuario

  constructor() { }

  initMap(containerId: string, options: MapOptions): L.Map {
    // Inicializar mapa
    this.map = L.map(containerId, {
      center: options.center,
      zoom: options.zoom,
      zoomControl: true,
      attributionControl: true
    });

    // Añadir capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Crear marcador del vehículo
    this.createVehicleMarker(options.center);

    // Crear línea de ruta
    this.createRoutePolyline();

    // NUEVO: Detectar interacciones del usuario para pausar auto-seguimiento temporalmente
    this.setupUserInteractionDetection();

    return this.map;
  }

  private createVehicleMarker(position: [number, number]): void {
    // Crear ícono personalizado para el vehículo con animación
    const vehicleIcon = L.divIcon({
      className: 'vehicle-marker-icon',
      html: `
        <div style="
          background: linear-gradient(45deg, #dc3545, #ff6b6b);
          border: 3px solid white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
          position: relative;
        ">
          🚗
          <div style="
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border: 2px solid rgba(220, 53, 69, 0.3);
            border-radius: 50%;
            animation: trackingPulse 2s infinite;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.vehicleMarker = L.marker(position, { 
      icon: vehicleIcon,
      title: 'Ubicación del vehículo - Seguimiento activo'
    }).addTo(this.map);

    this.vehicleMarker.bindPopup(`
      <div style="min-width: 200px;">
        <b>🚗 Vehículo en tiempo real</b><br>
        <small>Seguimiento GPS activo</small>
      </div>
    `);
  }

  private createRoutePolyline(): void {
    this.routePolyline = L.polyline([], {
      color: '#007bff',
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1,
      dashArray: '5, 10'
    }).addTo(this.map);
  }

  // NUEVO: Configurar detección de interacciones del usuario
  private setupUserInteractionDetection(): void {
    const updateUserInteraction = () => {
      this.userInteractionTime = Date.now();
    };

    // Detectar cuando el usuario interactúa con el mapa
    this.map.on('dragstart', updateUserInteraction);
    this.map.on('zoomstart', updateUserInteraction);
    this.map.on('click', updateUserInteraction);
  }

  // MEJORADO: Actualizar posición con auto-seguimiento inteligente
  updateVehiclePosition(lat: number, lng: number, info?: any): void {
    if (!this.map || !this.vehicleMarker) return;

    const newPosition = new L.LatLng(lat, lng);
    
    // Actualizar marcador del vehículo con animación suave
    this.vehicleMarker.setLatLng(newPosition);
    
    // Actualizar popup con información en tiempo real
    const popupContent = `
      <div style="min-width: 220px;">
        <b>🚗 Vehículo en movimiento</b><br>
        <small><b>Coordenadas:</b> ${lat.toFixed(6)}, ${lng.toFixed(6)}</small><br>
        ${info?.speed !== undefined ? `<small><b>Velocidad:</b> ${info.speed} km/h</small><br>` : ''}
        ${info?.accuracy ? `<small><b>Precisión:</b> ±${info.accuracy}m</small><br>` : ''}
        ${info?.heading !== null && info?.heading !== undefined ? `<small><b>Dirección:</b> ${info.heading}°</small><br>` : ''}
        <small><b>Última actualización:</b> ${new Date().toLocaleTimeString('es-CL')}</small><br>
        <small style="color: #28a745;"><b>🟢 GPS en vivo</b></small>
      </div>
    `;
    this.vehicleMarker.bindPopup(popupContent);

    // Añadir punto a la ruta
    this.addRoutePoint(newPosition);

    // NUEVO: Auto-seguimiento inteligente
    this.performIntelligentAutoFollow(newPosition);
  }

  // NUEVO: Auto-seguimiento inteligente que respeta las interacciones del usuario
  private performIntelligentAutoFollow(position: L.LatLng): void {
    if (!this.autoFollow) return;

    const now = Date.now();
    const timeSinceUserInteraction = now - this.userInteractionTime;

    // Si el usuario interactuó recientemente, no hacer auto-seguimiento
    if (timeSinceUserInteraction < this.AUTO_FOLLOW_DELAY) {
      return;
    }

    // Verificar si el vehículo está fuera del área visible del mapa
    const bounds = this.map.getBounds();
    const isVehicleVisible = bounds.contains(position);

    if (!isVehicleVisible || timeSinceUserInteraction > this.AUTO_FOLLOW_DELAY * 2) {
      // Centrar suavemente en el vehículo
      this.map.flyTo(position, this.map.getZoom(), {
        animate: true,
        duration: 1.5,
        easeLinearity: 0.3
      });
      
      this.lastAutoFollowTime = now;
    }
  }

  private addRoutePoint(point: L.LatLng): void {
    this.routePoints.push(point);
    
    // Mantener solo los últimos 100 puntos para rendimiento
    if (this.routePoints.length > 100) {
      this.routePoints.shift();
    }
    
    // Actualizar polyline con animación
    this.routePolyline.setLatLngs(this.routePoints);
  }

  // MEJORADO: Centrar en vehículo manualmente
  centerMapOnVehicle(): void {
    if (this.vehicleMarker) {
      const position = this.vehicleMarker.getLatLng();
      this.map.flyTo(position, Math.max(16, this.map.getZoom()), {
        animate: true,
        duration: 1.0
      });
      
      // Resetear el tiempo de interacción para evitar conflictos
      this.userInteractionTime = Date.now();
    }
  }

  // NUEVO: Control de auto-seguimiento
  setAutoFollow(enabled: boolean): void {
    this.autoFollow = enabled;
    console.log(`Auto-seguimiento ${enabled ? 'activado' : 'desactivado'}`);
  }

  getAutoFollow(): boolean {
    return this.autoFollow;
  }

  // NUEVO: Forzar seguimiento inmediato
  forceFollowVehicle(): void {
    if (this.vehicleMarker) {
      const position = this.vehicleMarker.getLatLng();
      this.map.flyTo(position, Math.max(16, this.map.getZoom()), {
        animate: true,
        duration: 0.8
      });
    }
  }

  setMapView(lat: number, lng: number, zoom: number = 15): void {
    this.map.flyTo([lat, lng], zoom, { 
      animate: true, 
      duration: 1.0 
    });
    
    // Marcar como interacción del usuario
    this.userInteractionTime = Date.now();
  }

  addGeofenceZone(lat: number, lng: number, radius: number, name: string, color: string = '#28a745'): void {
    const circle = L.circle([lat, lng], {
      color: color,
      fillColor: color,
      fillOpacity: 0.2,
      radius: radius * 1000, // Convertir km a metros
      weight: 2,
      dashArray: '5, 5'
    }).addTo(this.map);

    circle.bindPopup(`
      <div style="min-width: 180px;">
        <b>🛡️ ${name}</b><br>
        <small>Zona de seguridad GPS</small><br>
        <small><b>Radio:</b> ${radius} km</small><br>
        <small><b>Estado:</b> <span style="color: ${color};">Activa</span></small>
      </div>
    `);
  }

  clearRoute(): void {
    this.routePoints = [];
    this.routePolyline.setLatLngs([]);
  }

  // NUEVO: Obtener estadísticas del seguimiento
  getTrackingStats(): any {
    return {
      routePoints: this.routePoints.length,
      autoFollow: this.autoFollow,
      lastAutoFollow: this.lastAutoFollowTime,
      userInteractionTime: this.userInteractionTime
    };
  }

  getMap(): L.Map {
    return this.map;
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}