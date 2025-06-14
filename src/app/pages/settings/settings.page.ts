import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { 
  save,
  hardwareChip,
  shieldCheckmark,
  location,
  business,
  call,
  settings,
  add,
  personAdd,
  person,
  trash,
  flash,
  refresh,
  sync,
  home
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
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonLabel,
  IonList,
  IonItem,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonToggle
} from '@ionic/angular/standalone';

interface DeviceInfo {
  serialNumber: string;
  firmwareVersion: string;
  isConnected: boolean;
}

interface AntiTheftSettings {
  codeLength: number;
  timeLimit: number;
  reminderInterval: number;
  doorSensorEnabled: boolean;
  ignitionSensorEnabled: boolean;
}

interface GpsSettings {
  updateFrequency: number;
  highAccuracyMode: boolean;
  saveHistory: boolean;
}

interface SecurityZone {
  name: string;
  radius: number;
  enabled: boolean;
  icon: string;
  color: string;
  latitude?: number;
  longitude?: number;
}

interface EmergencyContact {
  name: string;
  phone: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
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
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonLabel,
    IonList,
    IonItem,
    IonBadge,
    IonSelect,
    IonSelectOption,
    IonToggle,
    CommonModule, 
    FormsModule
  ]
})
export class SettingsPage implements OnInit {
  deviceInfo: DeviceInfo = {
    serialNumber: 'AGP-2024-001234',
    firmwareVersion: '2.1.3',
    isConnected: true
  };

  antiTheftSettings: AntiTheftSettings = {
    codeLength: 2,
    timeLimit: 120,
    reminderInterval: 10,
    doorSensorEnabled: true,
    ignitionSensorEnabled: true
  };

  gpsSettings: GpsSettings = {
    updateFrequency: 30,
    highAccuracyMode: true,
    saveHistory: true
  };

  securityZones: SecurityZone[] = [
    {
      name: 'Casa',
      radius: 100,
      enabled: true,
      icon: 'home',
      color: 'success',
      latitude: -33.4489,
      longitude: -70.6693
    },
    {
      name: 'Trabajo',
      radius: 200,
      enabled: true,
      icon: 'business',
      color: 'primary',
      latitude: -33.4372,
      longitude: -70.6506
    },
    {
      name: 'Taller Mecánico',
      radius: 50,
      enabled: false,
      icon: 'construct',
      color: 'warning',
      latitude: -33.4696,
      longitude: -70.6419
    }
  ];

  emergencyContacts: EmergencyContact[] = [
    {
      name: 'Familia - Erik',
      phone: '+56 9 5419 8768'
    },
    {
      name: 'Trabajo - Seguridad',
      phone: '+56 2 2234 5678'
    }
  ];

  constructor() {
    addIcons({
      save,
      'hardware-chip': hardwareChip,
      'shield-checkmark': shieldCheckmark,
      location,
      business,
      call,
      settings,
      add,
      'person-add': personAdd,
      person,
      trash,
      flash,
      refresh,
      sync,
      home
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    // Aquí cargaríamos las configuraciones desde el almacenamiento local
    console.log('Configuraciones cargadas');
  }

  saveAllSettings() {
    const allSettings = {
      deviceInfo: this.deviceInfo,
      antiTheft: this.antiTheftSettings,
      gps: this.gpsSettings,
      zones: this.securityZones,
      contacts: this.emergencyContacts
    };
    
    console.log('Guardando todas las configuraciones:', allSettings);
    
    // Aquí implementaríamos el guardado real
    // localStorage.setItem('appSettings', JSON.stringify(allSettings));
    
    // Simular sincronización con el dispositivo
    this.showSaveConfirmation();
  }

  showSaveConfirmation() {
    console.log('Configuraciones guardadas exitosamente');
    // Aquí mostraríamos un toast o alerta de confirmación
  }

  addNewZone() {
    const newZone: SecurityZone = {
      name: `Nueva Zona ${this.securityZones.length + 1}`,
      radius: 100,
      enabled: false,
      icon: 'location',
      color: 'medium'
    };
    
    this.securityZones.push(newZone);
    console.log('Nueva zona agregada:', newZone);
  }

  addEmergencyContact() {
    const newContact: EmergencyContact = {
      name: 'Nuevo Contacto',
      phone: '+56 9 0000 0000'
    };
    
    this.emergencyContacts.push(newContact);
    console.log('Nuevo contacto agregado:', newContact);
  }

  removeContact(index: number) {
    if (index >= 0 && index < this.emergencyContacts.length) {
      const removedContact = this.emergencyContacts.splice(index, 1)[0];
      console.log('Contacto eliminado:', removedContact);
    }
  }

  testSystem() {
    console.log('Iniciando prueba del sistema...');
    
    // Simular prueba del sistema
    const testResults = {
      gps: true,
      gsm: true,
      antiTheft: true,
      sensors: true
    };
    
    console.log('Resultados de la prueba:', testResults);
    // Aquí mostraríamos los resultados al usuario
  }

  resetSettings() {
    console.log('Restableciendo configuraciones a valores por defecto...');
    
    this.antiTheftSettings = {
      codeLength: 2,
      timeLimit: 120,
      reminderInterval: 10,
      doorSensorEnabled: true,
      ignitionSensorEnabled: true
    };
    
    this.gpsSettings = {
      updateFrequency: 30,
      highAccuracyMode: true,
      saveHistory: true
    };
    
    console.log('Configuraciones restablecidas');
  }

  syncWithDevice() {
    console.log('Sincronizando con dispositivo...');
    
    // Simular sincronización
    setTimeout(() => {
      this.deviceInfo.isConnected = true;
      console.log('Sincronización completada');
      // Aquí mostraríamos confirmación al usuario
    }, 2000);
  }

  // Métodos auxiliares para validación
  validateSettings(): boolean {
    if (this.antiTheftSettings.codeLength < 1 || this.antiTheftSettings.codeLength > 5) {
      console.error('Longitud de código inválida');
      return false;
    }
    
    if (this.antiTheftSettings.timeLimit < 60 || this.antiTheftSettings.timeLimit > 300) {
      console.error('Tiempo límite inválido');
      return false;
    }
    
    return true;
  }

  getSettingsSummary() {
    return {
      antiTheftEnabled: this.antiTheftSettings.doorSensorEnabled || this.antiTheftSettings.ignitionSensorEnabled,
      gpsEnabled: this.gpsSettings.updateFrequency > 0,
      zonesCount: this.securityZones.filter(zone => zone.enabled).length,
      contactsCount: this.emergencyContacts.length
    };
  }
}