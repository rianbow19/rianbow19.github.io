import { Graphics, Container } from "./pixi.mjs";

export class Wire extends Container {
  constructor(startCP, endCP) {
    super();
    this.startCP = startCP || null;
    this.endCP = endCP || null;
    this.line = new Graphics();
    this.addChild(this.line);

    this.selected = false;
    this.drawLine();
  }

  drawLine() {
    this.line.clear();
    this.line.lineStyle(3, 0xffd700); // 金色
    const startPos = this.getPointGlobalPos(this.startCP);
    const endPos = this.getPointGlobalPos(this.endCP);
    this.line.moveTo(startPos.x, startPos.y);
    this.line.lineTo(endPos.x, endPos.y);
  }

  getPointGlobalPos(cp) {
    if (!cp) return { x: 0, y: 0 };
    return cp.getGlobalPosition();
  }

  // 在拉線預覽階段 (endCP 還沒真正確定)
  updateEndPos(pos) {
    // 只更新線的終端坐標(不綁CP)
    this.line.clear();
    this.line.lineStyle(3, 0xffd700);
    const startPos = this.getPointGlobalPos(this.startCP);
    this.line.moveTo(startPos.x, startPos.y);
    this.line.lineTo(pos.x, pos.y);
  }

  setStartCP(cp) {
    this.startCP = cp;
    this.drawLine();
  }

  setEndCP(cp) {
    this.endCP = cp;
    this.drawLine();
  }

  disconnect() {
    // 從雙方 CP 中移除
    if (this.startCP) {
      this.startCP.wires.delete(this);
    }
    if (this.endCP) {
      this.endCP.wires.delete(this);
    }
  }

  destroy() {
    this.disconnect();
    this.parent?.removeChild(this);
  }
}

export class WiringController {
  constructor(sceneContainer, groupManager) {
    this.sceneContainer = sceneContainer; // 用來 addChild(Wire)
    this.groupManager = groupManager; // 連接群組管理器

    this.activeWire = null; // 正在拉線的wire
    this.activeStartCP = null; // 拉線起始CP
    this.threshold = 20; // 吸附距離
  }

  /**
   * 註冊一堆連接點給 WiringController 監管
   */
  registerConnectionPoints(connectionPoints) {
    for (const cp of connectionPoints) {
      // pointerdown -> 開始拉線
      cp.on("pointerdown", (e) => this.onPointDown(e, cp));
      // pointermove / pointerup 通常用 globalpointermove / globalpointerup 來監測
      cp.on("globalpointermove", (e) => this.onPointMove(e, cp));
      cp.on("pointerup", (e) => this.onPointUp(e, cp));
      cp.on("pointerupoutside", (e) => this.onPointUp(e, cp));
    }
  }

  onPointDown(event, cp) {
    // 若已經在拉線中 -> 可考慮是否支援「線的第二次點擊」等功能
    if (this.activeWire) return;

    // 建立 Wire，指定 startCP
    this.activeWire = new Wire(cp, null);
    this.activeStartCP = cp;
    this.sceneContainer.addChild(this.activeWire);
  }

  onPointMove(event, cp) {
    if (!this.activeWire) return;
    if (this.activeStartCP !== cp) return; // 確認是同個CP在拉線

    // 更新線尾端位置(暫時跟隨滑鼠)
    const pos = event.getLocalPosition(this.sceneContainer);
    this.activeWire.updateEndPos(pos);

    // 可做 highlight 例如：找出附近 CP 並 highlight
    const near = this.findNearbyCP(pos, cp);
    if (near) near.show();
  }

  onPointUp(event, cp) {
    if (!this.activeWire) return;
    if (this.activeStartCP !== cp) return;

    // 找到目標CP
    const pos = event.getLocalPosition(this.sceneContainer);
    const targetCP = this.findNearbyCP(pos, cp);

    if (targetCP) {
      // 真正連結
      this.activeWire.setEndCP(targetCP);
      // 雙向記錄
      cp.wires.add(this.activeWire);
      targetCP.wires.add(this.activeWire);
      // 呼叫群組管理
      this.groupManager.handleConnect(cp, targetCP, this.activeWire);
    } else {
      // 若沒連到就刪除
      this.activeWire.destroy();
    }

    // 結束
    this.activeWire = null;
    this.activeStartCP = null;
  }

  findNearbyCP(pos, excludeCP) {
    // 在 sceneContainer 裏找所有 CP，但實務中可由外部傳入一個「所有 CP 的陣列」
    // 這裡示範簡易寫法：
    let nearest = null;
    let nearestDist = Infinity;

    // 你可能會維護一個 allConnectionPoints[] 做快速搜尋
    // 這裡假設 parentObject.children 內可以掃到 CP，也可改成對 DraggableList 的 sceneItems->connectionPoints 做遍歷
    for (const child of this.sceneContainer.children) {
      // child 可能是物件container or wire
      if (child.connectionPoints) {
        for (const cpoint of child.connectionPoints) {
          if (cpoint === excludeCP) continue;
          const gpos = cpoint.getGlobalPosition();
          const dx = gpos.x - pos.x;
          const dy = gpos.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < this.threshold && dist < nearestDist) {
            nearest = cpoint;
            nearestDist = dist;
          }
        }
      }
    }
    return nearest;
  }
}
