import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CabeceraPublica } from '../../core/layout/cabecera-publica/cabecera-publica';
import { Logo } from '../../core/layout/logo/logo';
import { Brillo } from '../../core/motion/brillo';
import { Revelar } from '../../core/motion/revelar';

interface Paso {
  titulo: string;
  texto: string;
  icono: 'publicar' | 'comparar' | 'calificar';
}

const OFICIOS_FILA_A = [
  'Gasfitería',
  'Electricidad',
  'Carpintería',
  'Pintura',
  'Albañilería',
  'Cerrajería',
  'Melamina',
  'Drywall',
] as const;

const OFICIOS_FILA_B = [
  'Soldadura',
  'Refrigeración',
  'Techos y coberturas',
  'Mayólica',
  'Termas',
  'Vidriería',
  'Jardinería',
  'Instalaciones de gas',
] as const;

/** Página de inicio pública de Fast Work con la historia del servicio en movimiento. */
@Component({
  selector: 'app-landing',
  imports: [RouterLink, CabeceraPublica, Logo, Revelar, Brillo],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  /** Se duplica cada fila para que la cinta se desplace sin cortes. */
  protected readonly filaA = [...OFICIOS_FILA_A, ...OFICIOS_FILA_A];
  protected readonly filaB = [...OFICIOS_FILA_B, ...OFICIOS_FILA_B];

  protected readonly pasos: readonly Paso[] = [
    {
      titulo: 'Publica lo que necesitas',
      texto: 'Describe el trabajo, sube fotos del problema y elige tu distrito y presupuesto.',
      icono: 'publicar',
    },
    {
      titulo: 'Compara y contrata',
      texto:
        'Recibe ofertas de técnicos verificados, revisa sus tarifas y conversa antes de decidir.',
      icono: 'comparar',
    },
    {
      titulo: 'Califica el trabajo',
      texto: 'Al terminar, cliente y técnico se califican. Así la reputación es real.',
      icono: 'calificar',
    },
  ];

  protected readonly verificaciones = [
    { titulo: 'DNI validado', texto: 'Verificamos tu documento al crear la cuenta.' },
    { titulo: 'Correo confirmado', texto: 'Con un código de 6 dígitos al registrarse.' },
    {
      titulo: 'Certificado Único Laboral',
      texto: 'Los técnicos suben su CUL y lo validamos antes de mostrarlos como verificados.',
    },
  ] as const;
}
