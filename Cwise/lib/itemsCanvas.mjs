import { Container, Sprite, Texture, Graphics } from "./pixi.mjs";

export class ItemsCanvas {
  constructor() {
    this.container = new Container();
    this.sceneItems = [];
    this.selectedSceneItem = null;
    this.deleteButton = null;
    this.selectionBorder = null;
    this.draggedSceneItem = null;
    this.dragOffset = { x: 0, y: 0 };
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

    sceneContainer.on("click", () => this.onSceneItemClick(sceneContainer));
    sceneContainer.on("pointerdown", (event) => this.onSceneItemDragStart(event, sceneContainer));
    sceneContainer.on("pointerup", (event) => this.onSceneItemDragEnd(event));
    sceneContainer.on("pointerupoutside", (event) => this.onSceneItemDragEnd(event));
    sceneContainer.on("globalpointermove", (event) => this.onSceneItemDragMove(event));

    this.sceneItems.push(sceneContainer);
    this.container.addChild(sceneContainer);

    return sceneContainer;
  }

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

  onSceneItemClick(sceneContainer) {
    if (this.draggedSceneItem) return;

    if (this.deleteButton) {
      this.container.removeChild(this.deleteButton);
      this.deleteButton = null;
    }
    if (this.selectionBorder) {
      this.container.removeChild(this.selectionBorder);
      this.selectionBorder = null;
    }

    if (this.selectedSceneItem === sceneContainer) {
      this.selectedSceneItem = null;
      return;
    }

    this.selectedSceneItem = sceneContainer;

    const sprite = sceneContainer.children[0];
    this.selectionBorder = this.createSelectionBorder(sprite);
    this.selectionBorder.x = sceneContainer.x;
    this.selectionBorder.y = sceneContainer.y;
    this.container.addChild(this.selectionBorder);

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

  deleteSceneItem(sceneContainer) {
    const index = this.sceneItems.indexOf(sceneContainer);
    if (index > -1) {
      this.sceneItems.splice(index, 1);
    }

    this.container.removeChild(sceneContainer);

    if (this.deleteButton) {
      this.container.removeChild(this.deleteButton);
      this.deleteButton = null;
    }

    if (this.selectionBorder) {
      this.container.removeChild(this.selectionBorder);
      this.selectionBorder = null;
    }

    this.selectedSceneItem = null;
  }

  onSceneItemDragStart(event, container) {
    if (this.draggedSceneItem) return;

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

    const localPos = event.getLocalPosition(this.container);
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

  reset() {
    this.container.removeChildren();
    this.sceneItems = [];
    this.selectedSceneItem = null;
    this.deleteButton = null;
    this.selectionBorder = null;
    this.draggedSceneItem = null;
  }
}
