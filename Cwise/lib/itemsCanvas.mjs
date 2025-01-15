import { Container, Sprite, Texture, Graphics } from "./pixi.mjs";

export class ItemsCanvas {
  constructor() {
    this.container = new Container();
    this.sceneItems = []; // 場景中的所有物品
    this.selectedSceneItem = null; // 當前選中的場景物品
    this.deleteButton = null; // 刪除按鈕
    this.selectionBorder = null; // 選中邊框
    this.draggedSceneItem = null; // 正在拖動的場景物品
    this.dragOffset = { x: 0, y: 0 }; // 拖動偏移量
  }

  // 創建場景物品
  createSceneItem(imagePath, position) {
    const sceneContainer = new Container();
    sceneContainer.x = position.x; // 設置物品的 X 座標
    sceneContainer.y = position.y; // 設置物品的 Y 座標

    const sprite = new Sprite(Texture.from(imagePath));
    sprite.anchor.set(0.5);
    const scale = sprite.texture.width / Math.max(sprite.texture.width, sprite.texture.height); // 設置比例
    sprite.scale.set(scale);

    sceneContainer.addChild(sprite);

    sceneContainer.eventMode = "static";
    sceneContainer.cursor = "pointer";

    sceneContainer.on("click", () => this.onSceneItemClick(sceneContainer));
    sceneContainer.on("pointerdown", (event) => this.onSceneItemDragStart(event, sceneContainer));
    sceneContainer.on("pointerup", (event) => this.onSceneItemDragEnd(event));
    sceneContainer.on("pointerupoutside", (event) => this.onSceneItemDragEnd(event));
    sceneContainer.on("globalpointermove", (event) => this.onSceneItemDragMove(event));

    this.sceneItems.push(sceneContainer);
    this.container.addChild(sceneContainer);

    return sceneContainer;
  }

  // 創建選中邊框
  createSelectionBorder(sprite) {
    const texture = sprite.texture;
    const padding = 10; // 邊框內邊距

    const baseWidth = texture.orig.width || texture.baseTexture.width; // 紋理寬度
    const baseHeight = texture.orig.height || texture.baseTexture.height; // 紋理高度

    const width = baseWidth * sprite.scale.x + padding * 2; // 計算邊框寬度
    const height = baseHeight * sprite.scale.y + padding * 2; // 計算邊框高度

    const border = new Graphics();
    border.rect(-width / 2, -height / 2, width, height); // 畫矩形作為邊框
    border.stroke({ width: 4, color: 0xffffff }); // 設置邊框顏色和寬度

    return border;
  }

  // 點擊場景物品時觸發
  onSceneItemClick(sceneContainer) {
    if (this.draggedSceneItem) return; // 如果正在拖動，則返回

    // 移除已有的刪除按鈕和選中邊框
    if (this.deleteButton) {
      this.container.removeChild(this.deleteButton);
      this.deleteButton = null;
    }
    if (this.selectionBorder) {
      this.container.removeChild(this.selectionBorder);
      this.selectionBorder = null;
    }

    // 如果當前物品已選中，再次點擊時取消選中
    if (this.selectedSceneItem === sceneContainer) {
      this.selectedSceneItem = null;
      return;
    }

    this.selectedSceneItem = sceneContainer; // 設置選中的場景物品

    // 創建選中邊框
    const sprite = sceneContainer.children[0];
    this.selectionBorder = this.createSelectionBorder(sprite);
    this.selectionBorder.x = sceneContainer.x;
    this.selectionBorder.y = sceneContainer.y;
    this.container.addChild(this.selectionBorder);

    // 創建刪除按鈕
    this.deleteButton = new Sprite(Texture.from("bin.png"));
    this.deleteButton.anchor.set(0.5);
    this.deleteButton.scale.set(0.13);
    this.deleteButton.x = sceneContainer.x + sceneContainer.children[0].width / 2;
    this.deleteButton.y = sceneContainer.y - sceneContainer.children[0].height / 2 - 40;

    this.deleteButton.eventMode = "static";
    this.deleteButton.cursor = "pointer";
    this.deleteButton.on("click", () => this.deleteSceneItem(sceneContainer));
    this.deleteButton.on("tap", () => this.deleteSceneItem(sceneContainer));

    this.container.addChild(this.deleteButton);
  }

  // 刪除場景物品
  deleteSceneItem(sceneContainer) {
    const index = this.sceneItems.indexOf(sceneContainer);
    if (index > -1) {
      this.sceneItems.splice(index, 1); // 從場景物品列表中移除
    }

    this.container.removeChild(sceneContainer); // 從主容器中移除

    // 移除刪除按鈕和選中邊框
    if (this.deleteButton) {
      this.container.removeChild(this.deleteButton);
      this.deleteButton = null;
    }
    if (this.selectionBorder) {
      this.container.removeChild(this.selectionBorder);
      this.selectionBorder = null;
    }

    this.selectedSceneItem = null; // 清除選中的物品
  }

  // 開始拖動場景物品
  onSceneItemDragStart(event, container) {
    if (this.draggedSceneItem) return; // 如果已有拖動物品，則返回

    // 移除刪除按鈕和選中邊框
    if (this.deleteButton) {
      this.container.removeChild(this.deleteButton);
      this.deleteButton = null;
    }
    if (this.selectionBorder) {
      this.container.removeChild(this.selectionBorder);
      this.selectionBorder = null;
    }

    this.draggedSceneItem = container; // 設置拖動的場景物品
    container.alpha = 0.8; // 調整透明度

    const localPos = event.getLocalPosition(this.container); // 獲取事件的本地位置
    this.dragOffset = {
      x: container.x - localPos.x,
      y: container.y - localPos.y,
    }; // 計算拖動偏移量
  }

  // 結束拖動場景物品
  onSceneItemDragEnd(event) {
    if (this.draggedSceneItem) {
      this.draggedSceneItem.alpha = 1; // 恢復透明度
      this.draggedSceneItem = null; // 清除拖動的物品
    }
  }

  // 拖動場景物品時觸發
  onSceneItemDragMove(event) {
    if (!this.draggedSceneItem) return; // 如果沒有拖動物品，則返回

    const newPosition = event.getLocalPosition(this.container); // 獲取新的位置
    this.draggedSceneItem.x = newPosition.x + this.dragOffset.x; // 更新 X 座標
    this.draggedSceneItem.y = newPosition.y + this.dragOffset.y; // 更新 Y 座標
  }

  // 重置場景
  reset() {
    this.container.removeChildren(); // 清空主容器
    this.sceneItems = []; // 清空場景物品列表
    this.selectedSceneItem = null; // 清空選中物品
    this.deleteButton = null; // 清空刪除按鈕
    this.selectionBorder = null; // 清空選中邊框
    this.draggedSceneItem = null; // 清空拖動的物品
  }
}
