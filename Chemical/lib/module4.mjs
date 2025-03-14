import { Container, Graphics, Sprite, Text, Texture } from "./pixi.mjs";
import { defaultStyle3, listStyle } from "./textStyle.mjs";
import { gsap } from "../gsap-public/src/index.js";
export { Module4 };

let dragTarget = null;
let dragStartPos = null;
let draggingJoint = null;

const DRAG_AREA = new Graphics().rect(0, 0, 1920, 1080).fill({ color: 0x000000, alpha: 0 });
DRAG_AREA.eventMode = "static";
DRAG_AREA.cursor = "pointer";
DRAG_AREA.zIndex = 9999;
DRAG_AREA.visible = false;
DRAG_AREA.on("pointerup", onDragEnd);
DRAG_AREA.on("pointerupoutside", onDragEnd);
DRAG_AREA.on("pointermove", onDragMove);

function onDragStart(event) {
  if (!this.parent.isJoint) {
    dragTarget = this.parent;
    draggingJoint = this;
  } else {
    dragTarget = this;
    draggingJoint = this;
  }

  dragStartPos = { x: event.global.x, y: event.global.y };
  DRAG_AREA.visible = true;

  // Record object and mouse position offset
  const globalPos = dragTarget.toGlobal({ x: 0, y: 0 });
  dragTarget.offset = {
    x: globalPos.x - event.global.x,
    y: globalPos.y - event.global.y,
  };
}

function onDragMove(event) {
  if (dragTarget && draggingJoint) {
    // 檢查 dragTarget 是否還存在於場景中
    if (!dragTarget.parent) {
      // 如果 dragTarget 已經不在場景中，結束拖拉操作
      DRAG_AREA.visible = false;
      dragTarget = null;
      draggingJoint = null;
      dragStartPos = null;
      return;
    }

    if (dragTarget instanceof Wire) {
      // 如果拖動的是電線本體
      if (!draggingJoint.isJoint) {
        // 先計算新位置
        const newGlobalPos = {
          x: event.global.x + dragTarget.offset.x,
          y: event.global.y + dragTarget.offset.y,
        };

        // 移動整個電線物件
        const newLocalPos = dragTarget.parent.toLocal(newGlobalPos);
        dragTarget.position.set(newLocalPos.x, newLocalPos.y);

        // 檢查所有連結點是否需要吸附
        dragTarget.joints.forEach((joint) => {
          const nearestConnection = findNearestConnection(joint);
          if (nearestConnection) {
            // 調整連結點位置以吸附
            const globalSnapPos = nearestConnection.parent.toGlobal(nearestConnection.position);
            const localSnapPos = joint.parent.toLocal(globalSnapPos);
            joint.position.set(localSnapPos.x, localSnapPos.y);
          }
        });

        // 重繪電線
        dragTarget.redrawWire();
      } else {
        // 如果拖動的是電線的連結點
        const localPos = draggingJoint.parent.toLocal(event.global);

        // 如果連結點已連接，先斷開連接
        if (draggingJoint.connectedTo) {
          const connectedJoint = draggingJoint.connectedTo;
          draggingJoint.connectedTo = null;
          connectedJoint.connectedTo = null;
          draggingJoint.tint = 0xffffff;
          connectedJoint.tint = 0xffffff;
          draggingJoint.scale.set(1);
          connectedJoint.scale.set(1);
        }

        // 正常移動連結點
        draggingJoint.position.set(localPos.x, localPos.y);

        // 檢查是否有需要吸附的連結點
        const nearestConnection = findNearestConnection(draggingJoint);
        if (nearestConnection) {
          // 如果找到近距離的連結點，進行吸附
          const globalSnapPos = nearestConnection.parent.toGlobal(nearestConnection.position);
          const localSnapPos = draggingJoint.parent.toLocal(globalSnapPos);
          draggingJoint.position.set(localSnapPos.x, localSnapPos.y);
        }

        draggingJoint.parent.redrawWire();
      }
    } else {
      // 一般組件的拖動邏輯
      const newGlobalPos = {
        x: event.global.x + dragTarget.offset.x,
        y: event.global.y + dragTarget.offset.y,
      };
      const newLocalPos = dragTarget.parent.toLocal(newGlobalPos);
      dragTarget.position.set(newLocalPos.x, newLocalPos.y);

      // 檢查組件的所有連結點是否需要吸附
      if (dragTarget.joints) {
        dragTarget.joints.forEach((joint) => {
          const nearestConnection = findNearestConnection(joint);
          if (nearestConnection) {
            // 調整組件位置以使連結點吸附
            const globalSnapPos = nearestConnection.parent.toGlobal(nearestConnection.position);
            const localSnapPos = dragTarget.toLocal(globalSnapPos);
            const offsetX = localSnapPos.x - joint.position.x;
            const offsetY = localSnapPos.y - joint.position.y;
            dragTarget.position.set(dragTarget.position.x + offsetX, dragTarget.position.y + offsetY);
          }
        });
      }
    }
  }
  recheckAllConnections();
}

function findNearestConnection(joint) {
  let nearestJoint = null;
  let minDistance = 20; // 吸附距離閾值

  // 獲取當前連結點的全域位置
  const jointGlobalPos = joint.parent.toGlobal(joint.position);

  // 遍歷所有組件
  Components.children.forEach((component) => {
    if (!component.joints || component === joint.parent) return;

    component.joints.forEach((otherJoint) => {
      if (otherJoint === joint) return;

      // 獲取其他連結點的全域位置
      const otherGlobalPos = otherJoint.parent.toGlobal(otherJoint.position);

      // 計算距離
      const distance = Math.sqrt(Math.pow(jointGlobalPos.x - otherGlobalPos.x, 2) + Math.pow(jointGlobalPos.y - otherGlobalPos.y, 2));

      // 更新最近的連結點
      if (distance < minDistance) {
        minDistance = distance;
        nearestJoint = otherJoint;
      }
    });
  });

  return nearestJoint;
}

function onDragEnd() {
  if (dragTarget) {
    DRAG_AREA.visible = false;
    dragTarget.alpha = 1;

    dragTarget = null;
    draggingJoint = null;
    dragStartPos = null;
  }
}

function recheckAllConnections() {
  // 儲存先前的連接狀態
  previousConnections = Components.children.map((component) =>
    component.joints.map((joint) => (joint.connectedTo ? Components.children.indexOf(joint.connectedTo.parent) : null))
  );

  // 重置所有組件的連接狀態
  Components.children.forEach((component) => {
    component.joints.forEach((joint) => {
      joint.connected = false;
      joint.tint = 0xffffff;
      joint.scale.set(1);
      joint.connectedTo = null;
    });
  });

  // 檢查所有可能的連接
  for (let i = 0; i < Components.children.length; i++) {
    const component1 = Components.children[i];
    const joints1 = component1.getGlobalJointPositions();

    for (let j = i + 1; j < Components.children.length; j++) {
      const component2 = Components.children[j];
      const joints2 = component2.getGlobalJointPositions();

      joints1.forEach((joint1Pos, idx1) => {
        joints2.forEach((joint2Pos, idx2) => {
          const joint1 = component1.joints[idx1];
          const joint2 = component2.joints[idx2];

          if (areJointsOverlapping(joint1Pos, joint2Pos)) {
            // 設置視覺連結效果
            joint1.tint = 0x00ff00;
            joint2.tint = 0x00ff00;
            joint1.scale.set(0.7);
            joint2.scale.set(0.7);

            // 保存連結關係但不影響移動
            joint1.connectedTo = joint2;
            joint2.connectedTo = joint1;
          }
        });
      });
    }
  }

  // 檢查連接是否有改變
  const currentConnections = Components.children.map((component) =>
    component.joints.map((joint) => (joint.connectedTo ? Components.children.indexOf(joint.connectedTo.parent) : null))
  );

  const hasChanged = JSON.stringify(previousConnections) !== JSON.stringify(currentConnections);

  if (hasChanged) {
    // 停止動畫
    const module4Instance = Module4.getInstance();
    if (module4Instance) {
      module4Instance.stopAllAnimations();
    }
  }
}

/*function printConnections() {
  console.log("=== Current Connections ===");

  Components.children.forEach((component, index) => {
    if (component.joints.some((joint) => joint.connectedTo)) {
      console.log(`\n${component.type} #${index}:`);
      component.joints.forEach((joint, jointIndex) => {
        if (joint.connectedTo) {
          const connectedComponent = joint.connectedTo.parent;
          const connectedIndex = Components.children.indexOf(connectedComponent);
          console.log(`  Joint ${jointIndex} -> ${connectedComponent.type} #${connectedIndex}`);
        }
      });
    }
  });
  console.log("\n======================");
}*/

function areJointsOverlapping(joint1Pos, joint2Pos) {
  const distance = Math.sqrt(Math.pow(joint1Pos.x - joint2Pos.x, 2) + Math.pow(joint1Pos.y - joint2Pos.y, 2));
  return distance < 10;
}

let previousConnections = [];

const Components = new Container();
const AllJoints = new Container();

class Module4 {
  static currentInstance = null;
  constructor() {
    Module4.currentInstance = this;
    this.container = new Container();
    this.selectedBeaker = null;
    this.isSuccess = false;

    this.initialStripPositions = {}; // 儲存電極的初始位置

    // 創建主要容器
    Components.sortableChildren = true;
    this.container.addChild(DRAG_AREA, Components, AllJoints);

    // 創建並定位ItemsList
    this.itemsList = new ItemsList(Components);
    this.container.addChild(this.itemsList.container);
    this.itemsList.container.position.set(20, 80);

    this.container.addChild(electronAnimation4.container);
  }

  static getInstance() {
    return Module4.currentInstance;
  }

  // 重置方法
  reset() {
    // 清除所有組件
    Components.removeChildren();
    AllJoints.removeChildren();
    this.stopAllAnimations();
    this.itemsList.reset();
    this.isSuccess = false;
    this.initialStripPositions = {}; // 重設電極初始位置
    // 移除銅層圖形
    if (this.zincLayer && this.zincLayer.parent) {
      this.zincLayer.parent.removeChild(this.zincLayer);
      this.zincLayer = null;
    }
  }

  // 新增檢查電路組裝的方法
  validateCircuitAssembly() {
    console.log("=== Validating Circuit Assembly ===");

    // 檢查是否包含必要元件: 電池, 電線, 燒杯
    const requiredComponents = ["Battery", "Wire", "Beaker"];
    const componentTypes = Components.children.map((comp) => comp.type);

    for (const type of requiredComponents) {
      if (!componentTypes.includes(type)) {
        return { success: false, message: `缺少必要元件: ${type}` };
      }
    }

    // 檢查燒杯溶液是否正確 (必須為硫酸鋅 - 無色)
    const beaker = Components.children.find((comp) => comp.type === "Beaker");
    if (!beaker || beaker.solution !== "硫酸鋅") {
      return { success: false, message: "燒杯溶液必須為硫酸鋅" };
    }

    // 檢查金屬棒 (必須有兩個金屬棒)
    const electrodes = Components.children.filter((comp) => comp.type === "ZincStrip" || comp.type === "CopperStrip");

    if (electrodes.length !== 2) {
      return { success: false, message: "需要兩個金屬棒作為電極" };
    }

    // 檢查電極是否被交換位置
    if (this.currentElectrodeType === "正極鋅棒 負極銅棒") {
      const zincStrip = electrodes.find((e) => e.type === "ZincStrip");
      const copperStrip = electrodes.find((e) => e.type === "CopperStrip");

      if (zincStrip && copperStrip && this.initialStripPositions.zinc && this.initialStripPositions.copper) {
        // 計算電極位置變動的距離
        const zincMoved = Math.sqrt(
          Math.pow(zincStrip.position.x - this.initialStripPositions.zinc.x, 2) +
            Math.pow(zincStrip.position.y - this.initialStripPositions.zinc.y, 2)
        );

        const copperMoved = Math.sqrt(
          Math.pow(copperStrip.position.x - this.initialStripPositions.copper.x, 2) +
            Math.pow(copperStrip.position.y - this.initialStripPositions.copper.y, 2)
        );

        // 如果兩個電極都移動了足夠的距離，可能是被交換了位置
        const movementThreshold = 50; // 判定為交換位置的閾值

        // 檢查鋅棒應在燒杯右側，銅棒應在燒杯左側
        const beakerCenter = beaker.position.x;
        const zincToRight = zincStrip.position.x > beakerCenter;
        const copperToLeft = copperStrip.position.x < beakerCenter;

        // 如果電極位置明顯錯誤（鋅棒應在右側，銅棒應在左側）
        if (!zincToRight || !copperToLeft || (zincMoved > movementThreshold && copperMoved > movementThreshold)) {
          return { success: false, message: "電極位置錯誤，請勿交換正負極位置" };
        }
      }
    }

    if (this.currentElectrodeType === "正極銅棒 負極鋅棒") {
      const zincStrip = electrodes.find((e) => e.type === "ZincStrip");
      const copperStrip = electrodes.find((e) => e.type === "CopperStrip");

      if (zincStrip && copperStrip && this.initialStripPositions.zinc && this.initialStripPositions.copper) {
        // 計算電極位置變動的距離
        const zincMoved = Math.sqrt(
          Math.pow(zincStrip.position.x - this.initialStripPositions.zinc.x, 2) +
            Math.pow(zincStrip.position.y - this.initialStripPositions.zinc.y, 2)
        );

        const copperMoved = Math.sqrt(
          Math.pow(copperStrip.position.x - this.initialStripPositions.copper.x, 2) +
            Math.pow(copperStrip.position.y - this.initialStripPositions.copper.y, 2)
        );

        // 如果兩個電極都移動了足夠的距離，可能是被交換了位置
        const movementThreshold = 50; // 判定為交換位置的閾值

        // 檢查鋅棒應在燒杯左側，銅棒應在燒杯右側
        const beakerCenter = beaker.position.x;
        const zincToLeft = zincStrip.position.x < beakerCenter;
        const copperToRight = copperStrip.position.x > beakerCenter;

        // 如果電極位置明顯錯誤（鋅棒應在左側，銅棒應在右側）
        if (!zincToLeft || !copperToRight || (zincMoved > movementThreshold && copperMoved > movementThreshold)) {
          return { success: false, message: "電極位置錯誤，請勿交換正負極位置" };
        }
      }
    }

    // 檢查電極種類是否符合要求 (正極銅棒 負極銅棒 或 正極鋅棒 負極銅棒)
    const hasValidElectrodes =
      // 正極銅棒 負極銅棒
      (electrodes[0].type === "CopperStrip" && electrodes[1].type === "CopperStrip") ||
      // 正極鋅棒 負極銅棒
      (electrodes[0].type === "ZincStrip" && electrodes[1].type === "CopperStrip");

    if (!hasValidElectrodes) {
      return { success: false, message: "電極組合不正確" };
    }

    // 檢查電路連通性 - 遞迴函數用於追蹤電路連接
    function traverseCircuit(component, circuit, visited = new Set()) {
      if (visited.has(component)) return;
      visited.add(component);
      circuit.components.add(component);

      if (component.type === "Battery") circuit.batteryCount++;
      if (component.type === "LightBulb") circuit.lightBulbs.push(component);
      if (component.type === "Beaker") circuit.beakers.push(component);
      if (component.type === "ZincStrip" || component.type === "CopperStrip") {
        circuit.electrodes.push(component);
      }

      component.joints.forEach((joint) => {
        if (joint.connectedTo) {
          traverseCircuit(joint.connectedTo.parent, circuit, visited);
        }
      });
    }

    // 從電池開始追蹤電路
    const circuit = {
      components: new Set(),
      lightBulbs: [],
      batteryCount: 0,
      beakers: [],
      electrodes: [],
    };

    traverseCircuit(
      Components.children.find((comp) => comp.type === "Battery"),
      circuit
    );

    // 檢查燒杯是否與電極連接
    if (circuit.beakers.length === 0) {
      return { success: false, message: "燒杯未連接到電路" };
    }

    // 檢查是否形成完整的迴路
    if (circuit.electrodes.length < 2) {
      return { success: false, message: "電極未正確連接到電路" };
    }

    // 檢查所有電路元件中的電線是否兩端都連接
    const wiresInCircuit = Array.from(circuit.components).filter((comp) => comp.type === "Wire");
    for (const wire of wiresInCircuit) {
      const connectionCount = wire.joints.filter((joint) => joint.connectedTo).length;
      if (connectionCount < 2) {
        return { success: false, message: "電線的兩端都必須連接到元件" };
      }
    }

    // 檢查電路是否形成閉合迴路 (每個元件至少有兩個連接點)
    const connectionCountMap = new Map();
    Array.from(circuit.components).forEach((comp) => {
      if (comp.joints) {
        const connectedJointsCount = comp.joints.filter((joint) => joint.connectedTo).length;
        connectionCountMap.set(comp, connectedJointsCount);
      }
    });

    for (const [comp, connectionCount] of connectionCountMap.entries()) {
      // 每個元件應至少有兩個連接點 (除了終端元件如燈泡可能只有一個接點)
      if (connectionCount < (comp.type === "LightBulb" ? 1 : 2)) {
        return { success: false, message: `元件 ${comp.type} 連接不完整，無法形成迴路` };
      }
    }

    // 若電路包含燈泡，使燈泡發光
    circuit.lightBulbs.forEach((bulb) => {
      let lightEffect = bulb.children.find((child) => child.label === "lightEffect");
      if (!lightEffect) {
        lightEffect = new Sprite(Texture.from("燈泡光.png"));
        lightEffect.label = "lightEffect";
        lightEffect.alpha = 0.7;
        lightEffect.anchor.set(0.5);
        lightEffect.position.set(0, -30);
        bulb.addChild(lightEffect);
      }
      // 根據電池數量調整亮度
      const brightness = Math.min(1.5, 1 + circuit.batteryCount * 0.25);
      lightEffect.scale.set(brightness);
    });

    this.isSuccess = true;
    // 電路驗證成功
    if (this.isSuccess) {
      // Find the copper strip on the left side (negative electrode)
      const copperStrip = circuit.electrodes.find((electrode) => electrode.type === "CopperStrip" && electrode.position.x < beaker.position.x);

      if (copperStrip) {
        this.animateZincPlating(copperStrip);
      }
    }

    console.log("電路連接成功，共有元件數:", circuit.components.size);
    console.log("電池數量:", circuit.batteryCount);
    console.log("燈泡數量:", circuit.lightBulbs.length);
    console.log("電極數量:", circuit.electrodes.length);

    return { success: true, message: "答對了，你好棒" };
  }

  createStrip() {
    // 根據當前電極類型創建電極
    switch (this.currentElectrodeType) {
      case "正極銅棒 負極銅棒":
        this.strip1 = new CopperStrip();
        this.strip2 = new CopperStrip();
        break;
      case "正極鋅棒 負極鋅棒":
        this.strip1 = new ZincStrip();
        this.strip2 = new ZincStrip();
        break;
      case "正極銅棒 負極鋅棒":
        this.strip1 = new CopperStrip();
        this.strip2 = new ZincStrip();
        break;
      case "正極鋅棒 負極銅棒":
        this.strip1 = new ZincStrip();
        this.strip2 = new CopperStrip();
        break;
    }

    // 尋找燒杯及其連接點位置
    const beaker = Components.children.filter((c) => c.type === "Beaker")[0];
    if (beaker) {
      // 取得燒杯的左側連接點位置
      const rightJoint = beaker.joints[1];
      const rightJointGlobal = beaker.toGlobal(rightJoint.position);

      // 取得燒杯的右側連接點位置
      const leftJoint = beaker.joints[0];
      const leftJointGlobal = beaker.toGlobal(leftJoint.position);

      // 將金屬條放置在連接點位置
      const strip1Local = Components.toLocal({
        x: rightJointGlobal.x,
        y: rightJointGlobal.y - 70,
      });
      const strip2Local = Components.toLocal({
        x: leftJointGlobal.x,
        y: leftJointGlobal.y - 70,
      });

      this.strip1.position.copyFrom(strip1Local);
      this.strip2.position.copyFrom(strip2Local);
    } else {
      // 如果找不到燒杯，使用預設位置
      this.strip1.position.set(1149, 646);
      this.strip2.position.set(1009, 646);
    }

    Components.addChild(this.strip1);
    Components.addChild(this.strip2);

    // 儲存電極的初始位置，用於後續檢查是否被交換
    if (this.currentElectrodeType === "正極鋅棒 負極銅棒") {
      this.initialStripPositions = {
        zinc: { x: this.strip1.position.x, y: this.strip1.position.y },
        copper: { x: this.strip2.position.x, y: this.strip2.position.y },
      };
    }
    if (this.currentElectrodeType === "正極銅棒 負極鋅棒") {
      this.initialStripPositions = {
        zinc: { x: this.strip2.position.x, y: this.strip2.position.y },
        copper: { x: this.strip1.position.x, y: this.strip1.position.y },
      };
    }
  }

  animateZincPlating(electrode) {
    // 定義鋅層尺寸
    const width = 62;

    // 在電極上創建一個鋅層圖形
    // 使用灰銀色表示鋅
    const zincLayer = new Graphics()
      .rect(-width / 2, 58, width, 68) // 相對於電極的本地座標
      .fill(0x808080);
    zincLayer.alpha = 0;
    electrode.addChild(zincLayer);

    // 鋅層逐漸顯現動畫
    gsap.to(zincLayer, {
      alpha: 1,
      duration: 5,
      ease: "linear",
    });

    // 儲存鋅層參考以供後續清理
    this.zincLayer = zincLayer;
  }

  handleElectrodeSelect(electrode) {
    // 儲存選擇的電極類型
    this.currentElectrodeType = electrode;

    // 移除現有的電極
    const existingStrips = Components.children.filter((c) => c.type === "ZincStrip" || c.type === "CopperStrip");
    existingStrips.forEach((strip) => Components.removeChild(strip));

    // 創建新的電極
    this.createStrip();
    // 尋找所有燒杯組件並重置它們的顏色和溶液
    Components.children
      .filter((c) => c.type === "Beaker")
      .forEach((beaker) => {
        beaker.setSolution(beaker.solution);
      });

    // 重新檢查所有連接
    recheckAllConnections();
  }

  toggleElectronDisplay(show) {
    this.isEleCheck = show;
    if (show && this.isSuccess) {
      electronAnimation4.start();
    } else {
      electronAnimation4.stop();
    }
  }

  handleSolutionSelect(solution) {
    if (this.selectedBeaker) {
      this.selectedBeaker.setSolution(solution);
      this.selectedBeaker = null;
      this.stopAllAnimations();
    }
  }

  stopAllAnimations() {
    this.isSuccess = false;
    electronAnimation4.stop();

    // 移除所有燈泡效果
    Components.children
      .filter((c) => c.type === "LightBulb")
      .forEach((bulb) => {
        bulb.children.forEach((child, index) => {
          if (child.label === "lightEffect") {
            bulb.removeChildAt(index);
          }
        });
      });

    console.log("所有動畫已完全停止並重置");
  }
}

class Battery extends Container {
  constructor() {
    super();
    this.type = "Battery";
    this.joints = [];

    const body = new Sprite(Texture.from("電池.png"));
    body.anchor.set(0.5);
    body.scale.set(0.6);
    body.eventMode = "static";
    body.cursor = "pointer";
    body.on("pointerdown", onDragStart);

    const JOINT_POSITON = [
      [-100, 0],
      [100, 0],
    ];
    for (let [x, y] of JOINT_POSITON) {
      const joint = new Graphics().circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.3 }).stroke({ color: 0xffffff, width: 2 });
      joint.eventMode = "static";
      joint.cursor = "pointer";
      joint.on("pointerdown", onDragStart);
      joint.position.set(x, y);
      joint.connected = false;
      joint.isJoint = true;
      joint.zIndex = 2;
      this.joints.push(joint);
      this.addChild(joint);
    }

    this.addChild(body);
  }

  getGlobalJointPositions() {
    return this.joints.map((joint) => {
      const globalPos = this.toGlobal(joint.position);
      return { x: globalPos.x, y: globalPos.y };
    });
  }
}

class LightBulb extends Container {
  constructor() {
    super();
    this.type = "LightBulb";
    this.joints = [];

    const body = new Sprite(Texture.from("燈泡.png"));
    body.anchor.set(0.5);
    body.scale.set(0.5);
    body.rotation = 0;
    body.eventMode = "static";
    body.cursor = "pointer";
    body.on("pointerdown", onDragStart);

    const JOINT_POSITION = [
      [0, 90],
      [40, 50],
    ];
    for (let [x, y] of JOINT_POSITION) {
      const joint = new Graphics().circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ color: 0xffffff, width: 2 });
      joint.eventMode = "static";
      joint.cursor = "pointer";
      joint.on("pointerdown", onDragStart);
      joint.position.set(x, y);
      joint.connected = false;
      joint.isJoint = true;
      joint.zIndex = 2;
      this.joints.push(joint);
      this.addChild(joint);
    }

    this.addChild(body);
  }

  getGlobalJointPositions() {
    return this.joints.map((joint) => {
      const globalPos = this.toGlobal(joint.position);
      return { x: globalPos.x, y: globalPos.y };
    });
  }
}

class Wire extends Container {
  constructor() {
    super();
    this.type = "Wire";
    this.joints = [];
    this.wireBody = new Graphics();
    this.wireBody.eventMode = "static";
    this.wireBody.cursor = "pointer";
    this.wireBody.on("pointerdown", onDragStart);
    this.zIndex = 3;

    for (let i = 0; i < 2; i++) {
      const joint = new Graphics().circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ color: 0xffffff, width: 2 });
      joint.eventMode = "static";
      joint.cursor = "pointer";
      joint.on("pointerdown", onDragStart);
      joint.position.set(i * 200, 0);
      joint.connected = false;
      joint.isJoint = true;
      joint.zIndex = 1;
      this.joints.push(joint);
      this.addChild(joint);
    }

    this.addChild(this.wireBody);
    this.redrawWire();
  }

  redrawWire() {
    // 確保線條總是在接點下方
    this.removeChild(this.wireBody);
    this.addChild(this.wireBody);

    this.wireBody.clear();
    this.wireBody
      .moveTo(this.joints[0].x, this.joints[0].y)
      .lineTo(this.joints[1].x, this.joints[1].y)
      .stroke({ width: 20, color: 0x000000, cap: "round" })
      .moveTo(this.joints[0].x, this.joints[0].y)
      .lineTo(this.joints[1].x, this.joints[1].y)
      .stroke({ width: 15, color: 0xff8000, cap: "round" });
  }

  getGlobalJointPositions() {
    return this.joints.map((joint) => {
      const globalPos = this.toGlobal(joint.position);
      return { x: globalPos.x, y: globalPos.y };
    });
  }
}

class Beaker extends Container {
  constructor() {
    super();
    this.type = "Beaker";
    this.joints = [];
    this.solution = null;

    // 建立燒杯主體
    this.body = new Sprite(Texture.from("燒杯.png"));
    this.body.anchor.set(0.5);
    this.body.scale.set(0.8);
    this.body.rotation = 0;
    // 將 body 保持互動，但不直接綁定拖曳或選擇
    this.body.eventMode = "static";
    this.body.cursor = "pointer";
    this.body.on("pointerdown", onDragStart);
    this.zIndex = 50;

    // 創建溶液名稱文字
    this.solutionText = new Text({
      text: "溶液：點擊後選擇右側列表",
      style: defaultStyle3,
    });
    this.solutionText.anchor.set(0.5, 0);
    this.solutionText.position.set(20, 180);
    this.addChild(this.solutionText);

    // 建立連結點（拖曳用）－保持原有拖曳設定
    const JOINT_POSITION = [
      [-50, 0],
      [90, 0],
    ];
    for (let [x, y] of JOINT_POSITION) {
      const joint = new Graphics().circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ color: 0xffffff, width: 2 });
      joint.position.set(x, y);
      joint.connected = false;
      joint.isJoint = true;
      joint.zIndex = 99;
      this.joints.push(joint);
      this.addChild(joint);

      // 連結點保留拖曳功能
      joint.eventMode = "static";
      joint.cursor = "pointer";
      joint.on("pointerdown", onDragStart);
    }

    // 將燒杯容器自身設為互動，綁定 pointerdown 事件來選擇燒杯
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", () => {
      const module = Module4.getInstance();
      if (module) {
        module.selectedBeaker = this;
      }
    });

    this.addChild(this.body);
  }

  setSolution(solutionType) {
    this.solution = solutionType;
    const color = this.getSolutionColor(solutionType);
    this.updateBeakerColor(color);
    this.solutionText.text = `溶液：${solutionType || "點擊容器後選擇右側列表"}`;
  }

  getSolutionColor(solutionType) {
    const solutionColors = {
      硫酸銅: "blue",
      硫酸鋅: "transparent",
      硝酸鉀: "transparent",
    };
    return solutionColors[solutionType] || "transparent";
  }

  updateBeakerColor(color) {
    const colorMap = {
      white: 0xffffff,
      blue: 0x4169e1,
      yellow: 0xfffdeb,
      lightgreen: 0x00e0f0,
      transparent: 0xffffff,
    };
    this.body.tint = colorMap[color] || 0xffffff;
  }

  getGlobalJointPositions() {
    return this.joints.map((joint) => {
      const globalPos = this.toGlobal(joint.position);
      return { x: globalPos.x, y: globalPos.y };
    });
  }
}

class CopperStrip extends Container {
  constructor() {
    super();
    this.type = "CopperStrip";
    this.joints = [];

    this.body = new Graphics();
    this.drawStrip();

    this.body.eventMode = "static";
    this.body.cursor = "pointer";
    this.body.on("pointerdown", onDragStart);

    const JOINT_POSITION = [
      [0, -120],
      [0, 120],
    ];
    for (let [x, y] of JOINT_POSITION) {
      const joint = new Graphics().circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ color: 0xffffff, width: 2 });
      joint.eventMode = "static";
      joint.cursor = "pointer";
      joint.on("pointerdown", onDragStart);
      joint.position.set(x, y);
      joint.connected = false;
      joint.isJoint = true;
      joint.zIndex = 2;
      this.joints.push(joint);
      this.addChild(joint);
    }

    const text = new Text({
      text: "銅棒",
      style: listStyle,
    });
    text.anchor.set(0.5);

    this.addChild(this.body, text);
  }

  drawStrip(scale = 1) {
    this.body.clear();

    const width = 60;
    const height = 250;
    const topWidth = width;
    const bottomWidth = width * scale;

    // 繪製梯形
    this.body.moveTo(-topWidth / 2, -height / 2); // 左上
    this.body.lineTo(topWidth / 2, -height / 2); // 右上
    this.body.lineTo(bottomWidth / 2, height / 2); // 右下
    this.body.lineTo(-bottomWidth / 2, height / 2); // 左下
    this.body.fill(0xb87333); // 銅的顏色
  }

  getGlobalJointPositions() {
    return this.joints.map((joint) => {
      const globalPos = this.toGlobal(joint.position);
      return { x: globalPos.x, y: globalPos.y };
    });
  }
}

class ZincStrip extends Container {
  constructor() {
    super();
    this.type = "ZincStrip";
    this.joints = [];
    this.body = new Graphics();
    this.drawStrip();

    this.body.eventMode = "static";
    this.body.cursor = "pointer";
    this.body.on("pointerdown", onDragStart);

    const JOINT_POSITION = [
      [0, -120],
      [0, 120],
    ];
    for (let [x, y] of JOINT_POSITION) {
      const joint = new Graphics().circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ color: 0xffffff, width: 2 });
      joint.eventMode = "static";
      joint.cursor = "pointer";
      joint.on("pointerdown", onDragStart);
      joint.position.set(x, y);
      joint.connected = false;
      joint.isJoint = true;
      joint.zIndex = 2;
      this.joints.push(joint);
      this.addChild(joint);
    }
    const text = new Text({
      text: "鋅棒",
      style: listStyle,
    });
    text.anchor.set(0.5);

    this.addChild(this.body, text);
  }

  drawStrip(scale = 1) {
    this.body.clear();

    const width = 60;
    const height = 250;
    const topWidth = width;
    const bottomWidth = width * scale;

    // 繪製梯形
    this.body.moveTo(-topWidth / 2, -height / 2); // 左上
    this.body.lineTo(topWidth / 2, -height / 2); // 右上
    this.body.lineTo(bottomWidth / 2, height / 2); // 右下
    this.body.lineTo(-bottomWidth / 2, height / 2); // 左下
    this.body.fill(0x808080); // 鋅的顏色
  }

  getGlobalJointPositions() {
    return this.joints.map((joint) => {
      const globalPos = this.toGlobal(joint.position);
      return { x: globalPos.x, y: globalPos.y };
    });
  }
}

class UTube extends Container {
  constructor() {
    super();
    this.type = "UTube";
    this.joints = [];
    this.body = new Sprite(Texture.from("U型管.png"));
    this.body.anchor.set(0.5);
    this.body.scale.set(0.66);
    this.body.rotation = 0;
    this.body.eventMode = "static";
    this.body.cursor = "pointer";
    this.body.on("pointerdown", onDragStart);

    // 創建溶液名稱文字
    this.solutionText = new Text({
      text: "溶液：點擊後選擇右側列表",
      style: defaultStyle3,
    });
    this.solutionText.anchor.set(0.5, 0);
    this.solutionText.position.set(0, -180);
    this.addChild(this.solutionText);

    const JOINT_POSITION = [
      [-100, 120],
      [100, 120],
    ];
    for (let [x, y] of JOINT_POSITION) {
      const joint = new Graphics().circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ color: 0xffffff, width: 2 });
      joint.eventMode = "static";
      joint.cursor = "pointer";
      joint.on("pointerdown", onDragStart);
      joint.position.set(x, y);
      joint.connected = false;
      joint.isJoint = true;
      joint.zIndex = 2;
      this.joints.push(joint);
      this.addChild(joint);
    }
    this.addChild(this.body);

    // 將燒杯容器自身設為互動，綁定 pointerdown 事件來選擇燒杯
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", () => {
      const module = Module4.getInstance();
      if (module) {
        module.selectedBeaker = this;
      }
    });
  }
  setSolution(solutionType) {
    this.solution = solutionType;
    const color = this.getSolutionColor(solutionType);
    this.updateBeakerColor(color);
    this.solutionText.text = `溶液：${solutionType || "點擊後選擇右側列表"}`;
  }

  // 根據溶液類型取得對應顏色
  getSolutionColor(solutionType) {
    const solutionColors = {
      硫酸銅: "blue", // 藍色
      硫酸鋅: "transparent", // 淡藍色
      硝酸鉀: "transparent", // 無色
    };
    return solutionColors[solutionType] || "transparent";
  }

  // 更新燒杯顏色
  updateBeakerColor(color) {
    // 將顏色名稱轉換為16進制顏色代碼
    const colorMap = {
      white: 0xffffff,
      blue: 0x4169e1,
      yellow: 0xfffdeb,
      lightgreen: 0x00e0f0,
      transparent: 0xffffff,
    };

    this.body.tint = colorMap[color] || 0xffffff;
  }

  getGlobalJointPositions() {
    return this.joints.map((joint) => {
      const globalPos = this.toGlobal(joint.position);
      return { x: globalPos.x, y: globalPos.y };
    });
  }
}

function getCircuitPathPoints() {
  let startJoint = null;
  let endJoint = null;

  // 找到所有與金屬棒連接的導線連接點
  const metalStripJoints = [];
  for (const comp of Components.children) {
    if (comp.type === "Wire") {
      for (const joint of comp.joints) {
        if (joint.connectedTo && joint.connectedTo.parent) {
          const connectedType = joint.connectedTo.parent.type;
          if (connectedType === "CopperStrip" || connectedType === "ZincStrip") {
            const stripPos = joint.connectedTo.parent.position.x;
            metalStripJoints.push({
              joint: joint,
              type: connectedType,
              x: stripPos,
            });
          }
        }
      }
    }
  }

  // 根據金屬棒的位置排序，找出最左和最右的連接點
  metalStripJoints.sort((a, b) => a.x - b.x);

  if (metalStripJoints.length >= 2) {
    startJoint = metalStripJoints[0].joint;
    endJoint = metalStripJoints[metalStripJoints.length - 1].joint;
  }

  if (!startJoint || !endJoint) {
    console.warn("找不到起始或結束連結點");
    return [];
  }

  const path = [];
  const visited = new Set();
  let currentJoint = startJoint;
  let prevJoint = null;

  // 從起點開始追蹤路徑
  while (currentJoint && !visited.has(currentJoint)) {
    visited.add(currentJoint);

    // 取得當前連結點的全域位置
    const globalPos = currentJoint.parent.toGlobal(currentJoint.position);
    path.push(globalPos);

    let nextJoint = null;
    const parentComp = currentJoint.parent;

    if (parentComp.type === "Wire") {
      // 在導線中找另一個連結點
      for (const joint of parentComp.joints) {
        if (joint !== currentJoint && joint.connectedTo) {
          nextJoint = joint.connectedTo;
          break;
        }
      }
    } else if (parentComp.type === "Battery" || parentComp.type === "LightBulb") {
      // 元件有兩個連結點的情況
      for (const joint of parentComp.joints) {
        if (joint !== currentJoint && joint.connectedTo && joint.connectedTo !== prevJoint) {
          nextJoint = joint.connectedTo;
          break;
        }
      }
    }

    // 如果找到終點，加入路徑後結束
    if (nextJoint === endJoint) {
      const endPos = nextJoint.parent.toGlobal(nextJoint.position);
      path.push(endPos);
      break;
    }

    // 若無法找到下一個點則中斷
    if (!nextJoint) break;

    // 更新前一個點和當前點
    prevJoint = currentJoint;
    currentJoint = nextJoint;
  }

  return path;
}

class ElectronAnimation {
  constructor() {
    this.container = new Container();
    this.electronsContainer = new Container();
    this.container.addChild(this.electronsContainer);

    this.electrons = [];
    this.electronAnimations = [];
    this.isAnimating = false;
  }

  createElectron() {
    const electron = new Graphics().circle(0, 0, 5).fill(0xffff00);
    electron.alpha = 0.8;
    electron.visible = false;
    return electron;
  }

  start() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // 獲取電路路徑
    const points = getCircuitPathPoints();
    if (points.length < 2) {
      console.warn("路徑點不足，無法進行電子動畫");
      return;
    }

    // 創建多個電子
    const electronCount = 12;
    for (let i = 0; i < electronCount; i++) {
      const electron = this.createElectron();
      this.electronsContainer.addChild(electron);
      electron.visible = true;

      // 計算初始位置
      const progress = i / electronCount;
      this.electrons.push({
        sprite: electron,
        progress: progress,
      });
    }

    this.animateElectrons(points);
  }

  animateElectrons(points) {
    // 為每個電子創建動畫
    this.electrons.forEach((electron, index) => {
      const tween = gsap.to(electron, {
        duration: 8, // 調整動畫速度
        progress: "+=1",
        repeat: -1,
        ease: "none",
        onUpdate: () => {
          const currentProgress = electron.progress % 1;
          const segmentCount = points.length - 1;
          const totalProgress = currentProgress * segmentCount;
          const segmentIndex = Math.floor(totalProgress);
          const segmentProgress = totalProgress - segmentIndex;

          // 確保索引在有效範圍內
          if (segmentIndex < points.length - 1) {
            const currentPoint = points[segmentIndex];
            const nextPoint = points[segmentIndex + 1];

            // 計算當前位置
            const globalX = currentPoint.x + (nextPoint.x - currentPoint.x) * segmentProgress;
            const globalY = currentPoint.y + (nextPoint.y - currentPoint.y) * segmentProgress;

            // 轉換為局部坐標
            const localPos = this.electronsContainer.toLocal({ x: globalX, y: globalY });
            electron.sprite.position.set(localPos.x, localPos.y);
          }
        },
      });

      this.electronAnimations.push(tween);
    });
  }

  stop() {
    this.isAnimating = false;
    this.stopElectronAnimation();
    this.reset();
  }

  stopElectronAnimation() {
    this.electronAnimations.forEach((anim) => anim?.kill());
    this.electronAnimations = [];
    this.electrons.forEach((e) => (e.sprite.visible = false));
  }

  reset() {
    this.electrons.forEach((electron) => {
      if (electron.sprite.parent) {
        electron.sprite.parent.removeChild(electron.sprite);
      }
    });
    this.electrons = [];
    this.electronAnimations = [];
  }
}

class ItemsList {
  constructor() {
    this.container = new Container();
    this.items = [];
    this.module4 = null;

    this.module4Components = {
      電線: { texture: "電線.png", type: "Wire" },
      燈泡: { texture: "燈泡.png", type: "LightBulb" },
      電池: { texture: "電池.png", type: "Battery" },
      燒杯: { texture: "燒杯.png", type: "Beaker" },
      U型管: { texture: "U型管.png", type: "UTube" },
    };

    // Default to module4 components
    this.components = this.module4Components;
    this.createItems();
  }

  // Call this method on reset to re-enable single-use items
  reset() {
    this.container.removeChildren();
    this.createItems();
  }

  createItems() {
    // 銷毀現有的項目
    this.items.forEach((item) => item.destroy());
    this.items = [];

    const componentNames = Object.keys(this.components);
    // 將組件以垂直欄排列，組件間隔為5（項目高度120加上5的間距，即125）
    for (let i = 0; i < componentNames.length; i++) {
      const name = componentNames[i];
      const component = this.components[name];

      const item = new Container();
      // 設定項目的位置；根據需要調整 x 與 y 值
      item.position.set(20, 70 + i * 125);

      const itemBg = new Graphics().roundRect(0, 0, 120, 120, 15).fill(0xeeeeee).stroke({ width: 2, color: 0x3c3c3c });
      item.addChild(itemBg);

      const sprite = new Sprite(Texture.from(component.texture));
      sprite.anchor.set(0.5);
      // 調整精靈大小以適應項目區域
      const scale = 80 / Math.max(sprite.width, sprite.height);
      sprite.scale.set(scale);
      sprite.position.set(60, 50);
      item.addChild(sprite);

      const text = new Text({
        text: name,
        style: listStyle,
      });
      text.anchor.set(0.5);
      text.position.set(60, 100);
      item.addChild(text);

      item.eventMode = "static";
      item.cursor = "pointer";
      item.componentType = component.type;
      item.texture = component.texture;

      item.on("pointerdown", (e) => this.onDragStart(e, item));

      this.container.addChild(item);
      this.items.push(item);
    }
  }

  onDragStart(event, item) {
    // 如果該單一使用元件已被拖出過，就不做任何動作
    if (!item.visible) return;

    const sprite = new Sprite(Texture.from(item.texture));
    sprite.anchor.set(0.5);
    const scale = 80 / Math.max(sprite.width, sprite.height);
    sprite.scale.set(scale);

    const globalPos = event.getLocalPosition(this.container.parent);
    sprite.position.copyFrom(globalPos);

    // 計算偏移量
    this.dragOffset = {
      x: globalPos.x - this.container.parent.toLocal({ x: event.clientX, y: event.clientY }).x,
      y: globalPos.y - this.container.parent.toLocal({ x: event.clientX, y: event.clientY }).y,
    };

    sprite.alpha = 0.8;
    sprite.componentType = item.componentType;
    sprite.startPos = { x: event.clientX, y: event.clientY }; // 記錄起始位置

    this.draggedSprite = sprite;
    this.container.parent.addChild(sprite);

    const dragMove = (e) => {
      if (this.draggedSprite) {
        const point = this.container.parent.toLocal({ x: e.clientX, y: e.clientY });
        this.draggedSprite.position.set(point.x + this.dragOffset.x, point.y + this.dragOffset.y);
      }
    };

    const dragEnd = (e) => {
      if (this.draggedSprite) {
        // 計算拖動距離
        const dragDistance = Math.sqrt(
          Math.pow(e.clientX - this.draggedSprite.startPos.x, 2) + Math.pow(e.clientY - this.draggedSprite.startPos.y, 2)
        );

        const point = this.container.parent.toLocal({ x: e.clientX, y: e.clientY });
        const finalPos = {
          x: point.x + this.dragOffset.x,
          y: point.y + this.dragOffset.y,
        };

        // 只有當拖動距離超過閾值時才建立元件
        if (dragDistance > 20) {
          const component = this.createComponent(item.componentType, finalPos);
          if (component) {
            Components.addChild(component);
            // 移除 ItemsList 上的圖案，使其無法再拖動
            // 檢查是否為金屬棒相關組件
            if (item.componentType === "Beaker" || item.componentType === "ZincStrip" || item.componentType === "CopperStrip") {
              // 計算場上相同類型的組件數量
              const sameTypeCount = Components.children.filter((c) => c.type === item.componentType).length;
              if (sameTypeCount >= 2) {
                for (let i = 1; i < item.children.length; i++) {
                  item.children[i].visible = false;
                }
                item.eventMode = "none";
              }
            }

            // 原有的限制單一使用元件邏輯
            if (item.componentType === "UTube" || item.componentType === "LightBulb" || item.componentType === "Battery") {
              // 只隱藏除了第一個元素 (itemBg) 以外的所有項目
              for (let i = 1; i < item.children.length; i++) {
                item.children[i].visible = false;
              }
              item.eventMode = "none";
            }
          }
        }

        this.container.parent.removeChild(this.draggedSprite);
        this.draggedSprite = null;
      }

      window.removeEventListener("pointermove", dragMove);
      window.removeEventListener("pointerup", dragEnd);
    };

    window.addEventListener("pointermove", dragMove);
    window.addEventListener("pointerup", dragEnd);
  }

  createComponent(type, position) {
    let component;
    switch (type) {
      case "Battery":
        component = new Battery();
        break;
      case "LightBulb":
        component = new LightBulb();
        break;
      case "Wire":
        component = new Wire();
        break;
      case "Beaker":
        component = new Beaker();
        break;
      case "UTube":
        component = new UTube();
        break;
    }

    if (component) {
      component.position.set(position.x, position.y);
    }
    return component;
  }
}

export const electronAnimation4 = new ElectronAnimation();
