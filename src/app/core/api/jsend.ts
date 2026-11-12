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
