import { List, ListItem } from "./list";

export enum TTag {
  Void,
  Bool,
  Byte,
  Char,
  I8,
  I16,
  I32,
  I64,
  U8,
  U16,
  U32,
  U64,
  F32,
  F64,
  String,
  Alias,
  Tuple,
  Enum,
  Struct,
  Func,
}

export const TYPE_TAGS: { [Tag in TTag]: { [key: string]: any } } = {
  [TTag.Void]: { s: "void", primitive: true, size: 0 },
  [TTag.Bool]: { s: "bool", primitive: true, size: 1 },
  [TTag.Byte]: { s: "byte", primitive: true, size: 1, signed: true },
  [TTag.Char]: { s: "char", primitive: true, size: 1 },
  [TTag.I8]: { s: "i8", primitive: true, size: 1, signed: true },
  [TTag.I16]: { s: "i16", primitive: true, size: 2, signed: true },
  [TTag.I32]: { s: "i32", primitive: true, size: 4, signed: true },
  [TTag.I64]: { s: "i64", primitive: true, size: 8, signed: true },
  [TTag.U8]: { s: "u8", primitive: true, size: 1 },
  [TTag.U16]: { s: "u16", primitive: true, size: 2 },
  [TTag.U32]: { s: "u32", primitive: true, size: 4 },
  [TTag.U64]: { s: "u64", primitive: true, size: 8 },
  [TTag.F32]: { s: "f32", primitive: true, size: 8 },
  [TTag.F64]: { s: "f64", primitive: true, size: 8 },
  [TTag.String]: { s: "string", primitive: true },
  [TTag.Alias]: { s: "alias" },
  [TTag.Tuple]: { s: "tuple" },
  [TTag.Enum]: { s: "enum" },
  [TTag.Struct]: { s: "struct" },
  [TTag.Func]: { s: "func" },
};

export class Type extends ListItem {
  constructor(public readonly tag: TTag) {
    super();
  }

  isPrimitive(): boolean {
    return TYPE_TAGS[this.tag].primitive || false;
  }

  getSize(): number {
    return TYPE_TAGS[this.tag].size || 0;
  }
}

export class TypeList extends List<Type> {}

export class AliasType extends Type {
  constructor(public aliasedType: Type) {
    super(TTag.Alias);
  }
}

export class TupleType extends Type {
  constructor(public readonly members: TypeList) {
    super(TTag.Tuple);
  }
}

class StructField extends ListItem {
  constructor(public readonly name: string, public readonly type: Type) {
    super();
  }
}

class StructType extends Type {
  constructor(
    public readonly name: string,
    public readonly fields: List<StructField>,
    public readonly base?: Type
  ) {
    super(TTag.Struct);
  }
}

class EnumOption extends ListItem {
  constructor(public readonly name: string, public readonly value: number) {
    super();
  }
}

class EnumType extends Type {
  constructor(
    public readonly name: string,
    public readonly options: List<EnumOption>,
    public readonly base?: Type
  ) {
    super(TTag.Enum);
  }
}

class FunctionParam extends ListItem {
  constructor(
    public readonly name: string,
    public readonly type: Type,
    public readonly isVariadic?: boolean
  ) {
    super();
  }
}

export class FunctionType extends Type {
  constructor();
}

export class TypingContext {
  resolve(type: Type): Type {
    while (true) {
      if (type.tag == TTag.Alias) {
        type = (<AliasType>type).aliasedType;
      } else break;
    }
    return type;
  }
}
