// To parse this data:
//
//   import { Convert, DocSignedDTO } from "./file";
//
//   const docSignedDTO = Convert.toDocSignedDTO(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface DocSignedDTO {
    filename:                       string;
    base64:                         string;
    sender:                         Sender;
    subject:                        string;
    message:                        string;
    publicAccessId:                 string;
    creationDate:                   number;
    sendDate:                       number;
    endDate:                        number;
    verificationAccess:             VerificationAccess;
    senderNotificationLevel:        string;
    notificationUrl:                string;
    callbackName:                   string;
    stampName:                      string;
    status:                         string;
    addresseeLines:                 AddresseeLine[];
    internalNotification:           any[];
    metadatas:                      any[];
    documentsToSign:                DocumentsToSign[];
    comments:                       any[];
    disableInboxEmailNotifications: boolean;
}

export interface AddresseeLine {
    addresseeGroups: AddresseeGroup[];
}

export interface AddresseeGroup {
    isOrGroup:    boolean;
    userEntities: UserEntity[];
}

export interface UserEntity {
    userCode:        string;
    entityCode:      string;
    action:          string;
    status:          string;
    actionInfo:      ActionInfo;
    externalSignUrl: string;
}

export interface ActionInfo {
    userCode: string;
    date:     number;
}

export interface DocumentsToSign {
    filename:       string;
    publicAccessId: string;
    signatureId:    string;
    stampPositions: any[];
}

export interface Sender {
    userCode:   string;
    entityCode: string;
}

export interface VerificationAccess {
    type: string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toDocSignedDTO(json: string): DocSignedDTO {
        return cast(JSON.parse(json), r("DocSignedDTO"));
    }

    public static docSignedDTOToJson(value: DocSignedDTO): string {
        return JSON.stringify(uncast(value, r("DocSignedDTO")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "DocSignedDTO": o([
        { json: "sender", js: "sender", typ: r("Sender") },
        { json: "subject", js: "subject", typ: "" },
        { json: "message", js: "message", typ: "" },
        { json: "publicAccessId", js: "publicAccessId", typ: "" },
        { json: "creationDate", js: "creationDate", typ: 0 },
        { json: "sendDate", js: "sendDate", typ: 0 },
        { json: "endDate", js: "endDate", typ: 0 },
        { json: "verificationAccess", js: "verificationAccess", typ: r("VerificationAccess") },
        { json: "senderNotificationLevel", js: "senderNotificationLevel", typ: "" },
        { json: "notificationUrl", js: "notificationUrl", typ: "" },
        { json: "callbackName", js: "callbackName", typ: "" },
        { json: "stampName", js: "stampName", typ: "" },
        { json: "status", js: "status", typ: "" },
        { json: "addresseeLines", js: "addresseeLines", typ: a(r("AddresseeLine")) },
        { json: "internalNotification", js: "internalNotification", typ: a("any") },
        { json: "metadatas", js: "metadatas", typ: a("any") },
        { json: "documentsToSign", js: "documentsToSign", typ: a(r("DocumentsToSign")) },
        { json: "comments", js: "comments", typ: a("any") },
        { json: "disableInboxEmailNotifications", js: "disableInboxEmailNotifications", typ: true },
    ], false),
    "AddresseeLine": o([
        { json: "addresseeGroups", js: "addresseeGroups", typ: a(r("AddresseeGroup")) },
    ], false),
    "AddresseeGroup": o([
        { json: "isOrGroup", js: "isOrGroup", typ: true },
        { json: "userEntities", js: "userEntities", typ: a(r("UserEntity")) },
    ], false),
    "UserEntity": o([
        { json: "userCode", js: "userCode", typ: "" },
        { json: "entityCode", js: "entityCode", typ: "" },
        { json: "action", js: "action", typ: "" },
        { json: "status", js: "status", typ: "" },
        { json: "actionInfo", js: "actionInfo", typ: r("ActionInfo") },
        { json: "externalSignUrl", js: "externalSignUrl", typ: "" },
    ], false),
    "ActionInfo": o([
        { json: "userCode", js: "userCode", typ: "" },
        { json: "date", js: "date", typ: 0 },
    ], false),
    "DocumentsToSign": o([
        { json: "filename", js: "filename", typ: "" },
        { json: "publicAccessId", js: "publicAccessId", typ: "" },
        { json: "signatureId", js: "signatureId", typ: "" },
        { json: "stampPositions", js: "stampPositions", typ: a("any") },
    ], false),
    "Sender": o([
        { json: "userCode", js: "userCode", typ: "" },
        { json: "entityCode", js: "entityCode", typ: "" },
    ], false),
    "VerificationAccess": o([
        { json: "type", js: "type", typ: "" },
    ], false),
};
