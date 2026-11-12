import { JsendErroresValidacion, JsendResponse } from './jsend';

export type CodigoErrorHttp = 400 | 401 | 403 | 404 | 500;

export type TipoError =
  | 'VALIDACION'
  | 'REGLA_NEGOCIO'
  | 'NO_AUTORIZADO'
  | 'ACCESO_DENEGADO'
  | 'NO_ENCONTRADO'
  | 'ERROR_SERVIDOR'
  | 'CONEXION';

/** Representación normalizada de errores HTTP y JSend del backend. */
export interface ErrorHttp {
  statusHttp: number;
  tipo: TipoError;
  mensaje: string;
  erroresCampo?: JsendErroresValidacion;
}

/** Extrae un ErrorHttp estructurado a partir de un status HTTP y un cuerpo JSend opcional. */
export function normalizarError(
  statusHttp: number,
  body?: Partial<JsendResponse<unknown>> | null,
): ErrorHttp {
  const mensajeDefecto = obtenerMensajePorDefecto(statusHttp);
  const mensaje = body?.message?.trim() || mensajeDefecto;

  if (statusHttp === 0) {
    return {
      statusHttp,
      tipo: 'CONEXION',
      mensaje: 'No se pudo conectar con el servidor de Fast Work',
    };
  }

  if (statusHttp === 400) {
    const esValidacion = esMapaErroresCampo(body?.data);
    return {
      statusHttp,
      tipo: esValidacion ? 'VALIDACION' : 'REGLA_NEGOCIO',
      mensaje,
      erroresCampo: esValidacion ? (body!.data as JsendErroresValidacion) : undefined,
    };
  }

  if (statusHttp === 401) return { statusHttp, tipo: 'NO_AUTORIZADO', mensaje };
  if (statusHttp === 403) return { statusHttp, tipo: 'ACCESO_DENEGADO', mensaje };
  if (statusHttp === 404) return { statusHttp, tipo: 'NO_ENCONTRADO', mensaje };

  return { statusHttp, tipo: 'ERROR_SERVIDOR', mensaje };
}

function esMapaErroresCampo(data: unknown): data is JsendErroresValidacion {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  return Object.values(data).every((valor) => typeof valor === 'string');
}

function obtenerMensajePorDefecto(statusHttp: number): string {
  switch (statusHttp) {
    case 400:
      return 'La solicitud contiene datos inválidos';
    case 401:
      return 'No autorizado: debe iniciar sesión con un token válido';
    case 403:
      return 'Acceso denegado: no cuenta con permisos suficientes';
    case 404:
      return 'Recurso no encontrado';
    default:
      return 'Ocurrió un error inesperado en el servidor';
  }
}
