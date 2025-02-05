import { ColorMatrixFilter, Container, Graphics, Sprite, Text, Texture } from "./pixi.mjs";
import { listStyle } from "./textStyle.mjs";
import { gsap } from "../gsap-public/src/index.js";
export { Module2 };

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
    // Find the Module2 instance from the Components container
    const module2Instance = Module2.getInstance();
    if (module2Instance) {
      module2Instance.ionAnimation.stop();
      module2Instance.electronAnimation.stop();
      module2Instance.isSuccess = false;
      module2Instance.metalStripAnim.stop();
    }

    // 重置檢流計
    const ammeter = Components.children.find((c) => c.type === "Ammeter");
    if (ammeter) {
      const pin = ammeter.children.find((child) => child instanceof Graphics);
      if (pin) {
        pin.rotation = 0;
        gsap.killTweensOf(pin);
      }
    }

    // 隱藏所有燈泡的光效果
    Components.children
      .filter((c) => c.type === "LightBulb")
      .forEach((bulb) => {
        const lightEffect = bulb.children.find((child) => child.name === "lightEffect");
        if (lightEffect) {
          bulb.removeChild(lightEffect);
        }
      });
  }

  // 在檢查完所有連接後呼叫印出函數
  printConnections();
}

function printConnections() {
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
}

function areJointsOverlapping(joint1Pos, joint2Pos) {
  const distance = Math.sqrt(Math.pow(joint1Pos.x - joint2Pos.x, 2) + Math.pow(joint1Pos.y - joint2Pos.y, 2));
  return distance < 10;
}

let previousConnections = [];

const Components = new Container();
const AllJoints = new Container();

class Module2 {
  static currentInstance = null;
  constructor() {
    Module2.currentInstance = this;
    this.container = new Container();
    this.selectedBeaker = null;
    this.isSuccess = false;

    // 新增磅秤實例
    this.weight = new Weight();
    this.container.addChild(this.weight.container);
    this.weight.container.position.set(1650, 800);

    // 創建主要容器
    Components.sortableChildren = true;
    this.container.addChild(DRAG_AREA, Components, AllJoints);

    // 創建並定位ItemsList
    this.itemsList = new ItemsList(Components);
    this.container.addChild(this.itemsList.container);
    this.itemsList.container.position.set(20, 80);

    // 設置 ItemsList 的引用
    this.itemsList.setModule2(this);

    this.ionAnimation = new IonAnimation(this);
    this.container.addChild(this.ionAnimation.container);

    this.electronAnimation = new ElectronAnimation(this);
    this.container.addChild(this.electronAnimation.container);

    this.metalStripAnim = new MetalStripAnimation();

    this.initializeScene();
  }

  static getInstance() {
    return Module2.currentInstance;
  }

  // 新增初始化場景方法
  initializeScene() {
    this.createZincStrip();
    this.createCopperStrip();
    this.createBeaker();
    this.bindBeakerEvent();
    this.bindBeakerEvents();
    this.bindUTubeEvent();
    this.setupDebugButton();
  }

  // 重置方法
  reset() {
    // 清除所有組件
    Components.removeChildren();
    AllJoints.removeChildren();
    this.ionAnimation.stop();
    this.electronAnimation.stop();
    this.metalStripAnim.reset();
    this.itemsList.reset();
    this.isSuccess = false;
    // 重新初始化場景
    this.initializeScene();
  }

  toggleIonDisplay(show) {
    this.isIonCheck = show;
    if (show && this.isSuccess) {
      this.ionAnimation.start();
    } else {
      this.ionAnimation.stop();
    }
  }

  toggleElectronDisplay(show) {
    this.isEleCheck = show;
    if (show && this.isSuccess) {
      this.electronAnimation.start();
    } else {
      this.electronAnimation.stop();
    }
  }

  // 新增綁定燒杯事件的方法
  bindBeakerEvent(beaker) {
    if (beaker && beaker instanceof Beaker) {
      // 添加類型檢查
      beaker.eventMode = "static";
      beaker.cursor = "pointer";
      beaker.on("pointerdown", () => {
        this.selectedBeaker = beaker;
      });
    }
  }

  bindUTubeEvent(utube) {
    if (utube && utube instanceof UTube) {
      utube.eventMode = "static";
      utube.cursor = "pointer";
      utube.on("pointerdown", () => {
        this.selectedBeaker = utube;
      });
    }
  }

  // 修改原有的批量綁定方法
  bindBeakerEvents() {
    if (this.beaker) {
      this.beaker.forEach((beaker) => this.bindBeakerEvent(beaker));
    }
  }

  // 處理溶液選擇
  handleSolutionSelect(solution) {
    if (this.selectedBeaker) {
      this.selectedBeaker.setSolution(solution);
      this.selectedBeaker = null;
    }
  }

  createBeaker() {
    this.beaker = [];
    for (let i = 0; i < 2; i++) {
      this.beaker[i] = new Beaker();
      this.beaker[i].position.set(700 + i * 340, 780);
      Components.addChild(this.beaker[i]);
    }
  }
  createZincStrip() {
    const zincStrip = new ZincStrip();
    zincStrip.position.set(650, 660);
    Components.addChild(zincStrip);
  }
  createCopperStrip() {
    const copperStrip = new CopperStrip();
    copperStrip.position.set(1130, 660);
    Components.addChild(copperStrip);
  }

  // 新增檢查電路組裝的方法
  validateCircuitAssembly() {
    // Helper function: 根據電路路徑點，找出連結在電路上的所有元件
    function addCircuitComponents(circuitPoints, circuitComponents) {
      Components.children.forEach((comp) => {
        if (comp.joints) {
          comp.joints.forEach((joint) => {
            const globalJointPos = comp.toGlobal(joint.position);
            if (
              circuitPoints.some(
                (circuitPoint) => Math.abs(circuitPoint.x - globalJointPos.x) < 10 && Math.abs(circuitPoint.y - globalJointPos.y) < 10
              )
            ) {
              circuitComponents.add(comp);
            }
          });
        }
      });
    }

    // Helper function: 深度遍歷連結的元件，組成一個電路
    function traverseCircuit(component, circuit) {
      if (circuit.components.has(component)) return;
      circuit.components.add(component);
      if (component.type === "Battery") circuit.batteryCount++;
      if (component.type === "LightBulb") circuit.lightBulbs.push(component);
      component.joints.forEach((joint) => {
        if (joint.connectedTo) {
          traverseCircuit(joint.connectedTo.parent, circuit);
        }
      });
    }

    const requiredComponents = {
      ZincStrip: 1,
      CopperStrip: 1,
      UTube: 1,
      Ammeter: 1,
      Beaker: 2,
      Wire: 2,
    };

    const typeToName = {
      ZincStrip: "鋅片",
      CopperStrip: "銅片",
      UTube: "U型管",
      Ammeter: "檢流計",
      Beaker: "燒杯",
      Wire: "電線",
      LightBulb: "燈泡",
      Battery: "電池",
      Clip: "迴紋針",
      Cotton: "棉花",
    };

    const allComponents = Components.children;
    const componentCounts = {};

    // 計算各類元件數量
    allComponents.forEach((component) => {
      componentCounts[component.type] = (componentCounts[component.type] || 0) + 1;
    });
    // 電線數量包含 Wire 與 Clip
    const wireLikeComponents = allComponents.filter((c) => c.type === "Wire" || c.type === "Clip");
    componentCounts["Wire"] = wireLikeComponents.length;

    // 驗證必需元件是否齊全
    for (const [type, count] of Object.entries(requiredComponents)) {
      if (!componentCounts[type] || componentCounts[type] < count) {
        return { success: false, message: "不對喔！再想想看，有哪些組件還沒有放置呢？" };
      }
    }

    // 驗證重要組件的連接
    const requiredConnections = [
      { component: "ZincStrip", connections: ["Wire", "Beaker"] },
      { component: "CopperStrip", connections: ["Wire", "Beaker"] },
      { component: "UTube", connections: ["Beaker", "Beaker"] },
      { component: "Ammeter", connections: ["Wire", "Wire"] },
    ];

    for (const req of requiredConnections) {
      const comp = allComponents.find((c) => c.type === req.component);
      if (!comp) continue;

      if (req.component === "Ammeter") {
        const wireConnections = comp.joints.filter((j) => j.connectedTo && j.connectedTo.parent.type === "Wire").length;
        if (wireConnections !== 2) {
          return { success: false, message: "檢流計必須兩個連結點都連接到電線" };
        }
        continue;
      }

      if (req.component === "UTube") {
        const beakerConnections = comp.joints.filter((j) => j.connectedTo && j.connectedTo.parent.type === "Beaker").length;
        if (beakerConnections !== 2) {
          return { success: false, message: "U型管必須兩個連結點都連接到燒杯" };
        }
        continue;
      }

      const compConnections = comp.joints.map((j) => (j.connectedTo ? j.connectedTo.parent.type : null));
      const missing = req.connections.filter((reqConn) => !compConnections.includes(reqConn));
      if (missing.length > 0) {
        return { success: false, message: `${typeToName[req.component]} 連接不正確` };
      }
    }

    // 檢查 Ammeter、CopperStrip 與 ZincStrip 連接的電線另一端必須接到其他組件
    const componentsToCheck = ["Ammeter", "CopperStrip", "ZincStrip"];
    for (const comp of allComponents.filter((c) => componentsToCheck.includes(c.type))) {
      for (const joint of comp.joints) {
        if (joint.connectedTo && (joint.connectedTo.parent.type === "Wire" || joint.connectedTo.parent.type === "Clip")) {
          const wireComp = joint.connectedTo.parent;
          const hasOtherConnection = wireComp.joints.some((j) => j.connectedTo && j.connectedTo.parent !== comp);
          if (!hasOtherConnection) {
            return { success: false, message: `${typeToName[comp.type]} 所連接的電線另一端必須連接其他組件` };
          }
        }
      }
    }

    // 根據電路路徑點，找出所有與電路相關的元件
    const circuitPoints = getCircuitPathPoints();
    const circuitComponents = new Set();
    addCircuitComponents(circuitPoints, circuitComponents);

    // 驗證電路中每個元件的連接點，另一端必須有連接到其他組件
    for (const comp of circuitComponents) {
      for (const joint of comp.joints) {
        if (joint.connectedTo) {
          const partnerComponent = joint.connectedTo.parent;
          const hasOtherValidConnection = partnerComponent.joints.some(
            (pj) => pj !== joint.connectedTo && pj.connectedTo && pj.connectedTo.parent !== partnerComponent
          );
          if (!hasOtherValidConnection) {
            return { success: false, message: `${typeToName[comp.type]} 另一端必須連接其他組件` };
          }
        }
      }
    }

    // 檢查所有連結點是否只連結到唯一的連結點
    const connectionUsage = new Map();
    allComponents.forEach((comp) => {
      comp.joints.forEach((joint) => {
        if (joint.connectedTo) {
          const partnerJoint = joint.connectedTo;
          connectionUsage.set(partnerJoint, (connectionUsage.get(partnerJoint) || 0) + 1);
        }
      });
    });
    for (const count of connectionUsage.values()) {
      if (count > 1) {
        return { success: false, message: "所有連結點只能連結一個連結點" };
      }
    }

    // 驗證 U型管溶液
    const uTube = allComponents.find((c) => c.type === "UTube");
    if (!uTube.solution) {
      return { success: false, message: "請為U型管選擇溶液" };
    }
    if (uTube.solution !== "硝酸鉀") {
      return { success: false, message: "不對喔，U型管溶液不正確！" };
    }

    // 驗證所有燒杯溶液
    const beakers = allComponents.filter((c) => c.type === "Beaker");
    if (!beakers.every((b) => b.solution)) {
      return { success: false, message: "請為所有燒杯選擇溶液" };
    }
    const solutionCounts = { 硫酸銅: 0, 硫酸鋅: 0 };
    beakers.forEach((b) => {
      if (b.solution in solutionCounts) {
        solutionCounts[b.solution]++;
      }
    });
    if (solutionCounts["硫酸銅"] !== 1 || solutionCounts["硫酸鋅"] !== 1) {
      return { success: false, message: "不對喔，燒杯溶液不正確！" };
    }

    // 檢查棉花是否連接到電路中的任一元件（棉花為絕緣體）
    const cottonConnected = allComponents
      .filter((c) => c.type === "Cotton")
      .some((cotton) => cotton.joints.some((joint) => joint.connectedTo && circuitComponents.has(joint.connectedTo.parent)));
    if (cottonConnected) {
      return { success: false, message: "棉花是絕緣體，不能導電！" };
    }

    // 驗證電路中是否包含所有重要組件
    function hasRequiredComponents(componentsSet) {
      const requiredTypes = ["ZincStrip", "CopperStrip", "UTube", "Ammeter"];
      return requiredTypes.every((type) => Array.from(componentsSet).some((comp) => comp.type === type));
    }

    this.isSuccess = true;

    // 處理燈泡及電路分組
    const lightBulbs = allComponents.filter((c) => c.type === "LightBulb");
    // 移除所有燈泡原有的光效
    lightBulbs.forEach((bulb) => {
      const lightEffect = bulb.children.find((child) => child.name === "lightEffect");
      if (lightEffect) {
        bulb.removeChild(lightEffect);
      }
    });

    const circuits = [];
    lightBulbs.forEach((bulb) => {
      let foundCircuit = circuits.find((circuit) => circuit.components.has(bulb));
      if (!foundCircuit) {
        const circuit = {
          components: new Set(),
          lightBulbs: [],
          batteryCount: 0,
        };
        traverseCircuit(bulb, circuit);
        circuits.push(circuit);
      }
    });

    // 更新燈泡光效：只有當電路包含所有重要組件時才發光
    circuits.forEach((circuit) => {
      if (hasRequiredComponents(circuit.components)) {
        const bulbCount = circuit.lightBulbs.length;
        const batteryCount = circuit.batteryCount;
        if (bulbCount > 0) {
          let brightness = 1 - (bulbCount - 1) * 0.25 + batteryCount * 0.25;
          brightness = Math.max(0.5, Math.min(1.5, brightness));
          circuit.lightBulbs.forEach((bulb) => {
            let lightEffect = bulb.children.find((child) => child.name === "lightEffect");
            if (!lightEffect) {
              lightEffect = new Sprite(Texture.from("燈泡光.png"));
              lightEffect.name = "lightEffect";
              lightEffect.alpha = 0.7;
              lightEffect.anchor.set(0.5);
              lightEffect.position.set(0, -30);
              bulb.addChild(lightEffect);
            }
            lightEffect.scale.set(brightness);
          });
        }
      }
    });

    // 啟動動畫
    if (this.isIonCheck && !this.ionAnimation.isAnimating) {
      this.ionAnimation.start();
    }
    if (this.isEleCheck && !this.electronAnimation.isAnimating) {
      this.electronAnimation.start();
    }

    return { success: true, message: "組裝成功！" };
  }

  updateAmmeterPointer() {
    const ammeter = Components.children.find((c) => c.type === "Ammeter");
    if (!ammeter) return;

    const pin = ammeter.children.find((child) => child instanceof Graphics);
    if (pin) {
      gsap.to(pin, {
        rotation: Math.PI / 3,
        duration: 1,
        onComplete: () => {
          gsap.to(pin, {
            rotation: Math.PI / 2.5,
            duration: 1,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          });
        },
      });
    }
  }

  setupDebugButton() {
    // 創建除錯按鈕
    const debugButton = new Container();

    // 按鈕背景
    const buttonBg = new Graphics().roundRect(-50, -20, 100, 40, 10).fill(0xff0000);

    // 按鈕文字
    const buttonText = new Text({
      text: "DEBUG",
      style: {
        fontSize: 18,
        fill: 0xffffff,
      },
    });
    buttonText.anchor.set(0.5);

    debugButton.addChild(buttonBg, buttonText);
    debugButton.position.set(1300, 90);
    debugButton.eventMode = "static";
    debugButton.cursor = "pointer";

    debugButton.on("pointerdown", () => this.setupDebugScene());
    this.container.addChild(debugButton);

    // 隱藏除錯按鈕，並監聽鍵盤事件，只有同時按下 Shift + D + B 才會顯示
    debugButton.visible = false;
    const keysPressed = { shift: false, d: false, b: false };

    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (key === "shift") keysPressed.shift = true;
      if (key === "d") keysPressed.d = true;
      if (key === "b") keysPressed.b = true;
      if (keysPressed.shift && keysPressed.d && keysPressed.b) {
        debugButton.visible = true;
      }
    };

    const onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === "shift") keysPressed.shift = false;
      if (key === "d") keysPressed.d = false;
      if (key === "b") keysPressed.b = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
  }

  setupDebugScene() {
    // 清除現有組件
    Components.removeChildren();

    // 創建並放置檢流計
    const ammeter = new Ammeter();
    ammeter.position.set(900, 300);
    Components.addChild(ammeter);

    // 創建並放置 U型管
    const uTube = new UTube();
    uTube.position.set(900, 660);
    uTube.solution = "硝酸鉀";
    uTube.solutionText.text = "溶液：硝酸鉀";
    Components.addChild(uTube);

    // 創建並放置鋅片
    const zincStrip = new ZincStrip();
    zincStrip.position.set(650, 660);
    Components.addChild(zincStrip);

    // 創建並放置銅片
    const copperStrip = new CopperStrip();
    copperStrip.position.set(1130, 660);
    Components.addChild(copperStrip);

    // 創建並放置燒杯
    const beaker1 = new Beaker();
    beaker1.position.set(700, 780);
    beaker1.setSolution("硫酸鋅");
    Components.addChild(beaker1);

    const beaker2 = new Beaker();
    beaker2.position.set(1040, 780);
    beaker2.setSolution("硫酸銅");
    Components.addChild(beaker2);

    // 創建並放置電線
    const wire1 = new Wire();
    wire1.position.set(750, 450);
    wire1.joints[0].position.set(40, -90);
    wire1.joints[1].position.set(-100, 90);
    wire1.redrawWire();
    Components.addChild(wire1);

    const wire2 = new Wire();
    wire2.position.set(1020, 450);
    wire2.joints[0].position.set(0, -90);
    wire2.joints[1].position.set(110, 90);
    wire2.redrawWire();
    Components.addChild(wire2);

    // 設置連接
    setTimeout(() => {
      this.connectComponents(zincStrip, wire1, 0);
      this.connectComponents(wire1, ammeter, 1);
      this.connectComponents(ammeter, wire2, 0);
      this.connectComponents(wire2, copperStrip, 1);
      this.connectComponents(zincStrip, beaker1, 1);
      this.connectComponents(copperStrip, beaker2, 1);
      this.connectComponents(beaker1, uTube, 0);
      this.connectComponents(beaker2, uTube, 1);

      // 重新檢查所有連接
      recheckAllConnections();
    }, 100);
  }

  connectComponents(comp1, comp2, jointIndex) {
    // 找到最近的連接點
    const joint1 = comp1.joints[jointIndex];
    const joint2 = comp2.joints[0]; // 使用第一個連接點

    // 模擬連接
    joint1.connectedTo = joint2;
    joint2.connectedTo = joint1;

    // 設置視覺效果
    joint1.tint = 0x00ff00;
    joint2.tint = 0x00ff00;
    joint1.scale.set(0.7);
    joint2.scale.set(0.7);
  }

  update(time) {
    this.weight.checkWeight();
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

    this.body.filters = [new ColorMatrixFilter()];
    this.body.filters[0].brightness(1);
    this.body.zIndex = 50;

    // 創建溶液名稱文字
    this.solutionText = new Text({
      text: "溶液：點擊後選擇右側列表",
      style: { fontSize: 22, fill: 0x333333 },
    });
    this.solutionText.anchor.set(0.5, 0);
    this.solutionText.position.set(20, 180);
    this.addChild(this.solutionText);

    const JOINT_POSITION = [
      [-50, 0],
      [90, 0],
    ];
    for (let [x, y] of JOINT_POSITION) {
      const joint = new Graphics().circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ color: 0xffffff, width: 2 });
      joint.eventMode = "static";
      joint.cursor = "pointer";
      joint.on("pointerdown", onDragStart);
      joint.position.set(x, y);
      joint.connected = false;
      joint.isJoint = true;
      joint.zIndex = 99;
      this.joints.push(joint);
      this.addChild(joint);
    }

    this.addChild(this.body);
  }

  // 設置溶液類型和顏色
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
      純水: "transparent", // 無色
      自來水: "transparent", // 淡藍色
      "氯化鈉(液體)": "transparent", // 無色
      "氯化鈉(固體)": "white", // 無色
      "糖(液體)": "transparent", // 無色
      "糖(固體)": "white", // 無色
      酒精: "transparent", // 無色
      鹽酸: "transparent", // 無色
      醋酸: "transparent", // 淡黃色
      氫氧化鈉: "transparent", // 無色
      小蘇打粉: "transparent", // 無色
      氯化銅: "lightgreen", // 淡綠色
    };
    return solutionColors[solutionType] || "transparent";
  }

  // 更新燒杯顏色
  updateBeakerColor(color) {
    this.body.filters[0].brightness(1); // 重置亮度

    // 將顏色名稱轉換為16進制顏色代碼
    const colorMap = {
      white: 0xffffff,
      blue: 0x4169e1,
      yellow: 0xfffdeb,
      lightgreen: 0x00e0f0,
      transparent: 0xffffff,
    };

    this.body.tint = colorMap[color] || 0xffffff;

    if (color === "white") {
      this.body.filters[0].brightness(2); // 提高亮度使其更白
    }
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
      text: "銅片",
      style: listStyle,
    });
    text.anchor.set(0.5);

    this.addChild(this.body, text);
  }

  drawStrip(scale = 1) {
    this.body.clear();

    const width = 40;
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
      text: "鋅片",
      style: listStyle,
    });
    text.anchor.set(0.5);

    this.addChild(this.body, text);
  }

  drawStrip(scale = 1) {
    this.body.clear();

    const width = 40;
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
      style: { fontSize: 22, fill: 0x333333 },
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
      this.addChild(this.body);
    }
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
      純水: "transparent", // 無色
      自來水: "transparent", // 淡藍色
      "氯化鈉(液體)": "transparent", // 無色
      "氯化鈉(固體)": "white", // 無色
      "糖(液體)": "transparent", // 無色
      "糖(固體)": "white", // 無色
      酒精: "transparent", // 無色
      鹽酸: "transparent", // 無色
      醋酸: "transparent", // 淡黃色
      氫氧化鈉: "transparent", // 無色
      小蘇打粉: "transparent", // 無色
      氯化銅: "lightgreen", // 淡綠色
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

class Ammeter extends Container {
  constructor() {
    super();
    this.type = "Ammeter";
    this.joints = [];
    const body = new Sprite(Texture.from("檢流計.png"));
    body.anchor.set(0.5);
    body.scale.set(1);
    body.rotation = 0;
    body.eventMode = "static";
    body.cursor = "pointer";
    body.on("pointerdown", onDragStart);

    const pin = new Graphics().rect(-5, -68, 10, 60).fill(0xff0000).stroke({ color: 0x000000, width: 5 });

    const JOINT_POSITION = [
      [110, 50],
      [-110, 50],
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

    this.addChild(body, pin);
  }

  getGlobalJointPositions() {
    return this.joints.map((joint) => {
      const globalPos = this.toGlobal(joint.position);
      return { x: globalPos.x, y: globalPos.y };
    });
  }
}

class Clip extends Container {
  constructor() {
    super();
    this.type = "Clip";
    this.joints = [];
    const body = new Sprite(Texture.from("迴紋針.png"));
    body.anchor.set(0.5);
    body.scale.set(0.6);
    body.rotation = Math.PI / 2;
    body.eventMode = "static";
    body.cursor = "pointer";
    body.on("pointerdown", onDragStart);

    const JOINT_POSITION = [
      [-70, 0],
      [70, 0],
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

class Cotton extends Container {
  constructor() {
    super();
    this.type = "Cotton";
    this.joints = [];
    const body = new Sprite(Texture.from("棉花.png"));
    body.anchor.set(0.5);
    body.scale.set(0.7);
    body.rotation = 0;
    body.eventMode = "static";
    body.cursor = "pointer";
    body.on("pointerdown", onDragStart);

    const JOINT_POSITION = [
      [50, 0],
      [-50, 0],
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

class IonAnimation {
  constructor(module2) {
    this.module2 = module2;
    this.container = new Container();
    this.ionContainer = new Container();
    this.container.addChild(this.ionContainer);
    this.isAnimating = false;
    this.cu2Count = 5;
    this._animationToken = 0; // 用來追蹤當前的動畫 token

    this.ionColors = {
      "Zn2+": 0x7eb6ff,
      "Cu2+": 0x4169e1,
      "K+": 0x9370db,
      "NO3-": 0xba55d3,
    };
  }

  initializeIons() {
    const copperStrip = Components.children.find((c) => c.type === "CopperStrip");
    const beakers = Components.children.filter((c) => c.type === "Beaker");

    if (!beakers || beakers.length < 2 || !copperStrip) return;
    const cuBeaker = beakers.find((beaker) => beaker.joints.some((joint) => joint.connectedTo?.parent === copperStrip));
    if (!cuBeaker) return;

    // 清除現有離子
    this.ionContainer.removeChildren();

    // 創建初始 Cu2+ 離子
    for (let i = 0; i < this.cu2Count; i++) {
      const cu2 = this.createIon("Cu2+", {
        x: cuBeaker.x + (Math.random() - 0.5) * 100,
        y: cuBeaker.y + 50 + (Math.random() - 0.5) * 100,
      });
      this.startRandomMovement(cu2, cuBeaker);
      this.ionContainer.addChild(cu2);
    }
  }

  startRandomMovement(ion, beaker) {
    const moveIon = () => {
      // 每次動畫開始前檢查 token 是否匹配，避免舊動畫循環還在運作
      if (!this.isAnimating) return;

      const randomX = beaker.x + (Math.random() - 0.5) * 180;
      const randomY = beaker.y + 90 + (Math.random() - 0.5) * 110;

      gsap.to(ion, {
        x: randomX,
        y: randomY,
        duration: 3 + Math.random() * 2, // 3-5 秒的隨機時間
        ease: "sine.inOut", // 使用正弦緩動使運動更平滑
        onComplete: moveIon, // 動畫完成後繼續移動
      });
    };

    moveIon();
  }

  createIon(type, startPos) {
    const ion = this.createIonSprite(type, this.ionColors[type]);
    ion.position.copyFrom(startPos);
    ion.type = type;
    return ion;
  }

  createIonSprite(text, color) {
    const ionContainer = new Container();
    const circle = new Graphics();
    circle.circle(0, 0, 15).fill(color);

    const ionText = new Text({
      text: text,
      style: {
        fontSize: 16,
        fill: 0xffffff,
        align: "center",
      },
    });
    ionText.anchor.set(0.5);

    ionContainer.addChild(circle);
    ionContainer.addChild(ionText);

    return ionContainer;
  }

  async animate(token) {
    while (this.isAnimating && token === this._animationToken) {
      if (this.cu2Count > 0) {
        await this.createIonGroup();
        // 每次 await 後檢查 token 是否仍然有效
        if (!this.isAnimating || token !== this._animationToken) return;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        // 重置並開始新一輪
        this.cu2Count = 5;
        this.initializeIons();
      }
    }
  }

  async createIonGroup() {
    // 如果是第一組，延遲 1000 毫秒
    if (this.cu2Count === 5) {
      if (!this.isAnimating) return;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    const beakers = Components.children.filter((c) => c.type === "Beaker");
    const uTube = Components.children.find((c) => c.type === "UTube");
    const zincStrip = Components.children.find((c) => c.type === "ZincStrip");
    const copperStrip = Components.children.find((c) => c.type === "CopperStrip");

    if (!beakers || beakers.length < 2 || !uTube || !zincStrip || !copperStrip) return;

    // 找出與鋅片和銅片連結的燒杯
    const znBeaker = beakers.find((beaker) => beaker.joints.some((joint) => joint.connectedTo?.parent === zincStrip));
    const cuBeaker = beakers.find((beaker) => beaker.joints.some((joint) => joint.connectedTo?.parent === copperStrip));

    if (!znBeaker || !cuBeaker) return;

    // 創建離子
    const zn2 = this.createIon("Zn2+", {
      x: znBeaker.x,
      y: znBeaker.y,
    });
    const k1 = this.createIon("K+", {
      x: uTube.x + 100,
      y: uTube.y,
    });
    const k2 = this.createIon("K+", {
      x: uTube.x + 100,
      y: uTube.y - 50,
    });
    const no31 = this.createIon("NO3-", {
      x: uTube.x - 100,
      y: uTube.y,
    });
    const no32 = this.createIon("NO3-", {
      x: uTube.x - 100,
      y: uTube.y - 50,
    });

    this.ionContainer.addChild(zn2, k1, k2, no31, no32);

    // 動畫設定
    const duration = 2000;

    // 移除一個 Cu2+ 離子並加入動畫效果
    this.cu2Count--;
    const cuIon = Array.from(this.ionContainer.children).find((ion) => ion.type === "Cu2+");
    if (cuIon) {
      gsap.to(cuIon, {
        y: cuIon.y - 50,
        alpha: 0.3, // 淡出效果
        duration: 0.5,
        ease: "power1.out",
        onComplete: () => {
          this.ionContainer.removeChild(cuIon);
        },
      });
    }

    // Zn2+ 的動畫效果
    zn2.alpha = 0.3;
    gsap.to(zn2, {
      y: znBeaker.y + 50,
      duration: 1,
      alpha: 1,
      ease: "power1.in",
      onComplete: () => {
        this.startRandomMovement(zn2, znBeaker);
      },
    });

    // K+ 移動到與銅片連結的燒杯
    gsap.to([k1, k2], {
      x: cuBeaker.x - 40,
      y: cuBeaker.y + 50,
      duration: duration / 1000,
      ease: "power1.out",
      onComplete: () => {
        [k1, k2].forEach((ion) => this.startRandomMovement(ion, cuBeaker));
      },
    });

    // NO3- 移動到與鋅片連結的燒杯
    gsap.to([no31, no32], {
      x: znBeaker.x + 100,
      y: znBeaker.y + 50,
      duration: duration / 1000,
      ease: "power1.out",
      onComplete: () => {
        [no31, no32].forEach((ion) => this.startRandomMovement(ion, znBeaker));
      },
    });
  }

  async start() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    // 每次啟動動畫時更新 token，讓之前的動畫循環失效
    this.container.visible = true;

    this._animationToken++;
    const currentToken = this._animationToken;

    // 立即初始化 Cu2+ 離子
    this.initializeIons();
    // 延遲 1000 毫秒後開始動畫
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // 檢查 token 是否仍然有效
    if (!this.isAnimating || currentToken !== this._animationToken) return;
    this.animate(currentToken);
  }

  stop() {
    this.isAnimating = false;
    // 更新 token，確保所有現有的非同步循環能夠終止
    this._animationToken++;
    this.container.visible = false;
    // 取消 ionContainer 中所有子物件的 tween 動畫
    this.ionContainer.children.forEach((child) => {
      gsap.killTweensOf(child);
    });

    // 如果有額外記錄的 tween 動畫，也將其全部銷毀（例如 ionAnimations 陣列）
    if (this.ionAnimations && this.ionAnimations.length) {
      this.ionAnimations.forEach((tween) => tween.kill());
      this.ionAnimations = [];
    }

    // 清空 ionContainer 中的所有離子並重置計數
    this.ionContainer.removeChildren();
    this.cu2Count = 5;
  }
}

function getCircuitPathPoints() {
  let startJoint = null;
  // 找出起點：從 Wire 中找出與 ZincStrip 相連的連結點
  for (const comp of Components.children) {
    if (comp.type === "Wire") {
      for (const joint of comp.joints) {
        if (joint.connectedTo && joint.connectedTo.parent && joint.connectedTo.parent.type === "ZincStrip") {
          startJoint = joint;
          break;
        }
      }
    }
    if (startJoint) break;
  }
  if (!startJoint) {
    console.warn("找不到起始連結點（ZincStrip 連線）");
    return [];
  }

  const path = [];
  const visited = new Set();
  let currentJoint = startJoint;
  let prevJoint = null;

  while (currentJoint && !visited.has(currentJoint)) {
    visited.add(currentJoint);
    // 取得當前連結點的全域位置，並加入路徑中
    const globalPos = currentJoint.parent.toGlobal(currentJoint.position);
    path.push(globalPos);

    let nextJoint = null;
    const parentComp = currentJoint.parent;

    if (parentComp.type === "Wire") {
      // 如果在 Wire 中，尋找另一個連結點（非目前這一點）的連結
      for (const joint of parentComp.joints) {
        if (joint !== currentJoint && joint.connectedTo) {
          nextJoint = joint.connectedTo;
          break;
        }
      }
    } else if (parentComp.type === "Ammeter" || parentComp.type === "Clip" || parentComp.type === "LightBulb" || parentComp.type === "Battery") {
      // Ammeter 有兩個連結點，找到另一個連接點
      let otherJoint = null;
      for (const joint of parentComp.joints) {
        if (joint !== currentJoint) {
          otherJoint = joint;
          break;
        }
      }
      if (otherJoint) {
        // 優先使用其他連接點的 connectedTo，如果沒有，再直接使用其他連接點
        if (otherJoint.connectedTo && otherJoint.connectedTo !== prevJoint) {
          nextJoint = otherJoint.connectedTo;
        } else {
          nextJoint = otherJoint;
        }
      }
    } else {
      // 其他元件直接取其連結（排除回到前一個連結點）
      if (currentJoint.connectedTo && currentJoint.connectedTo !== prevJoint) {
        nextJoint = currentJoint.connectedTo;
      }
    }

    // 當下一個連結點屬於 CopperStrip 時，將其加入路徑後結束遍歷
    if (nextJoint && nextJoint.parent && nextJoint.parent.type === "CopperStrip") {
      const copperPos = nextJoint.parent.toGlobal(nextJoint.position);
      path.push(copperPos);
      break;
    }

    // 若無下一個連結點則中斷
    if (!nextJoint) break;

    // 更新 prevJoint 與 currentJoint，繼續遍歷
    prevJoint = currentJoint;
    currentJoint = nextJoint;
  }

  return path;
}

class ElectronAnimation {
  constructor(module2) {
    this.module2 = module2;
    this.container = new Container();
    this.electronsContainer = new Container();
    this.container.addChild(this.electronsContainer);

    this.electrons = [];
    this.electronAnimations = [];
    this.isAnimating = false;

    this.electronConfigs = {};
  }

  createElectron() {
    const electron = new Graphics().circle(0, 0, 5).fill(0xffff00);
    electron.alpha = 0.8;
    electron.visible = false;
    return electron;
  }

  createElectronsForComponent(component) {
    if (component.type === "Wire") {
      if (!component.joints || component.joints.length !== 2) return;

      const start = component.toGlobal(component.joints[0]);
      const end = component.toGlobal(component.joints[1]);

      for (let i = 0; i < 6; i++) {
        const electron = this.createElectron();
        const progress = i / 5;

        const globalX = start.x + (end.x - start.x) * progress;
        const globalY = start.y + (end.y - start.y) * progress;

        const localPos = this.electronsContainer.toLocal({ x: globalX, y: globalY });
        electron.x = localPos.x;
        electron.y = localPos.y;

        this.electronsContainer.addChild(electron);
        this.electrons.push({
          sprite: electron,
          component: component,
          globalPos: { x: globalX, y: globalY },
        });
      }
      return;
    }

    const config = this.electronConfigs[component.type];
    if (!config) return;

    config.forEach((pos) => {
      const electron = this.createElectron();
      const globalPos = component.toGlobal(pos);
      const localPos = this.electronsContainer.toLocal(globalPos);

      electron.x = localPos.x;
      electron.y = localPos.y;

      this.electronsContainer.addChild(electron);
      this.electrons.push({
        sprite: electron,
        component: component,
        globalPos: globalPos,
      });
    });
  }

  start() {
    // Only start electron animation if the circuit is complete
    if (!this.module2.isSuccess) {
      console.log("Incomplete circuit - electron animation will not start.");
      return;
    }
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Create electrons only for components in the complete circuit.
    const allComponents = Components.children.filter((c) => ["Wire", "ZincStrip", "CopperStrip", "Ammeter"].includes(c.type));
    const components = allComponents.filter((component) => {
      if (component.type === "Wire") {
        // Only include wires whose all joints are connected
        return component.joints.every((joint) => joint.connectedTo);
      }
      return true;
    });

    components.forEach((component) => {
      this.createElectronsForComponent(component);
    });

    this.startElectronAnimation();
  }

  startElectronAnimation() {
    // 停止先前的動畫
    this.stopElectronAnimation();

    // 取得根據連結點計算出的路徑
    const points = getCircuitPathPoints();
    if (points.length < 2) {
      console.warn("連接點不足，無法進行電子動畫。");
      return;
    }

    console.log("電子運動路徑：", points);

    // 為每個電子建立 GSAP tween 動畫
    this.electrons.forEach((electronData, index) => {
      const electron = electronData.sprite;
      electron.visible = true;

      // 初始進度偏移使各電子均勻分布
      const initialOffset = index / this.electrons.length;
      electronData.progress = initialOffset;

      const tween = gsap.to(electronData, {
        duration: 15,
        progress: 1 + initialOffset,
        repeat: -1,
        ease: "none",
        onUpdate: () => {
          const currentProgress = electronData.progress % 1;
          const segmentCount = points.length - 1; // 段數 = 點數 - 1
          const totalProgress = currentProgress * segmentCount;
          const segmentIndex = Math.floor(totalProgress);
          const t = totalProgress - segmentIndex;

          const currentPoint = points[segmentIndex];
          const nextPoint = points[segmentIndex + 1];

          // 線性插值計算當前位置
          const globalX = currentPoint.x + (nextPoint.x - currentPoint.x) * t;
          const globalY = currentPoint.y + (nextPoint.y - currentPoint.y) * t;

          const localPos = this.electronsContainer.toLocal({ x: globalX, y: globalY });
          electron.x = localPos.x;
          electron.y = localPos.y;
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
  }
}

class MetalStripAnimation {
  constructor() {
    this.container = new Container();
    this.progress = 0;
    this.isComplete = false;
    this.isAnimating = false;
    this.updateCount = 0;
  }

  async start() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.drawStrips(0);

    // Start animation loop
    while (this.isAnimating && !this.isComplete) {
      await this.updateStrips();
      if (!this.isComplete) {
        await new Promise((resolve) => setTimeout(resolve, 200)); // Animation interval
      }
    }
  }

  stop() {
    this.isAnimating = false;
  }

  reset() {
    this.isAnimating = false;
    this.progress = 0;
    this.isComplete = false;
    this.resetStrips();
  }

  async updateStrips() {
    const zincStrip = Components.children.find((c) => c.type === "ZincStrip");
    const copperStrip = Components.children.find((c) => c.type === "CopperStrip");

    if (!zincStrip || !copperStrip) return;

    this.progress = Math.min(19, this.progress + 0.2);
    const normalizedProgress = this.progress / 20;

    // 更新金屬片的進度屬性
    zincStrip.progress = normalizedProgress;
    copperStrip.progress = normalizedProgress;

    this.updateCount++;

    if (this.progress >= 10) {
      this.isComplete = true;
    }

    this.drawStrips(normalizedProgress);
  }

  drawStrips(progress) {
    const zincStrip = Components.children.find((c) => c.type === "ZincStrip");
    const copperStrip = Components.children.find((c) => c.type === "CopperStrip");

    if (!zincStrip || !copperStrip) return;

    const zincGraphics = zincStrip.getChildAt(0);
    const copperGraphics = copperStrip.getChildAt(0);

    if (zincGraphics && copperGraphics) {
      zincGraphics.clear();
      copperGraphics.clear();
      this.drawMetalStrip(zincGraphics, progress, 0x808080, true);
      this.drawMetalStrip(copperGraphics, progress, 0xb87333, false);
    }
  }

  resetStrips() {
    this.drawStrips(0);
  }

  drawMetalStrip(graphics, progress, color, isZinc) {
    const width = 40;
    const mainHeight = 250;
    const addHeight = 60;

    graphics.fill(color);

    // 繪製主體部分
    if (isZinc) {
      // 鋅片：主體高度減少30
      graphics.moveTo(-width / 2, -mainHeight / 2);
      graphics.lineTo(width / 2, -mainHeight / 2);
      graphics.lineTo(width / 2, mainHeight / 2 - addHeight);
      graphics.lineTo(-width / 2, mainHeight / 2 - addHeight);

      // 底部矩形：寬度隨進度減少
      const currentWidth = width * (1 - progress * 0.5); // 最終寬度為原來的0.5倍
      graphics.moveTo(-currentWidth / 2, mainHeight / 2 - addHeight);
      graphics.lineTo(currentWidth / 2, mainHeight / 2 - addHeight);
      graphics.lineTo(currentWidth / 2, mainHeight / 2);
      graphics.lineTo(-currentWidth / 2, mainHeight / 2);
    } else {
      // 銅片：主體保持不變
      graphics.moveTo(-width / 2, -mainHeight / 2);
      graphics.lineTo(width / 2, -mainHeight / 2);
      graphics.lineTo(width / 2, mainHeight / 2 - addHeight);
      graphics.lineTo(-width / 2, mainHeight / 2 - addHeight);

      // 底部矩形：寬度隨進度增加
      const currentWidth = width * (1 + progress * 0.5); // 最終寬度為原來的1.5倍
      graphics.moveTo(-currentWidth / 2, mainHeight / 2 - addHeight);
      graphics.lineTo(currentWidth / 2, mainHeight / 2 - addHeight);
      graphics.lineTo(currentWidth / 2, mainHeight / 2);
      graphics.lineTo(-currentWidth / 2, mainHeight / 2);
    }
  }
}

class ItemsList {
  constructor() {
    this.container = new Container();
    this.items = [];
    this.module2 = null;

    this.components = {
      U型管: { texture: "U型管.png", type: "UTube" },
      檢流計: { texture: "檢流計.png", type: "Ammeter" },
      電線: { texture: "電線.png", type: "Wire" },
      燈泡: { texture: "燈泡.png", type: "LightBulb" },
      電池: { texture: "電池.png", type: "Battery" },
      迴紋針: { texture: "迴紋針.png", type: "Clip" },
      棉花: { texture: "棉花.png", type: "Cotton" },
    };

    this.createItems();
  }

  setModule2(module2) {
    this.module2 = module2;
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
            // 若物件為 UTube 或 Ammeter，移除 ItemsList 上的圖案，使其無法再拖動
            if (item.componentType === "UTube" || item.componentType === "Ammeter") {
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
      case "UTube":
        component = new UTube();
        if (this.module2) {
          this.module2.bindUTubeEvent(component);
        }
        break;
      case "Ammeter":
        component = new Ammeter();
        break;
      case "Clip":
        component = new Clip();
        break;
      case "Cotton":
        component = new Cotton();
        break;
    }

    if (component) {
      component.position.set(position.x, position.y);
    }
    return component;
  }
}

class Weight {
  constructor() {
    this.container = new Container();

    // 建立秤重圖片
    this.sprite = new Sprite(Texture.from("weight.png"));
    this.sprite.anchor.set(0.5);
    this.sprite.scale.set(0.4);

    // 建立秤重文字
    this.weightText = new Text({
      text: "",
      style: { fontSize: 24, fill: 0x333333 },
    });
    this.weightText.anchor.set(0.5);
    this.weightText.position.set(0, 120);

    // 建立檢測區域（不可見）
    // 此檢測區域相對於容器來定義。
    this.hitArea = new Graphics().rect(-100, -100, 200, 200).fill({ color: 0xff0000, alpha: 0 });

    // 將圖片、文字和檢測區域加入容器
    this.container.addChild(this.sprite, this.weightText, this.hitArea);

    // 設定檢測區域的互動
    this.hitArea.eventMode = "static";
    this.hitArea.on("pointerover", this.checkWeight.bind(this));
    this.hitArea.on("pointerout", () => (this.weightText.text = ""));
  }

  isInWeightArea(component) {
    // 取得 hitArea 的全域邊界
    const weightBounds = this.hitArea.getBounds(true);
    // 取得元件中心的全域位置
    const compGlobalPos = component.getGlobalPosition();

    // 手動判斷 compGlobalPos 是否在 weightBounds 範圍內
    return (
      compGlobalPos.x >= weightBounds.x &&
      compGlobalPos.x <= weightBounds.x + weightBounds.width &&
      compGlobalPos.y >= weightBounds.y &&
      compGlobalPos.y <= weightBounds.y + weightBounds.height
    );
  }

  checkWeight() {
    let totalWeight = 0;
    let metalStripsInArea = [];

    // 迭代所有元件，檢查是否為金屬條且位於秤重區域內
    Components.children.forEach((component) => {
      if ((component.type === "ZincStrip" || component.type === "CopperStrip") && this.isInWeightArea(component)) {
        metalStripsInArea.push(component);
      }
    });

    metalStripsInArea.forEach((strip) => {
      const weight = this.calculateWeight(strip);
      totalWeight += weight;
    });

    if (totalWeight > 0) {
      this.weightText.text = `${totalWeight.toFixed(2)}g`;
    } else {
      this.weightText.text = "";
    }
  }

  calculateWeight(strip) {
    const progress = strip.progress || 0;
    if (strip.type === "ZincStrip") {
      return 100 - progress * 3.25;
    } else if (strip.type === "CopperStrip") {
      return 100 + progress * 3.15;
    }
    return 0;
  }
}
