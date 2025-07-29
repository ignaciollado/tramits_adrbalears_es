

export interface PindustLineaAyudaDTO {
  id?: number;
  codigoSIA: string;
  convocatoria: number;
  num_BOIB: string;
  fecha_BOIB: string;
  num_BOIB_modific: string;
  fechaResPresidIDI?: string;
  lineaAyuda: string;
  programa: string;
  convocatoria_desde: string;
  convocatoria_hasta: string;
  dias_fecha_lim_justificar: number;
  meses_fecha_lim_consultoria: string;
  updateInterval: number;
  convocatoria_aviso_ca: string;
  convocatoria_aviso_es: string;
  activeLineData: string;
  totalAmount: number;
}