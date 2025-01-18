import { Sprite, Texture, Text, Graphics } from "./pixi.mjs";
import { defaultStyle } from "./textStyle.mjs";
import { gsap } from "../gsap_src/index.js"; // Add GSAP import

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
    this.bulbLight = null; // 新增此行以儲存燈光精靈參考
    this.statusText = null; // 新增此行以儲存狀態文字
    this.ions = [];
    this.animationFrame = null;
    this.activeIonTweens = []; // Add this for tracking GSAP tweens
  }

  // 檢查電路是否正確連接
  validateCircuit() {
    const components = this.itemCanvas.components.children;

    if (components.length > 0) {
      this.isAssembled = true;
    }

    // Required components count
    const required = {
      燒杯: 1,
      電池: 1,
      燈泡: 1,
      碳棒: 2,
      Wire: 4, // Changed from '電線' to 'Wire' to match actual type
    };

    // Count components in scene
    const counts = {};
    components.forEach((component) => {
      // Handle wires separately
      if (component.type === "Wire") {
        counts["Wire"] = (counts["Wire"] || 0) + 1;
        return;
      }

      // Handle other components
      const type = component.type;
      if (type) {
        counts[type] = (counts[type] || 0) + 1;
      }
    });

    // Compare with required components
    for (const [type, requiredCount] of Object.entries(required)) {
      const currentCount = counts[type] || 0;
      if (currentCount < requiredCount) {
        console.log(`組裝不完整：已放置 ${currentCount}/${requiredCount} 個 ${type}`);
        return false;
      }
    }

    // Check connections
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
      // Validate circuit again
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

    const solutionProps = this.solutionProperties[this.selectedSolution];

    // Show "電解中" text
    this.showStatusText("電解中");

    // 更新實驗狀態
    this.updateBulbBrightness(solutionProps.brightness);
    this.updateBeakerColor(solutionProps.color);

    // 如果有連接廣用試紙，更新其顏色
    this.handlePHPaperConnection();

    return true;
  }

  // 新增顯示狀態文字的方法
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

    // Update pH paper color based on overlap
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

    // Get test strip from connected pH paper
    const testStrip = this.connectedPHPaper.testStrip;
    if (!testStrip) return;

    // Convert color name to hex
    const colorHex = this.colorToHex(color);

    // Update the test strip color
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

    // Create light sprite if it doesn't exist
    if (!this.bulbLight) {
      this.bulbLight = new Sprite(Texture.from("燈泡光.png"));
      this.bulbLight.anchor.set(0.5);
      this.bulbLight.y = -50;
      this.bulbLight.alpha = 0;
      // Add light behind the bulb
      bulb.addChild(this.bulbLight);
    }

    // Update light effect based on brightness
    switch (brightness) {
      case "bright":
        this.bulbLight.alpha = 0.8;
        this.bulbLight.tint = 0xffff00; // Yellow tint
        this.bulbLight.scale.set(1.5);
        break;
      case "dim":
        this.bulbLight.alpha = 0.4;
        this.bulbLight.tint = 0xffaa00; // Orange-yellow tint
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
      console.log("Canvas or components not initialized");
      return null;
    }

    // Remove .png extension from search type
    const searchType = type.replace(".png", "");

    const component = this.itemCanvas.components.children.find((component) => {
      // Check if component is wire
      if (searchType === "電線" && component.type === "Wire") {
        return true;
      }

      // Direct type comparison for non-wire components
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
      this.updateBeakerColor(this.solutionProperties[solutionName].color);
      // 如果試紙已連接，立即更新試紙顏色
      this.handlePHPaperConnection();
    }
  }

  // 切換離子動畫
  toggleIonAnimation(show) {
    this.ionAnimationActive = show;
    if (show && this.validCircuit && this.selectedSolution) {
      // 啟動離子動畫
      this.startIonAnimation();
    } else {
      // 停止離子動畫
      this.stopIonAnimation();
    }
  }

  // 開始離子動畫
  startIonAnimation() {
    if (!this.validCircuit || !this.selectedSolution) return;
    this.stopIonAnimation();
    this.createIonsForComponents();
  }

  calculateWireLength(wire) {
    if (!wire.joints || wire.joints.length < 2) return 0;
    const start = wire.joints[0].getGlobalPosition();
    const end = wire.joints[1].getGlobalPosition();
    return Math.hypot(end.x - start.x, end.y - start.y);
  }

  getWireIonPositions(wire, numIons) {
    if (!wire.joints || wire.joints.length < 2) return [];
    const positions = [];
    const start = wire.joints[0].getGlobalPosition();
    const end = wire.joints[1].getGlobalPosition();

    for (let i = 0; i < numIons; i++) {
      const progress = i / Math.max(1, numIons - 1);
      positions.push({
        x: start.x + (end.x - start.x) * progress,
        y: start.y + (end.y - start.y) * progress,
        progress,
      });
    }
    return positions;
  }

  getComponentIonPositions(component, numIons) {
    const positions = [];
    const radius = 30;

    for (let i = 0; i < numIons; i++) {
      const angle = (i / numIons) * Math.PI * 2;
      const x = component.x + Math.cos(angle) * radius;
      const y = component.y + Math.sin(angle) * radius;
      positions.push({
        x,
        y,
        progress: i / numIons,
      });
    }
    return positions;
  }

  getConnectedComponentsPath(component) {
    const connectedComponents = this.itemCanvas.components.children.filter((comp) => comp.connectedComponent === component.connectedComponent);

    // Get all joint positions
    const points = [];
    connectedComponents.forEach((comp) => {
      comp.joints.forEach((joint) => {
        const globalPos = comp.toGlobal(joint.position);
        points.push({ x: globalPos.x, y: globalPos.y });
      });
    });

    // Order points to form a circular path
    const center = {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    };

    // Sort points by angle around center
    points.sort((a, b) => {
      const angleA = Math.atan2(a.y - center.y, a.x - center.x);
      const angleB = Math.atan2(b.y - center.y, b.x - center.x);
      return angleA - angleB;
    });

    return { points, center };
  }

  createIonsForComponents() {
    const components = this.itemCanvas.components.children;
    const processedGroups = new Set();

    components.forEach((component) => {
      if (!component || processedGroups.has(component.connectedComponent)) return;

      if (component.connectedComponent !== -1) {
        processedGroups.add(component.connectedComponent);
        const { points, center } = this.getConnectedComponentsPath(component);

        // Create ions for the circuit group
        const numIons = Math.max(8, points.length * 2);
        for (let i = 0; i < numIons; i++) {
          const ion = new Graphics();
          ion.circle(0, 0, 5);
          ion.fill(0x0000ff);

          const progress = i / numIons;
          ion.progress = progress;
          ion.pathPoints = points;
          ion.pathCenter = center;

          // Set initial position
          const pos = this.getIonPosition(progress, points, center);
          ion.x = pos.x;
          ion.y = pos.y;

          this.itemCanvas.container.addChild(ion);
          this.ions.push(ion);

          // Create GSAP animation
          const tween = gsap.to(ion, {
            duration: 5,
            progress: 1,
            repeat: -1,
            ease: "none",
            onUpdate: () => {
              const pos = this.getIonPosition(ion.progress, points, center);
              ion.x = pos.x;
              ion.y = pos.y;
            },
          });
          this.activeIonTweens.push(tween);
        }
      }
    });
  }

  getIonPosition(progress, points, center) {
    const totalPoints = points.length;
    const segmentIndex = Math.floor(progress * totalPoints);
    const nextIndex = (segmentIndex + 1) % totalPoints;
    const segmentProgress = (progress * totalPoints) % 1;

    const currentPoint = points[segmentIndex];
    const nextPoint = points[nextIndex];

    // Bezier curve control point
    const controlPoint = {
      x: center.x + (currentPoint.x - center.x) * 1.2,
      y: center.y + (currentPoint.y - center.y) * 1.2,
    };

    // Quadratic Bezier interpolation
    const t = segmentProgress;
    const x = (1 - t) * ((1 - t) * currentPoint.x + t * controlPoint.x) + t * ((1 - t) * controlPoint.x + t * nextPoint.x);
    const y = (1 - t) * ((1 - t) * currentPoint.y + t * controlPoint.y) + t * ((1 - t) * controlPoint.y + t * nextPoint.y);

    return { x, y };
  }

  stopIonAnimation() {
    // Kill all active GSAP tweens
    this.activeIonTweens.forEach((tween) => {
      tween.kill();
    });
    this.activeIonTweens = [];

    // Remove all ions
    this.ions.forEach((ion) => {
      if (ion.parent) {
        ion.parent.removeChild(ion);
      }
    });
    this.ions = [];
  }

  reset() {
    // 重置所有狀態
    this.validCircuit = false;
    this.selectedSolution = null;
    this.ionAnimationActive = false;
    this.connectedPHPaper = null;
    this.isAssembled = false;
    this.isAllitem = false;
    this.resetBulbLight();
    this.stopIonAnimation();
    this.activeIonTweens.forEach((tween) => tween.kill());
    this.activeIonTweens = [];
  }

  update(deltaTime) {
    if (this.ionAnimationActive && this.ions.length > 0) {
      // Update positions of connected components' ions
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
      wire1.joints[0].position.set(-260, 110); //Rod end
      wire1.joints[1].position.set(-275, -100); // Battery end

      // 從左碳棒到燈泡的電線
      wire2.joints[0].position.set(-100, -100); // Rod end
      wire2.joints[1].position.set(145, -25); // Bulb end

      // 從燈泡到右碳棒的電線
      wire3.joints[0].position.set(95, -120); // Bulb end
      wire3.joints[1].position.set(-30, 100); // Rod end

      // 從右碳棒到電池的電線
      wire4.joints[0].position.set(-20, -10); // Rod end
      wire4.joints[1].position.set(-280, -50); // Battery end

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
