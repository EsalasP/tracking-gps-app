import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class GpsService {
  private watchId: string | null = null;
  private currentPosition: GPSPosition | null = null;
  private positionHistory: GPSPosition[] = [];
  
  constructor() { }

  async getCurrentPosition(): Promise<GPSPosition> {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      const position: GPSPosition = {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
        speed: coordinates.coords.speed,
        heading: coordinates.coords.heading,
        timestamp: coordinates.timestamp
      };
      
      this.currentPosition = position;
      return position;
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      throw error;
    }
  }

  async startTracking(callback: (position: GPSPosition) => void): Promise<void> {
    try {
      this.watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000
      }, (position, err) => {
        if (err) {
          console.error('Error en tracking:', err);
          return;
        }
        
        if (position) {
          const gpsPosition: GPSPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp
          };
          
          this.currentPosition = gpsPosition;
          this.positionHistory.push(gpsPosition);
          
          // Mantener solo las últimas 100 posiciones
          if (this.positionHistory.length > 100) {
            this.positionHistory.shift();
          }
          
          callback(gpsPosition);
        }
      });
    } catch (error) {
      console.error('Error iniciando tracking:', error);
      throw error;
    }
  }

  async stopTracking(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }

  getPositionHistory(): GPSPosition[] {
    return [...this.positionHistory];
  }

  getCurrentPositionSync(): GPSPosition | null {
    return this.currentPosition;
  }

  calculateDistance(pos1: GPSPosition, pos2: GPSPosition): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distancia en km
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    }
  }
}