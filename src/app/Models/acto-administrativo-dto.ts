export interface ActoAdministrativoDTO {
  id?: number;
  denominacion: string;
  tipo_tramite: string;
  texto: string;
  texto_es: string;
  signedBy: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}