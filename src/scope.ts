import assert from "assert";
import { Ast, AstNode } from "./ast";
import { Logger } from "./diagnostics";
import { fmtKeyword, fmtReset } from "./format";
import { Range } from "./source";

export class Cymbol {
  constructor(public readonly name: string, public readonly node: AstNode) {}
}

export class Scope {
  next?: Scope;
  #symbols: Map<string, Cymbol> = new Map<string, Cymbol>();

  constructor(
    readonly L: Logger,
    private node: AstNode,
    private readonly prev?: Scope
  ) {
    if (prev) prev.next = this;
  }

  insert(name: string, node: AstNode) {
    const found = this.#symbols.get(name);
    if (found) {
      this.L.error(node.range!, `redefinition of symbol ${name}`);
      this.L.info(found.node.range!, `'${name}' already defined here`);
    } else {
      this.#symbols.set(name, new Cymbol(name, node));
    }
  }

  findSymbol(name: string, range: Range): AstNode | undefined {
    var scope: Scope | undefined = this;
    while (scope) {
      const found = scope.#symbols.get(name);
      if (found !== undefined) {
        return found.node;
      }
      scope = scope.prev;
    }

    this.L.error(range, `undefined identifier '${name}'`);
    this.#suggestSimilarSymbol(name);
  }

  findEnclosingLoop(keyword: string, range: Range): AstNode | undefined {
    return this.#findEnclosingScope(
      keyword,
      "loop",
      range,
      Ast.WhileStmt,
      Ast.ForStmt
    );
  }

  findEnclosingFunction(keyword: string, range: Range): AstNode | undefined {
    return this.#findEnclosingScope(
      keyword,
      "function",
      range,
      Ast.FuncDecl,
      Ast.ClosureExpr
    );
  }

  pushScope(node: AstNode): Scope {
    var scope;
    if (this.next) {
      scope = this.next;
      scope.node = node;
      scope.#symbols.clear();
    } else {
      scope = new Scope(this.L, node, this);
    }

    return scope;
  }

  popScope(): Scope {
    assert(this.prev);
    return this.prev;
  }

  #findEnclosingScope(
    keyword: string,
    context: string,
    range: Range,
    ...tags: Ast[]
  ): AstNode | undefined {
    var scope: Scope | undefined = this;
    while (scope) {
      if (tags.includes(scope.node.id)) return scope.node;
      scope = scope.prev;
    }

    this.L.error(
      range,
      `use of a ${fmtKeyword}${keyword}${fmtReset} outside a ${context}`
    );
  }

  #suggestSimilarSymbol(name: string) {
    var minDistance = 2;

    // Do not suggest similar symbols for identifiers that are too short
    if (name.length <= minDistance) return;

    var similarName: string | undefined = undefined;

    for (var scope: Scope | undefined = this; scope; scope = scope?.prev) {
      scope.#symbols.forEach((value, symbol) => {
        const dist = this.#levenshteinDistance(name, symbol, minDistance);
        if (dist < minDistance) {
          minDistance = dist;
          similarName = symbol;
        }
      });
    }

    if (similarName) this.L.infoMsg(`did you mean '${similarName}'?`);
  }

  #levenshteinDistance(lhs: string, rhs: string, min: number): number {
    if (lhs.length === 0) return rhs.length;
    if (rhs.length === 0) return lhs.length;

    if (lhs.charCodeAt(0) === rhs.charCodeAt(0))
      return this.#levenshteinDistance(lhs.slice(1), rhs.slice(1), min);

    if (min == 0) return 1;

    const a = this.#levenshteinDistance(lhs.slice(1), rhs, min - 1);
    const b = this.#levenshteinDistance(lhs, rhs.slice(1), min - 1);
    const c = this.#levenshteinDistance(lhs.slice(1), rhs.slice(1), min - 1);

    min = a;
    min = min < b ? min : b;
    min = min < c ? min : c;
    return 1 + min;
  }
}
