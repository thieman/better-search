class Baz {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.hypot(dx, dy);
  }
}

const p1 = new Baz(5, 5);
const p2 = new Baz(10, 10);

console.log(Baz.distance(p1, p2));