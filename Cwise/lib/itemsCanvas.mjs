import { Container, Sprite, Texture, Graphics, Point } from "./pixi.mjs";

export class ItemsCanvas {
  constructor() {
    this.container = new Container();
    this.dragTarget = null;

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
      "檢流計.png": [
        { x: 1, y: 0.5 }, // 右側中間
        { x: 0, y: 0.5 }, // 左側中間
      ],
      "U型管.png": [
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
    };
  }

  createSceneItem(imagePath, position) {
    const sceneContainer = new Container();
    sceneContainer.x = position.x;
    sceneContainer.y = position.y;
    sceneContainer.connectedComponent = -1; // 初始未連接狀態

    // 創建主體
    const sprite = new Sprite(Texture.from(imagePath));
    sprite.anchor.set(0.5);
    const scale = sprite.texture.width / Math.max(sprite.texture.width, sprite.texture.height);
    sprite.scale.set(scale);

    // 獲取物品類型的連結點配置
    const jointConfig = this.jointConfigs[imagePath] || [
      { x: 1, y: 0.5 }, // 預設右側中間
      { x: 0, y: 0.5 }, // 預設左側中間
    ];

    // 創建連接點
    sceneContainer.joints = [];
    jointConfig.forEach((config) => {
      const joint = new Graphics().circle(0, 0, 10).fill({ color: 0x00ff00, alpha: 0.5 });

      // 計算連結點位置
      joint.position.set((config.x - 0.5) * sprite.width, (config.y - 0.5) * sprite.height);

      joint.connected = false;
      joint.eventMode = "static";
      joint.cursor = "pointer";

      sceneContainer.joints.push(joint);
      sceneContainer.addChild(joint);
    });

    // 添加精靈
    sceneContainer.addChild(sprite);

    // 設置事件
    sceneContainer.eventMode = "static";
    sceneContainer.cursor = "pointer";
    sceneContainer.on("pointerdown", () => this.onDragStart(sceneContainer));

    // 添加獲取全局連接點位置的方法
    sceneContainer.getGlobalJointPositions = () => {
      return sceneContainer.joints.map((joint) => {
        const globalPos = sceneContainer.toGlobal(joint.position);
        return { x: globalPos.x, y: globalPos.y };
      });
    };

    this.components.addChild(sceneContainer);
    return sceneContainer;
  }

  onDragStart(target) {
    this.dragTarget = target;
    target.alpha = 0.5;
    this.dragArea.visible = true;
  }

  onDragMove(event) {
    if (this.dragTarget) {
      const oldPos = { x: this.dragTarget.x, y: this.dragTarget.y };
      this.dragTarget.parent.toLocal(event.global, null, this.dragTarget.position);

      // 如果有連接的組件，一起移動
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
  }

  onDragEnd() {
    if (this.dragTarget) {
      this.checkAndSnapJoints(this.dragTarget);
      this.dragArea.visible = false;
      this.dragTarget.alpha = 1;
      this.dragTarget = null;
    }
  }

  checkAndSnapJoints(dragTarget) {
    const dragTargetJoints = dragTarget.getGlobalJointPositions();

    this.components.children.forEach((element) => {
      if (element !== dragTarget) {
        const elementJoints = element.getGlobalJointPositions();

        dragTargetJoints.forEach((dragJoint, dragIdx) => {
          if (dragTarget.joints[dragIdx].connected) return;

          elementJoints.forEach((elementJoint, elementIdx) => {
            if (element.joints[elementIdx].connected) return;

            if (this.areJointsOverlapping(dragJoint, elementJoint)) {
              const midpoint = this.calculateMidpoint(dragJoint, elementJoint);

              // 設置位置
              const dragTargetLocal = dragTarget.parent.toLocal(midpoint);
              const dragJointLocal = dragTarget.joints[dragIdx].position;
              dragTarget.position.set(dragTargetLocal.x - dragJointLocal.x, dragTargetLocal.y - dragJointLocal.y);

              // 更新連接狀態
              dragTarget.joints[dragIdx].connected = true;
              element.joints[elementIdx].connected = true;
              dragTarget.joints[dragIdx].tint = 0x00ff00;
              element.joints[elementIdx].tint = 0x00ff00;

              // 更新組件組
              this.updateConnectedComponents(dragTarget, element);
            }
          });
        });
      }
    });
  }

  areJointsOverlapping(joint1Pos, joint2Pos) {
    const distance = Math.sqrt(Math.pow(joint1Pos.x - joint2Pos.x, 2) + Math.pow(joint1Pos.y - joint2Pos.y, 2));
    return distance < this.snapDistance;
  }

  calculateMidpoint(pos1, pos2) {
    return {
      x: (pos1.x + pos2.x) / 2,
      y: (pos1.y + pos2.y) / 2,
    };
  }

  updateConnectedComponents(item1, item2) {
    if (item1.connectedComponent === -1 && item2.connectedComponent === -1) {
      const newGroup = this.connectedGroups.length;
      this.connectedGroups.push(newGroup);
      item1.connectedComponent = newGroup;
      item2.connectedComponent = newGroup;
    } else if (item1.connectedComponent === -1) {
      item1.connectedComponent = item2.connectedComponent;
    } else if (item2.connectedComponent === -1) {
      item2.connectedComponent = item1.connectedComponent;
    }
  }

  reset() {
    this.components.removeChildren();
    this.connectedGroups = [];
    this.dragTarget = null;
    this.dragArea.visible = false;
  }
}
