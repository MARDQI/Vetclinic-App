export enum UserRole {
  ADMIN = 'ADMIN',
  VETERINARIO = 'VETERINARIO',
  RECEPCIONISTA = 'RECEPCIONISTA',
  CLIENTE = 'CLIENTE'
}

export enum PetSex {
  MACHO = 'MACHO',
  HEMBRA = 'HEMBRA',
  DESCONOCIDO = 'DESCONOCIDO'
}

export enum AppointmentStatus {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA'
}

export interface User {
  id: string;
  nombre: string;
  first_name: string;
  last_name: string;
  email: string;
  telefono: string;
  rol: UserRole;
  especialidad?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  direccion?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface Mascota {
  id: string;
  nombre: string;
  especie: string;
  raza?: string;
  fecha_nacimiento?: string;
  sexo: PetSex;
  propietario: string;
  propietario_nombre?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface Cita {
  id: string;
  cliente: string;
  cliente_nombre?: string;
  mascota: string;
  mascota_nombre?: string;
  veterinario: string;
  veterinario_nombre?: string;
  motivo: string;
  fecha_programada: string;
  estado: AppointmentStatus;
  notas?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface RegistroMedico {
  id: string;
  mascota: string;
  mascota_nombre?: string;
  veterinario: string;
  veterinario_nombre?: string;
  sintomas: string;
  diagnostico: string;
  tratamiento: string;
  medicamentos?: string;
  fecha_seguimiento?: string;
  creado_en: string;
  actualizado_en: string;
}

export interface Vacuna {
  id: string;
  mascota: string;
  mascota_nombre?: string;
  nombre: string;
  fecha_administracion: string;
  proxima_fecha?: string;
  notas?: string;
  creado_en: string;
}

export interface ArticuloInventario {
  id: string;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  nivel_reorden: number;
  precio?: number;
  creado_en: string;
  actualizado_en: string;
}
