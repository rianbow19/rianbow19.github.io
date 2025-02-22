import { Sprite, Texture, Text, Graphics, Container, ColorMatrixFilter } from "./pixi.mjs";
import { defaultStyle, listStyle, scoreStyle } from "./textStyle.mjs";
import { gsap } from "../gsap-public/src/index.js";

export class ElectrolysisModule {
  constructor(itemCanvas) {
    this.itemCanvas = itemCanvas;
    this.selectedSolution = null;
    this.ionAnimationActive = false;
    this.connectedPHPaper = null;
    this.isIonCheckboxChecked = false;
    this.isTextCheckboxChecked = false;

    this.isElectrolysisActive = false; // 追蹤實驗是否在進行中
    this.isElectronCheckboxChecked = false; // 追蹤使用者是否想看到電子流向

    // 新增模組設置實例
    this.moduleSetup = new ModuleSetup(itemCanvas);
    this.setElectron = new SetElectron(itemCanvas);

    //pH試紙檢查
    this.lastPHCheckTime = 0;
    this.PHCheckInterval = 1000;

    this.bulbLight = null;
    this.ionMoving = false;
    this.randomAnimations = []; // 用於儲存隨機移動的動畫
    this.electrodesAnimations = []; // 用於儲存電極移動的動畫

    this.electrodeLabels = []; // 用於儲存電極標籤

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
        color: "lightgreen",
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
    this.setElectron.reset();

    if (!this.selectedSolution) {
      showStatusText("請選擇溶液", this.itemCanvas);
      return false;
    }
    if (!this.moduleSetup.isSetDown) {
      showStatusText("請先放置實驗設備", this.itemCanvas);
      return false;
    }

    const solutionProps = this.solutionProperties[this.selectedSolution];

    // 首先，從畫布中獲取所有組件
    const allComponents = this.itemCanvas.components.children;

    // 然後處理每個組件
    allComponents.forEach((component) => {
      this.setElectron.createElectronsForComponent(component);
      component.eventMode = "none"; // 禁用事件交互
      component.cursor = "default"; // 改變游標樣式
    });

    // 設定實驗狀態為進行中
    this.isElectrolysisActive = true;

    // 停止隨機移動，開始電極移動
    this.stopRandomMovement();
    this.startElectrodesMovement();

    // 根據使用者選擇決定是否顯示電子動畫
    this.updateElectronAnimation();

    // 顯示實驗狀態
    showStatusText("電解中", this.itemCanvas);
    this.updateBulbBrightness(solutionProps.brightness);
    this.updateBeakerColor(solutionProps.color);

    // 如果選擇的是「氯化銅」，則開始額外的氯化銅動畫
    if (this.selectedSolution === "氯化銅") {
      this.startCopperChlorideAnimation();
    }

    this.ionMoving = true;
    return true;
  }

  // 新增：氯化銅專屬動畫（電極沉積/氣泡＆溶液變淡）
  startCopperChlorideAnimation() {
    // 延遲 1.5 秒後開始執行
    gsap.delayedCall(1.5, () => {
      // ------------------------------
      // 新增電極區塊：負極與正極
      // ------------------------------
      // 建立負極（左側碳棒）
      const negativeElectrode = new Container();
      const negLabel = new Text({ text: "-", style: scoreStyle });
      negLabel.x = 5;
      negLabel.y = 70;
      // 設定負極位置（依實際畫布調整座標）
      negativeElectrode.addChild(negLabel);
      negativeElectrode.x = this.moduleSetup.centerX - 90;
      negativeElectrode.y = this.moduleSetup.centerY + 80;

      negLabel.visible = this.isTextCheckboxChecked; // 加入這行

      // 建立正極（右側碳棒）
      const positiveElectrode = new Container();
      const posLabel = new Text({ text: "+", style: scoreStyle });
      posLabel.x = 5;
      posLabel.y = 70;
      positiveElectrode.addChild(posLabel);
      positiveElectrode.x = this.moduleSetup.centerX + 100;
      positiveElectrode.y = this.moduleSetup.centerY + 80;

      posLabel.visible = this.isTextCheckboxChecked; // 加入這行

      // 將電極區塊加入畫布（或實驗模組容器）
      this.itemCanvas.container.addChild(negativeElectrode);
      this.itemCanvas.container.addChild(positiveElectrode);

      // -----------------------------------------
      // 負極：銅附著沉積動畫（紅棕色）
      // -----------------------------------------
      const copperDeposition = new Graphics();
      // 初始在碳棒底部，寬40、高0
      copperDeposition.rect(-2, 250, 42, 0);
      copperDeposition.fill(0x8b4513); // 可調整成理想的紅棕色
      copperDeposition.alpha = 0.5;
      negativeElectrode.addChild(copperDeposition);
      const progress = { height: 0, y: 250 }; // 從底部 250 開始

      // 利用 gsap tween 該物件，並在 onUpdate 裡更新 Graphics
      gsap.to(progress, {
        height: 110, // 目標高度80
        y: 140, // 目標位置 170
        duration: 20,
        ease: "linear",
        onUpdate: () => {
          // 重新繪製 copperDeposition
          copperDeposition.clear();
          copperDeposition.rect(-2, progress.y, 44, progress.height);
          copperDeposition.fill(0x8b4513);
        },
      });

      // -----------------------------------------
      // 正極：氣泡產生動畫（黃綠色）與毒性標示
      // -----------------------------------------
      const bubblesContainer = new Container();
      positiveElectrode.addChild(bubblesContainer);
      // 氣泡建立函式
      const createBubble = () => {
        const bubble = new Graphics();
        bubble.circle(0, 0, 5);
        bubble.fill(0xadff2f); // 黃綠色
        // 隨機在電極區塊寬度內
        bubble.x = Math.random() * 50;
        // 從底部開始產生
        bubble.y = 250;
        return bubble;
      };

      let bubbleDelay = 500; // 初始延遲 500ms
      const minDelay = 10; // 最小延遲 100ms
      let isActive = true; // 控制是否繼續產生氣泡

      // 每 2 秒加快氣泡產生速度，25秒後開始減慢
      const speedupInterval = setInterval(() => {
        if (!isActive) {
          clearInterval(speedupInterval);
          return;
        }

        bubbleDelay = Math.max(minDelay, bubbleDelay * 0.8);
        clearInterval(bubbleInterval);
        createBubbleInterval();
      }, 1000);

      // 25秒後開始減少氣泡
      setTimeout(() => {
        isActive = false;
        // 逐漸增加延遲時間
        const slowdown = setInterval(() => {
          bubbleDelay *= 1.5;
          if (bubbleDelay > 2000) {
            clearInterval(bubbleInterval);
            clearInterval(slowdown);
          } else {
            clearInterval(bubbleInterval);
            createBubbleInterval();
          }
        }, 1000);
      }, 20000);

      // 建立氣泡產生間隔
      let bubbleInterval;
      const createBubbleInterval = () => {
        bubbleInterval = setInterval(() => {
          if (!isActive && Math.random() > 0.7) return; // 減少氣泡產生機率
          const bubble = createBubble();
          bubblesContainer.addChild(bubble);
          gsap.to(bubble, {
            y: 130, // 改為從250往上到130的位置
            alpha: 0,
            duration: 3,
            ease: "power1.out",
            onComplete: () => {
              bubblesContainer.removeChild(bubble);
            },
          });
        }, bubbleDelay);
      };

      let skullCount = 10;
      // 創建骷髏頭動畫
      const skullInterval = setInterval(() => {
        if (!isActive && skullCount <= 0) {
          clearInterval(skullInterval);
          return;
        }
        const floatingSkull = new Sprite(Texture.from("skull.png"));
        floatingSkull.scale.set(0.07);
        floatingSkull.tint = 0xff0000;
        floatingSkull.x = (40 - floatingSkull.width) / 2;
        floatingSkull.y = 250 - floatingSkull.height;
        positiveElectrode.addChild(floatingSkull);

        gsap.to(floatingSkull, {
          x: floatingSkull.x + (Math.random() < 0.5 ? -50 : 50),
          y: floatingSkull.y - 80 - Math.random() * 40,
          alpha: 0,
          duration: 2,
          ease: "power1.out",
          onComplete: () => {
            positiveElectrode.removeChild(floatingSkull);
            skullCount--;
          },
        });
      }, 3000);

      createBubbleInterval();

      // -----------------------------------------
      // 溶液顏色變淡動畫：從原本的氯化銅色（lightgreen 對應 0x00e0f0）
      // 逐漸過渡至白色
      // -----------------------------------------
      const beaker = this.findComponentByType("燒杯");
      if (beaker) {
        // 初始 RGB 值：0x00e0f0 → (0, 224, 240)
        const colorObj = { r: 0, g: 224, b: 240 };
        const endRGB = { r: 255, g: 255, b: 255 }; // 白色

        // 將 tween 存入實例變數，方便後續停止
        this.beakerColorTween = gsap.to(colorObj, {
          r: endRGB.r,
          g: endRGB.g,
          b: endRGB.b,
          duration: 20,
          ease: "linear",
          onUpdate: () => {
            const r = Math.round(colorObj.r);
            const g = Math.round(colorObj.g);
            const b = Math.round(colorObj.b);
            const newColor = (r << 16) + (g << 8) + b;
            beaker.tint = newColor;
          },
        });
      }
    });
  }
  // 停止氯化銅專屬動畫效果
  stopCopperChlorideAnimation() {
    // 尋找並移除電極區塊
    const electrodesAndEffects = this.itemCanvas.container.children.filter((child) =>
      child.children?.some((grandChild) => grandChild.text === "+" || grandChild.text === "-")
    );
    electrodesAndEffects.forEach((electrode) => {
      // 停止該電極相關的所有動畫
      gsap.killTweensOf(electrode.children);
      this.itemCanvas.container.removeChild(electrode);
    });

    // 清除燒杯相關的所有動畫和效果
    // 停止燒杯顏色動畫
    const beaker = this.findComponentByType("燒杯");
    if (beaker) {
      // 如果有儲存顏色 tween，先停止它
      if (this.beakerColorTween) {
        this.beakerColorTween.kill();
        this.beakerColorTween = null;
      }
      // 停止所有與燒杯相關的其他 GSAP 動畫（如果有的話）
      gsap.killTweensOf(beaker);

      // 重設所有濾鏡和顏色效果
      beaker.filters = [new ColorMatrixFilter()];
      beaker.filters[0].brightness(1);
      beaker.tint = 0xffffff;

      // 根據當前溶液重新設置正確的顏色
      const solution = this.solutionProperties[this.selectedSolution];
      if (solution) {
        setTimeout(() => {
          this.updateBeakerColor(solution.color);
        }, 50);
      }
    }
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

    // 從連接的廣用試紙中獲取試紙部分
    const testStrip = this.connectedPHPaper.testStrip;
    if (!testStrip) return;

    // 將顏色名稱轉換為十六進制
    const colorHex = this.colorToHex(color);

    // 如果試紙尚未初始化動畫屬性，進行初始化
    if (!testStrip.hasOwnProperty("targetColor")) {
      testStrip.targetColor = this.colorToHex("green"); // 預設綠色
      testStrip.currentColor = this.colorToHex("green");
      testStrip.colorProgress = 0;
      testStrip.colorTween = null;
    }

    // 如果已經是相同顏色且動畫已完成，則不執行
    if (testStrip.targetColor === colorHex && testStrip.colorProgress >= 1) return;

    // 設定目標顏色
    testStrip.targetColor = colorHex;

    // 如果已有動畫在執行，先停止
    if (testStrip.colorTween) {
      testStrip.colorTween.kill();
      testStrip.colorTween = null;
    }

    // 對於所有非綠色的顏色，開始由下而上的動畫
    testStrip.currentColor = colorHex;
    testStrip.colorProgress = 0; // 重置進度

    // 建立動畫
    testStrip.colorTween = gsap.to(testStrip, {
      colorProgress: 1,
      duration: 1.5,
      ease: "linear",
      onUpdate: () => {
        this.drawTestStrip(testStrip);
      },
    });
  }

  // 輔助方法：根據當前動畫進度繪製試紙
  drawTestStrip(testStrip) {
    testStrip.clear();

    // 如果是綠色或正在動畫中
    if (testStrip.targetColor === this.colorToHex("green")) {
      // 繪製綠色背景
      testStrip.rect(-40, 0, 80, 150).fill({ color: this.colorToHex("green") });
    } else if (testStrip.colorProgress < 1) {
      // 動畫過程中：從綠色背景開始
      testStrip.rect(-40, 0, 80, 150).fill({ color: this.colorToHex("green") });

      // 根據進度計算高度（由下往上）
      const animatedHeight = testStrip.colorProgress * 150;
      const yPosition = 150 - animatedHeight;

      // 從底部開始繪製有顏色的部分
      testStrip.rect(-40, yPosition, 80, animatedHeight).fill({ color: testStrip.currentColor });
    } else {
      // 動畫完成：完全填充目標顏色
      testStrip.rect(-40, 0, 80, 150).fill({ color: testStrip.currentColor });
    }
  }

  // 處理廣用試紙的連接/斷開
  handlePHPaperConnection() {
    const phPaper = this.findComponentByType("廣用試紙");
    const beaker = this.findComponentByType("燒杯");

    if (!phPaper || !beaker) return;

    // 檢查廣用試紙是否與燒杯重疊
    const paperBounds = phPaper.getBounds();
    const beakerBounds = {
      x: beaker.x - 50,
      y: beaker.y - 100,
      width: 250,
      height: 250,
    };

    const overlapping = !(
      paperBounds.x + paperBounds.width < beakerBounds.x ||
      paperBounds.x > beakerBounds.x + beakerBounds.width ||
      paperBounds.y + paperBounds.height < beakerBounds.y ||
      paperBounds.y > beakerBounds.y + beakerBounds.height
    );

    // 初始化最後溶液屬性（如果不存在）
    if (!phPaper.lastSolution) {
      phPaper.lastSolution = null;
    }

    // 根據重疊狀態更新
    if (overlapping && this.selectedSolution) {
      // 僅在以下情況更新顏色：
      // 1. 試紙之前未連接，或
      // 2. 溶液自上次檢查後有變化
      if (this.connectedPHPaper !== phPaper || phPaper.lastSolution !== this.selectedSolution) {
        this.connectedPHPaper = phPaper;
        phPaper.lastSolution = this.selectedSolution;
        this.updatePHPaperColor(this.solutionProperties[this.selectedSolution].phColor);
      }
    } else if (this.connectedPHPaper === phPaper) {
      // 如果不再重疊，重置為綠色
      this.resetPHPaperColor();
      this.connectedPHPaper = null;
      phPaper.lastSolution = null;
    }
  }

  // 更新廣用試紙顏色的方法（帶一次性動畫）
  updatePHPaperColor(color) {
    if (!this.connectedPHPaper) return;

    // 從連接的廣用試紙中獲取試紙部分
    const testStrip = this.connectedPHPaper.testStrip;
    if (!testStrip) return;

    // 將顏色名稱轉換為十六進制
    const colorHex = this.colorToHex(color);

    // 如果試紙尚未初始化動畫屬性，進行初始化
    if (!testStrip.hasOwnProperty("targetColor")) {
      testStrip.targetColor = this.colorToHex("green"); // 預設綠色
      testStrip.currentColor = this.colorToHex("green");
      testStrip.colorProgress = 0;
      testStrip.colorTween = null;
    }

    // 如果已經在向此顏色動畫，則不重新開始
    if (testStrip.targetColor === colorHex && testStrip.colorTween) return;

    // 如果已經是相同顏色且動畫已完成，則不執行
    if (testStrip.targetColor === colorHex && testStrip.colorProgress >= 1) return;

    // 設定目標顏色
    testStrip.targetColor = colorHex;

    // 如果已有動畫在執行，先停止
    if (testStrip.colorTween) {
      testStrip.colorTween.kill();
      testStrip.colorTween = null;
    }

    // 對於所有非綠色的顏色，開始由下而上的動畫
    testStrip.currentColor = colorHex;
    testStrip.colorProgress = 0; // 重置進度

    // 建立動畫
    testStrip.colorTween = gsap.to(testStrip, {
      colorProgress: 1,
      duration: 1.5,
      ease: "linear",
      onUpdate: () => {
        this.drawTestStrip(testStrip);
      },
      onComplete: () => {
        // 確保在完成時完全繪製
        this.drawTestStrip(testStrip);
        testStrip.colorTween = null;
      },
    });
  }

  // 輔助方法：根據當前動畫進度繪製試紙
  drawTestStrip(testStrip) {
    testStrip.clear();

    // 如果是綠色或正在變為綠色的過程中
    if (testStrip.targetColor === this.colorToHex("green")) {
      // 繪製綠色背景
      testStrip.rect(-40, 0, 80, 150).fill({ color: this.colorToHex("green") });
    } else if (testStrip.colorProgress < 1) {
      // 動畫過程中：從綠色背景開始
      testStrip.rect(-40, 0, 80, 150).fill({ color: this.colorToHex("green") });

      // 根據進度計算高度（由下往上）
      const animatedHeight = testStrip.colorProgress * 150;
      const yPosition = 150 - animatedHeight;

      // 從底部開始繪製有顏色的部分
      testStrip.rect(-40, yPosition, 80, animatedHeight).fill({ color: testStrip.currentColor });
    } else {
      // 動畫完成：完全填充目標顏色
      testStrip.rect(-40, 0, 80, 150).fill({ color: testStrip.currentColor });
    }
  }

  // 重置廣用試紙顏色為綠色（當從溶液中移除時）
  resetPHPaperColor() {
    if (!this.connectedPHPaper || !this.connectedPHPaper.testStrip) return;

    const testStrip = this.connectedPHPaper.testStrip;

    // 停止任何正在執行的動畫
    if (testStrip.colorTween) {
      testStrip.colorTween.kill();
      testStrip.colorTween = null;
    }

    // 重置為綠色
    testStrip.targetColor = this.colorToHex("green");
    testStrip.currentColor = this.colorToHex("green");
    testStrip.colorProgress = 0;

    // 立即重繪
    this.drawTestStrip(testStrip);
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
      transparent: 0xffffff,
      blue2: 0x4169e1,
      lightgreen: 0x00e0f0,
    };
    return colorMap[colorName];
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

    // 創建一個類屬性來存儲當前的 timeline
    this.lightTimeline = null;

    // 在切換亮度時
    switch (brightness) {
      case "bright":
        // 清除之前的 timeline
        if (this.lightTimeline) {
          this.lightTimeline.kill();
        }

        this.bulbLight.tint = 0xffff00;
        this.bulbLight.scale.set(1.5);

        // 創建新的 timeline
        this.lightTimeline = gsap
          .timeline()
          .to(this.bulbLight, {
            duration: 2,
            alpha: 0.8,
            ease: "power2.out",
          })
          .to(this.bulbLight, {
            duration: 0.5,
            alpha: 0.75,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          });
        break;

      case "dim":
        // 同樣的模式
        if (this.lightTimeline) {
          this.lightTimeline.kill();
        }

        this.bulbLight.tint = 0xffdd00;
        this.bulbLight.scale.set(1.2);

        this.lightTimeline = gsap
          .timeline()
          .to(this.bulbLight, {
            duration: 2,
            alpha: 0.6,
            ease: "power2.out",
          })
          .to(this.bulbLight, {
            duration: 0.5,
            alpha: 0.55,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          });
        break;

      case "none":
      default:
        if (this.lightTimeline) {
          this.lightTimeline.kill();
        }
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
    const beaker = this.findComponentByType("燒杯");
    if (!beaker) return;
    beaker.filters = [new ColorMatrixFilter()];
    beaker.filters[0].brightness(1); // 重置亮度
    beaker.tint = this.colorToHex(color);
    if (color === "white") {
      beaker.filters[0].brightness(2); // 稍微提高亮度使其更白
    }
  }

  // 尋找特定類型的組件
  findComponentByType(type) {
    if (!this.itemCanvas?.components?.children) {
      console.log("畫布或組件未初始化");
      return null;
    }

    return this.itemCanvas.components.children.find((component) => {
      // 檢查特定類型和電線類型
      return (type === "電線" && component.type === "Wire") || component.type === type;
    });
  }

  // 設置選擇的溶液
  setSolution(solutionName) {
    if (this.solutionProperties[solutionName]) {
      this.selectedSolution = solutionName;
      this.resetBulbLight();

      // 停止所有動畫
      this.stopRandomMovement();
      this.stopCopperChlorideAnimation();
      this.stopElectrodesMovement();
      this.setElectron.reset();
      this.ionMoving = false;

      showStatusText("溶液已選擇：" + solutionName, this.itemCanvas);

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
  // 更新電子動畫狀態
  updateElectronAnimation() {
    // 只有當實驗進行中且使用者選擇要看時才顯示動畫
    if (this.isElectrolysisActive && this.isElectronCheckboxChecked) {
      this.setElectron.startElectronAnimation();
    } else {
      this.setElectron.stopElectronAnimation();
    }
  }

  // 處理電子流向顯示的切換
  toggleElectronVisibility(isChecked) {
    this.isElectronCheckboxChecked = isChecked;
    this.updateElectronAnimation();
  }

  toggleTextVisibility(isChecked) {
    this.isTextCheckboxChecked = isChecked;

    // 先將所有現有的標籤設為可見或不可見
    const allComponents = this.itemCanvas.container.children;
    allComponents.forEach((component) => {
      if (component.children) {
        component.children.forEach((child) => {
          if (child.text === "+" || child.text === "-") {
            child.visible = isChecked;
          }
        });
      }
    });

    // 存儲創建的電極標籤引用
    if (!this.electrodeLabels) {
      this.electrodeLabels = { positive: null, negative: null };
    }

    // 檢查是否已經創建了電極標籤
    if (!this.electrodeLabels.negative) {
      const negLabel = new Text({ text: "-", style: scoreStyle });
      negLabel.x = this.moduleSetup.centerX - 85;
      negLabel.y = this.moduleSetup.centerY + 150;
      this.itemCanvas.container.addChild(negLabel);
      this.electrodeLabels.negative = negLabel;
    }

    if (!this.electrodeLabels.positive) {
      const posLabel = new Text({ text: "+", style: scoreStyle });
      posLabel.x = this.moduleSetup.centerX + 105;
      posLabel.y = this.moduleSetup.centerY + 150;
      this.itemCanvas.container.addChild(posLabel);
      this.electrodeLabels.positive = posLabel;
    }

    // 根據 checkbox 狀態設置可見性
    this.electrodeLabels.negative.visible = isChecked;
    this.electrodeLabels.positive.visible = isChecked;
  }

  // 重置
  reset() {
    this.stopRandomMovement();
    this.stopElectrodesMovement();
    this.stopCopperChlorideAnimation();
    this.setElectron.reset();
    this.ionAnimationActive = false;
    this.connectedPHPaper = null;
    this.resetBulbLight();
    this.ionVisible = false;
    this.ionMoving = false;
    this.moduleSetup.isSetDown = false;
    this.isElectrolysisActive = false;
  }

  // 更新
  update(deltaTime) {}
}

export class SetElectron {
  constructor(itemCanvas) {
    this.itemCanvas = itemCanvas;
    this.electrons = [];
    this.electronAnimations = [];
    this.electronsContainer = new Container();
    this.electronsContainer.zIndex = 2000; // 設置高的 zIndex
    this.itemCanvas.container.addChild(this.electronsContainer);
    this.electronsContainer.scale = this.itemCanvas.container.scale;

    // 電子配置
    this.electronConfigs = {
      電池: [
        { x: -90, y: 0 },
        { x: 0, y: 0 },
        { x: 90, y: 0 },
      ],
      燈泡: [
        { x: -5, y: 90 },
        { x: 5, y: 90 },
      ],
      碳棒: [
        { x: 0, y: -50 },
        { x: 0, y: 0 },
        { x: 0, y: 50 },
      ],
      燒杯: [
        { x: -50, y: 30 },
        { x: 30, y: 30 },
        { x: 110, y: 30 },
      ],
    };
  }

  // 創建單個電子/離子
  createElectron() {
    const electron = new Graphics().circle(0, 0, 5).fill(0xffff00);

    electron.alpha = 0.8;
    electron.visible = false;
    return electron;
  }

  // 為組件創建電子
  createElectronsForComponent(component) {
    // 對於電線，使用其連接點
    if (component.type === "Wire") {
      if (!component.joints || component.joints.length !== 2) return;

      // 取得電線兩端的全局位置
      const start = component.toGlobal(component.joints[0]);
      const end = component.toGlobal(component.joints[1]);

      // 在電線上創建6個均勻分布的點
      for (let i = 0; i < 6; i++) {
        const electron = this.createElectron();
        const progress = i / 5; // 0 到 1 之間的值

        // 計算電子在電線上的位置
        const globalX = start.x + (end.x - start.x) * progress;
        const globalY = start.y + (end.y - start.y) * progress;

        // 轉換為 electronsContainer 的本地座標
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

    // 對於其他組件，使用預設的配置點
    const config = this.electronConfigs[component.type];
    if (!config) return;

    config.forEach((pos) => {
      const electron = this.createElectron();
      // 將組件本地座標轉換為全局座標
      const globalPos = component.toGlobal(pos);
      // 再轉換為 electronsContainer 的本地座標
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

  // 開始電子動畫
  startElectronAnimation() {
    this.stopElectronAnimation();

    // 收集所有點並計算中心點
    const points = this.electrons.map((e) => e.globalPos);
    if (points.length < 2) return;

    // 計算中心點
    const center = points.reduce(
      (acc, point) => {
        acc.x += point.x;
        acc.y += point.y;
        return acc;
      },
      { x: 0, y: 0 }
    );

    center.x /= points.length;
    center.y /= points.length;

    // 按角度排序點
    points.sort((a, b) => {
      const angleA = Math.atan2(a.y - center.y, a.x - center.x);
      const angleB = Math.atan2(b.y - center.y, b.x - center.x);
      return angleA - angleB;
    });

    // 為每個電子創建動畫
    this.electrons.forEach((electronData, index) => {
      const electron = electronData.sprite;
      electron.visible = true;

      // 設置初始偏移量，確保電子均勻分布
      const initialOffset = index / this.electrons.length;
      electronData.progress = initialOffset;

      const tween = gsap.to(electronData, {
        duration: 15,
        progress: 1 + initialOffset, // 動畫到完整的一圈加上初始偏移
        repeat: -1,
        ease: "none",
        onUpdate: () => {
          // 計算當前進度（保持在 0-1 之間）
          const currentProgress = electronData.progress % 1;

          // 計算當前點和下一個點的索引
          const index = Math.floor(currentProgress * points.length);
          const nextIndex = (index + 1) % points.length;
          const currentPoint = points[index];
          const nextPoint = points[nextIndex];

          // 在點之間進行插值
          const t = (currentProgress * points.length) % 1;
          const globalX = currentPoint.x + (nextPoint.x - currentPoint.x) * t;
          const globalY = currentPoint.y + (nextPoint.y - currentPoint.y) * t;

          // 轉換為本地座標並更新電子位置
          const localPos = this.electronsContainer.toLocal({ x: globalX, y: globalY });
          electron.x = localPos.x;
          electron.y = localPos.y;
        },
      });

      this.electronAnimations.push(tween);
    });
  }

  // 停止電子動畫
  stopElectronAnimation() {
    this.electronAnimations.forEach((anim) => anim?.kill());
    this.electronAnimations = [];
    this.electrons.forEach((e) => (e.sprite.visible = false));
  }

  // 重置模組
  reset() {
    this.stopElectronAnimation();
    this.electrons.forEach((electron) => {
      if (electron.sprite.parent) {
        electron.sprite.parent.removeChild(electron.sprite);
      }
    });
    this.electrons = [];
  }
}

export class ModuleSetup {
  constructor(itemCanvas) {
    this.itemCanvas = itemCanvas;
    this.centerX = 850;
    this.centerY = 520;
  }

  setupElectrolysisModule() {
    // 重置畫布
    this.itemCanvas.reset();
    this.isSetDown = true;

    // 創建所有組件並儲存引用
    const components = this.createAllComponents();

    // 設置所有組件的位置
    this.positionAllComponents(components);

    // 調整所有電線的位置和形狀
    this.adjustWirePositions(components);

    // 使所有組件不可移動
    this.makeComponentsImmovable(components);

    Object.values(components).forEach((component) => {
      if (component && this.itemCanvas.electronModule) {
        this.itemCanvas.electronModule.createElectronsForComponent(component);
      }
    });

    return components;
  }

  makeComponentsImmovable(components) {
    Object.values(components).forEach((component) => {
      if (!component) return;

      // 禁用所有事件交互
      component.eventMode = "none";
      component.cursor = "default";

      // 保留連接點的視覺效果，但禁用它們的交互
      if (component.joints) {
        component.joints.forEach((joint) => {
          joint.visible = true; // 保持可見
          joint.eventMode = "none"; // 禁用事件
        });
      }
    });
  }

  createComponent(imagePath, position) {
    const component = this.itemCanvas.createSceneItem(imagePath, position);
    // 設置組件為不可移動，但保留視覺效果
    component.eventMode = "none";
    component.cursor = "default";

    // 確保連接點可見
    if (component.joints) {
      component.joints.forEach((joint) => {
        joint.visible = true;
      });
    }

    return component;
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

  adjustWirePositions(components) {
    const { wire1, wire2, wire3, wire4 } = components;

    // 調整電線端點以創建圖片中所示的電路佈局
    // 定位電線以創建所示的角度連接
    if (wire1?.joints && wire2?.joints && wire3?.joints && wire4?.joints) {
      // 從電池到左碳棒的電線
      wire1.joints[0].position.set(-260, 110); // 碳棒端
      wire1.joints[1].position.set(-275, -100); // 電池端

      // 從左碳棒到燈泡的電線
      wire2.joints[0].position.set(-105, -100); // 碳棒端
      wire2.joints[1].position.set(150, -25); // 燈泡端

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
    showStatusText("藥品已選擇：" + solutionName, this.itemCanvas);
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
      blue: 0x4169e1,
      white: 0xffffff,
      transparent: 0xffffff,
    };

    this.cachedBeaker.tint = colorMap[color] || 0xffffff;
  }

  createPowderParticles(bottle) {
    if (!this.currentSolution) {
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
      showStatusText("請選擇藥品", this.itemCanvas);
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
        ion.visible = this.ionsVisible; // 添加這行

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

  // 把粒子加入燒杯內
  isParticleInBeaker(particle, beakerBounds) {
    const collision =
      particle.x >= beakerBounds.x &&
      particle.x <= beakerBounds.x + beakerBounds.width &&
      particle.y >= beakerBounds.y &&
      particle.y <= beakerBounds.y + beakerBounds.height;

    return collision;
  }

  update() {
    if (!this.cachedBeaker) {
      this.updateBeakerReference();
    }

    const currentBeakerBounds = this.getBeakerBounds();
    // 檢查燒杯是否移動
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
              this.cachedBeaker.tint = 0x4169e1;
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

// 顯示狀態文字
export function showStatusText(message, itemCanvas) {
  // 創建新文字
  const statusText = new Text({ text: message, style: defaultStyle });

  // 將文字定位在螢幕中央
  statusText.anchor.set(0.5);
  statusText.x = 1000; // 1920 的一半
  statusText.y = 70; // 1080 的一半

  // 加入容器中
  itemCanvas.container.addChild(statusText);

  // 一秒後移除
  setTimeout(() => {
    if (statusText) {
      itemCanvas.container.removeChild(statusText);
    }
  }, 1000);
}
