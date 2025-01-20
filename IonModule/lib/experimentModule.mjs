import { Sprite, Texture, Text, Graphics, Container } from "./pixi.mjs";
import { defaultStyle } from "./textStyle.mjs";
import { gsap } from "../gsap-public/src/index.js";

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
      height: 220,
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

          const relativeTargetY = 0.8 + Math.random() * 0.1; // 靠近底部

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
