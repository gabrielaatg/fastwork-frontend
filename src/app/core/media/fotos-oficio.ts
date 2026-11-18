/** Fotos de referencia de técnicos, emparejadas con el nombre del oficio. */
const FOTOS_OFICIO: readonly { clave: RegExp; foto: string }[] = [
  { clave: /gasfit|plomer|sanitari/i, foto: 'img/personas/gasfitero.webp' },
  { clave: /electr/i, foto: 'img/personas/electricista.webp' },
  { clave: /carpint|melamin|mueble/i, foto: 'img/personas/carpintero.webp' },
  { clave: /sold|metal|herrer/i, foto: 'img/personas/soldador.webp' },
  { clave: /alba|constru|obra|drywall/i, foto: 'img/personas/obrero.webp' },
];

/** Devuelve la foto que mejor representa un oficio, o `null` si no hay ninguna. */
export function fotoParaOficio(nombreOficio: string): string | null {
  return FOTOS_OFICIO.find((f) => f.clave.test(nombreOficio))?.foto ?? null;
}

/** Lista de fotos con su patrón, para armar categorías. */
export const CATEGORIAS_CON_FOTO = FOTOS_OFICIO;
