import { Container, Sprite, Graphics, Text, Texture } from "./pixi.mjs";
import { defaultStyle, defaultStyle2 } from "./textStyle.mjs";

let dragTarget = null;

export class ItemsCanvas {
  constructor() {
    this.container = new Container();
    this.dragTarget = null;
    this.dragStartPos = null;
    this.rotationCenter = null;
    this.draggingJoint = null;

    // 創建拖拽區域
    this.dragArea = new Graphics().rect(0, 0, 1920, 1080).fill({ color: 0x000000, alpha: 0 });
    this.dragArea.eventMode = "static";
    this.dragArea.cursor = "pointer";
    this.dragArea.zIndex = 9999;
    this.dragArea.visible = false;

    // 新增刪除區域
    this.deleteArea = new Container();
    this.deleteArea.box = new Graphics()
      .roundRect(-100, -50, 200, 100, 20)
      .fill({ color: 0x000000, alpha: 0.2 })
      .stroke({ width: 5, color: 0xffffff });
    this.deleteArea.box.position.set(1600, 985);
    this.deleteArea.text = new Text({ text: "刪除區", style: defaultStyle2 });
    this.deleteArea.text.position.set(1600, 985);
    this.deleteArea.text.anchor.set(0.5);
    this.deleteArea.addChild(this.deleteArea.box, this.deleteArea.text);

    // 初始化容器
    this.components = new Container();
    this.container.addChild(this.dragArea, this.deleteArea, this.components);

    this.componentsToDelete = [];

    // 設置拖拽區域事件
    this.dragArea.on("pointermove", this.onDragMove.bind(this));
    this.dragArea.on("pointerup", this.onDragEnd.bind(this));
    this.dragArea.on("pointerupoutside", this.onDragEnd.bind(this));

    // 組件相關
    this.connectedGroups = [];
    this.snapDistance = 30;

    // 定義不同物品的連結點配置
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

      "燒杯.png": [
        { x: 0.3, y: 0.5 }, // 左側中間
        { x: 0.8, y: 0.5 }, // 右側中間
      ],
      "廣用試紙.png": [
        { x: 0.5, y: 1 }, // 底部中間
      ],
      "碳棒.png": [
        { x: 0.5, y: 1 }, // 底部中間
        { x: 0.5, y: 0 }, // 頂部中間
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
  setIomModule(ionModule) {
    this.ionModule = ionModule;
  }

  createSceneItem(imagePath, position) {
    const sceneContainer = new Container();
    sceneContainer.x = position.x;
    sceneContainer.y = position.y;
    sceneContainer.connectedComponent = -1;
    sceneContainer.type = imagePath.replace(".png", "");

    if (this.itemsList) {
      requestAnimationFrame(() => {
        this.itemsList.updateRestrictedItems();
      });
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
        const joint = new Graphics().circle(0, 0, 20).fill({ color: 0x00ff00, alpha: 0 }).stroke({ color: 0xadadad, width: 6, alpha: 0.3 });

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
        this.wireBody.moveTo(this.joints[0].x, this.joints[0].y).lineTo(this.joints[1].x, this.joints[1].y).stroke({ width: 20, color: 0xff8000 });
      };

      sceneContainer.redrawWire();
    } else if (imagePath === "廣用試紙.png") {
      const paperBody = new Graphics().rect(-40, -100, 80, 200).fill(0x01ea00);

      // 創建測試區域（會變色的部分）
      const testStrip = new Graphics().rect(-40, 0, 80, 100).fill(0x01ea00);

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
      const scale = sprite.texture.width / Math.max(sprite.texture.width, sprite.texture.height);
      sprite.scale.set(scale);

      const jointConfig = this.jointConfigs[imagePath] || [];
      sceneContainer.joints = jointConfig.map((config) => {
        const joint = new Graphics().circle(0, 0, 20).fill({ color: 0x00ff00, alpha: 0 }).stroke({ color: 0xadadad, width: 6, alpha: 0.3 });

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
        // 為燒杯創建離子
        this.createBeakerIons(sceneContainer);
        sceneContainer.joints.forEach((joint) => {
          joint.visible = false;
        });
      }
      if (imagePath === "藥品罐.png") {
        const sprite = new Sprite(Texture.from(imagePath));
        sprite.anchor.set(0.5);
        const scale = sprite.texture.width / Math.max(sprite.texture.width, sprite.texture.height);
        sprite.scale.set(scale);
        sprite.rotation = Math.PI / 4;
        sceneContainer.addChild(sprite);
      }

      sceneContainer.addChild(sprite);
    }

    sceneContainer.joints.forEach((joint) => sceneContainer.addChild(joint));
    sceneContainer.eventMode = "static";
    sceneContainer.cursor = "pointer";
    sceneContainer.on("pointerdown", (event) => this.onDragStart(event, sceneContainer));

    sceneContainer.getGlobalJointPositions = () => sceneContainer.joints.map((joint) => sceneContainer.toGlobal(joint.position));

    this.components.addChild(sceneContainer);
    return sceneContainer;
  }

  // 燒杯離子創建方法
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

  // 離子創建方法
  createIon(isPositive) {
    const ionContainer = new Container(); // 創建容器來存放離子和標誌

    // 創建離子本體
    const ionBody = new Graphics();
    ionBody.circle(0, 0, 15);
    ionBody.fill(0x0077cc);

    // 創建正負極標誌
    const polarityMarker = new Graphics();
    if (isPositive) {
      // 正號
      polarityMarker.rect(-8, -2, 16, 5);
      polarityMarker.rect(-2, -8, 5, 16);
    } else {
      // 負號
      polarityMarker.rect(-8, -2, 16, 5);
    }
    polarityMarker.fill(isPositive ? 0xff0000 : 0x0000ff);

    // 將兩個部分加入容器
    ionContainer.addChild(ionBody);
    ionContainer.addChild(polarityMarker);

    // 設置屬性
    ionContainer.isPositive = isPositive;
    ionContainer.ionBody = ionBody;
    ionContainer.polarityMarker = polarityMarker;
    ionContainer.visible = false;
    polarityMarker.visible = false; // 預設隱藏極性標誌

    return ionContainer;
  }

  // 極性標誌顯示
  togglePolarityMarkers(visible) {
    this.components.children.forEach((component) => {
      if (component.type === "燒杯") {
        component.ions.forEach((ion) => {
          ion.polarityMarker.visible = visible;
        });
      }
    });
  }

  setRandomPosition(ion, width, height) {
    ion.x = Math.random() * 260 - 100;
    ion.y = Math.random() * 230 - 70;
  }

  onDragStart(event, target, joint = null) {
    if (!event || !target) return;

    if (target.type === "藥品罐") {
      // 用一個短暫的延遲來區分點擊和拖拽
      const startPos = { x: event.global.x, y: event.global.y };

      const checkClick = setTimeout(() => {
        // 如果位置沒有明顯變化，視為點擊
        const currentPos = { x: event.global.x, y: event.global.y };
        const distance = Math.sqrt(Math.pow(currentPos.x - startPos.x, 2) + Math.pow(currentPos.y - startPos.y, 2));

        if (distance < 5 && this.ionModule) {
          // 5像素的閾值
          console.log("Triggering bottle animation");
          this.ionModule.handleBottleAnimation(target);
          return; // 不執行拖拽
        }
      }, 100); // 100ms 的判斷時間

      // 如果開始拖動，清除點擊檢查
      const clearCheck = () => {
        clearTimeout(checkClick);
        target.off("pointermove", clearCheck);
      };
      target.on("pointermove", clearCheck);
    }

    if (joint?.isJoint) {
      this.dragTarget = target;
      this.draggingJoint = joint;
    } else {
      this.dragTarget = target;
      this.draggingJoint = null;
    }

    this.dragStartPos = {
      x: event.global.x || 0,
      y: event.global.y || 0,
    };

    this.rotationCenter = {
      rotation: target.rotation || 0,
    };

    this.dragArea.visible = true;
    target.alpha = 0.5;

    // 記錄物件與滑鼠位置的偏移
    const globalPos = dragTarget.toGlobal({ x: 0, y: 0 });
    dragTarget.offset = {
      x: globalPos.x - event.global.x,
      y: globalPos.y - event.global.y,
    };
  }

  onDragMove(event) {
    if (!this.dragTarget || !event?.global) return;

    // 新增刪除檢查
    this.checkAllDelete();

    if (this.dragTarget && this.draggingJoint) {
      if (this.draggingJoint.isJoint) {
        // 如果是拖拽連接點，執行旋轉邏輯
        this.handleJointDrag(event);
      } else {
        // 否則執行普通拖拽
        this.handleNormalDrag(event);
      }
    } else {
      // 如果沒有拖拽連接點，執行普通拖拽
      this.handleNormalDrag(event);
    }
  }

  handleJointDrag(event) {
    if (!this.dragTarget || !this.draggingJoint) return;

    if (this.dragTarget.redrawWire) {
      // 電線的拉伸邏輯
      const localPos = this.dragTarget.toLocal(event.global);
      this.draggingJoint.position.set(localPos.x, localPos.y);
      this.dragTarget.redrawWire();
      return;
    }

    // 取得另一個joint作為旋轉軸心
    const pivotJoint = this.dragTarget.joints.find((j) => j !== this.draggingJoint);
    const pivotGlobal = this.dragTarget.toGlobal(pivotJoint.position);

    // 計算角度差
    const startAngle = Math.atan2(this.dragStartPos.y - pivotGlobal.y, this.dragStartPos.x - pivotGlobal.x);
    const currentAngle = Math.atan2(event.global.y - pivotGlobal.y, event.global.x - pivotGlobal.x);
    const rotationDiff = currentAngle - startAngle;

    // 計算新位置
    const currentPos = { x: this.dragTarget.x, y: this.dragTarget.y };
    const newPos = this.rotateAroundPoint(currentPos, this.dragTarget.parent.toLocal(pivotGlobal), rotationDiff);

    // 更新位置和旋轉
    this.dragTarget.position.set(newPos.x, newPos.y);
    this.dragTarget.rotation = this.rotationCenter.rotation + rotationDiff;

    // 更新起始狀態
    this.dragStartPos = { x: event.global.x, y: event.global.y };
    this.rotationCenter.rotation = this.dragTarget.rotation;
  }

  handleNormalDrag(event) {
    if (!this.dragTarget || !this.dragTarget.parent) return;

    const oldPos = {
      x: this.dragTarget.x,
      y: this.dragTarget.y,
    };

    const newPos = this.dragTarget.parent.toLocal(event.global);
    this.dragTarget.position.set(newPos.x, newPos.y);

    if (this.dragTarget.connectedComponent !== -1) {
      this.components.children.forEach((element) => {
        if (element !== this.dragTarget && element.connectedComponent === this.dragTarget.connectedComponent) {
          const dx = this.dragTarget.x - oldPos.x;
          const dy = this.dragTarget.y - oldPos.y;
          element.x += dx;
          element.y += dy;
        }
      });
    }
  }

  rotateAroundPoint(point, center, angle) {
    if (!point || !center) return null;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);

    const translatedX = point.x - center.x;
    const translatedY = point.y - center.y;

    return {
      x: translatedX * cos - translatedY * sin + center.x,
      y: translatedX * sin + translatedY * cos + center.y,
    };
  }

  onDragEnd() {
    if (this.dragTarget) {
      this.doAllDelete();
      this.recheckAllConnections();
      this.dragArea.visible = false;
      this.dragTarget.alpha = 1;
      this.dragTarget = null;
      this.draggingJoint = null;
      this.dragStartPos = null;
      this.rotationCenter = null;
    }
  }

  recheckAllConnections() {
    // 重置所有連接狀態
    this.components.children.forEach((component) => {
      component.connectedComponent = -1;
      component.joints.forEach((joint) => {
        joint.connected = false;
        joint.tint = 0xffffff;
      });
    });

    // 檢查所有可能的連接
    for (let i = 0; i < this.components.children.length; i++) {
      const component1 = this.components.children[i];
      const joints1 = component1.getGlobalJointPositions();

      for (let j = i + 1; j < this.components.children.length; j++) {
        const component2 = this.components.children[j];
        const joints2 = component2.getGlobalJointPositions();

        joints1.forEach((joint1Pos, idx1) => {
          joints2.forEach((joint2Pos, idx2) => {
            if (this.areJointsOverlapping(joint1Pos, joint2Pos)) {
              component1.joints[idx1].connected = true;
              component2.joints[idx2].connected = true;
              component1.joints[idx1].tint = 0x00ff00;
              component2.joints[idx2].tint = 0x00ff00;

              if (component1.connectedComponent === -1 && component2.connectedComponent === -1) {
                const newGroup = this.connectedGroups.length;
                this.connectedGroups.push(newGroup);
                component1.connectedComponent = newGroup;
                component2.connectedComponent = newGroup;
              } else if (component1.connectedComponent === -1) {
                component1.connectedComponent = component2.connectedComponent;
              } else if (component2.connectedComponent === -1) {
                component2.connectedComponent = component1.connectedComponent;
              } else if (component1.connectedComponent !== component2.connectedComponent) {
                const oldGroup = component2.connectedComponent;
                this.components.children.forEach((comp) => {
                  if (comp.connectedComponent === oldGroup) {
                    comp.connectedComponent = component1.connectedComponent;
                  }
                });
              }
            }
          });
        });
      }
    }
  }

  calculateMidpoint(pos1, pos2) {
    return {
      x: (pos1.x + pos2.x) / 2,
      y: (pos1.y + pos2.y) / 2,
    };
  }

  areJointsOverlapping(joint1Pos, joint2Pos) {
    const distance = Math.sqrt(Math.pow(joint1Pos.x - joint2Pos.x, 2) + Math.pow(joint1Pos.y - joint2Pos.y, 2));
    return distance < this.snapDistance;
  }

  reset() {
    this.components.removeChildren();
    this.connectedGroups = [];
    this.dragTarget = null;
    this.dragArea.visible = false;
    this.draggingJoint = null;
    this.dragStartPos = null;
    this.rotationCenter = null;

    if (this.itemsList) {
      // 使用 ItemsList 自己保存的初始索引進行重置
      Object.keys(this.itemsList.restrictedItems).forEach((key) => {
        this.itemsList.restrictedItems[key] = false;
      });
      this.itemsList.updateDisplayedImages(this.itemsList.initialIndices);
    }
  }

  // 新增刪除處理的方法
  checkAllDelete() {
    this.componentsToDelete.length = 0;
    const deleteAreaBounds = this.deleteArea.getBounds();

    // 第一次檢查：尋找接觸刪除區域的組件
    let touchingComponents = new Set();

    this.components.children.forEach((component) => {
      component.tint = 0xffffff;

      const compBounds = component.getBounds();
      if (
        compBounds.x + compBounds.width >= deleteAreaBounds.x &&
        compBounds.x <= deleteAreaBounds.x + deleteAreaBounds.width &&
        compBounds.y + compBounds.height >= deleteAreaBounds.y &&
        compBounds.y <= deleteAreaBounds.y + deleteAreaBounds.height
      ) {
        touchingComponents.add(component);
      }

      // 檢查具有連結點的組件
      component.joints.forEach((joint) => {
        const globalPos = component.toGlobal(joint.position);
        if (
          globalPos.x >= deleteAreaBounds.x &&
          globalPos.x <= deleteAreaBounds.x + deleteAreaBounds.width &&
          globalPos.y >= deleteAreaBounds.y &&
          globalPos.y <= deleteAreaBounds.y + deleteAreaBounds.height
        ) {
          touchingComponents.add(component);
        }
      });
    });

    // 第二次檢查：新增相連的組件
    touchingComponents.forEach((component) => {
      if (component.connectedComponent !== -1) {
        this.components.children.forEach((otherComp) => {
          if (otherComp.connectedComponent === component.connectedComponent) {
            touchingComponents.add(otherComp);
          }
        });
      }
    });

    // 套用視覺效果並準備刪除
    touchingComponents.forEach((component) => {
      component.tint = 0xff0000;
      this.componentsToDelete.push(component);
    });
  }

  doAllDelete() {
    this.componentsToDelete.forEach((component) => {
      this.components.removeChild(component);
    });
    this.componentsToDelete.length = 0;

    if (this.itemsList) {
      requestAnimationFrame(() => {
        this.itemsList.updateRestrictedItems();
      });
    }
  }
}
