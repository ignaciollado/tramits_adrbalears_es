export interface CreateSignatureRequest {
  adreca_mail?: string;
  telefono_cont?: string;   // solo números, sin +34
  nombreDocumento: string; // ej. "contrato.pdf"
  nif: string;             // ej. "12345678A"
  last_insert_id?: number;
}

export interface SignatureResponse {
  publicAccessId?: string;
  addresseeLines?: any[];
  documentsToSign?: { filename: string }[];
  sendDate?: number; // epoch ms
  // Puedes extender con el resto de campos devueltos por la API externa
}

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}
