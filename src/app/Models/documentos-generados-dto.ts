export interface DocumentoGeneradoDTO {
  id?: number;
  id_sol: number;
  cifnif_propietario: string;
  convocatoria: string;
  name: string;
  type: string;
  created_at: string;
  tipo_tramite: string;
  corresponde_documento: string;
  selloDeTiempo: string;
  publicAccessId: string;
  datetime_uploaded?: string;
}