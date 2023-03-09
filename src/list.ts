export class ListItem {
  public next?: ListItem = undefined;
  clone(): ListItem | undefined {
    return undefined;
  }
}

export class List<T extends ListItem> {
  first?: ListItem = undefined;
  last?: ListItem = undefined;
  count: number = 0;

  add(node: T) {
    if (!this.first) {
      this.first = node;
    } else if (this.last) {
      this.last.next = node;
    }
    this.last = node;
    this.count++;
  }

  clone(): List<T> {
    const copy = new List<T>();
    var node = this.first;
    while (node) {
      copy.add(<T>node.clone());
      node = node.next;
    }
    return copy;
  }

  each(func: (node: T, index?: number) => true | undefined | void) {
    var node = this.first;
    var i = 0;
    while (node) {
      if (func(<T>node, i++)) break;
      node = node.next;
    }
  }

  find(func: (node: T, index?: number) => boolean): T | undefined {
    var node = this.first;
    var i = 0;
    while (node) {
      if (func(<T>node, i++)) return <T>node;
      node = node.next;
    }
    return undefined;
  }

  findAll(
    func: (node: T, index?: number) => boolean
  ): { index: number; value: T }[] {
    const ret: { index: number; value: T }[] = [];
    var node = this.first;
    var i = 0;
    while (node) {
      if (func(<T>node, i++)) ret.push({ index: i, value: <T>node });
      node = node.next;
    }

    return ret;
  }
}
