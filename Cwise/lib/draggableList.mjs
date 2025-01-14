import { Container, Sprite, Texture, Graphics, Text } from "./pixi.mjs";
import { listStyle } from "./textStyle.mjs";

export class DraggableList {
  constructor(images, itemsPerPage = 5, selectedIndices = null) {
    this.container = new Container();
    this.allImages = images; // 儲存所有圖片
    this.images = selectedIndices ? selectedIndices.map((index) => images[index]) : images;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 0;
    this.items = [];
    this.draggedSprite = null;
    this.dragOffset = { x: 0, y: 0 };
    // 記錄拖動開始的位置
    this.dragStartPosition = { x: 0, y: 0 };
    this.isDragging = false;
    // 用於存儲場景中的獨立可拖動項目
    this.sceneItems = [];
    // 當前被拖動的場景項目
    this.draggedSceneItem = null;
    // 追踪當前選中的場景項目
    this.selectedSceneItem = null;
    // 追踪刪除按鈕
    this.deleteButton = null;

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
  }

  createBackground() {
    // 創建底圖容器
    this.backgroundContainer = new Container();
    this.container.addChild(this.backgroundContainer);

    // 為每個項目位置創建圓角矩形底圖
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

  createPageButtons() {
    // 上一頁按鈕
    this.upButton = new Graphics();
    this.upButton.poly([0, 20, 20, 0, 40, 20]);
    this.upButton.fill(0xcccccc);
    this.upButton.x = 90;
    this.upButton.y = 110;
    this.upButton.eventMode = "static";
    this.upButton.cursor = "pointer";
    this.upButton.on("pointerdown", () => this.previousPage());
    this.container.addChild(this.upButton);

    // 下一頁按鈕
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

  createItems() {
    // 移除現有項目
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

  createDraggableItem(imagePath, index) {
    const itemContainer = new Container();
    itemContainer.x = 110;
    itemContainer.y = 210 + index * 140;

    const sprite = new Sprite(Texture.from(imagePath));
    sprite.anchor.set(0.5);
    const scale = 100 / Math.max(sprite.width, sprite.height);
    sprite.scale.set(scale);
    sprite.originalScale = scale;

    const fileName = imagePath.replace(".png", "");
    const listText = new Text({ text: fileName, style: listStyle });
    listText.anchor.set(0.5);
    listText.y = 40;

    itemContainer.addChild(sprite);
    itemContainer.addChild(listText);

    // 存儲圖片路徑，用於創建新的場景項目
    itemContainer.imagePath = imagePath;

    itemContainer.eventMode = "static";
    itemContainer.cursor = "pointer";

    itemContainer.on("pointerdown", (event) => this.onDragStart(event, itemContainer));
    itemContainer.on("pointerup", (event) => this.onDragEnd(event, itemContainer));
    itemContainer.on("pointerupoutside", (event) => this.onDragEnd(event, itemContainer));
    itemContainer.on("globalpointermove", (event) => this.onDragMove(event));

    return itemContainer;
  }

  createSceneItem(imagePath, position) {
    const sceneContainer = new Container();
    sceneContainer.x = position.x;
    sceneContainer.y = position.y;

    const sprite = new Sprite(Texture.from(imagePath));
    sprite.anchor.set(0.5);
    const scale = sprite.texture.width / Math.max(sprite.texture.width, sprite.texture.height);
    sprite.scale.set(scale);

    sceneContainer.addChild(sprite);

    sceneContainer.eventMode = "static";
    sceneContainer.cursor = "pointer";

    // 添加點擊事件處理
    sceneContainer.on("click", () => this.onSceneItemClick(sceneContainer));
    sceneContainer.on("pointerdown", (event) => this.onSceneItemDragStart(event, sceneContainer));
    sceneContainer.on("pointerup", (event) => this.onSceneItemDragEnd(event));
    sceneContainer.on("pointerupoutside", (event) => this.onSceneItemDragEnd(event));
    sceneContainer.on("globalpointermove", (event) => this.onSceneItemDragMove(event));

    return sceneContainer;
  }

  createDraggedItem(sourceContainer, position) {
    const draggedContainer = new Container();
    draggedContainer.x = position.x;
    draggedContainer.y = position.y;

    // 複製精靈
    const originalSprite = sourceContainer.children[0];
    const draggedSprite = new Sprite(originalSprite.texture);
    draggedSprite.anchor.set(0.5);
    draggedSprite.scale.set(draggedSprite.texture.width / Math.max(draggedSprite.texture.width, draggedSprite.texture.height));

    draggedContainer.addChild(draggedSprite);

    draggedContainer.dragging = true;

    return draggedContainer;
  }
  onDragStart(event, container) {
    if (this.isDragging) return;

    container.alpha = 0.5;
    const localPos = event.getLocalPosition(this.container);

    // 創建拖動的副本
    this.draggedSprite = this.createDraggedItem(container, {
      x: localPos.x,
      y: localPos.y,
    });

    // 存儲原始項目的圖片路徑
    this.draggedSprite.imagePath = container.imagePath;

    this.container.addChild(this.draggedSprite);
    this.isDragging = true;
  }

  onDragEnd(event, container) {
    if (!this.isDragging) return;

    container.alpha = 1;

    if (this.draggedSprite) {
      // 在放開時創建新的場景項目
      const position = event.getLocalPosition(this.container);
      const sceneItem = this.createSceneItem(this.draggedSprite.imagePath, position);
      this.sceneItems.push(sceneItem);
      this.container.addChild(sceneItem);

      // 移除拖動的預覽精靈
      this.container.removeChild(this.draggedSprite);
      this.draggedSprite = null;
    }

    this.isDragging = false;
  }

  onDragMove(event) {
    if (!this.isDragging || !this.draggedSprite) return;

    const newPosition = event.getLocalPosition(this.container);
    this.draggedSprite.x = newPosition.x;
    this.draggedSprite.y = newPosition.y;
  }

  // 創建選中框
  createSelectionBorder(sprite) {
    const texture = sprite.texture;
    const padding = 10;

    // Get base dimensions from texture
    const baseWidth = texture.orig.width || texture.baseTexture.width;
    const baseHeight = texture.orig.height || texture.baseTexture.height;

    // Calculate scaled dimensions
    const width = baseWidth * sprite.scale.x + padding * 2;
    const height = baseHeight * sprite.scale.y + padding * 2;

    const border = new Graphics();
    border.rect(-width / 2, -height / 2, width, height);
    border.stroke({ width: 4, color: 0xffffff });

    console.log("Border calc:", {
      baseWidth,
      baseHeight,
      scale: sprite.scale,
      finalWidth: width,
      finalHeight: height,
    });

    return border;
  }

  // 處理場景項目的點擊
  onSceneItemClick(sceneContainer) {
    // 如果正在拖動，不處理點擊
    if (this.isDragging || this.draggedSceneItem) return;

    // 如果已經有選中的項目，移除之前的刪除按鈕和選中框
    if (this.deleteButton) {
      this.container.removeChild(this.deleteButton);
      this.deleteButton = null;
    }
    if (this.selectionBorder) {
      this.container.removeChild(this.selectionBorder);
      this.selectionBorder = null;
    }

    // 如果點擊的是當前選中項目，取消選中
    if (this.selectedSceneItem === sceneContainer) {
      this.selectedSceneItem = null;
      return;
    }

    // 設置新的選中項目
    this.selectedSceneItem = sceneContainer;

    // 創建並添加選中框
    const sprite = sceneContainer.children[0];
    this.selectionBorder = this.createSelectionBorder(sprite);
    this.selectionBorder.x = sceneContainer.x;
    this.selectionBorder.y = sceneContainer.y;
    this.container.addChild(this.selectionBorder);

    // 將選中框放在容器的底層，這樣不會遮擋物件
    this.container.setChildIndex(this.selectionBorder, this.container.children.indexOf(sceneContainer));

    // 創建並添加刪除按鈕
    this.deleteButton = new Sprite(Texture.from("bin.png"));
    this.deleteButton.anchor.set(0.5);
    this.deleteButton.scale.set(0.13);
    this.deleteButton.x = sceneContainer.x + sceneContainer.children[0].width / 2;
    this.deleteButton.y = sceneContainer.y - sceneContainer.children[0].height / 2 - 40;

    // 添加刪除按鈕的點擊事件
    this.deleteButton.eventMode = "static";
    this.deleteButton.cursor = "pointer";
    this.deleteButton.on("click", () => this.deleteSceneItem(sceneContainer));
    this.deleteButton.on("tap", () => this.deleteSceneItem(sceneContainer));

    this.container.addChild(this.deleteButton);
  }

  // 刪除場景項目
  deleteSceneItem(sceneContainer) {
    // 從數組中移除
    const index = this.sceneItems.indexOf(sceneContainer);
    if (index > -1) {
      this.sceneItems.splice(index, 1);
    }

    // 從顯示列表中移除
    this.container.removeChild(sceneContainer);

    // 移除刪除按鈕
    if (this.deleteButton) {
      this.container.removeChild(this.deleteButton);
      this.deleteButton = null;
    }

    // 移除選中框
    if (this.selectionBorder) {
      this.container.removeChild(this.selectionBorder);
      this.selectionBorder = null;
    }

    // 清除選中狀態
    this.selectedSceneItem = null;
  }

  onSceneItemDragStart(event, container) {
    if (this.draggedSceneItem) return;

    // 如果有刪除按鈕和選中框，先移除它們
    if (this.deleteButton) {
      this.container.removeChild(this.deleteButton);
      this.deleteButton = null;
    }
    if (this.selectionBorder) {
      this.container.removeChild(this.selectionBorder);
      this.selectionBorder = null;
    }

    this.draggedSceneItem = container;
    container.alpha = 0.8;

    const localPos = event.getLocalPosition(container.parent);
    this.dragOffset = {
      x: container.x - localPos.x,
      y: container.y - localPos.y,
    };
  }

  onSceneItemDragEnd(event) {
    if (this.draggedSceneItem) {
      this.draggedSceneItem.alpha = 1;
      this.draggedSceneItem = null;
    }
  }

  onSceneItemDragMove(event) {
    if (!this.draggedSceneItem) return;

    const newPosition = event.getLocalPosition(this.container);
    this.draggedSceneItem.x = newPosition.x + this.dragOffset.x;
    this.draggedSceneItem.y = newPosition.y + this.dragOffset.y;
  }

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
}
