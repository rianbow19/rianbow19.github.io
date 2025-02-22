import { ColorMatrixFilter, Container, Graphics, Sprite, Text, Texture } from "./pixi.mjs";
import { defaultStyle3, ionStyle, listStyle } from "./textStyle.mjs";
import { gsap } from "../gsap-public/src/index.js";
export { Module5 };

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

  checkPhPaperBeakerCollision();
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
    const module5Instance = Module5.getInstance();
    if (module5Instance) {
      module5Instance.stopAllAnimations();
    }
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

class Module5 {
  static currentInstance = null;
  constructor() {
    Module5.currentInstance = this;
    this.container = new Container();
    this.selectedBeaker = null;
    this.isSuccess = false;

    // 創建主要容器
    Components.sortableChildren = true;
    this.container.addChild(DRAG_AREA, Components, AllJoints);

    // 創建並定位ItemsList
    this.itemsList = new ItemsList(Components);
    this.container.addChild(this.itemsList.container);
    this.itemsList.container.position.set(20, 80);

    this.container.addChild(electronAnimation5.container);
  }

  static getInstance() {
    return Module5.currentInstance;
  }

  // 重置方法
  reset() {
    // 清除所有組件
    Components.removeChildren();
    AllJoints.removeChildren();
    this.stopAllAnimations();
    this.itemsList.reset();
    this.isSuccess = false;
    // 移除銅層圖形
    if (this.copperLayer && this.copperLayer.parent) {
      this.copperLayer.parent.removeChild(this.copperLayer);
      this.copperLayer = null;
    }
  }

  // 新增檢查電路組裝的方法
  // 簡化後的validateCircuitAssembly方法
  validateCircuitAssembly() {
    console.log("=== Validating Circuit Assembly ===");

    // 檢查是否包含必要元件
    const requiredComponents = ["LightBulb", "Battery", "Wire"];
    const componentTypes = Components.children.map((comp) => comp.type);

    for (const type of requiredComponents) {
      if (!componentTypes.includes(type)) {
        return { success: false, message: `缺少必要元件: ${type}` };
      }
    }

    // 查找燈泡與電池
    const battery = Components.children.find((comp) => comp.type === "Battery");

    // 檢查電路連通性
    const circuit = {
      components: new Set(),
      lightBulbs: [],
      batteryCount: 0,
    };

    // 追蹤電路連通性
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

    // 從電池開始追蹤電路
    traverseCircuit(battery, circuit);

    // 簡化：檢查每條電線的兩端是否都連接到元件
    const wiresInCircuit = Array.from(circuit.components).filter((comp) => comp.type === "Wire");
    for (const wire of wiresInCircuit) {
      const connectionCount = wire.joints.filter((joint) => joint.connectedTo).length;
      if (connectionCount < 2) {
        console.log("先選擇電極材質");
        return { success: false, message: "先選擇電極材質" };
      }
    }

    // 使燈泡發光
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
      // 根據電池數量調整亮度
      const brightness = Math.min(1.5, 1 + circuit.batteryCount * 0.25);
      lightEffect.scale.set(brightness);
    });

    // 開始電極動畫
    this.isSuccess = true;
    if (this.currentElectrodeType) {
      this.startElectrodeAnimation(this.currentElectrodeType);
    }

    console.log("電路連接成功，共有元件數:", circuit.components.size);
    console.log("電池數量:", circuit.batteryCount);
    console.log("燈泡數量:", circuit.lightBulbs.length);

    return { success: true, message: "組裝成功！" };
  }

  setModuleScene() {
    // 清除所有現有元件
    Components.removeChildren();

    const lightBulb = new LightBulb();
    lightBulb.position.set(580, 610);
    Components.addChild(lightBulb);

    const battery = new Battery();
    battery.position.set(580, 200);
    Components.addChild(battery);

    // 建立電線並設定正確接點

    // Wire #5：位置 (300, 200)
    const wire5 = new Wire();
    wire5.position.set(300, 200);
    wire5.joints[0].position.set(320, 455);
    wire5.joints[1].position.set(709, 326);
    wire5.redrawWire();
    Components.addChild(wire5);

    // Wire #6：位置 (800, 200)
    const wire6 = new Wire();
    wire6.position.set(800, 200);
    wire6.joints[0].position.set(350, 0);
    wire6.joints[1].position.set(-120, 0);
    wire6.redrawWire();
    Components.addChild(wire6);

    // Wire #7：位置 (1000, 380)
    const wire7 = new Wire();
    wire7.position.set(1000, 380);
    wire7.joints[0].position.set(1149 - 1000, 646 - 380 - 120);
    wire7.joints[1].position.set(1149 - 1000, -180);
    wire7.redrawWire();
    Components.addChild(wire7);

    // Wire #8：位置 (620, 700)
    const wire8 = new Wire();
    wire8.position.set(620, 700);
    wire8.joints[0].position.set(-45, 0);
    wire8.joints[1].position.set(-200, -10);
    wire8.redrawWire();
    Components.addChild(wire8);

    // Wire #9：位置 (420, 660)
    const wire9 = new Wire();
    wire9.position.set(420, 660);
    wire9.joints[0].position.set(0, 25);
    wire9.joints[1].position.set(60, -460);
    wire9.redrawWire();
    Components.addChild(wire9);

    // 使用預設電極類型（兩極碳棒）
    this.currentElectrodeType = "";
    if (this.currentElectrodeType != "") {
      this.createStrip();
    }
    // 建立並設定基礎元件
    const beaker = new Beaker();
    beaker.position.set(1059, 766);
    beaker.setSolution("硫酸銅");
    Components.addChild(beaker);

    // 延遲後重新檢查所有連結
    setTimeout(() => {
      recheckAllConnections();
    }, 100);

    this.isSuccess = true;
  }

  createStrip() {
    // 根據當前電極類型創建電極
    switch (this.currentElectrodeType) {
      case "兩極碳棒": // 兩極碳棒
        this.strip1 = new CarbonRod();
        this.strip2 = new CarbonRod();
        break;
      case "兩極銅棒": // 兩極銅棒
        this.strip1 = new CopperStrip();
        this.strip2 = new CopperStrip();
        break;
      case "正極碳棒 負極銅棒": // 正極碳棒 負極銅棒
        this.strip1 = new CarbonRod();
        this.strip2 = new CopperStrip();
        break;
      case "正極銅棒 負極碳棒": // 正極銅棒 負極碳棒
        this.strip1 = new CopperStrip();
        this.strip2 = new CarbonRod();
        break;
      default:
        this.strip1 = new CarbonRod();
        this.strip2 = new CarbonRod();
    }

    this.strip1.position.set(1149, 646);
    this.strip2.position.set(1009, 646);

    Components.addChild(this.strip1);
    Components.addChild(this.strip2);
  }

  toggleElectronDisplay(show) {
    this.isEleCheck = show;
    if (show && this.isSuccess) {
      electronAnimation5.start();
    } else {
      electronAnimation5.stop();
    }
  }

  handleElectrodeSelect(electrode) {
    // 儲存選擇的電極類型
    this.currentElectrodeType = electrode;

    // 移除現有的電極
    const existingStrips = Components.children.filter((c) => c.type === "CarbonRod" || c.type === "CopperStrip");
    existingStrips.forEach((strip) => Components.removeChild(strip));

    // 創建新的電極
    this.createStrip();
    // 尋找所有燒杯組件並重置它們的顏色和溶液
    Components.children
      .filter((c) => c.type === "Beaker")
      .forEach((beaker) => {
        beaker.setSolution("硫酸銅");
      });

    // 重新檢查所有連接
    recheckAllConnections();
  }

  // 開始電極動畫
  startElectrodeAnimation(electrodeType) {
    // 清除現有動畫
    if (this.electrodeAnimations) {
      this.electrodeAnimations.forEach((anim) => anim.kill());
    }
    this.electrodeAnimations = [];

    // 找到燒杯元件
    const beakers = Components.children.filter((c) => c.type === "Beaker");
    if (!beakers || beakers.length < 1) return;

    const mainBeaker = beakers[0];

    // 根據不同電極組合執行不同動畫
    switch (electrodeType) {
      case "兩極碳棒":
        // 正極動畫：產生氣體和試紙變色
        this.animateGasBubbles(this.strip1);

        // 負極動畫：產生紅棕色銅金屬
        this.animateCopperDeposition(this.strip2);

        // 溶液顏色變淺 - 試紙顏色變化會在 animateSolutionFade 中處理
        this.animateSolutionFade(mainBeaker);
        break;

      case "兩極銅棒":
        // 正極動畫：銅棒重量變輕和溶液分層
        this.animateCopperDissolution(this.strip1);

        // 負極動畫：銅棒重量變重和溶液分層
        this.animateCopperDeposition(this.strip2);

        // 溶液顏色保持不變
        break;

      case "正極碳棒 負極銅棒":
        // 正極動畫：產生氣體和試紙變色
        this.animateGasBubbles(this.strip1);

        // 負極動畫：銅棒重量變重和溶液分層
        this.animateCopperDeposition(this.strip2);

        // 溶液顏色變淺 - 試紙顏色變化會在 animateSolutionFade 中處理
        this.animateSolutionFade(mainBeaker);
        break;

      case "正極銅棒 負極碳棒":
        // 正極動畫：銅棒重量變輕和溶液分層
        this.animateCopperDissolution(this.strip1);

        // 負極動畫：產生紅棕色銅金屬
        this.animateCopperDeposition(this.strip2);

        // 溶液顏色保持不變
        break;
    }
  }

  animateGasBubbles(electrode) {
    // 確保先清除可能存在的上一次動畫
    if (this.bubbleContainer) {
      if (this.bubbleContainer.parent) {
        this.bubbleContainer.parent.removeChild(this.bubbleContainer);
      }
      this.bubbleContainer = null;
    }

    // 建立全新的氣泡容器
    this.bubbleContainer = new Container();
    this.bubbleContainer.label = "bubbleContainer";
    electrode.addChild(this.bubbleContainer);

    // 尋找燒杯元件
    const beakers = Components.children.filter((c) => c.type === "Beaker");
    if (!beakers || beakers.length < 1) return;
    const mainBeaker = beakers[0];

    // 氣泡建立函式
    const createBubble = () => {
      const bubble = new Graphics();
      bubble.circle(0, 0, 3);
      bubble.fill(0xffffff);
      bubble.x = Math.random() * 70 - 35;
      bubble.y = 130;
      return bubble;
    };

    let bubbleDelay = 10; // 初始延遲
    const minDelay = 3; // 最小延遲
    let isActive = true;

    // 檢查溶液顏色的函數 - 返回 0 到 1 之間的值，代表顏色距離白色的程度
    // 0 表示完全白色，1 表示完全有顏色
    const checkSolutionColor = () => {
      if (!mainBeaker) return 0;

      const tint = mainBeaker.body.tint;
      const r = (tint >> 16) & 0xff;
      const g = (tint >> 8) & 0xff;
      const b = tint & 0xff;

      // 計算與白色 (255,255,255) 的距離，轉換為 0-1 範圍
      // 越接近白色，返回值越接近 0
      const distance = Math.sqrt(Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2));
      // 最大可能距離是 √(255²+255²+255²) ≈ 441.7
      return Math.min(1, distance / 441.7);
    };

    // 每 1 秒加快氣泡產生速度，持續 5 秒
    this.speedupInterval = setInterval(() => {
      if (!isActive || !this.bubbleContainer || !this.bubbleContainer.parent) {
        clearInterval(this.speedupInterval);
        this.speedupInterval = null;
        return;
      }

      bubbleDelay = Math.max(minDelay, bubbleDelay * 0.8);
      if (this.gasBubbleInterval) {
        clearInterval(this.gasBubbleInterval);
        this.gasBubbleInterval = null;
      }
      createBubbleInterval();
    }, 1000);

    // 5秒後開始減少氣泡
    this.bubbleTimeout = setTimeout(() => {
      isActive = false;
      if (this.speedupInterval) {
        clearInterval(this.speedupInterval);
        this.speedupInterval = null;
      }

      // 逐漸增加延遲時間
      this.slowdownInterval = setInterval(() => {
        if (!this.bubbleContainer || !this.bubbleContainer.parent) {
          clearInterval(this.slowdownInterval);
          this.slowdownInterval = null;
          return;
        }

        bubbleDelay *= 1.5;
        if (bubbleDelay > 2000) {
          if (this.gasBubbleInterval) {
            clearInterval(this.gasBubbleInterval);
            this.gasBubbleInterval = null;
          }
          clearInterval(this.slowdownInterval);
          this.slowdownInterval = null;

          // 清除所有剩餘氣泡
          if (this.bubbleContainer) {
            while (this.bubbleContainer.children.length > 0) {
              this.bubbleContainer.removeChildAt(0);
            }
          }
        } else {
          if (this.gasBubbleInterval) {
            clearInterval(this.gasBubbleInterval);
            this.gasBubbleInterval = null;
          }
          createBubbleInterval();
        }
      }, 1000);
    }, 5000);

    // 建立氣泡產生間隔
    const createBubbleInterval = () => {
      this.gasBubbleInterval = setInterval(() => {
        // 檢查溶液顏色 - 如果接近白色則降低或停止氣泡產生
        const colorIntensity = checkSolutionColor();

        // 如果溶液已經變成白色 (colorIntensity < 0.1)，則停止產生氣泡
        if (colorIntensity < 0.1) {
          if (this.gasBubbleInterval) {
            clearInterval(this.gasBubbleInterval);
            this.gasBubbleInterval = null;
          }
          return;
        }

        // 根據顏色強度調整氣泡生成機率
        if ((!isActive && Math.random() > 0.7) || Math.random() > colorIntensity) return;

        // 檢查容器是否還存在
        if (!this.bubbleContainer || !this.bubbleContainer.parent) {
          if (this.gasBubbleInterval) {
            clearInterval(this.gasBubbleInterval);
            this.gasBubbleInterval = null;
          }
          return;
        }

        const bubbleCount = Math.floor(Math.random() * 2) + 1; // 生成 1-2 個氣泡
        for (let i = 0; i < bubbleCount; i++) {
          const bubble = createBubble();
          // 在 x 位置上增加一些隨機性，防止所有氣泡生成在同一位置
          bubble.x = Math.random() * 80 - 40; // 增加分散範圍
          this.bubbleContainer.addChild(bubble);

          if (!this.electrodeAnimations) {
            this.electrodeAnimations = [];
          }

          // 為每個氣泡設置稍微不同的動畫參數，增加自然感
          const anim = gsap.to(bubble, {
            y: 50 + Math.random() * 10 - 5, // 稍微隨機化終點
            alpha: 0,
            duration: 1.5 + Math.random(), // 隨機化持續時間 1.5-2.5 秒
            ease: "power1.out",
            onComplete: () => {
              if (bubble && bubble.parent) {
                bubble.parent.removeChild(bubble);
              }
            },
          });

          this.electrodeAnimations.push(anim);
        }
      }, bubbleDelay);
    };

    // 開始產生氣泡
    createBubbleInterval();
  }

  // 銅沉積動畫效果
  animateCopperDeposition(electrode) {
    const width = 60;
    // 建立銅層圖形作為電極的child
    const copperLayer = new Graphics()
      .rect(-(width + 4) / 2, 58, width + 4, 68) // 相對於電極的本地座標
      .fill(0x8b4513);
    copperLayer.alpha = 0;
    electrode.addChild(copperLayer);

    // 銅層逐漸顯現動畫
    const anim = gsap.to(copperLayer, {
      alpha: 1,
      duration: 5,
      ease: "linear",
    });
    this.electrodeAnimations.push(anim);

    // 保存引用以便後續清除
    this.copperLayer = copperLayer;
  }

  // 銅溶解動畫效果
  animateCopperDissolution(electrode) {
    // 金屬棒溶解動畫
    const progressObj = { progress: 0 };
    const anim = gsap.to(progressObj, {
      progress: 1,
      duration: 5,
      ease: "linear",
      onUpdate: () => {
        const width = 60;
        const mainHeight = 250;
        const addHeight = 65;

        electrode.body.clear();

        // 主體部分：高度減少
        electrode.body.moveTo(-width / 2, -mainHeight / 2);
        electrode.body.lineTo(width / 2, -mainHeight / 2);
        electrode.body.lineTo(width / 2, mainHeight / 2 - addHeight);
        electrode.body.lineTo(-width / 2, mainHeight / 2 - addHeight);

        electrode.body.fill(0xb87333);

        // 底部矩形：寬度隨進度減少
        const currentWidth = width * (1 - progressObj.progress * 0.08);
        electrode.body.moveTo(-currentWidth / 2, mainHeight / 2 - addHeight);
        electrode.body.lineTo(currentWidth / 2, mainHeight / 2 - addHeight);
        electrode.body.lineTo(currentWidth / 2, mainHeight / 2);
        electrode.body.lineTo(-currentWidth / 2, mainHeight / 2);

        electrode.body.fill(0x8b4513);
      },
    });

    this.electrodeAnimations.push(anim);
  }

  // 溶液褪色動畫效果
  animateSolutionFade(beaker) {
    if (!beaker) return;

    // 取得當前顏色作為起始點
    const currentTint = beaker.body.tint;

    // 從 RGB 格式解析出當前顏色
    const r = (currentTint >> 16) & 0xff;
    const g = (currentTint >> 8) & 0xff;
    const b = currentTint & 0xff;

    const colorObj = { r: r, g: g, b: b };
    const endRGB = { r: 255, g: 255, b: 255 }; // 最終變為白色

    // 記錄初始顏色距離，用於比較變化程度
    const initialDistance = Math.sqrt(Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2));
    const changeThreshold = initialDistance * 0.15; // 當顏色變化超過 15% 時更新試紙顏色

    const anim = gsap.to(colorObj, {
      r: endRGB.r,
      g: endRGB.g,
      b: endRGB.b,
      duration: 15,
      ease: "linear",
      onUpdate: () => {
        const r = Math.round(colorObj.r);
        const g = Math.round(colorObj.g);
        const b = Math.round(colorObj.b);
        const newColor = (r << 16) + (g << 8) + b;
        beaker.body.tint = newColor;

        // 檢查顏色變化程度，如果足夠大且是硫酸銅溶液，則更新試紙顏色
        if (beaker.solution === "硫酸銅") {
          const currentDistance = Math.sqrt(Math.pow(255 - r, 2) + Math.pow(255 - g, 2) + Math.pow(255 - b, 2));
          const changePercent = 1 - currentDistance / initialDistance;

          // 當顏色變化超過閾值時，更新所有與該燒杯接觸的試紙
          if (changePercent > 0.5) {
            this.updatePhPaperColors(beaker);
          }
        }
      },
    });
    this.electrodeAnimations.push(anim);
  }

  updatePhPaperColors(beaker) {
    Components.children.forEach((component) => {
      if (component.type === "PhPaper") {
        // 檢查試紙是否與燒杯接觸
        const testStripGlobal = component.toGlobal({ x: -40, y: 0 });
        const testStripBounds = {
          x: testStripGlobal.x,
          y: testStripGlobal.y,
          width: 80,
          height: 150,
        };

        const beakerBounds = beaker.getBounds();
        if (rectIntersect(testStripBounds, beakerBounds)) {
          // 更新為橘色
          if (component.testStripColor !== 0xff6600) {
            // 避免重複設置相同顏色
            component.updateColor(0xff6600);
          }
        }
      }
    });
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
    electronAnimation5.stop();

    // 清除所有計時器
    if (this.gasBubbleInterval) {
      clearInterval(this.gasBubbleInterval);
      this.gasBubbleInterval = null;
    }

    if (this.speedupInterval) {
      clearInterval(this.speedupInterval);
      this.speedupInterval = null;
    }

    if (this.slowdownInterval) {
      clearInterval(this.slowdownInterval);
      this.slowdownInterval = null;
    }

    // 清除計時器
    if (this.bubbleTimeout) {
      clearTimeout(this.bubbleTimeout);
      this.bubbleTimeout = null;
    }

    // 移除所有氣泡容器
    Components.children.forEach((component) => {
      // 查找所有帶標籤的氣泡容器
      component.children.forEach((child, index) => {
        if (child instanceof Container && child.label === "bubbleContainer") {
          component.removeChildAt(index);
        }
      });
    });

    // 清除主實例的氣泡容器
    if (this.bubbleContainer) {
      if (this.bubbleContainer.parent) {
        this.bubbleContainer.parent.removeChild(this.bubbleContainer);
      }
      this.bubbleContainer = null;
    }

    // 終止所有 GSAP 動畫
    if (this.electrodeAnimations) {
      this.electrodeAnimations.forEach((anim) => {
        if (anim && typeof anim.kill === "function") {
          anim.kill();
        }
      });
      this.electrodeAnimations = [];
    }

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
    body.eventMode = "none";

    const JOINT_POSITON = [
      [-100, 0],
      [100, 0],
    ];
    for (let [x, y] of JOINT_POSITON) {
      const joint = new Graphics().circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.3 }).stroke({ color: 0xffffff, width: 2 });
      joint.eventMode = "none";
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
    body.eventMode = "none";

    const JOINT_POSITION = [
      [0, 90],
      [40, 50],
    ];
    for (let [x, y] of JOINT_POSITION) {
      const joint = new Graphics().circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ color: 0xffffff, width: 2 });
      joint.eventMode = "none";
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
    this.wireBody.eventMode = "none";
    this.zIndex = 3;

    for (let i = 0; i < 2; i++) {
      const joint = new Graphics().circle(0, 0, 30).fill({ color: 0xffffff, alpha: 0.5 }).stroke({ color: 0xffffff, width: 2 });
      joint.eventMode = "none";
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
    this.body.eventMode = "none";
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
      joint.visible = false;
      this.joints.push(joint);
      this.addChild(joint);

      // 連結點保留拖曳功能
      joint.eventMode = "none";
    }

    // 將燒杯容器自身設為互動，綁定 pointerdown 事件來選擇燒杯
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", () => {
      const module = Module5.getInstance();
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
    this.solutionText.text = `溶液：${solutionType || "點擊後選擇右側列表"}`;
  }

  getSolutionColor(solutionType) {
    const solutionColors = {
      硫酸銅: "blue",
    };
    return solutionColors[solutionType] || "transparent";
  }

  updateBeakerColor(color) {
    const colorMap = {
      blue: 0x4169e1,
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
      joint.visible = false;
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

class CarbonRod extends Container {
  constructor() {
    super();
    this.type = "CarbonRod";
    this.joints = [];
    this.body = new Graphics();
    this.drawRod();

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
      joint.visible = false;
      this.joints.push(joint);
      this.addChild(joint);
    }

    const text = new Text({
      text: "碳棒",
      style: listStyle,
    });
    text.anchor.set(0.5);

    this.addChild(this.body, text);
  }

  drawRod() {
    this.body.clear();
    const width = 60;
    const height = 250;

    // 繪製長方形碳棒
    this.body
      .moveTo(-width / 2, -height / 2)
      .lineTo(width / 2, -height / 2)
      .lineTo(width / 2, height / 2)
      .lineTo(-width / 2, height / 2)
      .fill(0x333333); // 深灰色表示碳棒
  }

  getGlobalJointPositions() {
    return this.joints.map((joint) => {
      const globalPos = this.toGlobal(joint.position);
      return { x: globalPos.x, y: globalPos.y };
    });
  }
}

class PhPaper extends Container {
  constructor() {
    super();
    this.type = "PhPaper";
    this.joints = [];
    this.body = new Graphics();
    this.testBody = new Graphics();
    this.testStripColor = 0x01ea00; // 預設顏色
    this.targetColor = this.testStripColor; // 目標顏色
    this.colorProgress = 0; // 用於存儲顏色擴散進度 (0-1)
    this.drawPaper();

    // 設置 body 的事件
    this.body.eventMode = "static";
    this.body.cursor = "pointer";
    this.body.on("pointerdown", onDragStart);

    this.addChild(this.body, this.testBody);
  }

  drawPaper() {
    this.body.clear();
    this.testBody.clear();

    // 繪製試紙主體（整體背景）
    this.body.rect(-40, -150, 80, 300);
    this.body.fill(0x01ea00);

    // 繪製測試區域基本部分（可變色區域的背景）
    this.testBody.rect(-40, 0, 80, 150);
    this.testBody.fill(0x01ea00); // 先用綠色填充整個測試區

    // 繪製變色部分（從下往上擴散）
    if (this.colorProgress > 0) {
      const height = 150 * this.colorProgress; // 根據進度計算高度
      this.testBody.rect(-40, 150 - height, 80, height);
      this.testBody.fill(this.testStripColor); // 用當前顏色填充變色部分
    }
  }

  // 修改為帶有從下往上動畫效果的顏色更新，移出時立即恢復
  updateColor(newColor, immediate = false) {
    // 如果顏色相同則不做任何改變
    if (this.targetColor === newColor && this.colorProgress >= 1) return;

    // 設置目標顏色
    this.targetColor = newColor;

    // 如果已經有動畫在運行，先停止
    if (this.colorTween) {
      this.colorTween.kill();
      this.colorTween = null;
    }

    // 如果是變回綠色或需要立即變化，立即重置
    if (newColor === 0x01ea00 || immediate) {
      this.testStripColor = newColor;
      this.colorProgress = newColor === 0x01ea00 ? 0 : 1; // 綠色進度為0，其他立即變化時進度為1
      this.drawPaper();
      return;
    }

    // 從下往上的顏色過渡動畫
    this.testStripColor = newColor;
    this.colorProgress = 0; // 重置進度

    this.colorTween = gsap.to(this, {
      colorProgress: 1,
      duration: 5,
      ease: "linear",
      onUpdate: () => {
        this.drawPaper();
      },
    });
  }

  // 新增立即恢復綠色的方法
  resetColor() {
    if (this.colorTween) {
      this.colorTween.kill();
      this.colorTween = null;
    }
    this.testStripColor = 0x01ea00;
    this.targetColor = 0x01ea00;
    this.colorProgress = 0;
    this.drawPaper();
  }

  getGlobalJointPositions() {
    return this.joints.map((joint) => {
      const globalPos = this.toGlobal(joint.position);
      return { x: globalPos.x, y: globalPos.y };
    });
  }
}

function rectIntersect(rect1, rect2) {
  return !(
    rect2.x > rect1.x + rect1.width ||
    rect2.x + rect2.width < rect1.x ||
    rect2.y > rect1.y + rect1.height ||
    rect2.y + rect2.height < rect1.y
  );
}
function checkPhPaperBeakerCollision() {
  Components.children.forEach((component) => {
    if (component.type === "PhPaper") {
      // 取得試紙變色區域的全域位置
      const testStripGlobal = component.toGlobal({ x: -40, y: 0 });
      const testStripBounds = {
        x: testStripGlobal.x,
        y: testStripGlobal.y,
        width: 80,
        height: 150,
      };

      let isColliding = false;

      Components.children.forEach((other) => {
        if (other.type === "Beaker") {
          const beakerBounds = other.getBounds();
          if (rectIntersect(testStripBounds, beakerBounds)) {
            isColliding = true;

            // 檢查燒杯溶液和顏色狀態
            if (other.solution === "硫酸銅") {
              // 取得當前燒杯顏色
              const tint = other.body.tint;
              const r = (tint >> 16) & 0xff;
              const g = (tint >> 8) & 0xff;
              const b = tint & 0xff;

              // 計算與藍色的距離，判斷是否已經開始變白
              const blueValue = 0x4169e1;
              const blueR = (blueValue >> 16) & 0xff;
              const blueG = (blueValue >> 8) & 0xff;
              const blueB = blueValue & 0xff;

              // 計算當前顏色與原始藍色的差異
              const colorDiff = Math.sqrt(Math.pow(r - blueR, 2) + Math.pow(g - blueG, 2) + Math.pow(b - blueB, 2));

              // 如果顏色已經明顯變化（變淡），則更改試紙顏色
              if (colorDiff > 100) {
                component.updateColor(0xff6600); // 橘色（帶淡入效果）
              } else {
                component.resetColor(); // 使用重置方法
              }
            } else {
              // 其他溶液或沒有溶液時，重置為綠色
              component.resetColor();
            }
          }
        }
      });

      // 如果試紙不與任何燒杯接觸，立即恢復原始顏色
      if (!isColliding && component.targetColor !== 0x01ea00) {
        component.resetColor();
      }
    }
  });
}

class ItemsList {
  constructor() {
    this.container = new Container();
    this.items = [];

    this.module5Components = {
      廣用試紙: { texture: "廣用試紙.png", type: "PhPaper" },
    };

    // Default to module4 components
    this.components = this.module5Components;
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
            if (item.componentType === "CarbonRod" || item.componentType === "ZincStrip" || item.componentType === "CopperStrip") {
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
            if (
              item.componentType === "PhPaper" ||
              item.componentType === "LightBulb" ||
              item.componentType === "Battery" ||
              item.componentType === "Beaker"
            ) {
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
      case "PhPaper":
        component = new PhPaper();
        break;
    }

    if (component) {
      component.position.set(position.x, position.y);
    }
    return component;
  }
}

function getCircuitPathPoints() {
  let startJoint = null;
  // 找出起點：從 Wire 中找出與 ZincStrip 相連的連結點
  for (const comp of Components.children) {
    if (comp.type === "Wire") {
      for (const joint of comp.joints) {
        if (
          (joint.connectedTo && joint.connectedTo.parent && joint.connectedTo.parent.type === "CopperStrip") ||
          joint.connectedTo.parent.type === "CarbonRod"
        ) {
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
    } else if (parentComp.type === "Clip" || parentComp.type === "LightBulb" || parentComp.type === "Battery") {
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
    if ((nextJoint && nextJoint.parent && nextJoint.parent.type === "CopperStrip") || nextJoint.parent.type === "CarbonRod") {
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
  constructor() {
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

export const electronAnimation5 = new ElectronAnimation();
