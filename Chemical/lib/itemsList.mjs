import { Container, Sprite, Texture, Graphics, Text } from "./pixi.mjs";
import { listStyle } from "./textStyle.mjs";

export class ItemsList {
  constructor(images, itemCanvas, itemsPerPage = 5, selectedIndices = null) {
    this.container = new Container();
    this.itemCanvas = itemCanvas;
    this.allImages = images;

    this.initialIndices = selectedIndices ? [...selectedIndices] : null;

    this.images = selectedIndices ? selectedIndices.map((index) => images[index]) : images;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 0;
    this.items = [];
    this.draggedSprite = null;
    this.isDragging = false;
    this.dragStartPosition = null;

    if (selectedIndices && selectedIndices.length > 0) {
      // 只選擇指定索引的圖片
      this.images = selectedIndices.map((index) => this.allImages[index]);
    } else {
      // 如果沒有提供索引，則使用所有圖片
      this.images = [...this.allImages];
    }

    // 添加限制物件的追踪
    this.restrictedItems = {
      "燒杯.png": false,
      "廣用試紙.png": false,
      "藥品罐.png": false,
    };

    this.init();
    this.updateRestrictedItems(); // 初始檢查限制物件
  }

  // 檢查並更新限制物件的狀態
  updateRestrictedItems() {
    // 重置狀態
    Object.keys(this.restrictedItems).forEach((key) => {
      this.restrictedItems[key] = false;
    });

    // 檢查畫布上的每個物件
    this.itemCanvas.components.children.forEach((component) => {
      const type = component.type + ".png";
      if (this.restrictedItems.hasOwnProperty(type)) {
        this.restrictedItems[type] = true;
      }
    });

    // 更新顯示的項目
    this.updateDisplayedImages();
  }

  // 更新顯示的圖片
  updateDisplayedImages(selectedIndices = null) {
    if (selectedIndices && selectedIndices.length > 0) {
      // 使用新的選定索引
      this.images = selectedIndices.map((index) => this.allImages[index]);
    } else {
      // 如果沒有提供新的索引，保持當前的過濾狀態
      this.images = this.images.filter((imagePath) => {
        if (this.restrictedItems.hasOwnProperty(imagePath)) {
          return !this.restrictedItems[imagePath];
        }
        return true;
      });
    }

    this.currentPage = 0;
    this.createItems();
  }

  // 設置每頁顯示的項目數量並重置當前頁面。
  setItemsPerPage(count) {
    this.itemsPerPage = count;
    this.currentPage = 0;
    this.createItems();
  }

  // 初始化背景、頁面切換按鈕以及項目清單。
  init() {
    this.createBackground();
    this.createPageButtons();
    this.createItems();
  }

  // 建立背景圖形。
  createBackground() {
    // 確保移除舊的背景容器
    if (this.backgroundContainer) {
      this.container.removeChild(this.backgroundContainer);
    }

    // 創建新的背景容器
    this.backgroundContainer = new Container();
    this.container.addChild(this.backgroundContainer);

    // 創建背景方格
    for (let i = 0; i < this.itemsPerPage; i++) {
      const background = new Graphics();
      background.roundRect(0, 0, 120, 120, 15);
      background.fill(0xeeeeee);
      background.stroke({ width: 2, color: 0x3c3c3c });
      background.x = 50;
      background.y = 180 + i * 140;
      this.backgroundContainer.addChild(background);
    }
  }

  // 建立翻頁按鈕。
  createPageButtons() {
    this.upButton = new Graphics();
    this.upButton.roundRect(-40, -5, 120, 30, 5);
    this.upButton.fill(0xffffff);
    this.upButton.stroke({ width: 2, color: 0x3c3c3c });
    this.upButton.poly([0, 20, 20, 0, 40, 20]);
    this.upButton.fill(0xcccccc);
    this.upButton.x = 90;
    this.upButton.y = 140;
    this.upButton.eventMode = "static";
    this.upButton.cursor = "pointer";
    this.upButton.on("pointerdown", () => this.previousPage());
    this.container.addChild(this.upButton);

    this.downButton = new Graphics();
    this.downButton.roundRect(-40, -6, 120, 30, 5);
    this.downButton.fill(0xffffff);
    this.downButton.stroke({ width: 2, color: 0x3c3c3c });
    this.downButton.poly([0, 0, 20, 20, 40, 0]);
    this.downButton.fill(0xcccccc);
    this.downButton.x = 90;
    this.downButton.y = 880;
    this.downButton.eventMode = "static";
    this.downButton.cursor = "pointer";
    this.downButton.on("pointerdown", () => this.nextPage());
    this.container.addChild(this.downButton);
  }

  // 根據目前的頁面和分頁資訊建立或更新項目。
  createItems() {
    this.items.forEach((container) => this.container.removeChild(container));
    this.items = [];

    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.images.length);

    for (let i = startIndex; i < endIndex; i++) {
      const itemContainer = this.createDraggableItem(this.images[i], this.items.length);
      if (itemContainer) {
        this.items.push(itemContainer);
        this.container.addChild(itemContainer);
      }
    }

    this.updatePageButtonsVisibility();
  }

  // 建立可拖動的項目容器。
  createDraggableItem(imagePath, index) {
    const itemContainer = new Container();
    itemContainer.x = 110;
    itemContainer.y = 240 + index * 140;

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
    itemContainer.imagePath = imagePath;

    itemContainer.eventMode = "static";
    itemContainer.cursor = "pointer";

    itemContainer.on("pointerdown", (event) => this.onDragStart(event, itemContainer));
    itemContainer.on("pointerup", (event) => this.onDragEnd(event, itemContainer));
    itemContainer.on("pointerupoutside", (event) => this.onDragEnd(event, itemContainer));
    itemContainer.on("globalpointermove", (event) => this.onDragMove(event));

    return itemContainer;
  }

  // 建立拖動中的項目容器。
  createDraggedItem(sourceContainer, position) {
    const draggedContainer = new Container();
    draggedContainer.x = position.x;
    draggedContainer.y = position.y;

    const originalSprite = sourceContainer.children[0];
    const draggedSprite = new Sprite(originalSprite.texture);
    draggedSprite.anchor.set(0.5);
    draggedSprite.scale.set(draggedSprite.texture.width / Math.max(draggedSprite.texture.width, draggedSprite.texture.height));

    draggedContainer.addChild(draggedSprite);
    draggedContainer.dragging = true;

    return draggedContainer;
  }

  // 開始拖動項目。
  onDragStart(event, container) {
    if (this.isDragging) return;

    container.alpha = 0.5;
    const localPos = event.getLocalPosition(this.container);

    // 儲存拖曳起始位置
    this.dragStartPosition = { x: localPos.x, y: localPos.y };

    this.draggedSprite = this.createDraggedItem(container, {
      x: localPos.x,
      y: localPos.y,
    });
    this.draggedSprite.imagePath = container.imagePath;

    this.container.addChild(this.draggedSprite);
    this.isDragging = true;
  }

  // 結束拖動項目。
  onDragEnd(event, container) {
    if (!this.isDragging) return;

    container.alpha = 1;

    if (this.draggedSprite && this.dragStartPosition) {
      const currentPos = event.getLocalPosition(this.container);
      const dragDistance = Math.sqrt(Math.pow(currentPos.x - this.dragStartPosition.x, 2) + Math.pow(currentPos.y - this.dragStartPosition.y, 2));

      // 只有當拖曳距離大於閾值時才創建物件
      if (dragDistance > 200) {
        const imagePath = this.draggedSprite.imagePath;

        // 檢查是否是限制物件且已存在
        if (this.restrictedItems.hasOwnProperty(imagePath) && this.restrictedItems[imagePath]) {
          // 如果是已存在的限制物件，不創建新物件
          console.log(`${imagePath} 已經存在於畫布上`);
        } else {
          // 創建新物件
          const position = event.getLocalPosition(this.itemCanvas.container);
          this.itemCanvas.createSceneItem(imagePath, position);
          if (imagePath === "燒杯.png") {
            this.itemCanvas.beakerPlaced = true;
          }

          // 如果是限制物件，更新狀態並重新整理列表
          if (this.restrictedItems.hasOwnProperty(imagePath)) {
            this.restrictedItems[imagePath] = true;
            this.updateDisplayedImages();
          }
        }
      }

      this.container.removeChild(this.draggedSprite);
      this.draggedSprite = null;
      this.dragStartPosition = null;
    }

    this.isDragging = false;
  }

  // 拖動過程中更新項目位置。
  onDragMove(event) {
    if (!this.isDragging || !this.draggedSprite) return;

    const newPosition = event.getLocalPosition(this.container);
    this.draggedSprite.x = newPosition.x;
    this.draggedSprite.y = newPosition.y;
  }

  // 切換到下一頁。
  nextPage() {
    const maxPage = Math.ceil(this.images.length / this.itemsPerPage) - 1;
    if (this.currentPage < maxPage) {
      this.currentPage++;
      this.createItems();
    }
  }

  // 切換到上一頁。
  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.createItems();
    }
  }

  // 更新頁面按鈕的可見性。
  updatePageButtonsVisibility() {
    const maxPage = Math.ceil(this.images.length / this.itemsPerPage) - 1;
    this.upButton.visible = this.currentPage > 0;
    this.downButton.visible = this.currentPage < maxPage;
  }

  // 重置項目列表。
  reset() {
    this.container.removeChildren();

    // 重置所有狀態
    Object.keys(this.restrictedItems).forEach((key) => {
      this.restrictedItems[key] = false;
    });

    this.currentPage = 0;
    this.items = [];
    this.draggedSprite = null;
    this.isDragging = false;
    this.dragStartPosition = null;

    // 使用保存的初始索引重新初始化
    if (this.initialIndices) {
      this.images = this.initialIndices.map((index) => this.allImages[index]);
    } else {
      this.images = [...this.allImages];
    }

    this.init();
  }
}
