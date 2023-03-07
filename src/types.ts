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

export class Type {
  constructor(public readonly tag: TTag) {}

  isPrimitive(): boolean {
    return TYPE_TAGS[this.tag].primitive || false;
  }

  getSize(): number {
    return TYPE_TAGS[this.tag].size || 0;
  }
}

class AliasType extends Type {}
class TupleType extends Type {}
class StructType extends Type {}
class EnumType extends Type {}
class FunctionType extends Type {}

export class TypingContext {
  resolve(type: Type): Type {
    while (true) {
      if (type.tag == TTag.Alias) {
        type = <AliasType>type;
      }
    }
    return type;
  }
}
