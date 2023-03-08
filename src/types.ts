import { assert } from "console";
import { getIntegerSize } from "./utils";

export enum TTag {
  Unknown,
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
  Pointer,
  Array,
  Enum,
  Alias,
  Tuple,
  Struct,
  Func,
}

export const TYPE_TAGS: { [Tag in TTag]: { [key: string]: any } } = {
  [TTag.Unknown]: { s: "unknown" },
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
  [TTag.Pointer]: { s: "pointer" },
  [TTag.Array]: { s: "array" },
  [TTag.Enum]: { s: "enum" },
  [TTag.Alias]: { s: "alias" },
  [TTag.Tuple]: { s: "tuple" },
  [TTag.Struct]: { s: "struct" },
  [TTag.Func]: { s: "func" },
};

export class Type {
  constructor(public readonly tag: TTag) {}

  isPrimitive(): boolean {
    return TYPE_TAGS[this.tag].primitive || false;
  }

  isUnsigned(): boolean {
    return TYPE_TAGS[this.tag].unsigned || false;
  }

  isSigned(): boolean {
    return TYPE_TAGS[this.tag].signed || false;
  }

  isFloat(): boolean {
    return this.tag === TTag.F32 || this.tag === TTag.F64;
  }

  isInteger(): boolean {
    return this.isSigned() || this.isUnsigned();
  }

  isNumber(): boolean {
    return this.isInteger() || this.isFloat();
  }

  isNominal(): boolean {
    return this.tag === TTag.Enum || this.tag === TTag.Struct;
  }

  isNonConstPointer(): boolean {
    return false;
  }

  getSize(): number {
    return TYPE_TAGS[this.tag].size || 0;
  }

  getBitSize(): number {
    return this.getSize() * 8;
  }

  resolve(): Type {
    return this;
  }
}

export class AliasType extends Type {
  constructor(public readonly name: string, public readonly aliasedType: Type) {
    super(TTag.Alias);
  }

  resolve(): Type {
    return this.aliasedType;
  }
}

export class TupleType extends Type {
  constructor(public readonly members: Type[]) {
    super(TTag.Tuple);
  }
}

export class StructField {
  constructor(public readonly name: string, public readonly type: Type) {}
}

export class StructType extends Type {
  #inheritanceDepth: number | undefined = undefined;
  constructor(
    public readonly name: string,
    public readonly fields: StructField[],
    public readonly base?: Type,
    public readonly isStructLike?: boolean
  ) {
    super(TTag.Struct);
  }

  getInheritanceDepth(): number {
    if (this.#inheritanceDepth === undefined) {
      this.#inheritanceDepth = 0;
      if (this.base !== undefined) {
        this.#inheritanceDepth =
          1 + (<StructType>this.base).getInheritanceDepth();
      }
    }
    return this.#inheritanceDepth;
  }

  getField(name: string): StructField | undefined {
    return this.fields.find((field) => field.name === name);
  }
}

export class EnumOption {
  constructor(public readonly name: string, public readonly value: number) {}
}

export class EnumType extends Type {
  #size: number | undefined = 4;
  constructor(
    public readonly name: string,
    public readonly options: EnumOption[],
    public readonly base?: Type,
    public readonly sealed: boolean = false
  ) {
    super(TTag.Enum);
  }

  getOption(name: string): EnumOption | undefined {
    return this.options.find((option) => option.name === name);
  }

  getSize(): number {
    if (this.#size === undefined || !this.sealed) {
      if (this.base !== undefined) {
        return (this.#size = this.base.getSize());
      }
      const values = this.options.map((opt) => opt.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      return (this.#size = Math.max(getIntegerSize(min), getIntegerSize(max)));
    }
    return this.#size;
  }
}

class FunctionParam {
  constructor(
    public readonly name: string,
    public readonly type: Type,
    public readonly isVariadic?: boolean
  ) {}
}

export class FunctionType extends Type {
  constructor(
    public readonly name: string,
    public readonly params: FunctionParam[],
    public readonly ret: Type
  ) {
    super(TTag.Func);
  }

  getParam(name: string): FunctionParam | undefined {
    return this.params.find((param) => param.name === name);
  }
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

  isSubtype(lhs: Type, rhs: Type): boolean {
    lhs = this.resolve(lhs);
    rhs = this.resolve(rhs);

    if (lhs === rhs || lhs.tag === TTag.Unknown || rhs.tag === TTag.Unknown) {
      return true;
    }

    if (
      (lhs.isSigned() && rhs.isSigned()) ||
      (lhs.isUnsigned() && rhs.isUnsigned()) ||
      (lhs.isFloat() && rhs.isFloat())
    ) {
      return lhs.getBitSize() <= rhs.getBitSize();
    }

    if (this.isSubStruct(lhs, rhs)) {
      return true;
    }

    if (this.isSubEnum(lhs, rhs)) {
      return true;
    }

    if (lhs.tag !== rhs.tag) {
      return false;
    }

    if (lhs.tag === TTag.Tuple) {
      const left = <TupleType>lhs,
        right = <TupleType>rhs;
      if (left.members.length !== right.members.length) {
        return false;
      }

      for (var i = 0; i < left.members.length; ++i) {
        if (!this.isSubtype(left.members[i], right.members[i])) {
          return false;
        }
      }

      return true;
    }

    if (lhs.tag === TTag.Func) {
      const left = <FunctionType>lhs,
        right = <FunctionType>rhs;
      if (left.params.length !== right.params.length) {
        return false;
      }

      for (var i = 0; i < left.params.length; ++i) {
        if (!this.isSubtype(left.params[i].type, right.params[i].type)) {
          return false;
        }
      }

      return this.isSubtype(left.ret, right.ret);
    }

    return false;
  }

  private isSubStruct(lhs: Type, rhs: Type): boolean {
    lhs = this.resolve(lhs);
    rhs = this.resolve(rhs);

    if (lhs.tag !== TTag.Enum && rhs.tag !== TTag.Enum) {
      return false;
    }

    var left = <StructType>lhs,
      right = <StructType>rhs;

    var lDepth = left.getInheritanceDepth(),
      rDepth = right.getInheritanceDepth();

    if (lDepth < rDepth) {
      return false;
    }

    while (lDepth > rDepth) {
      lhs = this.resolve(left.base!);
      assert(lhs.tag === TTag.Struct);
      left = <StructType>lhs;
      lDepth--;
    }

    return lhs === rhs;
  }

  private isSubEnum(lhs: Type, rhs: Type): boolean {
    lhs = this.resolve(lhs);
    rhs = this.resolve(rhs);

    if (
      (lhs.tag === TTag.Enum && rhs.isInteger()) ||
      (rhs.isInteger() && lhs.tag === TTag.Enum)
    ) {
      return lhs.getBitSize() <= rhs.getBitSize();
    }

    return false;
  }
}
