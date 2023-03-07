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

  each(func: (node: T) => true | undefined) {
    var node = this.first;
    while (node) {
      if (func(<T>node)) break;
      node = node.next;
    }
  }
}
