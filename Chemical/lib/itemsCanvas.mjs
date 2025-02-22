import { Container, Sprite, Graphics, Texture, ColorMatrixFilter, Text } from "./pixi.mjs";
import { listStyle } from "./textStyle.mjs";

export class ItemsCanvas {
  constructor() {
    this.container = new Container();
    this.dragTarget = null;
    this.dragStartPos = null;
    this.rotationCenter = null;
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

    // 設置拖拽區域事件
    this.dragArea.on("pointermove", this.onDragMove.bind(this));
    this.dragArea.on("pointerup", this.onDragEnd.bind(this));
    this.dragArea.on("pointerupoutside", this.onDragEnd.bind(this));

    // 定義不同物品的連結點配置 (只用於視覺顯示)
    this.jointConfigs = {
      "電池.png": [
        { x: 1, y: 0.5 }, // 右側中間
        { x: 0, y: 0.5 }, // 左側中間
      ],
      "燈泡.png": [
        { x: 0.5, y: 1 }, // 底部中間
        { x: 0.8, y: 0.8 }, // 右側下方
      ],
      "電線.png": [
        { x: 1, y: 0.5 }, // 右側中間
        { x: 0, y: 0.5 }, // 左側中間
      ],
      "檢流計.png": [
        { x: 1, y: 0.5 }, // 右側中間
        { x: 0, y: 0.5 }, // 左側中間
      ],
      "U型管.png": [
        { x: 1, y: 0.5 }, // 右側中間
        { x: 0, y: 0.5 }, // 左側中間
      ],
    };

    // 新增離子配置
    this.ionConfigs = {
      "燒杯.png": {
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
  setElectron(electron) {
    this.electron = electron;
  }
  setElectrolysisModule(electrolysisModule) {
    this.electrolysisModule = electrolysisModule;
  }

  createSceneItem(imagePath, position) {
    const sceneContainer = new Container();
    sceneContainer.x = position.x;
    sceneContainer.y = position.y;
    sceneContainer.connectedComponent = -1;
    sceneContainer.type = imagePath.replace(".png", "");

    if (this.itemsList) {
      this.itemsList.updateRestrictedItems();
    }

    // 新增離子陣列到容器
    sceneContainer.ions = [];

    if (imagePath === "電線.png") {
      // 移除電線的離子創建，保持其他電線相關代碼
      sceneContainer.type = "Wire";
      const wireBody = new Graphics();
      wireBody.eventMode = "static";
      wireBody.cursor = "pointer";
      wireBody.on("pointerdown", (event) => this.onDragStart(event, sceneContainer));

      sceneContainer.joints = [];
      for (let i = 0; i < 2; i++) {
        const joint = new Graphics().circle(0, 0, 21).fill({ color: 0x00ff00, alpha: 0.5 }).stroke({ color: 0x00ff00, width: 2 });

        joint.eventMode = "static";
        joint.cursor = "pointer";
        joint.position.set(i * 100, 0);
        joint.connected = false;
        joint.isJoint = true;
        joint.zIndex = 3;
        joint.on("pointerdown", (event) => this.onDragStart(event, sceneContainer, joint));

        sceneContainer.joints.push(joint);
        sceneContainer.addChild(joint);
      }

      sceneContainer.addChild(wireBody);
      sceneContainer.wireBody = wireBody;
      sceneContainer.redrawWire = function () {
        this.wireBody.clear();
        this.wireBody.moveTo(this.joints[0].x, this.joints[0].y).lineTo(this.joints[1].x, this.joints[1].y).stroke({
          width: 25, // 稍微比主線寬一些
          color: 0x000000, // 外邊框顏色（白色）
          cap: "round",
        });

        // 再畫主要的線條（上層）
        this.wireBody.moveTo(this.joints[0].x, this.joints[0].y).lineTo(this.joints[1].x, this.joints[1].y).stroke({
          width: 20,
          color: 0xff8000, // 主線顏色（橙色）
          cap: "round",
        });
      };

      sceneContainer.redrawWire();
    } else if (imagePath === "廣用試紙.png") {
      const paperBody = new Graphics().rect(-40, -150, 80, 300).fill(0x01ea00);

      // 創建測試區域（會變色的部分）
      const testStrip = new Graphics().rect(-40, 0, 80, 150).fill(0x01ea00);

      sceneContainer.testStrip = testStrip; // 存儲測試區域的引用
      sceneContainer.addChild(paperBody, testStrip);

      // 廣用試紙不需要連結點
      sceneContainer.joints = [];
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
      sprite.scale.set(0.6);

      const jointConfig = this.jointConfigs[imagePath] || [];
      sceneContainer.joints = jointConfig.map((config) => {
        const joint = new Graphics().circle(0, 0, 21).fill({ color: 0x00ff00, alpha: 0.5 }).stroke({ color: 0x00ff00, width: 2 });

        joint.position.set((config.x - 0.5) * sprite.width, (config.y - 0.5) * sprite.height);
        joint.connected = false;
        joint.eventMode = "static";
        joint.cursor = "pointer";
        joint.isJoint = true;
        joint.on("pointerdown", (event) => this.onDragStart(event, sceneContainer, joint));
        return joint;
      });
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
        this.createBeakerIons(sceneContainer);
        sceneContainer.joints.forEach((joint) => {
          joint.visible = false;
        });

        if (this.electrolysisModule.selectedSolution) {
          const solutionProps = this.electrolysisModule.solutionProperties[this.electrolysisModule.selectedSolution];
          if (solutionProps.color === "white") {
            sceneContainer.filters = [new ColorMatrixFilter()];
            sceneContainer.filters[0].brightness(2); // 稍微提高亮度使其更白
          } else {
            sceneContainer.tint = solutionProps.color === "transparent" ? 0xffffff : this.electrolysisModule.colorToHex(solutionProps.color);
          }
        }
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
      } else if (imagePath === "碳棒.png") {
        sprite.visible = false;
        const rodBody = new Graphics().rect(-30, -125, 60, 250).fill(0x333333);
        const text = new Text({
          text: "碳棒",
          style: listStyle,
        });
        text.anchor.set(0.5);
        sceneContainer.addChild(rodBody, text);
      }

      sceneContainer.addChild(sprite);
    }

    // Add joints and assign pointerdown, but skip for beaker so it doesn't block test paper events
    sceneContainer.joints.forEach((joint) => sceneContainer.addChild(joint));
    if (!sceneContainer.isBeaker) {
      sceneContainer.eventMode = "static";
      sceneContainer.cursor = "pointer";
      sceneContainer.on("pointerdown", (event) => this.onDragStart(event, sceneContainer));
    } else {
      sceneContainer.eventMode = "none"; // Beaker is fixed and non-interactive
    }

    sceneContainer.getGlobalJointPositions = () => sceneContainer.joints.map((joint) => sceneContainer.toGlobal(joint.position));

    this.components.addChild(sceneContainer);

    // 如果有電子模組，為組件創建電子
    if (this.electron && this.electron.electronConfigs[imagePath]) {
      this.electron.createElectronsForComponent(sceneContainer);
    }

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
    ion.circle(0, 0, 8);
    ion.fill(isPositive ? 0xff0000 : 0x0000ff);

    // 正負極標誌

    if (isPositive) {
      // 正號
      ion.rect(-5, -1, 10, 2);
      ion.rect(-1, -5, 2, 10);
    } else {
      // 負號
      ion.rect(-5, -1, 10, 2);
    }
    ion.fill(0xffffff);
    ion.isPositive = isPositive;
    ion.visible = false;

    return ion;
  }

  setRandomPosition(ion) {
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
        if (distance < 2 && this.ionModule) {
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

    if (this.electron) {
      this.electron.reset();
    }

    if (this.itemsList) {
      Object.keys(this.itemsList.restrictedItems).forEach((key) => {
        this.itemsList.restrictedItems[key] = false;
      });
      this.itemsList.updateDisplayedImages(this.itemsList.initialIndices);
    }
  }
}
