import { Container, Sprite, Texture, Graphics, Text } from "./pixi.mjs";
import { listStyle } from "./textStyle.mjs";

export class ItemsList {
  constructor(images, itemCanvas, itemsPerPage = 5, selectedIndices = null) {
    this.container = new Container();
    this.itemCanvas = itemCanvas;

    this.allImages = images;
    this.images = selectedIndices ? selectedIndices.map((index) => images[index]) : images;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 0;
    this.items = [];
    this.draggedSprite = null;
    this.isDragging = false;

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

  createPageButtons() {
    this.upButton = new Graphics();
    this.upButton.poly([0, 20, 20, 0, 40, 20]);
    this.upButton.fill(0xcccccc);
    this.upButton.x = 90;
    this.upButton.y = 110;
    this.upButton.eventMode = "static";
    this.upButton.cursor = "pointer";
    this.upButton.on("pointerdown", () => this.previousPage());
    this.container.addChild(this.upButton);

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
    itemContainer.imagePath = imagePath;

    itemContainer.eventMode = "static";
    itemContainer.cursor = "pointer";

    itemContainer.on("pointerdown", (event) => this.onDragStart(event, itemContainer));
    itemContainer.on("pointerup", (event) => this.onDragEnd(event, itemContainer));
    itemContainer.on("pointerupoutside", (event) => this.onDragEnd(event, itemContainer));
    itemContainer.on("globalpointermove", (event) => this.onDragMove(event));

    return itemContainer;
  }

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

  onDragStart(event, container) {
    if (this.isDragging) return;

    container.alpha = 0.5;
    const localPos = event.getLocalPosition(this.container);

    this.draggedSprite = this.createDraggedItem(container, {
      x: localPos.x,
      y: localPos.y,
    });
    this.draggedSprite.imagePath = container.imagePath;

    this.container.addChild(this.draggedSprite);
    this.isDragging = true;
  }

  onDragEnd(event, container) {
    if (!this.isDragging) return;

    container.alpha = 1;

    if (this.draggedSprite) {
      const position = event.getLocalPosition(this.itemCanvas.container);
      this.itemCanvas.createSceneItem(this.draggedSprite.imagePath, position);

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
    this.init();
  }
}
