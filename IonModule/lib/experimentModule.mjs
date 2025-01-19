import { Sprite, Texture, Text, Graphics } from "./pixi.mjs";
import { defaultStyle } from "./textStyle.mjs";
import { gsap } from "../gsap-public/src/index.js";

export class IonModule {
  constructor(itemCanvas) {
    this.itemCanvas = itemCanvas;
    this.animatingBottles = new Set();
    this.particles = new Set();
    this.cachedBeaker = null; // 只快取燒杯引用

    // 初始化時尋找燒杯
    this.updateBeakerReference();

    console.log("IonModule initialized"); // 用於調試

    // 溶液特性配置
    this.solutionProperties = {
      硫酸銅: {
        color: "blue",
      },
      硫酸鋅: {
        color: "transparent",
      },
      硫酸鎂: {
        color: "transparent",
      },
      硫酸鈣: {
        color: "white",
      },
      硫酸鈉: {
        color: "transparent",
      },
      硫酸鉀: {
        color: "transparent",
      },
    };
  }

  // 設置選擇的溶液
  setSolution(solutionName) {
    if (this.solutionProperties[solutionName]) {
      this.selectedSolution = solutionName;
      //this.stopRandomMovement();
      this.ionMoving = false;

      this.showStatusText("藥品已選擇：" + solutionName);

      this.updateBeakerColor(this.solutionProperties[solutionName].color);

      // 根據 checkbox 狀態決定是否顯示離子
      if (this.isIonCheckboxChecked) {
        this.toggleIonAnimation(true);
      }
    }
  }

  updateBeakerColor(color) {
    const beaker = this.findComponentByType("燒杯.png");
    if (!beaker) return;

    // 設置燒杯中溶液顏色
    beaker.tint = color === "transparent" ? 0xffffff : this.colorToHex(color);
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

  // 尋找特定類型的組件
  findComponentByType(type) {
    if (!this.itemCanvas?.components?.children) {
      console.log("畫布或組件未初始化");
      return null;
    }
    // 從搜尋類型中移除 .png 副檔名
    const searchType = type.replace(".png", "");

    const component = this.itemCanvas.components.children.find((component) => {
      return component.type === searchType;
    });
    console.log(`尋找組件：${searchType}`);

    return component;
  }

  handleBottleAnimation(sceneContainer) {
    if (!sceneContainer) {
      return;
    }
    if (this.animatingBottles.has(sceneContainer)) {
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
        y: sceneContainer.y + 50, // 往下移動 50 單位
        x: sceneContainer.x + 10, // 往右移動 50 單位
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => this.createPowderParticles(sceneContainer),
      })
      .to(sceneContainer, {
        rotation: -Math.PI / 15,
        y: sceneContainer.y, // 回到原始位置
        x: sceneContainer.x, // 回到原始位置
        duration: 0.5,
        ease: "power2.inOut",
      });
  }

  createPowderParticles(bottle) {
    const particleCount = 30;
    // 考慮旋轉角度計算瓶口位置
    const particleGroup = {
      particles: [],
      // 直接使用藥品罐的位置
      centerX: bottle.x + 120,
      centerY: bottle.y + 50, // 稍微往上偏移到瓶口位置
      vx: 0,
      vy: 0,
      scattered: false,
    };

    for (let i = 0; i < particleCount; i++) {
      const particle = new Graphics().circle(0, 0, 3).fill(0xffffff);

      // 直接在瓶口位置產生粒子
      particle.x = particleGroup.centerX + Math.random() * 6 - 3;
      particle.y = particleGroup.centerY + Math.random() * 6 - 3;

      particleGroup.particles.push(particle);
      this.itemCanvas.container.addChild(particle);
    }

    this.particles.add(particleGroup);
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

  //更新燒杯參考
  updateBeakerReference() {
    if (!this.itemCanvas?.components?.children) {
      this.cachedBeaker = null;
      return;
    }

    this.cachedBeaker = this.itemCanvas.components.children.find((component) => component.type === "燒杯");
  }

  // 新增：獲取當前燒杯邊界的方法
  getBeakerBounds() {
    if (!this.cachedBeaker) {
      return null;
    }

    return {
      x: this.cachedBeaker.x - 105,
      y: this.cachedBeaker.y - 70,
      width: 265,
      height: 220,
    };
  }

  reset() {
    this.animatingBottles.clear();
    gsap.killTweensOf([...this.animatingBottles]);

    for (const group of this.particles) {
      group.particles.forEach((particle) => {
        this.itemCanvas.container.removeChild(particle);
      });
    }
    this.particles.clear();

    // 重置燒杯參考
    this.cachedBeaker = null;
  }

  update() {
    // 如果沒有快取的燒杯，嘗試更新參考
    if (!this.cachedBeaker) {
      this.updateBeakerReference();
    }

    // 獲取最新的燒杯邊界
    const currentBeakerBounds = this.getBeakerBounds();

    for (const group of this.particles) {
      if (!group.scattered) {
        // 結塊下落邏輯
        group.vy += 0.2;
        group.centerY += group.vy;
        group.centerX += group.vx;

        // 更新粒子位置
        group.particles.forEach((particle, i) => {
          particle.x = group.centerX + Math.cos((i * Math.PI * 2) / group.particles.length) * 5;
          particle.y = group.centerY + Math.sin((i * Math.PI * 2) / group.particles.length) * 5;
        });

        // 檢查是否碰到燒杯或超出螢幕
        if (currentBeakerBounds && this.isParticleInBeaker({ x: group.centerX, y: group.centerY }, currentBeakerBounds)) {
          // 進入燒杯後散開
          group.scattered = true;
          group.particles.forEach((particle) => {
            particle.vx = (Math.random() - 0.5) * 4;
            particle.vy = (Math.random() - 0.5) * 4;
            particle.x = group.centerX;
            particle.y = group.centerY;
          });
        } else if (group.centerY > 1080 || group.centerX < 0 || group.centerX > 1920) {
          // 如果超出螢幕範圍，移除粒子
          group.particles.forEach((particle) => {
            this.itemCanvas.container.removeChild(particle);
          });
          this.particles.delete(group);
        }
      } else if (currentBeakerBounds) {
        // 散開後的限制運動
        group.particles.forEach((particle) => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.1;

          // 使用最新的燒杯邊界進行碰撞檢測
          if (particle.x <= currentBeakerBounds.x || particle.x >= currentBeakerBounds.x + currentBeakerBounds.width) {
            particle.vx *= -0.8;
          }
          if (particle.y <= currentBeakerBounds.y || particle.y >= currentBeakerBounds.y + currentBeakerBounds.height) {
            particle.vy *= -0.8;
          }

          // 確保粒子在最新的燒杯範圍內
          particle.x = Math.max(currentBeakerBounds.x, Math.min(particle.x, currentBeakerBounds.x + currentBeakerBounds.width));
          particle.y = Math.max(currentBeakerBounds.y, Math.min(particle.y, currentBeakerBounds.y + currentBeakerBounds.height));
        });
      }
    }
  }

  isParticleInBeaker(particle, beakerBounds) {
    const collision =
      particle.x >= beakerBounds.x &&
      particle.x <= beakerBounds.x + beakerBounds.width &&
      particle.y >= beakerBounds.y &&
      particle.y <= beakerBounds.y + beakerBounds.height;

    if (collision) {
      console.log("Collision detected with beaker");
    }
    return collision;
  }
}
