export type OP = "INSERT" | "DELETE" | "SET" | "UNSET";

export interface OPCode{
    id: string,
    op: OP,
    timestamp: number,
    table: string,
    key: string,
    etag?: string,
}

export interface Insert extends OPCode{
    value: any,
}

export interface Delete extends OPCode{}

export interface Set extends OPCode{
    keypath: string,
    value: any,
}

export interface Unset extends OPCode{
    keypath: string,
}

export interface Batch{
    op: "BATCH",
    ops: Array<OPCode>,
}