import { Container, Sprite, Texture, Graphics, Point } from "./pixi.mjs";

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

  // 輔助函數：圍繞點旋轉
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

  // 尋找所有相連的組件
  findAllConnectedComponents(startComponent) {
    const connectedComponents = new Set();
    const componentGroup = startComponent.connectedComponent;

    if (componentGroup === -1) return connectedComponents;

    this.components.children.forEach((component) => {
      if (component.connectedComponent === componentGroup) {
        connectedComponents.add(component);
      }
    });

    return connectedComponents;
  }

  updateComponentGroups() {
    // 重置所有 Groups
    this.connectedGroups.length = 0;
    const visited = new Set();

    // 尋找所有相連的組件並重新分配 group
    this.components.children.forEach((component) => {
      if (visited.has(component)) return;

      const connectedComponents = this.findConnectedComponentsByJoints(component);
      if (connectedComponents.size > 1) {
        const newGroup = this.connectedGroups.length;
        this.connectedGroups.push(newGroup);
        connectedComponents.forEach((comp) => {
          comp.connectedComponent = newGroup;
          visited.add(comp);
        });
      } else {
        component.connectedComponent = -1;
        visited.add(component);
      }
    });
  }

  // 尋找通過連接點相連的所有組件
  findConnectedComponentsByJoints(startComponent, visited = new Set()) {
    const connectedComponents = new Set([startComponent]);
    visited.add(startComponent);

    startComponent.joints.forEach((joint) => {
      if (!joint.connected) return;

      this.components.children.forEach((otherComponent) => {
        if (visited.has(otherComponent)) return;

        otherComponent.joints.forEach((otherJoint) => {
          if (!otherJoint.connected) return;

          const jointPos = startComponent.toGlobal(joint.position);
          const otherJointPos = otherComponent.toGlobal(otherJoint.position);

          if (this.areJointsOverlapping(jointPos, otherJointPos)) {
            const subComponents = this.findConnectedComponentsByJoints(otherComponent, visited);
            subComponents.forEach((comp) => connectedComponents.add(comp));
          }
        });
      });
    });

    return connectedComponents;
  }

  // 斷開連接點
  disconnectJoint(joint) {
    if (joint.connected) {
      const oldComponents = this.findAllConnectedComponents(joint.parent);

      const connectedJoint = this.findConnectedJoint(joint);
      if (connectedJoint) {
        connectedJoint.connected = false;
        connectedJoint.tint = 0xffffff;
      }

      joint.connected = false;
      joint.tint = 0xffffff;

      this.updateComponentGroups();
    }
  }

  // 尋找相連的另一個連接點
  findConnectedJoint(targetJoint) {
    for (let component of this.components.children) {
      for (let joint of component.joints) {
        if (joint !== targetJoint && joint.connected) {
          const targetPos = targetJoint.parent.toGlobal(targetJoint.position);
          const jointPos = joint.parent.toGlobal(joint.position);

          if (this.areJointsOverlapping(targetPos, jointPos)) {
            return joint;
          }
        }
      }
    }
    return null;
  }

  createSceneItem(imagePath, position) {
    const sceneContainer = new Container();
    sceneContainer.x = position.x;
    sceneContainer.y = position.y;
    sceneContainer.connectedComponent = -1;

    const sprite = new Sprite(Texture.from(imagePath));
    sprite.anchor.set(0.5);
    const scale = sprite.texture.width / Math.max(sprite.texture.width, sprite.texture.height);
    sprite.scale.set(scale);

    const jointConfig = this.jointConfigs[imagePath] || [
      { x: 1, y: 0.5 },
      { x: 0, y: 0.5 },
    ];

    // 為 joint 添加拖曳事件
    sceneContainer.joints = jointConfig.map((config) => {
      const joint = new Graphics().circle(0, 0, 20).fill({ color: 0x00ff00, alpha: 0 }).stroke({ color: 0xadadad, width: 6 });

      joint.position.set((config.x - 0.5) * sprite.width, (config.y - 0.5) * sprite.height);
      joint.connected = false;
      joint.eventMode = "static";
      joint.cursor = "pointer";
      joint.isJoint = true;
      joint.on("pointerdown", (event) => this.onDragStart(event, sceneContainer, joint));
      return joint;
    });

    sceneContainer.joints.forEach((joint) => sceneContainer.addChild(joint));
    sceneContainer.addChild(sprite);
    sceneContainer.eventMode = "static";
    sceneContainer.cursor = "pointer";
    sceneContainer.on("pointerdown", (event) => this.onDragStart(event, sceneContainer));

    sceneContainer.getGlobalJointPositions = () => sceneContainer.joints.map((joint) => sceneContainer.toGlobal(joint.position));

    this.components.addChild(sceneContainer);
    return sceneContainer;
  }

  // 開始拖拽
  onDragStart(event, target, joint = null) {
    if (!event || !target) return;

    this.dragTarget = target;
    this.draggingJoint = joint;

    this.dragStartPos = {
      x: event.global.x || 0,
      y: event.global.y || 0,
    };

    this.rotationCenter = {
      rotation: target.rotation || 0,
    };

    this.dragArea.visible = true;
    target.alpha = 0.5;

    if (joint?.connected) {
      this.disconnectJoint(joint);
    }
  }

  // 拖拽移動處理
  onDragMove(event) {
    if (!this.dragTarget || !event?.global) return;

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

  // 處理連接點拖拽（旋轉）
  handleJointDrag(event) {
    // 取得另一個joint作為旋轉軸心
    const pivotJoint = this.dragTarget.joints.find((j) => j !== this.draggingJoint);

    // 如果軸心 joint 是已連接的，也要斷開連接
    if (pivotJoint.connected) {
      this.disconnectJoint(pivotJoint);
    }

    const pivotGlobal = this.dragTarget.toGlobal(pivotJoint.position);

    // 計算角度差
    const startAngle = Math.atan2(this.dragStartPos.y - pivotGlobal.y, this.dragStartPos.x - pivotGlobal.x);
    const currentAngle = Math.atan2(event.global.y - pivotGlobal.y, event.global.x - pivotGlobal.x);
    const rotationDiff = currentAngle - startAngle;

    // 計算電池的新位置（考慮旋轉後的位置變化）
    const currentPos = { x: this.dragTarget.x, y: this.dragTarget.y };
    const newPos = this.rotateAroundPoint(currentPos, this.dragTarget.parent.toLocal(pivotGlobal), rotationDiff);

    // 更新電池的位置和旋轉
    this.dragTarget.position.set(newPos.x, newPos.y);
    this.dragTarget.rotation = this.rotationCenter.rotation + rotationDiff;

    // 更新起始狀態
    this.dragStartPos = { x: event.global.x, y: event.global.y };
    this.rotationCenter.rotation = this.dragTarget.rotation;
  }

  // 處理一般的拖曳
  handleNormalDrag(event) {
    if (!this.dragTarget || !this.dragTarget.parent) return;

    // 儲存舊位置
    const oldPos = {
      x: this.dragTarget.x,
      y: this.dragTarget.y,
    };

    // 更新位置
    const newPos = this.dragTarget.parent.toLocal(event.global);
    this.dragTarget.position.set(newPos.x, newPos.y);

    // 如果是群組的一部分，移動相連的物件
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
  onDragEnd() {
    if (this.dragTarget) {
      this.checkAndSnapJoints(this.dragTarget);
      this.dragArea.visible = false;
      this.dragTarget.alpha = 1;
      this.dragTarget = null;
      this.draggingJoint = null;
      this.dragStartPos = null;
      this.rotationCenter = null;
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

              // 計算拖曳目標的局部關節位置，考慮旋轉
              const dragJointLocal = dragTarget.joints[dragIdx].position;
              const rotatedDragJointPos = this.rotateAroundPoint({ x: dragJointLocal.x, y: dragJointLocal.y }, { x: 0, y: 0 }, dragTarget.rotation);

              // 計算新的位置，考慮旋轉後的偏移
              const newPos = dragTarget.parent.toLocal(midpoint);
              dragTarget.position.set(newPos.x - rotatedDragJointPos.x, newPos.y - rotatedDragJointPos.y);

              dragTarget.joints[dragIdx].connected = true;
              element.joints[elementIdx].connected = true;
              dragTarget.joints[dragIdx].tint = 0x00ff00;
              element.joints[elementIdx].tint = 0x00ff00;

              if (dragTarget.connectedComponent == -1 && element.connectedComponent == -1) {
                const newGroup = this.connectedGroups.length;
                this.connectedGroups.push(newGroup);
                dragTarget.connectedComponent = newGroup;
                element.connectedComponent = newGroup;
              } else if (dragTarget.connectedComponent == -1) {
                dragTarget.connectedComponent = element.connectedComponent;
              } else if (element.connectedComponent == -1) {
                element.connectedComponent = dragTarget.connectedComponent;
              }
            }
          });
        });
      }
    });
  }

  calculateMidpoint(pos1, pos2) {
    return {
      x: (pos1.x + pos2.x) / 2,
      y: (pos1.y + pos2.y) / 2,
    };
  }

  areJointsOverlapping(joint1Pos, joint2Pos) {
    const distance = Math.sqrt(Math.pow(joint1Pos.x - joint2Pos.x, 2) + Math.pow(joint1Pos.y - joint2Pos.y, 2));
    return distance < 30;
  }

  reset() {
    this.components.removeChildren();
    this.connectedGroups = [];
    this.dragTarget = null;
    this.dragArea.visible = false;
    this.draggingJoint = null;
    this.dragStartPos = null;
    this.rotationCenter = null;
  }
}
