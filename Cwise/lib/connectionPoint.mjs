import { Graphics, Point } from "./pixi.mjs";

export class ConnectionPoint extends Graphics {
  constructor(x, y, parentObject) {
    super();

    // 基礎屬性
    this.parentObject = parentObject; // 該連接點所屬的「場景物件Container」
    this.x = x;
    this.y = y;

    // 紀錄與此 CP 相連的 wires
    this.wires = new Set();
    // 群組
    this.group = null;

    // 繪製小圓
    this.drawPoint();
  }

  drawPoint() {
    this.clear();
    this.lineStyle(2, 0x3c3c3c);
    this.beginFill(0xffffff, 1);
    this.drawCircle(0, 0, 5);
    this.endFill();
    this.alpha = 0.5;
  }

  show() {
    this.alpha = 1;
  }

  hide() {
    this.alpha = 0.5;
  }

  getGlobalPosition() {
    // 如果 parentObject 是個 Container，直接用它的 toGlobal
    return this.parentObject.toGlobal(new Point(this.x, this.y));
  }
}

export class ConnectionGroup {
  constructor() {
    this.points = new Set();
    this.wires = new Set();
  }

  addPoint(cp) {
    this.points.add(cp);
    cp.group = this;
  }

  removePoint(cp) {
    this.points.delete(cp);
    cp.group = null;
  }

  addWire(wire) {
    this.wires.add(wire);
  }

  removeWire(wire) {
    this.wires.delete(wire);
  }

  merge(otherGroup) {
    for (const p of otherGroup.points) {
      this.addPoint(p);
    }
    for (const w of otherGroup.wires) {
      this.addWire(w);
    }
  }
}

export class ConnectionGroupManager {
  constructor() {
    this.groups = new Set();
  }

  handleConnect(cp1, cp2, wire) {
    const g1 = cp1.group;
    const g2 = cp2.group;

    // 都沒群組 -> 新建
    if (!g1 && !g2) {
      const newGroup = new ConnectionGroup();
      newGroup.addPoint(cp1);
      newGroup.addPoint(cp2);
      newGroup.addWire(wire);
      this.groups.add(newGroup);
    } else if (g1 && !g2) {
      g1.addPoint(cp2);
      g1.addWire(wire);
    } else if (!g1 && g2) {
      g2.addPoint(cp1);
      g2.addWire(wire);
    } else if (g1 !== g2) {
      // 不同群組 -> 合併
      g1.merge(g2);
      g1.addWire(wire);
      this.groups.delete(g2);
    } else {
      // 同群組
      g1.addWire(wire);
    }
  }

  handleDisconnect(cp1, cp2, wire) {
    // 從群組移除 wire 與 point
    // 這裡可依需求做更進階拆分邏輯（若拆完群組有兩群，也可嘗試重新分群）
    const group = cp1.group;
    if (group) {
      group.removeWire(wire);
    }
  }
}

export const ConnectionPointsConfig = {
  燒杯: [
    { x: -50, y: 0 },
    { x: 50, y: 0 },
    { x: 0, y: -50 },
    { x: 0, y: 50 },
  ],
  電線: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
  電池: [
    { x: 0, y: -30 },
    { x: 0, y: 30 },
  ],
  燈泡: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
  廣用試紙: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
  碳棒: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
  銅片: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
  鋅片: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
  U型管: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
  檢流計: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
  鋅銅電池雙燒杯: [
    { x: -50, y: 0 },
    { x: 50, y: 0 },
    { x: 0, y: -50 },
    { x: 0, y: 50 },
  ],
  鋅銅電池組合: [
    { x: -50, y: 0 },
    { x: 50, y: 0 },
    { x: 0, y: -50 },
    { x: 0, y: 50 },
  ],
  // default 連接點配置（若未在上面定義，則使用此配置）
  default: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
};
