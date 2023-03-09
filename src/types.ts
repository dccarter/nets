import { assert } from "console";
import { getIntegerSize } from "./utils";

export enum TTag {
  Unknown,
  Variant,
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
  [TTag.Variant]: { s: "unknown" },
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
  constructor(public readonly tag: TTag, public readonly id: number) {}

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

  clone(id: number, context: TypingContext): Type {
    return new Type(this.tag, id);
  }

  copy(id: number): Type {
    return new Type(this.tag, id);
  }
}

export class AliasType extends Type {
  constructor(
    id: number,
    public readonly name: string,
    public readonly aliasedType: Type
  ) {
    super(TTag.Alias, id);
  }

  resolve(): Type {
    return this.aliasedType;
  }

  clone(id: number, context: TypingContext): Type {
    return new AliasType(id, this.name, context.clone(this.aliasedType));
  }

  copy(id: number): Type {
    return new AliasType(id, this.name, this.aliasedType);
  }
}

export class TupleType extends Type {
  constructor(id: number, public readonly members: Type[]) {
    super(id, TTag.Tuple);
  }

  clone(id: number, context: TypingContext): Type {
    const members = new Array<Type>(this.members.length);
    this.members.forEach(
      (member, index) => (members[index] = context.clone(member))
    );
    return new TupleType(id, members);
  }

  copy(id: number): Type {
    const members = [...this.members];
    return new TupleType(id, members);
  }
}

export class StructField {
  constructor(public readonly name: string, public readonly type: Type) {}
}

export class StructType extends Type {
  #inheritanceDepth: number | undefined = undefined;
  constructor(
    id: number,
    public readonly name: string,
    public readonly fields: StructField[],
    public readonly base?: Type,
    public readonly isStructLike?: boolean
  ) {
    super(id, TTag.Struct);
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

  clone(id: number, context: TypingContext): Type {
    const fields = new Array<StructField>(this.fields.length);
    this.fields.forEach(
      (field, index) =>
        (fields[index] = new StructField(field.name, context.clone(field.type)))
    );
    return new StructType(id, this.name, fields, this.base, this.isStructLike);
  }

  copy(id: number): Type {
    const fields = [...this.fields];
    return new StructType(id, this.name, fields, this.base, this.isStructLike);
  }
}

export class EnumOption {
  constructor(public readonly name: string, public readonly value: number) {}
}

export class EnumType extends Type {
  #size: number | undefined = 4;
  constructor(
    id: number,
    public readonly name: string,
    public readonly options: EnumOption[],
    public readonly base?: Type,
    public readonly sealed: boolean = false
  ) {
    super(id, TTag.Enum);
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

  clone(id: number, context: TypingContext): Type {
    return new EnumType(id, this.name, [...this.options], this.base, false);
  }

  copy(id: number): Type {
    return new EnumType(id, this.name, [...this.options], this.base, false);
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
    id: number,
    public readonly name: string,
    public readonly params: FunctionParam[],
    public readonly ret: Type
  ) {
    super(id, TTag.Func);
  }

  getParam(name: string): FunctionParam | undefined {
    return this.params.find((param) => param.name === name);
  }

  clone(id: number, context: TypingContext): Type {
    const params = new Array<StructField>(this.params.length);
    this.params.forEach(
      (param, index) =>
        (params[index] = new FunctionParam(
          param.name,
          context.clone(param.type)
        ))
    );
    return new FunctionType(id, this.name, params, context.clone(this.ret));
  }

  copy(id: number): Type {
    return new FunctionType(id, this.name, [...this.params], this.ret);
  }
}

export class ArrayType extends Type {
  constructor(
    id: number,
    public readonly elementType: Type,
    public readonly size: number
  ) {
    super(id, TTag.Array);
  }

  getSize(): number {
    return this.elementType.getSize() * this.size;
  }

  clone(id: number, context: TypingContext): Type {
    return new ArrayType(id, context.clone(this.elementType), this.size);
  }

  copy(id: number): Type {
    return new ArrayType(id, this.elementType, this.size);
  }
}

export class PointerType extends Type {
  constructor(
    id: number,
    public readonly pointee: Type,
    public readonly isConst: boolean = false
  ) {
    super(id, TTag.Pointer);
  }

  getSize(): number {
    return this.pointee.getSize();
  }

  isNonConstPointer(): boolean {
    return !this.isConst;
  }

  clone(id: number, context: TypingContext): Type {
    return new PointerType(id, context.clone(this.pointee), this.isConst);
  }

  copy(id: number): Type {
    return new PointerType(id, this.pointee, this.isConst);
  }
}

export enum TVariance {
  Constant = 0x00,
  Covariant = 0x01,
  ContraVariant = 0x02,
  Invariant = TVariance.Covariant | TVariance.ContraVariant,
}

export class TypingContext {
  #count: number = 0;
  #unknownType: Type;
  #primitives: Map<TTag, Type> = new Map<TTag, Type>();
  #table: Map<number, Type> = new Map<number, Type>();

  constructor() {
    this.#unknownType = this.getOrInsertType(
      new Type(TTag.Unknown, this.#uniqueId())
    );

    this.#primitives.set(
      TTag.Bool,
      this.getOrInsertType(new Type(TTag.Bool, this.#uniqueId()))
    );
    this.#primitives.set(
      TTag.Char,
      this.getOrInsertType(new Type(TTag.Char, this.#uniqueId()))
    );
    this.#primitives.set(
      TTag.Byte,
      this.getOrInsertType(new Type(TTag.Byte, this.#uniqueId()))
    );
    this.#primitives.set(
      TTag.I8,
      this.getOrInsertType(new Type(TTag.I8, this.#uniqueId()))
    );
    this.#primitives.set(
      TTag.I16,
      this.getOrInsertType(new Type(TTag.I16, this.#uniqueId()))
    );
    this.#primitives.set(
      TTag.I32,
      this.getOrInsertType(new Type(TTag.I32, this.#uniqueId()))
    );
    this.#primitives.set(
      TTag.I64,
      this.getOrInsertType(new Type(TTag.I64, this.#uniqueId()))
    );
    this.#primitives.set(
      TTag.U8,
      this.getOrInsertType(new Type(TTag.U8, this.#uniqueId()))
    );
    this.#primitives.set(
      TTag.U16,
      this.getOrInsertType(new Type(TTag.U16, this.#uniqueId()))
    );
    this.#primitives.set(
      TTag.U32,
      this.getOrInsertType(new Type(TTag.U32, this.#uniqueId()))
    );
    this.#primitives.set(
      TTag.U64,
      this.getOrInsertType(new Type(TTag.U64, this.#uniqueId()))
    );
    this.#primitives.set(
      TTag.F32,
      this.getOrInsertType(new Type(TTag.F32, this.#uniqueId()))
    );
    this.#primitives.set(
      TTag.F64,
      this.getOrInsertType(new Type(TTag.F64, this.#uniqueId()))
    );
  }

  #uniqueId(): number {
    return this.#count++;
  }

  clone(type: Type): Type {
    return type.clone(this.#uniqueId(), this);
  }

  makePrimitive(tag: TTag): Type {
    assert(TYPE_TAGS[tag].primitive);
    return this.#primitives.get(tag)!;
  }

  makeUnknownType(): Type {
    return this.#unknownType;
  }

  makeTupleType(members: Type[]): Type {
    return this.getOrInsertType(new TupleType(this.#uniqueId(), members));
  }

  makeArray(elementType: Type, size: number = 0): Type {
    return this.getOrInsertType(
      new ArrayType(this.#uniqueId(), elementType, size)
    );
  }

  makePointer(pointee: Type, isConst: boolean = false): Type {
    return this.getOrInsertType(
      new PointerType(this.#uniqueId(), pointee, isConst)
    );
  }

  makeFunction(name: string, params: FunctionParam[], ret: Type): Type {
    return this.getOrInsertType(
      new FunctionType(this.#uniqueId(), name, params, ret)
    );
  }

  makeAlias(name: string, aliased: Type): Type {
    return this.getOrInsertType(new AliasType(this.#uniqueId(), name, aliased));
  }

  getOrInsertType(type: Type): Type {
    if (!this.#table.has(type.id)) {
      this.#table.set(type.id, type);
    }
    return type;
  }

  static invertVariance(variance: TVariance): TVariance {
    if (variance === TVariance.Covariant) return TVariance.ContraVariant;
    if (variance === TVariance.ContraVariant) return TVariance.Covariant;
    return variance;
  }

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

  private traverseWithVariance(
    from: Type,
    to: Type,
    variance: TVariance,
    func: (
      to: Type,
      from: Type,
      variance: TVariance,
      context: TypingContext
    ) => void
  ) {
    if (from.tag != to.tag && from.tag !== TTag.Variant) {
      return;
    }

    switch (from.tag) {
      case TTag.Variant:
        func(from, to, variance, this);
        break;
      case TTag.Tuple: {
        const t1 = <TupleType>from,
          t2 = <TupleType>to;
        for (var i = 0; i < t1.members.length && i < t2.members.length; i++) {
          this.traverseWithVariance(
            t1.members[i],
            t2.members[i],
            variance,
            func
          );
        }
        break;
      }
      case TTag.Func: {
        const f1 = <FunctionType>from,
          f2 = <FunctionType>to;
        for (var i = 0; i < f1.params.length && i < f2.params.length; i++) {
          this.traverseWithVariance(
            f1.params[i].type,
            f2.params[i].type,
            variance,
            func
          );
        }
        this.traverseWithVariance(f1.ret, f2.ret, variance, func);
        break;
      }

      case TTag.Array: {
        const a1 = <ArrayType>from,
          a2 = <ArrayType>to;
        this.traverseWithVariance(
          a1.elementType,
          a2.elementType,
          TVariance.Invariant,
          func
        );
        break;
      }

      case TTag.Pointer: {
        const a1 = <PointerType>from,
          a2 = <PointerType>to;
        this.traverseWithVariance(
          a1.pointee,
          a2.pointee,
          TVariance.Invariant,
          func
        );
        break;
      }

      default:
        break;
    }
  }
}
