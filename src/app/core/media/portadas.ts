import { Injectable, signal } from '@angular/core';

export interface Portada {
  id: string;
  url: string;
  nombre: string;
}

/** Portadas disponibles para el perfil de un proveedor. */
export const PORTADAS: readonly Portada[] = [
  { id: 'portada-1', url: 'img/portadas/portada-1.webp', nombre: 'Trazos turquesa' },
  { id: 'portada-2', url: 'img/portadas/portada-2.webp', nombre: 'Ondas azules' },
  { id: 'portada-3', url: 'img/portadas/portada-3.webp', nombre: 'Luz roja' },
  { id: 'portada-4', url: 'img/portadas/portada-4.webp', nombre: 'Rayas nocturnas' },
];

const CLAVE_STORAGE = 'fastwork_portadas';

/**
 * Asigna y recuerda la portada de cada perfil de proveedor.
 *
 * - Si el backend envía una portada conocida, se usa esa.
 * - Si el proveedor eligió una en este navegador, se usa su elección.
 * - Si no, se asigna una "al azar" pero estable a partir del id del perfil,
 *   para que todos vean la misma portada del mismo técnico.
 *
 * Nota: mientras el backend no guarde la portada, la elección del proveedor
 * solo persiste en su navegador (localStorage).
 */
@Injectable({ providedIn: 'root' })
export class Portadas {
  private readonly elegidas = signal<Record<string, string>>(this.leer());

  readonly disponibles = PORTADAS;

  /** Devuelve la portada que corresponde a un perfil. */
  portadaDe(idPerfil: number | null | undefined, desdeServidor?: string | null): Portada {
    const porId = (id: string | null | undefined) => PORTADAS.find((p) => p.id === id);
    const servidor = porId(desdeServidor);
    if (servidor) {
      return servidor;
    }
    if (idPerfil == null) {
      return PORTADAS[0];
    }
    const elegida = porId(this.elegidas()[String(idPerfil)]);
    return elegida ?? PORTADAS[this.indiceEstable(idPerfil)];
  }

  /** Guarda la portada elegida por el proveedor para su perfil. */
  elegir(idPerfil: number, idPortada: string): void {
    if (!PORTADAS.some((p) => p.id === idPortada)) {
      return;
    }
    this.elegidas.update((actual) => ({ ...actual, [String(idPerfil)]: idPortada }));
    try {
      globalThis.localStorage?.setItem(CLAVE_STORAGE, JSON.stringify(this.elegidas()));
    } catch {
      // Si el navegador bloquea el almacenamiento, la elección dura solo esta sesión.
    }
  }

  /** Mezcla el id para repartir las portadas sin que salgan en orden. */
  private indiceEstable(idPerfil: number): number {
    const mezcla = Math.imul(idPerfil ^ 0x5bd1e995, 2654435761) >>> 0;
    return mezcla % PORTADAS.length;
  }

  private leer(): Record<string, string> {
    try {
      const crudo = globalThis.localStorage?.getItem(CLAVE_STORAGE);
      const valor: unknown = crudo ? JSON.parse(crudo) : {};
      return valor && typeof valor === 'object' ? (valor as Record<string, string>) : {};
    } catch {
      return {};
    }
  }
}
