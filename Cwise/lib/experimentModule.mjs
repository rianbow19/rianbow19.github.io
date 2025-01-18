import { Sprite, Texture, Text, Graphics } from "./pixi.mjs";
import { defaultStyle } from "./textStyle.mjs";
import { gsap } from "../gsap_src/index.js";

class ElectrolysisModule {
  constructor(itemCanvas) {
    this.itemCanvas = itemCanvas;
    this.validCircuit = false;
    this.selectedSolution = null;
    this.ionAnimationActive = false;
    this.connectedPHPaper = null;

    // 新增模組設置實例
    this.moduleSetup = new ModuleSetup(itemCanvas);

    // 追蹤組件狀態
    this.components = null;
    this.isAssembled = false;
    this.isAllitem = false;

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
    this.bulbLight = null; // 儲存燈光精靈參考
    this.statusText = null; // 儲存狀態文字
    this.ions = [];
    this.animationFrame = null;
    this.activeIonTweens = []; // 用於追蹤 GSAP 動畫
    this.ionVisible = false;
    this.ionMoving = false;
  }

  // 檢查電路是否正確連接
  validateCircuit() {
    const components = this.itemCanvas.components.children;

    if (components.length > 0) {
      this.isAssembled = true;
    }

    // 必需的組件數量
    const required = {
      燒杯: 1,
      電池: 1,
      燈泡: 1,
      碳棒: 2,
      Wire: 4, // 從 '電線' 改為 'Wire' 以匹配實際類型
    };

    // 計算場景中的組件數量
    const counts = {};
    components.forEach((component) => {
      // 單獨處理電線
      if (component.type === "Wire") {
        counts["Wire"] = (counts["Wire"] || 0) + 1;
        return;
      }

      // 處理其他組件
      const type = component.type;
      if (type) {
        counts[type] = (counts[type] || 0) + 1;
      }
    });

    // 與所需組件進行比較
    for (const [type, requiredCount] of Object.entries(required)) {
      const currentCount = counts[type] || 0;
      if (currentCount < requiredCount) {
        console.log(`組裝不完整：已放置 ${currentCount}/${requiredCount} 個 ${type}`);
        return false;
      }
    }

    // 檢查連接
    const connectedGroup = components[0]?.connectedComponent;
    const allConnected = components.every((comp) => comp.connectedComponent === connectedGroup && comp.connectedComponent !== -1);

    if (!allConnected) {
      console.log("組裝不完整：元件未正確連接");
      return false;
    }

    this.validCircuit = true;
    return true;
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
    this.resetBulbLight();

    if (!this.isAllitem) {
      // 再次驗證電路
      this.validateCircuit();

      if (!this.isAssembled) {
        this.showStatusText("請先組裝實驗");
        return false;
      }

      if (!this.validCircuit) {
        this.showStatusText("電路未正確連接");
        return false;
      }
    }

    if (!this.selectedSolution) {
      this.showStatusText("請選擇溶液");
      return false;
    }

    this.startIonMovement();

    const solutionProps = this.solutionProperties[this.selectedSolution];

    // 顯示 "電解中" 文字
    this.showStatusText("電解中");

    // 更新實驗狀態
    this.updateBulbBrightness(solutionProps.brightness);
    this.updateBeakerColor(solutionProps.color);

    // 如果有連接廣用試紙，更新其顏色
    this.handlePHPaperConnection();
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
    testStrip.clear().rect(-40, 0, 80, 100).fill(colorHex);
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
      // 在燈泡後面添加燈光
      bulb.addChild(this.bulbLight);
    }

    // 根據亮度更新燈光效果
    switch (brightness) {
      case "bright":
        this.bulbLight.alpha = 0.8;
        this.bulbLight.tint = 0xffff00; // 黃色
        this.bulbLight.scale.set(1.5);
        break;
      case "dim":
        this.bulbLight.alpha = 0.4;
        this.bulbLight.tint = 0xffaa00; // 橙黃色
        this.bulbLight.scale.set(1.2);
        break;
      case "none":
      default:
        this.bulbLight.alpha = 0;
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

    console.log(`尋找組件 ${searchType}: ${component ? "找到" : "未找到"}`);
    if (!component) {
      console.log(
        "目前畫布中的組件：",
        this.itemCanvas.components.children.map((c) => c.type)
      );
    }

    return component;
  }

  // 設置選擇的溶液
  setSolution(solutionName) {
    if (this.solutionProperties[solutionName]) {
      this.selectedSolution = solutionName;
      this.resetBulbLight(); // 切換溶液時重置燈泡
      this.stopIonAnimation(); // 切換溶液時停止離子動畫
      this.updateBeakerColor(this.solutionProperties[solutionName].color);
    }
    this.handlePHPaperConnection();
  }

  // 切換離子動畫
  toggleIonAnimation(show) {
    this.ionVisible = show;
    const components = this.itemCanvas.components.children;

    components.forEach((component) => {
      if (component.ions) {
        component.ions.forEach((ion) => {
          // 只有在動畫中時顯示燒杯離子
          ion.visible = show && (component.type === "燒杯" || this.ionMoving);
        });
      }
    });
  }

  // 開始離子移動
  startIonMovement() {
    if (!this.validCircuit || !this.selectedSolution) return;
    this.ionMoving = true;

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

    center.x /= allPoints.length;
    center.y /= allPoints.length;

    // 按角度排序點以進行圓周運動
    allPoints.sort((a, b) => {
      const angleA = Math.atan2(a.y - center.y, a.x - center.x);
      const angleB = Math.atan2(b.y - center.y, b.x - center.x);
      return angleB - angleA;
    });

    // 顯示所有離子並對其進行動畫處理
    components.forEach((component) => {
      if (component.ions) {
        component.ions.forEach((ion) => {
          ion.visible = true;
          if (ion.tween) ion.tween.kill();

          const tween = gsap.to(ion, {
            duration: 5,
            progress: 1,
            repeat: -1,
            ease: "none",
            onUpdate: () => {
              if (!this.ionMoving) return;

              // 找到路徑中的當前點和下一個點
              const index = Math.floor(ion.progress * allPoints.length);
              const nextIndex = (index + 1) % allPoints.length;
              const currentPoint = allPoints[index];
              const nextPoint = allPoints[nextIndex];

              // 轉換為本地座標
              const localCurrent = component.toLocal(currentPoint);
              const localNext = component.toLocal(nextPoint);

              // 在點之間插值
              const t = (ion.progress * allPoints.length) % 1;
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
  stopIonAnimation() {
    this.ionMoving = false;
    const components = this.itemCanvas.components.children;

    components.forEach((component) => {
      if (component.ions) {
        component.ions.forEach((ion) => {
          if (ion.tween) {
            ion.tween.kill();
          }
          // 重置離子到原始位置
          const config = this.itemCanvas.ionConfigs[component.type + ".png"]?.find((pos) => pos.x === ion.originalX && pos.y === ion.originalY);
          if (config) {
            ion.x = config.x;
            ion.y = config.y;
          }
          // 只有在不動畫時顯示燒杯離子
          ion.visible = component.type === "燒杯" && this.ionVisible;
        });
      }
    });
  }

  // 重置
  reset() {
    // 重置所有狀態
    this.validCircuit = false;
    this.ionAnimationActive = false;
    this.connectedPHPaper = null;
    this.isAssembled = false;
    this.isAllitem = false;
    this.resetBulbLight();
    this.stopIonAnimation();
    this.activeIonTweens.forEach((tween) => tween.kill());
    this.activeIonTweens = [];
    this.ionVisible = false;
    this.ionMoving = false;
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

class ModuleSetup {
  constructor(itemCanvas) {
    this.itemCanvas = itemCanvas;
    this.centerX = 960;
    this.centerY = 540;
  }

  setupElectrolysisModule() {
    // 重置畫布
    this.itemCanvas.reset();

    // 在中央偏下方創建燒杯
    const beaker = this.createComponent("燒杯.png", {
      x: this.centerX,
      y: this.centerY + 300,
    });

    // 在燒杯上方偏左創建電池
    const battery = this.createComponent("電池.png", {
      x: this.centerX - 200,
      y: this.centerY - 150,
    });

    // 在電池右側創建燈泡
    const bulb = this.createComponent("燈泡.png", {
      x: this.centerX + 200,
      y: this.centerY - 200,
    });

    // 在燒杯內創建碳棒
    const leftRod = this.createComponent("碳棒.png", {
      x: this.centerX - 70,
      y: this.centerY + 200,
    });

    const rightRod = this.createComponent("碳棒.png", {
      x: this.centerX + 120,
      y: this.centerY + 200,
    });

    // 創建連接電線
    // 從電池到左碳棒的電線
    const wire1 = this.createComponent("電線.png", {
      x: this.centerX - 70,
      y: this.centerY - 50,
    });

    // 從左碳棒到燈泡（底部連接）的電線
    const wire2 = this.createComponent("電線.png", {
      x: this.centerX + 50,
      y: this.centerY - 50,
    });

    // 從燈泡到右碳棒的電線
    const wire3 = this.createComponent("電線.png", {
      x: this.centerX + 150,
      y: this.centerY,
    });

    // 從右碳棒到電池的電線
    const wire4 = this.createComponent("電線.png", {
      x: this.centerX - 50,
      y: this.centerY + 110,
    });

    // 等待組件載入後再建立連接
    setTimeout(() => {
      // 按圖片中所示的順序連接組件
      this.connectComponents([
        battery, // 從電池開始
        wire1, // 連接到第一條電線
        leftRod, // 連接到左碳棒
        wire2, // 連接到第二條電線
        bulb, // 連接到燈泡
        wire3, // 連接到第三條電線
        rightRod, // 連接到右碳棒
        wire4, // 連接到第四條電線
        battery, // 完成回到電池的電路
      ]);

      // 調整電線位置以匹配圖片中的橙色電線
      this.adjustWirePositions({
        wire1,
        wire2,
        wire3,
        wire4,
        battery,
        leftRod,
        rightRod,
        bulb,
      });
    }, 500);

    return {
      beaker,
      battery,
      leftRod,
      rightRod,
      bulb,
      wire1,
      wire2,
      wire3,
      wire4,
    };
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

export { ElectrolysisModule, ModuleSetup };
