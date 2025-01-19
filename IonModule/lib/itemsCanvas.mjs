import { Container, Sprite, Graphics, Text, Texture } from "./pixi.mjs";
import { defaultStyle2 } from "./textStyle.mjs";

export class ItemsCanvas {
  constructor() {
    this.container = new Container();
    this.dragTarget = null;
    this.dragStartPos = null;
    this.beakerPlaced = false;

    // 創建拖拽區域
    this.dragArea = new Graphics().rect(0, 0, 1920, 1080).fill({ color: 0x000000, alpha: 0 });
    this.dragArea.eventMode = "static";
    this.dragArea.cursor = "pointer";
    this.dragArea.zIndex = 9999;
    this.dragArea.visible = false;

    // 初始化容器
    this.components = new Container();
    this.container.addChild(this.dragArea, this.components);

    this.componentsToDelete = [];

    // 設置拖拽區域事件
    this.dragArea.on("pointermove", this.onDragMove.bind(this));
    this.dragArea.on("pointerup", this.onDragEnd.bind(this));
    this.dragArea.on("pointerupoutside", this.onDragEnd.bind(this));

    // 新增離子配置
    this.ionConfigs = {
      "燒杯.png": {
        positions: [],
        count: {
          positive: 15,
          negative: 15,
        },
      },
    };
  }

  setItemsList(itemsList) {
    this.itemsList = itemsList;
  }
  setIonModule(ionModule) {
    this.ionModule = ionModule;
  }
  createSceneItem(imagePath, position) {
    const sceneContainer = new Container();
    sceneContainer.x = position.x;
    sceneContainer.y = position.y;
    sceneContainer.type = imagePath.replace(".png", "");

    if (this.itemsList) {
      requestAnimationFrame(() => {
        this.itemsList.updateRestrictedItems();
      });
    }

    // 新增離子陣列到容器
    sceneContainer.ions = [];

    if (imagePath === "電線.png") {
      sceneContainer.type = "Wire";
      const wireBody = new Graphics();
      wireBody.eventMode = "static";
      wireBody.cursor = "pointer";
      wireBody.on("pointerdown", (event) => this.onDragStart(event, sceneContainer));

      const wire = new Graphics().moveTo(0, 0).lineTo(100, 0).stroke({ width: 20, color: 0xff8000 });

      sceneContainer.addChild(wireBody, wire);
    } else if (imagePath === "廣用試紙.png") {
      const paperBody = new Graphics().rect(-40, -100, 80, 200).fill(0x01ea00);
      const testStrip = new Graphics().rect(-40, 0, 80, 100).fill(0x01ea00);

      sceneContainer.testStrip = testStrip;
      sceneContainer.addChild(paperBody, testStrip);

      sceneContainer.getBounds = () => {
        return {
          x: sceneContainer.x - 15,
          y: sceneContainer.y - 100,
          width: 30,
          height: 200,
        };
      };
    } else {
      const sprite = new Sprite(Texture.from(imagePath));
      sprite.anchor.set(0.5);
      const scale = sprite.texture.width / Math.max(sprite.texture.width, sprite.texture.height);
      sprite.scale.set(scale);

      if (imagePath === "燒杯.png") {
        sceneContainer.zIndex = 1000;
        this.components.sortableChildren = true;
        sprite.scale.set(1);

        sceneContainer.getBounds = () => {
          return {
            x: sceneContainer.x - sprite.width / 2,
            y: sceneContainer.y - sprite.height / 2,
            width: sprite.width,
            height: sprite.height,
          };
        };
        sceneContainer.isBeaker = true;
      }
      if (imagePath === "藥品罐.png") {
        sprite.rotation = Math.PI / 1.5;
        sprite.scale.set(0.5);

        sceneContainer.getBounds = () => {
          return {
            x: sceneContainer.x - sprite.width / 2,
            y: sceneContainer.y - sprite.height / 2,
            width: sprite.width,
            height: sprite.height,
          };
        };
      }

      sceneContainer.addChild(sprite);
    }

    sceneContainer.eventMode = "static";
    sceneContainer.cursor = "pointer";
    sceneContainer.on("pointerdown", (event) => this.onDragStart(event, sceneContainer));

    this.components.addChild(sceneContainer);
    return sceneContainer;
  }
  // 新的燒杯離子創建方法
  createBeakerIons(container) {
    const { positive, negative } = this.ionConfigs["燒杯.png"].count;
    const beakerWidth = 160; // 燒杯寬度
    const beakerHeight = 80; // 燒杯高度

    // 創建正離子
    for (let i = 0; i < positive; i++) {
      const ion = this.createIon(true);
      this.setRandomPosition(ion, beakerWidth, beakerHeight);
      container.addChild(ion);
      container.ions.push(ion);
    }

    // 創建負離子
    for (let i = 0; i < negative; i++) {
      const ion = this.createIon(false);
      this.setRandomPosition(ion, beakerWidth, beakerHeight);
      container.addChild(ion);
      container.ions.push(ion);
    }
  }

  // 創建單個離子
  createIon(isPositive) {
    const ion = new Graphics();
    // 離子主體
    ion.circle(0, 0, 10);
    ion.fill(isPositive ? 0xff0000 : 0x0000ff);

    // 正負極標誌

    if (isPositive) {
      // 正號
      ion.rect(-6, -1, 12, 3);
      ion.rect(-1, -6, 3, 12);
    } else {
      // 負號
      ion.rect(-6, -1, 12, 3);
    }
    ion.fill(0xffffff);
    ion.isPositive = isPositive;
    ion.visible = false;

    return ion;
  }

  setRandomPosition(ion, width, height) {
    ion.x = Math.random() * 260 - 100;
    ion.y = Math.random() * 230 - 70;
  }

  onDragStart(event, target) {
    if (!event || !target) return;
    if (target.isBeaker && this.beakerPlaced) {
      return;
    }
    if (target.type === "藥品罐") {
      const startPos = { x: event.global.x, y: event.global.y };

      const checkClick = setTimeout(() => {
        const currentPos = { x: event.global.x, y: event.global.y };
        const distance = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2));

        if (distance < 5 && this.ionModule) {
          this.ionModule.handleBottleAnimation(target);
          return;
        }
      }, 100);

      const clearCheck = () => {
        clearTimeout(checkClick);
        target.off("pointermove", clearCheck);
      };
      target.on("pointermove", clearCheck);
    }

    this.dragTarget = target;
    this.dragStartPos = {
      x: event.global.x || 0,
      y: event.global.y || 0,
    };

    this.dragArea.visible = true;
    target.alpha = 0.5;

    const globalPos = this.dragTarget.toGlobal({ x: 0, y: 0 });
    this.dragTarget.offset = {
      x: globalPos.x - event.global.x,
      y: globalPos.y - event.global.y,
    };
  }

  onDragMove(event) {
    if (!this.dragTarget || !event?.global) return;
    const newPos = this.dragTarget.parent.toLocal(event.global);
    this.dragTarget.position.set(newPos.x, newPos.y);
  }

  onDragEnd() {
    if (this.dragTarget) {
      this.dragArea.visible = false;
      this.dragTarget.alpha = 1;
      this.dragTarget = null;
      this.dragStartPos = null;
    }
  }

  reset() {
    this.components.removeChildren();
    this.dragTarget = null;
    this.dragArea.visible = false;
    this.dragStartPos = null;
    this.beakerPlaced = false;

    if (this.itemsList) {
      Object.keys(this.itemsList.restrictedItems).forEach((key) => {
        this.itemsList.restrictedItems[key] = false;
      });
      this.itemsList.updateDisplayedImages(this.itemsList.initialIndices);
    }
  }
}
