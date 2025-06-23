export class ActividadCnaeDTO {
    id: number;
    cnae: string;
    label: string;
    label_cas: string;
    created_at: Date;
    updated_at?: Date;
    deleted_at?: Date;

    constructor(
        id: number,
        cnae: string,
        label: string,
        label_cas: string,
        created_at: Date,
        updated_at?: Date,
        deleted_at?: Date
    ) {
        this.id = id;
        this.cnae = cnae;
        this.label = label;
        this.label_cas = label_cas;
        this.created_at = created_at
        this.updated_at = updated_at
        this.deleted_at = deleted_at
    }
}