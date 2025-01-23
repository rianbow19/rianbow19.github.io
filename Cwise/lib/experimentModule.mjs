import { Sprite, Texture, Text, Graphics } from "./pixi.mjs";
import { defaultStyle } from "./textStyle.mjs";
import { gsap } from "../gsap-public/src/index.js";

export class ElectrolysisModule {
  constructor(itemCanvas) {
    this.itemCanvas = itemCanvas;
    this.selectedSolution = null;
    this.ionAnimationActive = false;
    this.connectedPHPaper = null;
    this.isIonCheckboxChecked = false;

    // 新增模組設置實例
    this.moduleSetup = new ModuleSetup(itemCanvas);

    // 追蹤組件狀態
    this.components = null;
    this.isAssembled = false;
    this.isAllitem = false;

    //pH試紙檢查
    this.lastPHCheckTime = 0;
    this.PHCheckInterval = 1000;
    this.lastPHPaperPosition = null;
    this.lastBeakerPosition = null;

    this.bulbLight = null;
    this.statusText = null;
    this.ionMoving = false;
    this.ionFlowMoving = false;
    this.ions = [];
    this.animationFrame = null;
    this.activeIonTweens = []; // 用於追蹤 GSAP 動畫
    this.randomAnimations = []; // 用於儲存隨機移動的動畫
    this.electrodesAnimations = []; // 用於儲存電極移動的動畫

    // 溶液特性配置
    this.solutionProperties = {
      純水: {
        color: "transparent",
        brightness: "none",
        phColor: "green",
      },
      自來水: {
        color: "transparent",
        brightness: "dim",
        phColor: "green",
      },
      "氯化鈉(液體)": {
        color: "transparent",
        brightness: "bright",
        phColor: "green",
      },
      "糖(液體)": {
        color: "transparent",
        brightness: "none",
        phColor: "green",
      },
      "氯化鈉(固體)": {
        color: "white",
        brightness: "none",
        phColor: "green",
      },
      "糖(固體)": {
        color: "white",
        brightness: "none",
        phColor: "green",
      },
      酒精: {
        color: "transparent",
        brightness: "none",
        phColor: "green",
      },
      鹽酸: {
        color: "transparent",
        brightness: "bright",
        phColor: "red",
      },
      醋酸: {
        color: "transparent",
        brightness: "dim",
        phColor: "orange",
      },
      氫氧化鈉: {
        color: "transparent",
        brightness: "bright",
        phColor: "purple",
      },
      小蘇打粉: {
        color: "transparent",
        brightness: "dim",
        phColor: "blue",
      },
      氯化銅: {
        color: "blue",
        brightness: "bright",
        phColor: "green",
      },
    };
  }

  // 重置燈泡效果
  resetBulbLight() {
    if (this.bulbLight) {
      const bulb = this.findComponentByType("燈泡");
      if (bulb && this.bulbLight.parent) {
        this.bulbLight.parent.removeChild(this.bulbLight);
      }
      this.bulbLight = null;
    }
  }

  // 開始電解實驗
  startElectrolysis() {
    if (!this.selectedSolution) {
      this.showStatusText("請選擇溶液");
      return false;
    }
    if (!this.moduleSetup.isSetDown) {
      this.showStatusText("請先放置實驗設備");
      return false;
    }

    const solutionProps = this.solutionProperties[this.selectedSolution];

    // 停止隨機移動，開始電極移動
    this.stopRandomMovement();
    this.startElectrodesMovement();

    // 顯示 "電解中" 文字
    this.showStatusText("電解中");

    // 更新實驗狀態
    this.updateBulbBrightness(solutionProps.brightness);
    this.updateBeakerColor(solutionProps.color);

    this.ionFlowMoving = true;
    this.ionMoving = true;
    return true;
  }

  // 顯示狀態文字
  showStatusText(message) {
    // 移除現有文字（如果有的話）
    if (this.statusText) {
      this.itemCanvas.container.removeChild(this.statusText);
    }

    // 創建新文字
    this.statusText = new Text({ text: message, style: defaultStyle });

    // 將文字定位在螢幕中央
    this.statusText.anchor.set(0.5);
    this.statusText.x = 960; // 1920 的一半
    this.statusText.y = 100; // 1080 的一半

    // 加入容器中
    this.itemCanvas.container.addChild(this.statusText);

    // 一秒後移除
    setTimeout(() => {
      if (this.statusText) {
        this.itemCanvas.container.removeChild(this.statusText);
        this.statusText = null;
      }
    }, 1000);
  }

  // 檢查並處理廣用試紙的連接
  handlePHPaperConnection() {
    const phPaper = this.findComponentByType("廣用試紙");
    const beaker = this.findComponentByType("燒杯");

    if (!phPaper || !beaker) return;

    // 檢查廣用試紙是否與燒杯重疊
    const paperBounds = phPaper.getBounds();
    const beakerBounds = {
      x: beaker.x - 50, // 估計燒杯寬度
      y: beaker.y - 100, // 估計燒杯高度
      width: 250,
      height: 250,
    };

    const overlapping = !(
      paperBounds.x + paperBounds.width < beakerBounds.x ||
      paperBounds.x > beakerBounds.x + beakerBounds.width ||
      paperBounds.y + paperBounds.height < beakerBounds.y ||
      paperBounds.y > beakerBounds.y + beakerBounds.height
    );

    // 更新試紙顏色根據重疊情況
    if (overlapping && this.selectedSolution) {
      this.connectedPHPaper = phPaper;
      this.updatePHPaperColor(this.solutionProperties[this.selectedSolution].phColor);
    } else if (this.connectedPHPaper === phPaper) {
      this.updatePHPaperColor("green");
      this.connectedPHPaper = null;
    }
  }

  // 更新試紙顏色
  updatePHPaperColor(color) {
    if (!this.connectedPHPaper) return;

    // 從連接的 pH 試紙獲取測試條
    const testStrip = this.connectedPHPaper.testStrip;
    if (!testStrip) return;

    // 將顏色名稱轉換為十六進制
    const colorHex = this.colorToHex(color);

    // 更新測試條顏色
    testStrip.clear().rect(-40, 0, 80, 150).fill(colorHex);
  }

  // 顏色名稱轉換為十六進制
  colorToHex(colorName) {
    const colorMap = {
      red: 0xff0000,
      orange: 0xffa500,
      green: 0x01ea00,
      blue: 0x0000ff,
      purple: 0x800080,
      white: 0xffffff,
    };
    return colorMap[colorName] || 0xffffff;
  }

  // 更新燈泡亮度效果
  updateBulbBrightness(brightness) {
    const bulb = this.findComponentByType("燈泡");
    if (!bulb) return;

    // 如果不存在則創建燈光精靈
    if (!this.bulbLight) {
      this.bulbLight = new Sprite(Texture.from("燈泡光.png"));
      this.bulbLight.anchor.set(0.5);
      this.bulbLight.y = -50;
      this.bulbLight.alpha = 0;
      bulb.addChild(this.bulbLight);
    }

    // 先清除之前可能存在的閃爍動畫
    gsap.killTweensOf(this.bulbLight);

    switch (brightness) {
      case "bright":
        this.bulbLight.tint = 0xffff00; // 黃色
        this.bulbLight.scale.set(1.5);
        // 創建循環閃爍動畫
        gsap.to(this.bulbLight, {
          duration: 2,
          alpha: 0.8,
          ease: "power2.out",
          onComplete: () => {
            // 開始循環閃爍
            gsap.to(this.bulbLight, {
              duration: 0.5,
              alpha: 0.75,
              yoyo: true,
              repeat: -1,
              ease: "sine.inOut",
            });
          },
        });
        break;

      case "dim":
        this.bulbLight.tint = 0xffaa00; // 橙黃色
        this.bulbLight.scale.set(1.2);
        // 創建循環閃爍動畫（較弱的效果）
        gsap.to(this.bulbLight, {
          duration: 2,
          alpha: 0.7,
          ease: "power2.out",
          onComplete: () => {
            // 開始循環閃爍
            gsap.to(this.bulbLight, {
              duration: 0.5,
              alpha: 0.65,
              yoyo: true,
              repeat: -1,
              ease: "sine.inOut",
            });
          },
        });
        break;

      case "none":
      default:
        gsap.to(this.bulbLight, {
          duration: 0.5,
          alpha: 0,
          ease: "power2.out",
        });
        break;
    }
  }

  // 更新燒杯顏色
  updateBeakerColor(color) {
    const beaker = this.findComponentByType("燒杯.png");
    if (!beaker) return;

    // 設置燒杯中溶液顏色
    beaker.tint = color === "transparent" ? 0xffffff : this.colorToHex(color);
  }

  // 尋找特定類型的組件
  findComponentByType(type) {
    if (!this.itemCanvas?.components?.children) {
      console.log("畫布或組件未初始化");
      return null;
    }

    // 從搜尋類型中移除 .png 副檔名
    const searchType = type.replace(".png", "");

    const component = this.itemCanvas.components.children.find((component) => {
      // 檢查組件是否為電線
      if (searchType === "電線" && component.type === "Wire") {
        return true;
      }

      // 非電線組件的直接類型比較
      return component.type === searchType;
    });

    return component;
  }

  // 設置選擇的溶液
  setSolution(solutionName) {
    if (this.solutionProperties[solutionName]) {
      this.selectedSolution = solutionName;
      this.resetBulbLight();
      // 停止所有動畫
      this.stopRandomMovement();
      this.stopElectrodesMovement();
      this.ionMoving = false;
      this.ionFlowMoving = false;

      this.showStatusText("溶液已選擇：" + solutionName);

      this.updateBeakerColor(this.solutionProperties[solutionName].color);

      // 根據 checkbox 狀態決定是否顯示離子
      if (this.isIonCheckboxChecked) {
        this.toggleIonAnimation(true);
      }
    }
  }

  // 開始隨機移動動畫
  startRandomMovement() {
    const beaker = this.findComponentByType("燒杯");
    if (!beaker || !beaker.ions) return;

    // 清除現有的隨機動畫
    this.stopRandomMovement();

    beaker.ions.forEach((ion) => {
      ion.visible = true;

      // 創建隨機移動的動畫
      const createRandomMovement = () => {
        const newX = Math.random() * 260 - 100; // 範圍 [-110, 150]
        const newY = Math.random() * 230 - 70; // 範圍 [-80, 150]

        const duration = 10 + Math.random() * 10; // 2-4秒的隨機持續時間

        return gsap.to(ion, {
          x: newX,
          y: newY,
          duration: duration,
          ease: "none",
          onComplete: () => {
            // 動畫完成後創建新的移動
            const newAnim = createRandomMovement();
            // 更新動畫引用
            const index = this.randomAnimations.findIndex((a) => a.target === ion);
            if (index !== -1) {
              this.randomAnimations[index] = newAnim;
            }
          },
        });
      };

      const anim = createRandomMovement();
      this.randomAnimations.push(anim);
    });
  }

  // 停止隨機移動動畫
  stopRandomMovement() {
    this.randomAnimations.forEach((anim) => {
      if (anim) anim.kill();
    });
    this.randomAnimations = [];
  }

  // 開始電極移動動畫
  startElectrodesMovement() {
    const beaker = this.findComponentByType("燒杯");
    if (!beaker || !beaker.ions) return;

    // 清除現有的電極動畫
    this.stopElectrodesMovement();

    beaker.ions.forEach((ion) => {
      // 決定目標範圍（基於離子類型）
      const finalRange = ion.isPositive
        ? {
            x: { min: -90, max: -50 }, // 左側範圍
            y: { min: -60, max: 160 }, // y軸範圍 (-60 到 160)
          }
        : {
            x: { min: 90, max: 130 }, // 右側範圍
            y: { min: -60, max: 160 }, // y軸範圍 (-60 到 160)
          };

      // 創建移動到目標區域的動畫序列
      const sequence = gsap.timeline();

      // 生成3-4個中途點
      const steps = 3 + Math.floor(Math.random() * 2);

      for (let i = 0; i < steps; i++) {
        // 逐漸靠近目標區域
        const progress = (i + 1) / steps;
        const targetRange = {
          x: {
            min: ion.x + (finalRange.x.min - ion.x) * progress,
            max: ion.x + (finalRange.x.max - ion.x) * progress,
          },
          y: finalRange.y, // y範圍保持不變
        };

        // 在當前範圍內取隨機點
        const targetX = targetRange.x.min + Math.random() * (targetRange.x.max - targetRange.x.min);
        const targetY = targetRange.y.min + Math.random() * (targetRange.y.max - targetRange.y.min);

        sequence.to(ion, {
          x: targetX,
          y: targetY,
          duration: 1 + Math.random(),
          ease: "power1.inOut",
        });
      }

      // 到達目標區域後開始隨機移動
      sequence.call(() => {
        const createRandomMovement = () => {
          const targetX = finalRange.x.min + Math.random() * (finalRange.x.max - finalRange.x.min);
          const targetY = finalRange.y.min + Math.random() * (finalRange.y.max - finalRange.y.min);

          const anim = gsap.to(ion, {
            x: targetX,
            y: targetY,
            duration: 1.5 + Math.random(),
            ease: "power1.inOut",
            onComplete: () => {
              createRandomMovement();
            },
          });

          this.electrodesAnimations.push(anim);
        };

        createRandomMovement();
      });

      this.electrodesAnimations.push(sequence);
    });
  }

  // 停止電極移動動畫
  stopElectrodesMovement() {
    this.electrodesAnimations.forEach((anim) => {
      if (anim) anim.kill();
    });
    this.electrodesAnimations = [];
  }

  // 切換離子顯示
  toggleIonAnimation(show) {
    const beaker = this.findComponentByType("燒杯");
    if (!beaker || !beaker.ions) return;

    this.isIonCheckboxChecked = show; // 更新 checkbox 狀態

    // 只有當選擇了溶液且 checkbox 被勾選時才顯示離子
    const shouldShowIons = this.selectedSolution && this.isIonCheckboxChecked;

    beaker.ions.forEach((ion) => {
      ion.visible = shouldShowIons;
    });

    if (shouldShowIons) {
      // 如果當前在電解狀態，則保持電極動畫
      if (this.ionMoving) {
        // 不做任何改變，保持現有的電極動畫
      } else {
        this.startRandomMovement();
      }
    } else if (!this.isIonCheckboxChecked) {
      // 只隱藏離子，不停止動畫
      beaker.ions.forEach((ion) => {
        ion.visible = false;
      });
    }
  }

  // 開始離子移動
  startIonFlowMovement() {
    if (!this.moduleSetup.isSetDown || !this.selectedSolution) return;
    this.ionFlowMoving = true;

    const components = this.itemCanvas.components.children;
    const allPoints = [];
    let center = { x: 0, y: 0 };

    // 首先，收集所有離子位置並計算中心
    components.forEach((component) => {
      if (component.ions) {
        component.ions.forEach((ion) => {
          const pos = component.toGlobal({ x: ion.x, y: ion.y });
          allPoints.push(pos);
          center.x += pos.x;
          center.y += pos.y;
        });
      }
    });
    if (allPoints.length === 0) return;

    center.x /= allPoints.length;
    center.y /= allPoints.length;
    // 按角度排序點以進行圓周運動
    allPoints.sort((a, b) => {
      const angleA = Math.atan2(a.y - center.y, a.x - center.x);
      const angleB = Math.atan2(b.y - center.y, b.x - center.x);
      return angleB - angleA;
    });
    // 創建新的動畫
    components.forEach((component) => {
      if (component.ions) {
        component.ions.forEach((ion, ionIndex) => {
          if (ion.tween) ion.tween.kill();

          // 儲存原始的 progress 值
          const initialOffset = ionIndex / component.ions.length;
          ion.originalProgress = initialOffset; // 新增這行
          ion.progress = initialOffset;

          const tween = gsap.to(ion, {
            duration: 10,
            progress: 1 + initialOffset,
            repeat: -1,
            ease: "none",
            onUpdate: () => {
              if (!this.ionFlowMoving) return;

              // 計算實際進度（保持在 0-1 之間）
              const currentProgress = ion.progress % 1;

              // 計算當前點和下一個點的索引
              const index = Math.floor(currentProgress * allPoints.length);
              const nextIndex = (index + 1) % allPoints.length;
              const currentPoint = allPoints[index];
              const nextPoint = allPoints[nextIndex];

              // 轉換為本地座標
              const localCurrent = component.toLocal(currentPoint);
              const localNext = component.toLocal(nextPoint);

              // 在點之間線性插值
              const t = (currentProgress * allPoints.length) % 1;
              ion.x = localCurrent.x + (localNext.x - localCurrent.x) * t;
              ion.y = localCurrent.y + (localNext.y - localCurrent.y) * t;
            },
          });
          ion.tween = tween;
        });
      }
    });
  }

  // 停止離子動畫
  stopIonFlowAnimation() {
    this.ionMoving = false;
    const components = this.itemCanvas.components.children;
    components.forEach((component) => {
      if (component.ions) {
        component.ions.forEach((ion) => {
          if (ion.tween) {
            ion.tween.kill();
          }
          // 重置離子位置
          if (component.type === "Wire") {
            // 儲存原始的 progress 值
            const originalProgress = ion.originalProgress || 0;
            // 使用組件的實際 joints 位置重新計算
            const joint1 = component.joints[0];
            const joint2 = component.joints[1];
            // 確保 joints 存在且有正確的位置
            if (joint1 && joint2) {
              // 計算新的位置
              ion.x = joint1.x + (joint2.x - joint1.x) * originalProgress;
              ion.y = joint1.y + (joint2.y - joint1.y) * originalProgress;
              // 重置當前 progress 為原始值
              ion.progress = originalProgress;
            }
          } else {
            // 非電線組件的離子重置
            if (ion.originalX !== undefined && ion.originalY !== undefined) {
              ion.x = ion.originalX;
              ion.y = ion.originalY;
            }
          }
          // 更新可見性
          ion.visible = component.type === "燒杯" && this.ionVisible;
        });
      }
      // 如果是電線組件，重新繪製並重新定位離子
      if (component.type === "Wire") {
        // 首先重新繪製電線
        if (component.redrawWire) {
          component.redrawWire();
        }
        // 然後重新定位所有離子
        if (component.ions) {
          component.ions.forEach((ion) => {
            const originalProgress = ion.originalProgress || 0;
            const joint1 = component.joints[0];
            const joint2 = component.joints[1];
            if (joint1 && joint2) {
              ion.x = joint1.x + (joint2.x - joint1.x) * originalProgress;
              ion.y = joint1.y + (joint2.y - joint1.y) * originalProgress;
            }
          });
        }
      }
    });
  }

  // 重置
  reset() {
    this.stopRandomMovement();
    this.stopElectrodesMovement();
    this.validCircuit = false;
    this.ionAnimationActive = false;
    this.connectedPHPaper = null;
    this.isAssembled = false;
    this.isAllitem = false;
    this.resetBulbLight();
    this.ionVisible = false;
    this.ionMoving = false;
    this.ionFlowMoving = false;
    this.moduleSetup.isSetDown = false;
    this.activeIonTweens.forEach((tween) => tween.kill());
    this.activeIonTweens = [];
  }

  // 更新
  update(deltaTime) {
    if (this.ionAnimationActive && this.ions.length > 0) {
      // 更新連接組件的離子位置
      this.ions.forEach((ion) => {
        if (ion.pathPoints && ion.pathCenter) {
          const pos = this.getIonPosition(ion.progress, ion.pathPoints, ion.pathCenter);
          if (pos) {
            ion.x = pos.x;
            ion.y = pos.y;
          }
        }
      });
    }
  }
}

export class ModuleSetup {
  constructor(itemCanvas) {
    this.itemCanvas = itemCanvas;
    this.centerX = 960;
    this.centerY = 540;
    this.components = null;
  }

  setupElectrolysisModule() {
    // 重置畫布
    this.itemCanvas.reset();
    this.isSetDown = true;

    // 創建所有組件並儲存引用
    const components = this.createAllComponents();
    this.components = components;

    // 先設置所有組件的位置
    this.positionAllComponents(components);

    // 調整所有電線的位置和形狀
    this.adjustWirePositions(components);

    // 強制進行一次全局位置更新
    this.updateGlobalPositions(components);

    // 建立所有連接並確保它們保持連接狀態
    this.forceConnectAllComponents(components);

    return components;
  }

  createAllComponents() {
    // 創建組件的代碼保持不變
    return {
      beaker: this.createComponent("燒杯.png", {
        x: this.centerX,
        y: this.centerY + 300,
      }),
      battery: this.createComponent("電池.png", {
        x: this.centerX - 200,
        y: this.centerY - 150,
      }),
      bulb: this.createComponent("燈泡.png", {
        x: this.centerX + 200,
        y: this.centerY - 200,
      }),
      leftRod: this.createComponent("碳棒.png", {
        x: this.centerX - 70,
        y: this.centerY + 200,
      }),
      rightRod: this.createComponent("碳棒.png", {
        x: this.centerX + 120,
        y: this.centerY + 200,
      }),
      wire1: this.createComponent("電線.png", {
        x: this.centerX - 70,
        y: this.centerY - 50,
      }),
      wire2: this.createComponent("電線.png", {
        x: this.centerX + 50,
        y: this.centerY - 50,
      }),
      wire3: this.createComponent("電線.png", {
        x: this.centerX + 150,
        y: this.centerY,
      }),
      wire4: this.createComponent("電線.png", {
        x: this.centerX - 50,
        y: this.centerY + 110,
      }),
    };
  }

  positionAllComponents(components) {
    // 為每個組件設置正確的初始位置和旋轉
    Object.entries(components).forEach(([name, component]) => {
      if (!component) return;

      // 根據組件類型設置特定位置
      switch (name) {
        case "beaker":
          component.zIndex = 1000;
          component.isBeaker = true;
          break;
      }

      // 確保組件的所有連接點都被正確初始化
      if (component.joints) {
        component.joints.forEach((joint) => {
          joint.connected = false;
          joint.tint = 0xffffff;
        });
      }
    });

    // 確保組件層級正確
    if (this.itemCanvas.components) {
      this.itemCanvas.components.sortableChildren = true;
    }
  }

  forceConnectAllComponents(components) {
    // 定義預期的連接順序
    const connections = [
      ["leftRod", "beaker"],
      ["wire1", "leftRod"],
      ["wire1", "wire2"],
      ["battery", "wire2"],
      ["battery", "wire3"],
      ["wire3", "bulb"],
      ["bulb", "wire4"],
      ["wire4", "rightRod"],
      ["rightRod", "beaker"],
    ];

    // 強制建立所有連接
    connections.forEach(([fromName, toName]) => {
      const fromComp = components[fromName];
      const toComp = components[toName];

      if (!fromComp || !toComp) return;

      // 獲取兩個組件的所有連接點的全局位置
      const fromJoints = fromComp.joints.map((joint) => {
        const globalPos = fromComp.toGlobal(joint.position);
        return { joint, globalPos };
      });

      const toJoints = toComp.joints.map((joint) => {
        const globalPos = toComp.toGlobal(joint.position);
        return { joint, globalPos };
      });

      // 找到最近的一對連接點
      let minDist = Infinity;
      let bestPair = null;

      fromJoints.forEach((from) => {
        toJoints.forEach((to) => {
          const dx = from.globalPos.x - to.globalPos.x;
          const dy = from.globalPos.y - to.globalPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < minDist && !from.joint.connected && !to.joint.connected) {
            minDist = dist;
            bestPair = { from: from.joint, to: to.joint };
          }
        });
      });

      // 強制建立連接
      if (bestPair) {
        bestPair.from.connected = true;
        bestPair.to.connected = true;
        bestPair.from.tint = 0x00ff00;
        bestPair.to.tint = 0x00ff00;

        // 設置組件的連接組
        if (fromComp.connectedComponent === -1 && toComp.connectedComponent === -1) {
          const newGroup = this.itemCanvas.connectedGroups.length;
          this.itemCanvas.connectedGroups.push(newGroup);
          fromComp.connectedComponent = newGroup;
          toComp.connectedComponent = newGroup;
        } else if (fromComp.connectedComponent === -1) {
          fromComp.connectedComponent = toComp.connectedComponent;
        } else if (toComp.connectedComponent === -1) {
          toComp.connectedComponent = fromComp.connectedComponent;
        }
      }
    });

    // 最後再次檢查所有連接
    this.itemCanvas.recheckAllConnections();
  }

  updateGlobalPositions(components) {
    Object.values(components).forEach((component) => {
      if (!component || !component.joints) return;

      // 更新每個組件的所有連接點的全局位置
      component.joints.forEach((joint) => {
        const globalPos = component.toGlobal(joint.position);
        joint.globalX = globalPos.x;
        joint.globalY = globalPos.y;
      });

      // 如果是電線，確保重新繪製
      if (component.redrawWire) {
        component.redrawWire();
      }
    });
  }

  adjustWirePositions(components) {
    const { wire1, wire2, wire3, wire4 } = components;

    // 調整電線端點以創建圖片中所示的電路佈局
    // 定位電線以創建所示的角度連接
    if (wire1?.joints && wire2?.joints && wire3?.joints && wire4?.joints) {
      // 從電池到左碳棒的電線
      wire1.joints[0].position.set(-260, 110); // 碳棒端
      wire1.joints[1].position.set(-275, -100); // 電池端

      // 從左碳棒到燈泡的電線
      wire2.joints[0].position.set(-100, -100); // 碳棒端
      wire2.joints[1].position.set(145, -25); // 燈泡端

      // 從燈泡到右碳棒的電線
      wire3.joints[0].position.set(95, -120); // 燈泡端
      wire3.joints[1].position.set(-30, 100); // 碳棒端

      // 從右碳棒到電池的電線
      wire4.joints[0].position.set(-20, -10); // 碳棒端
      wire4.joints[1].position.set(-280, -50); // 電池端

      // 重新繪製所有電線
      [wire1, wire2, wire3, wire4].forEach((wire) => {
        if (wire.redrawWire) wire.redrawWire();
      });
    }
  }

  createComponent(imagePath, position) {
    return this.itemCanvas.createSceneItem(imagePath, position);
  }

  connectComponents(components) {
    for (let i = 0; i < components.length - 1; i++) {
      const current = components[i];
      const next = components[i + 1];

      if (current && next) {
        const currentJoints = current.getGlobalJointPositions();
        const nextJoints = next.getGlobalJointPositions();

        let minDistance = Infinity;
        let bestJointPair = null;

        currentJoints.forEach((currentJoint, currentIdx) => {
          nextJoints.forEach((nextJoint, nextIdx) => {
            const distance = Math.hypot(currentJoint.x - nextJoint.x, currentJoint.y - nextJoint.y);
            if (distance < minDistance) {
              minDistance = distance;
              bestJointPair = {
                current: { joint: current.joints[currentIdx], pos: currentJoint },
                next: { joint: next.joints[nextIdx], pos: nextJoint },
              };
            }
          });
        });

        if (bestJointPair) {
          bestJointPair.current.joint.connected = true;
          bestJointPair.next.joint.connected = true;
          bestJointPair.current.joint.tint = 0x00ff00;
          bestJointPair.next.joint.tint = 0x00ff00;
        }
      }
    }

    if (this.itemCanvas.recheckAllConnections) {
      this.itemCanvas.recheckAllConnections();
    }
  }
}

export class IonModule {
  constructor(itemCanvas) {
    this.itemCanvas = itemCanvas;
    this.animatingBottles = new Set();
    this.particles = new Set();
    this.ions = new Set(); // 追蹤所有離子
    this.cachedBeaker = null;
    this.currentSolution = null;
    this.lastBeakerX = 0;
    this.lastBeakerY = 0;
    this.ionsVisible = false;
    this.ionStorage = [];

    // 溶液特性配置
    this.solutionProperties = {
      硫酸銅: {
        color: "blue",
        canDissolve: true,
        ionColor: {
          positive: 0x0000ff,
          negative: 0x0000ff,
        },
      },
      硫酸鋅: {
        color: "transparent",
        canDissolve: true,
        ionColor: {
          positive: 0xffffff,
          negative: 0xffffff,
        },
      },
      硫酸鎂: {
        color: "transparent",
        canDissolve: true,
        ionColor: {
          positive: 0xffffff,
          negative: 0xffffff,
        },
      },
      硫酸鈣: {
        color: "white",
        canDissolve: false,
        ionColor: {
          positive: 0xffffff,
          negative: 0xffffff,
        },
      },
      硫酸鈉: {
        color: "transparent",
        canDissolve: true,
        ionColor: {
          positive: 0xffffff,
          negative: 0xffffff,
        },
      },
      硫酸鉀: {
        color: "transparent",
        canDissolve: true,
        ionColor: {
          positive: 0xffffff,
          negative: 0xffffff,
        },
      },
    };

    this.updateBeakerReference();
  }

  setSolution(solutionName) {
    if (this.solutionProperties[solutionName]) {
      this.currentSolution = solutionName;
    }
    this.showStatusText("溶液已選擇：" + solutionName);
  }

  updateBeakerReference() {
    if (!this.itemCanvas?.components?.children) {
      this.cachedBeaker = null;
      return;
    }

    this.cachedBeaker = this.itemCanvas.components.children.find((component) => component.type === "燒杯");
  }

  getBeakerBounds() {
    if (!this.cachedBeaker) {
      return null;
    }

    return {
      x: this.cachedBeaker.x - 105,
      y: this.cachedBeaker.y - 70,
      width: 265,
      height: 250,
    };
  }

  updateBeakerColor(color) {
    if (!this.cachedBeaker) return;

    const colorMap = {
      blue: 0x0000ff,
      white: 0xffffff,
      transparent: 0xffffff,
    };

    this.cachedBeaker.tint = colorMap[color] || 0xffffff;
  }

  createPowderParticles(bottle) {
    if (!this.currentSolution) {
      this.showStatusText("請選擇溶液");
      return;
    }

    const particleCount = 5;
    const particleGroup = {
      particles: [],
      centerX: bottle.x + 120,
      centerY: bottle.y + 50,
      vx: 0,
      vy: 0,
      scattered: false,
      initialOffsets: [],
    };

    // 根據當前溶液設定粒子顏色
    let particleColor = 0xffffff;
    if (this.currentSolution === "硫酸銅") {
      particleColor = 0x0000ff;
    }

    // 在一個較小的範圍內創建多個粒子
    for (let i = 0; i < particleCount; i++) {
      const particle = new Graphics().circle(0, 0, 8).fill(particleColor);
      // 使用極座標方式生成實心圓內的隨機位置
      const radius = Math.sqrt(Math.random()) * 15; // sqrt 使分布更均勻
      const angle = Math.random() * Math.PI * 2;

      const offset = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };

      particleGroup.initialOffsets.push(offset);

      particle._isPrecipitate = true;
      particle.x = particleGroup.centerX + offset.x;
      particle.y = particleGroup.centerY + offset.y;
      particle.alpha = 0.8;

      particleGroup.particles.push(particle);
      this.itemCanvas.container.addChild(particle);
    }

    this.particles.add(particleGroup);
  }

  handleBottleAnimation(sceneContainer) {
    if (!sceneContainer || this.animatingBottles.has(sceneContainer)) {
      return;
    }
    if (!this.currentSolution) {
      this.showStatusText("請選擇溶液");
      return;
    }

    this.animatingBottles.add(sceneContainer);

    const timeline = gsap.timeline({
      onComplete: () => {
        this.animatingBottles.delete(sceneContainer);
      },
    });

    timeline
      .to(sceneContainer, {
        rotation: Math.PI / 15,
        y: sceneContainer.y + 50,
        x: sceneContainer.x + 10,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => this.createPowderParticles(sceneContainer),
      })
      .to(sceneContainer, {
        rotation: -Math.PI / 15,
        y: sceneContainer.y,
        x: sceneContainer.x,
        duration: 0.5,
        ease: "power2.inOut",
      });
  }
  setIonsVisible(visible) {
    this.ionsVisible = visible;
    for (const ion of this.ions) {
      if (!ion._isPrecipitate) {
        ion.visible = visible;
      }
    }
  }
  createIonsFromParticle(position, solutionName) {
    if (!solutionName || !this.solutionProperties[solutionName]) {
      return;
    }

    const solution = this.solutionProperties[solutionName];
    const bounds = this.getBeakerBounds() || {
      x: position.x - 130,
      y: position.y - 110,
      width: 265,
      height: 200,
    };

    // 如果是硫酸鈣，產生白色沉澱
    if (!solution.canDissolve) {
      for (let i = 0; i < 10; i++) {
        const precipitate = new Graphics().circle(0, 0, 8).fill(0xffffff);
        precipitate._isPrecipitate = true;
        precipitate._originalX = 0; // 儲存相對位置
        precipitate._originalY = 0;
        precipitate.alpha = 0.7;

        // 計算初始相對位置
        const relativeX = (position.x - bounds.x) / bounds.width;
        const relativeY = (position.y - bounds.y) / bounds.height;

        precipitate.x = position.x;
        precipitate.y = position.y;

        this.itemCanvas.container.addChild(precipitate);
        this.ions.add(precipitate);

        const createPrecipitateMotion = () => {
          // 限制水平散布範圍
          // 使用原始位置為中心，只允許較小範圍的偏移
          const spreadRange = 0.15; // 相對於容器寬度的 10% 範圍
          const relativeTargetX = relativeX + (Math.random() - 0.5) * spreadRange;

          // 確保 X 不會超出容器邊界
          const clampedTargetX = Math.max(0.1, Math.min(0.9, relativeTargetX));

          const relativeTargetY = 0.85 + Math.random() * 0.1; // 靠近底部

          const targetX = bounds.x + bounds.width * clampedTargetX;
          const targetY = bounds.y + bounds.height * relativeTargetY;

          precipitate._originalX = clampedTargetX;
          precipitate._originalY = relativeTargetY;

          return gsap.to(precipitate, {
            x: targetX,
            y: targetY,
            duration: 3 + Math.random() * 2,
            ease: "power1.in",
            onComplete: () => {
              // 減少擺動幅度
              const swayAmount = 0.01; // 降低為相對寬度的 1%
              gsap.to(precipitate, {
                x: bounds.x + bounds.width * (clampedTargetX + (Math.random() - 0.5) * swayAmount),
                duration: 1 + Math.random(),
                repeat: -1,
                yoyo: true,
              });
            },
          });
        };

        createPrecipitateMotion();
      }
      return;
    }

    // 創建離子對
    const numIonPairs = 5;
    for (let i = 0; i < numIonPairs; i++) {
      const createIon = (isPositive) => {
        const ion = new Graphics().circle(0, 0, 8).fill(isPositive ? solution.ionColor.positive : solution.ionColor.negative);

        if (isPositive) {
          ion.rect(-5, -1, 10, 2).rect(-1, -5, 2, 10).fill(0xff0000);
        } else {
          ion.rect(-5, -1, 10, 2).fill(0x000000);
        }

        ion._isIon = true;
        ion._originalX = 0;
        ion._originalY = 0;
        ion.x = position.x;
        ion.y = position.y;
        ion.alpha = 0.8;
        ion.visible = this.ionsVisible; // Add this line

        this.itemCanvas.container.addChild(ion);
        this.ions.add(ion);

        return ion;
      };

      const positiveIon = createIon(true);
      const negativeIon = createIon(false);

      const createIonMotion = (ion) => {
        const createRandomMovement = () => {
          // 計算相對位置的目標點
          const relativeTargetX = Math.random();
          const relativeTargetY = Math.random();

          // 轉換為實際座標
          const targetX = bounds.x + bounds.width * relativeTargetX;
          const targetY = bounds.y + bounds.height * relativeTargetY;

          // 儲存相對位置
          ion._originalX = relativeTargetX;
          ion._originalY = relativeTargetY;

          return gsap.to(ion, {
            x: targetX,
            y: targetY,
            duration: 2 + Math.random() * 3,
            ease: "none",
            onComplete: createRandomMovement,
          });
        };

        return createRandomMovement();
      };

      createIonMotion(positiveIon);
      createIonMotion(negativeIon);
    }

    if (solution.color !== "transparent") {
      this.updateBeakerColor(solution.color);
    }
  }

  isParticleInBeaker(particle, beakerBounds) {
    const collision =
      particle.x >= beakerBounds.x &&
      particle.x <= beakerBounds.x + beakerBounds.width &&
      particle.y >= beakerBounds.y &&
      particle.y <= beakerBounds.y + beakerBounds.height;

    return collision;
  }

  // 顯示狀態文字
  showStatusText(message) {
    // 移除現有文字（如果有的話）
    if (this.statusText) {
      this.itemCanvas.container.removeChild(this.statusText);
    }

    // 創建新文字
    this.statusText = new Text({ text: message, style: defaultStyle });

    // 將文字定位在螢幕中央
    this.statusText.anchor.set(0.5);
    this.statusText.x = 960; // 1920 的一半
    this.statusText.y = 100; // 1080 的一半

    // 加入容器中
    this.itemCanvas.container.addChild(this.statusText);

    // 一秒後移除
    setTimeout(() => {
      if (this.statusText) {
        this.itemCanvas.container.removeChild(this.statusText);
        this.statusText = null;
      }
    }, 1000);
  }

  update() {
    if (!this.cachedBeaker) {
      this.updateBeakerReference();
    }

    const currentBeakerBounds = this.getBeakerBounds();
    const beakerMoved = this.cachedBeaker && (this.lastBeakerX !== this.cachedBeaker.x || this.lastBeakerY !== this.cachedBeaker.y);

    // 如果燒杯移動了，更新所有離子的位置
    if (beakerMoved && currentBeakerBounds) {
      // 更新所有離子和沉澱物的位置
      for (const ion of this.ions) {
        // 使用儲存的相對位置計算新的實際位置
        if (ion._originalX !== undefined && ion._originalY !== undefined) {
          const newX = currentBeakerBounds.x + currentBeakerBounds.width * ion._originalX;
          const newY = currentBeakerBounds.y + currentBeakerBounds.height * ion._originalY;

          // 取得當前動畫
          const currentTween = gsap.getTweensOf(ion)[0];
          if (currentTween) {
            // 更新動畫目標
            gsap.to(ion, {
              x: newX,
              y: newY,
              duration: currentTween.duration(),
              ease: currentTween.vars.ease || "none",
            });
          } else {
            // 如果沒有動畫，直接更新位置
            ion.x = newX;
            ion.y = newY;
          }
        }
      }
    }

    // 更新燒杯最後位置
    if (this.cachedBeaker) {
      this.lastBeakerX = this.cachedBeaker.x;
      this.lastBeakerY = this.cachedBeaker.y;
    }

    // 更新粒子位置
    for (const group of this.particles) {
      if (!group.scattered) {
        group.vy += 0.2;
        group.centerY += group.vy;

        // 更新每個粒子的位置
        group.particles.forEach((particle, i) => {
          const offset = group.initialOffsets[i];
          particle.x = group.centerX + offset.x;
          particle.y = group.centerY + offset.y;
        });

        // 檢查是否有燒杯且粒子在燒杯範圍內
        if (currentBeakerBounds && this.isParticleInBeaker({ x: group.centerX, y: group.centerY }, currentBeakerBounds)) {
          if (this.currentSolution === "硫酸銅") {
            // 更新燒杯顏色
            if (this.cachedBeaker) {
              this.cachedBeaker.tint = 0x0000ff;
            }
          }

          // 創建離子
          if (this.currentSolution) {
            this.createIonsFromParticle({ x: group.centerX, y: group.centerY }, this.currentSolution);
          }

          // 移除原始粒子
          group.particles.forEach((particle) => {
            this.itemCanvas.container.removeChild(particle);
          });
          this.particles.delete(group);
        } else if (group.centerY > 1080 || group.centerX < 0 || group.centerX > 1920) {
          // 如果超出畫面範圍則移除
          group.particles.forEach((particle) => {
            this.itemCanvas.container.removeChild(particle);
          });
          this.particles.delete(group);
        }
      }
    }
  }

  reset() {
    // 停止所有動畫
    this.animatingBottles.clear();
    gsap.killTweensOf([...this.animatingBottles]);

    // 移除所有粒子
    for (const group of this.particles) {
      group.particles.forEach((particle) => {
        gsap.killTweensOf(particle);
        this.itemCanvas.container.removeChild(particle);
      });
    }
    this.particles.clear();

    // 移除所有離子和沉澱物
    for (const ion of this.ions) {
      gsap.killTweensOf(ion);
      this.itemCanvas.container.removeChild(ion);
    }
    this.ions.clear();

    // 重設其他屬性
    this.cachedBeaker = null;
    this.currentSolution = null;
    this.lastBeakerX = 0;
    this.lastBeakerY = 0;
  }
}
