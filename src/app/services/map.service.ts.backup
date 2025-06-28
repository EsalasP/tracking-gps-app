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

    return this.map;
  }

  private createVehicleMarker(position: [number, number]): void {
    // Crear ícono personalizado para el vehículo
    const vehicleIcon = L.divIcon({
      className: 'vehicle-marker-icon',
      html: `
        <div style="
          background: #dc3545;
          border: 3px solid white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
        ">🚗</div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    this.vehicleMarker = L.marker(position, { 
      icon: vehicleIcon,
      title: 'Ubicación del vehículo'
    }).addTo(this.map);

    this.vehicleMarker.bindPopup(`
      <b>🚗 Vehículo</b><br>
      <small>Ubicación actual</small>
    `);
  }

  private createRoutePolyline(): void {
    this.routePolyline = L.polyline([], {
      color: '#007bff',
      weight: 3,
      opacity: 0.7,
      smoothFactor: 1
    }).addTo(this.map);
  }

  updateVehiclePosition(lat: number, lng: number, info?: any): void {
    if (!this.map || !this.vehicleMarker) return;

    const newPosition = new L.LatLng(lat, lng);
    
    // Actualizar marcador del vehículo
    this.vehicleMarker.setLatLng(newPosition);
    
    // Actualizar popup con información
    const popupContent = `
      <div style="min-width: 200px;">
        <b>🚗 Vehículo en movimiento</b><br>
        <small><b>Coordenadas:</b> ${lat.toFixed(6)}, ${lng.toFixed(6)}</small><br>
        ${info?.speed ? `<small><b>Velocidad:</b> ${info.speed} km/h</small><br>` : ''}
        ${info?.accuracy ? `<small><b>Precisión:</b> ±${info.accuracy}m</small><br>` : ''}
        <small><b>Actualizado:</b> ${new Date().toLocaleTimeString('es-CL')}</small>
      </div>
    `;
    this.vehicleMarker.bindPopup(popupContent);

    // Añadir punto a la ruta
    this.addRoutePoint(newPosition);
  }

  private addRoutePoint(point: L.LatLng): void {
    this.routePoints.push(point);
    
    // Mantener solo los últimos 50 puntos para rendimiento
    if (this.routePoints.length > 50) {
      this.routePoints.shift();
    }
    
    // Actualizar polyline
    this.routePolyline.setLatLngs(this.routePoints);
  }

  centerMapOnVehicle(): void {
    if (this.vehicleMarker) {
      const position = this.vehicleMarker.getLatLng();
      this.map.setView(position, 16, { animate: true });
    }
  }

  setMapView(lat: number, lng: number, zoom: number = 15): void {
    this.map.setView([lat, lng], zoom, { animate: true });
  }

  addGeofenceZone(lat: number, lng: number, radius: number, name: string, color: string = '#28a745'): void {
    const circle = L.circle([lat, lng], {
      color: color,
      fillColor: color,
      fillOpacity: 0.2,
      radius: radius * 1000 // Convertir km a metros
    }).addTo(this.map);

    circle.bindPopup(`
      <b>🛡️ ${name}</b><br>
      <small>Zona de seguridad</small><br>
      <small>Radio: ${radius} km</small>
    `);
  }

  clearRoute(): void {
    this.routePoints = [];
    this.routePolyline.setLatLngs([]);
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