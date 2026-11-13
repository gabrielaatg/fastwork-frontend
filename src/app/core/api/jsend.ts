export type JsendStatus = 'success' | 'fail' | 'error';

/** Envoltorio estándar de respuestas REST de Fast Work (`Jsend.java`). */
export interface JsendResponse<T = void> {
  status: JsendStatus;
  message?: string;
  data?: T;
  code?: number;
}

/** Mapa campo -> mensaje devuelto por Bean Validation (`@Valid`, HTTP 400). */
export type JsendErroresValidacion = Record<string, string>;

/** Extrae `data` de una respuesta JSend exitosa; lanza error si `data` viene ausente. */
export function extraerData<T>(respuesta: JsendResponse<T>): T {
  if (respuesta.data === undefined) {
    throw new Error(respuesta.message || 'Respuesta JSend sin campo data');
  }
  return respuesta.data;
}
