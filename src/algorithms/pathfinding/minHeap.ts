/** Binary min-heap ordered by a comparator (negative = a before b). */
export class MinHeap<T> {
  private readonly items: T[] = [];

  constructor(private readonly compare: (a: T, b: T) => number) {}

  get size(): number {
    return this.items.length;
  }

  push(item: T): void {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(this.get(i), this.get(parent)) >= 0) break;
      this.swap(i, parent);
      i = parent;
    }
  }

  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.get(0);
    const last = this.items.pop() as T;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let smallest = i;
        if (l < this.items.length && this.compare(this.get(l), this.get(smallest)) < 0)
          smallest = l;
        if (r < this.items.length && this.compare(this.get(r), this.get(smallest)) < 0)
          smallest = r;
        if (smallest === i) break;
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }

  private get(i: number): T {
    return this.items[i] as T;
  }

  private swap(i: number, j: number): void {
    const tmp = this.get(i);
    this.items[i] = this.get(j);
    this.items[j] = tmp;
  }
}
