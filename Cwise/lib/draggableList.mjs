import { Container, Sprite, Texture, Graphics, Text } from "./pixi.mjs";
import { ConnectionPointsConfig, ConnectionPoint, ConnectionGroup } from "./connectionPoint.mjs";
import { Wire } from "./wire.mjs";
import { listStyle } from "./textStyle.mjs";

export class DraggableList {
  constructor(images, itemsPerPage = 5, selectedIndices = null) {
    this.container = new Container();

    this.allImages = images; // 儲存所有圖片
    this.images = selectedIndices ? selectedIndices.map((index) => images[index]) : images;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 0;
    this.items = [];

    // 拖曳預覽相關
    this.draggedSprite = null;
    this.dragOffset = { x: 0, y: 0 };
    this.dragStartPosition = { x: 0, y: 0 };
    this.isDragging = false;

    // 場景中可拖動的物件
    this.sceneItems = [];
    // 正在拖動的場景物件
    this.draggedSceneItem = null;
    // 追踪目前選中的場景項目（用來顯示刪除按鈕、選框）
    this.selectedSceneItem = null;
    // 刪除按鈕
    this.deleteButton = null;

    // 電線、群組
    this.wires = new Set();
    this.connectionGroups = new Set();
    this.activeWire = null;
    this.draggingWire = false;

    // 場景容器
    this.sceneItemsContainer = new Container();
    this.container.addChild(this.sceneItemsContainer);

    this.init();
  }

  updateDisplayedImages(selectedIndices) {
    this.images = selectedIndices.map((index) => this.allImages[index]);
    this.currentPage = 0;
    this.createItems();
  }

  setItemsPerPage(count) {
    this.itemsPerPage = count;
    this.currentPage = 0;
    this.createItems();
  }

  init() {
    this.createBackground();
    this.createPageButtons();
    this.createItems();
    this.container.addChild(this.sceneItemsContainer);
  }

  /**
   * 建立背景：底圖容器 + 圓角矩形格子
   */
  createBackground() {
    this.backgroundContainer = new Container();
    this.container.addChild(this.backgroundContainer);

    for (let i = 0; i < this.itemsPerPage; i++) {
      const background = new Graphics();
      background.roundRect(0, 0, 120, 120, 15);
      background.fill(0xeeeeee);
      background.stroke({ width: 2, color: 0x3c3c3c });
      background.x = 50;
      background.y = 150 + i * 140;
      this.backgroundContainer.addChild(background);
    }
  }

  /**
   * 建立上一頁/下一頁按鈕
   */
  createPageButtons() {
    // 上一頁
    this.upButton = new Graphics();
    this.upButton.poly([0, 20, 20, 0, 40, 20]);
    this.upButton.fill(0xcccccc);
    this.upButton.x = 90;
    this.upButton.y = 110;
    this.upButton.eventMode = "static";
    this.upButton.cursor = "pointer";
    this.upButton.on("pointerdown", () => this.previousPage());
    this.container.addChild(this.upButton);

    // 下一頁
    this.downButton = new Graphics();
    this.downButton.poly([0, 0, 20, 20, 40, 0]);
    this.downButton.fill(0xcccccc);
    this.downButton.x = 90;
    this.downButton.y = 850;
    this.downButton.eventMode = "static";
    this.downButton.cursor = "pointer";
    this.downButton.on("pointerdown", () => this.nextPage());
    this.container.addChild(this.downButton);
  }

  /**
   * 創建清單項目
   */
  createItems() {
    // 先移除舊的
    this.items.forEach((container) => this.container.removeChild(container));
    this.items = [];

    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.images.length);

    for (let i = startIndex; i < endIndex; i++) {
      const itemContainer = this.createDraggableItem(this.images[i], i - startIndex);
      this.items.push(itemContainer);
      this.container.addChild(itemContainer);
    }

    this.updatePageButtonsVisibility();
  }

  /**
   * 建立可拖曳或可點擊的清單項目
   */
  createDraggableItem(imagePath, index) {
    const itemContainer = new Container();
    itemContainer.x = 110;
    itemContainer.y = 210 + index * 140;

    // 預覽圖
    const sprite = new Sprite(Texture.from(imagePath));
    sprite.anchor.set(0.5);
    const scale = 100 / Math.max(sprite.width, sprite.height);
    sprite.scale.set(scale);

    // 顯示圖檔名稱
    const fileName = imagePath.replace(".png", "");
    const listText = new Text({ text: fileName, style: listStyle });
    listText.anchor.set(0.5);
    listText.y = 40;

    itemContainer.addChild(sprite, listText);
    itemContainer.imagePath = imagePath;

    // 若是電線
    if (fileName === "電線") {
      itemContainer.eventMode = "static";
      itemContainer.cursor = "pointer";
      itemContainer.on("pointerdown", (event) => this.onWireDragStart(event));
      itemContainer.on("pointerup", () => this.onWireDragEnd());
      itemContainer.on("pointerupoutside", () => this.onWireDragEnd());
      itemContainer.on("globalpointermove", (event) => this.onWireDragMove(event));

      // 也可直接建立固定長度電線
      itemContainer.on("pointerdown", () => {
        const wire = new Wire(this.sceneItemsContainer, 100); // 例：長度100
        wire.setInitialPosition({ x: 300, y: 300 });
        this.sceneItems.push(wire.wire);
      });
    } else {
      // 一般物件 -> 可拖曳
      itemContainer.eventMode = "static";
      itemContainer.cursor = "pointer";
      itemContainer.on("pointerdown", (event) => this.onDragStart(event, itemContainer));
      itemContainer.on("pointerup", (event) => this.onDragEnd(event, itemContainer));
      itemContainer.on("pointerupoutside", (event) => this.onDragEnd(event, itemContainer));
      itemContainer.on("globalpointermove", (event) => this.onDragMove(event));
    }

    return itemContainer;
  }

  /**
   * 在場景中建立實際的物件 (SceneItem)，包含連接點
   */
  createSceneItem(imagePath, position) {
    const sceneContainer = new Container();
    sceneContainer.x = position.x;
    sceneContainer.y = position.y;

    // 主圖
    const sprite = new Sprite(Texture.from(imagePath));
    sprite.anchor.set(0.5);
    const scale = sprite.texture.width / Math.max(sprite.texture.width, sprite.texture.height);
    sprite.scale.set(scale);

    sceneContainer.addChild(sprite);

    // 建立連接點 (依照 ConnectionPointsConfig)
    const fileName = imagePath.replace(".png", "");
    const pointsConfig = ConnectionPointsConfig[fileName] || ConnectionPointsConfig.default;

    sceneContainer.connectionPoints = pointsConfig.map((config) => {
      const point = new ConnectionPoint(config.x, config.y, sceneContainer);
      sceneContainer.addChild(point.point);

      // 點下連接點可拉線
      point.point.eventMode = "static";
      point.point.cursor = "pointer";
      point.point.on("pointerdown", (event) => {
        if (!this.draggingWire) {
          this.startWireDrag(point, event);
        }
      });

      return point;
    });

    // 讓此場景物件本身可拖曳
    sceneContainer.eventMode = "static";
    sceneContainer.cursor = "pointer";

    // 點擊顯示選擇框 + 刪除按鈕
    sceneContainer.on("click", () => this.onSceneItemClick(sceneContainer));

    // 物件本身被拖曳
    sceneContainer.on("pointerdown", (event) => this.onSceneItemDragStart(event, sceneContainer));
    sceneContainer.on("pointerup", (event) => this.onSceneItemDragEnd(event));
    sceneContainer.on("pointerupoutside", (event) => this.onSceneItemDragEnd(event));
    sceneContainer.on("globalpointermove", (event) => this.onSceneItemDragMove(event));

    return sceneContainer;
  }

  /**
   * 建立被拖曳的預覽 (複製)
   */
  createDraggedItem(sourceContainer, position) {
    const draggedContainer = new Container();
    draggedContainer.x = position.x;
    draggedContainer.y = position.y;

    // 複製原 sprite
    const originalSprite = sourceContainer.children[0];
    const draggedSprite = new Sprite(originalSprite.texture);
    draggedSprite.anchor.set(0.5);
    draggedSprite.scale.set(draggedSprite.texture.width / Math.max(draggedSprite.texture.width, draggedSprite.texture.height));

    draggedContainer.addChild(draggedSprite);
    draggedContainer.dragging = true;
    return draggedContainer;
  }

  /**
   * 清單項目 -> 拖曳開始
   */
  onDragStart(event, container) {
    if (this.isDragging) return;

    container.alpha = 0.5;
    const localPos = event.getLocalPosition(this.container);

    // **重要：記住拖曳起始位置，以便計算拖曳距離**
    this.dragStartPosition = { x: localPos.x, y: localPos.y };
    this.isDragging = true;

    // 建立拖曳預覽
    this.draggedSprite = this.createDraggedItem(container, {
      x: localPos.x,
      y: localPos.y,
    });
    this.draggedSprite.imagePath = container.imagePath;

    this.container.addChild(this.draggedSprite);
  }

  /**
   * 清單項目 -> 拖曳移動
   */
  onDragMove(event) {
    if (!this.isDragging || !this.draggedSprite) return;
    const newPos = event.getLocalPosition(this.container);
    this.draggedSprite.x = newPos.x;
    this.draggedSprite.y = newPos.y;
  }

  /**
   * 清單項目 -> 拖曳結束
   */
  onDragEnd(event, container) {
    if (!this.isDragging) return;
    container.alpha = 1;

    if (this.draggedSprite) {
      // 判斷拖曳距離
      const endPos = event.getLocalPosition(this.container);
      const dragDistance = Math.sqrt(Math.pow(endPos.x - this.dragStartPosition.x, 2) + Math.pow(endPos.y - this.dragStartPosition.y, 2));

      // 若足夠遠 -> 產生場景物件
      if (dragDistance > 20) {
        const position = event.getLocalPosition(this.sceneItemsContainer);
        const sceneItem = this.createSceneItem(this.draggedSprite.imagePath, {
          x: position.x,
          y: position.y,
        });

        this.sceneItems.push(sceneItem);
        this.sceneItemsContainer.addChild(sceneItem);
      }

      // 移除預覽
      this.container.removeChild(this.draggedSprite);
      this.draggedSprite = null;
    }

    this.isDragging = false;
  }

  /**
   * 拉線(電線)相關：pointerdown -> 建立 wirePreview
   */
  onWireDragStart(event) {
    const startPos = event.getLocalPosition(this.sceneItemsContainer);
    this.wirePreview = new Wire(startPos, startPos);
    this.sceneItemsContainer.addChild(this.wirePreview);
    this.isDragging = true;

    // 監聽移動/結束
    this.sceneItemsContainer.on("globalpointermove", (e) => this.onWireDragMove(e));
    this.sceneItemsContainer.on("pointerup", () => this.onWireDragEnd());
    this.sceneItemsContainer.on("pointerupoutside", () => this.onWireDragEnd());
  }

  /**
   * 拉線移動
   */
  onWireDragMove(event) {
    if (!this.wirePreview || !this.isDragging) return;
    const newPos = event.getLocalPosition(this.sceneItemsContainer);
    this.wirePreview.updateEndPoint(newPos);

    // 吸附提醒
    this.highlightNearbyPoints(newPos);
  }

  /**
   * 拉線結束
   */
  onWireDragEnd() {
    if (!this.wirePreview) return;

    const startPos = {
      x: this.wirePreview.startConnector.x,
      y: this.wirePreview.startConnector.y,
    };
    const endPos = {
      x: this.wirePreview.endConnector.x,
      y: this.wirePreview.endConnector.y,
    };

    // 判斷線段長度
    const distance = Math.sqrt(Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2));

    // 太短 -> 刪除
    if (distance < 20) {
      this.wirePreview.destroy();
      this.wirePreview = null;
      this.isDragging = false;
      return;
    }

    // 找起點/終點是否有連接點
    const startPoint = this.findNearbyConnectionPoint(startPos);
    const endPoint = this.findNearbyConnectionPoint(endPos);

    if (startPoint && endPoint) {
      // 吸附 + 群組
      const startGlobalPos = startPoint.getGlobalPosition();
      const endGlobalPos = endPoint.getGlobalPosition();
      this.wirePreview.updatePositions(startGlobalPos, endGlobalPos);

      this.handleConnectionGroups(startPoint, endPoint, this.wirePreview);

      startPoint.wires.add(this.wirePreview);
      endPoint.wires.add(this.wirePreview);
    } else {
      this.wirePreview.destroy();
    }

    this.wirePreview = null;
    this.isDragging = false;
    this.unhighlightAllPoints();
  }

  /**
   * 建立 or 合併 群組
   */
  handleConnectionGroups(startPoint, endPoint, wire) {
    if (!startPoint.group && !endPoint.group) {
      const newGroup = new ConnectionGroup();
      newGroup.addPoint(startPoint);
      newGroup.addPoint(endPoint);
      newGroup.addWire(wire);
      this.connectionGroups.add(newGroup);
    } else if (startPoint.group && !endPoint.group) {
      startPoint.group.addPoint(endPoint);
      startPoint.group.addWire(wire);
    } else if (!startPoint.group && endPoint.group) {
      endPoint.group.addPoint(startPoint);
      endPoint.group.addWire(wire);
    } else if (startPoint.group !== endPoint.group) {
      // 合併
      const group1 = startPoint.group;
      const group2 = endPoint.group;
      group1.merge(group2);
      group1.addWire(wire);
      this.connectionGroups.delete(group2);
    } else {
      // 同群組
      startPoint.group.addWire(wire);
    }
  }

  /**
   * 創建選中框
   */
  createSelectionBorder(sprite) {
    const texture = sprite.texture;
    const padding = 10;

    const baseWidth = texture.orig.width || texture.baseTexture.width;
    const baseHeight = texture.orig.height || texture.baseTexture.height;

    const width = baseWidth * sprite.scale.x + padding * 2;
    const height = baseHeight * sprite.scale.y + padding * 2;

    const border = new Graphics();
    border.rect(-width / 2, -height / 2, width, height);
    border.stroke({ width: 4, color: 0xffffff });
    return border;
  }

  /**
   * 點擊場景物件 -> 顯示選中框 + 刪除按鈕
   */
  onSceneItemClick(sceneContainer) {
    if (this.isDragging || this.draggedSceneItem) return;

    // 移除舊刪除按鈕/框
    if (this.deleteButton) {
      this.container.removeChild(this.deleteButton);
      this.deleteButton = null;
    }
    if (this.selectionBorder) {
      this.container.removeChild(this.selectionBorder);
      this.selectionBorder = null;
    }

    // 若重複點同物件 -> 取消選取
    if (this.selectedSceneItem === sceneContainer) {
      this.selectedSceneItem = null;
      return;
    }

    // 設新選取
    this.selectedSceneItem = sceneContainer;
    const sprite = sceneContainer.children[0];

    this.selectionBorder = this.createSelectionBorder(sprite);
    this.selectionBorder.x = sceneContainer.x;
    this.selectionBorder.y = sceneContainer.y;
    this.sceneItemsContainer.addChild(this.selectionBorder);

    // 刪除按鈕
    this.deleteButton = new Sprite(Texture.from("bin.png"));
    this.deleteButton.anchor.set(0.5);
    // 先縮放大一點，再疊加更小倍數
    this.deleteButton.scale.set(0.2);
    this.deleteButton.scale.set(0.13);

    this.deleteButton.x = sceneContainer.x + sceneContainer.children[0].width / 2;
    this.deleteButton.y = sceneContainer.y - sceneContainer.children[0].height / 2 - 40;

    this.deleteButton.eventMode = "static";
    this.deleteButton.cursor = "pointer";
    this.deleteButton.on("click", () => this.deleteSceneItem(sceneContainer));
    this.deleteButton.on("tap", () => this.deleteSceneItem(sceneContainer));

    this.sceneItemsContainer.addChild(this.deleteButton);
  }

  /**
   * 刪除場景物件
   */
  deleteSceneItem(sceneContainer) {
    const index = this.sceneItems.indexOf(sceneContainer);
    if (index > -1) {
      this.sceneItems.splice(index, 1);
    }

    // 刪除所有與此物件連接點有關的電線
    sceneContainer.connectionPoints.forEach((point) => {
      const group = point.group;
      if (group) {
        group.removePoint(point);
        point.wires.forEach((wire) => {
          wire.destroy();
          group.removeWire(wire);
        });
        point.wires.clear();
        if (group.points.size === 0 && group.wires.size === 0) {
          this.connectionGroups.delete(group);
        }
      }
    });

    // 也從場景容器移除
    this.sceneItemsContainer.removeChild(sceneContainer);

    if (this.deleteButton) {
      this.sceneItemsContainer.removeChild(this.deleteButton);
      this.deleteButton = null;
    }
    if (this.selectionBorder) {
      this.sceneItemsContainer.removeChild(this.selectionBorder);
      this.selectionBorder = null;
    }

    this.selectedSceneItem = null;
  }

  /**
   * 場景物件 -> pointerdown 拖曳開始
   */
  onSceneItemDragStart(event, container) {
    if (this.draggedSceneItem) return;

    // 移除刪除按鈕 + 選取框
    if (this.deleteButton) {
      this.sceneItemsContainer.removeChild(this.deleteButton);
      this.deleteButton = null;
    }
    if (this.selectionBorder) {
      this.sceneItemsContainer.removeChild(this.selectionBorder);
      this.selectionBorder = null;
    }

    this.draggedSceneItem = container;
    container.alpha = 0.8;

    // 計算偏移
    const localPos = event.getLocalPosition(this.sceneItemsContainer);
    this.dragOffset = {
      x: container.x - localPos.x,
      y: container.y - localPos.y,
    };
  }

  /**
   * 場景物件 -> pointerup 拖曳結束
   */
  onSceneItemDragEnd(event) {
    if (this.draggedSceneItem) {
      this.draggedSceneItem.alpha = 1;
      this.draggedSceneItem = null;
    }
  }

  /**
   * 場景物件 -> pointermove 拖曳中
   */
  onSceneItemDragMove(event) {
    if (!this.draggedSceneItem) return;
    const newPosition = event.getLocalPosition(this.sceneItemsContainer);
    this.draggedSceneItem.x = newPosition.x + this.dragOffset.x;
    this.draggedSceneItem.y = newPosition.y + this.dragOffset.y;
  }

  /**
   * 由點擊連接點開始拉線
   */
  startWireDrag(startPoint, event) {
    const globalStartPos = startPoint.getGlobalPosition();
    this.activeWire = new Wire(globalStartPos, this.sceneItemsContainer);
    this.draggingWire = true;

    const wireMove = (moveEvent) => {
      if (this.activeWire) {
        const newPos = moveEvent.getLocalPosition(this.sceneItemsContainer);
        this.activeWire.updateEndPoint(newPos);
        this.highlightNearbyPoints(newPos);
      }
    };

    const wireEnd = (endEvent) => {
      if (this.activeWire) {
        const endPos = endEvent.getLocalPosition(this.sceneItemsContainer);
        const nearbyPoint = this.findNearbyConnectionPoint(endPos);

        if (nearbyPoint) {
          // 吸附
          const globalEndPos = nearbyPoint.getGlobalPosition();
          this.activeWire.updateEndPoint(globalEndPos);
          this.wires.add(this.activeWire);

          startPoint.wires.add(this.activeWire);
          nearbyPoint.wires.add(this.activeWire);
        } else {
          // 無法連接 -> 刪除
          this.activeWire.destroy();
        }
      }

      this.activeWire = null;
      this.draggingWire = false;
      this.unhighlightAllPoints();

      this.sceneItemsContainer.off("globalpointermove", wireMove);
      this.sceneItemsContainer.off("pointerup", wireEnd);
      this.sceneItemsContainer.off("pointerupoutside", wireEnd);
    };

    this.sceneItemsContainer.on("globalpointermove", wireMove);
    this.sceneItemsContainer.on("pointerup", wireEnd);
    this.sceneItemsContainer.on("pointerupoutside", wireEnd);
  }

  /**
   * 在給定位置找最近連接點
   */
  findNearbyConnectionPoint(position, threshold = 20) {
    for (const item of this.sceneItems) {
      if (!item.connectionPoints) continue;
      for (const point of item.connectionPoints) {
        if (point.isNearby(position, threshold)) {
          return point;
        }
      }
    }
    return null;
  }

  highlightNearbyPoints(position) {
    this.unhighlightAllPoints();
    const nearbyPoint = this.findNearbyConnectionPoint(position);
    if (nearbyPoint) {
      nearbyPoint.show();
    }
  }

  unhighlightAllPoints() {
    for (const item of this.sceneItems) {
      if (!item.connectionPoints) continue;
      for (const point of item.connectionPoints) {
        point.hide();
      }
    }
  }

  /**
   * 翻頁功能
   */
  nextPage() {
    const maxPage = Math.ceil(this.images.length / this.itemsPerPage) - 1;
    if (this.currentPage < maxPage) {
      this.currentPage++;
      this.createItems();
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.createItems();
    }
  }

  updatePageButtonsVisibility() {
    const maxPage = Math.ceil(this.images.length / this.itemsPerPage) - 1;
    this.upButton.visible = this.currentPage > 0;
    this.downButton.visible = this.currentPage < maxPage;
  }

  reset() {
    this.container.removeChildren();
    this.sceneItemsContainer.removeChildren();
    this.init();
  }
}
