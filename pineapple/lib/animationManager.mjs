import { Text, Container, Graphics } from "./pixi.mjs";
import { gsap } from "../node_modules/gsap/index.js";
import { gdStyle, infoStyle, infoStyle2, titleStyle, defaultStyle } from "./textStyle.mjs";

export class AnimationManager {
  constructor(game) {
    this.game = game;
  }

  async showReadyGoAnimation() {
    const readyText = new Text({
      text: "READY",
      style: gdStyle,
    });

    const goText = new Text({
      text: "GO!",
      style: gdStyle,
    });

    // 置中文字
    readyText.anchor.set(0.5);
    goText.anchor.set(0.5);
    readyText.position.set(960, 540);
    goText.position.set(960, 540);

    // 初始設定
    readyText.alpha = 0;
    readyText.position.y = 800; // 設定初始位置在畫面下方
    goText.alpha = 0;
    goText.scale.set(2); // 初始較大的尺寸

    this.game.sceneContainer.addChild(readyText, goText);

    // 建立動畫時間軸
    const timeline = gsap.timeline({
      onComplete: () => {
        this.game.sceneContainer.removeChild(readyText, goText);
      },
    });

    // READY 動畫
    timeline
      // READY 從下方飛入
      .to(readyText, {
        alpha: 1,
        y: 540, // 移動到畫面中央
        duration: 0.3,
        ease: "power2.out",
      })
      // READY 震動效果
      .to(readyText.scale, {
        x: 1.1,
        y: 1.1,
        duration: 0.1,
        repeat: 3,
        yoyo: true,
        ease: "power1.inOut",
      })
      // READY 停留
      .to(readyText, {
        alpha: 1,
        duration: 0.1,
      })
      // READY 淡出
      .to(readyText, {
        alpha: 0,
        duration: 0.1,
        ease: "power2.in",
      })
      // GO 由大變小進入
      .to(
        goText,
        {
          alpha: 1,
          scale: 1,
          duration: 0.3,
          ease: "back.out(1.7)",
        },
        "-=0.1"
      )
      // GO 震動效果
      .to(goText.scale, {
        x: 1.1,
        y: 1.1,
        duration: 0.1,
        repeat: 2,
        yoyo: true,
        ease: "power1.inOut",
      })
      // GO 淡出
      .to(
        goText,
        {
          alpha: 0,
          scale: 0.5,
          duration: 0.1,
          ease: "power2.in",
        },
        "+=0.2"
      );
  }

  // Combo文字動畫
  animateCombo(comboCount) {
    if (comboCount <= 1) {
      this.game.comboText.text = "";
      return;
    }

    const comboColors = [0xffd700, 0x3cb371, 0x8a2be2, 0x1e90ff, 0xdc143c];
    const colorIndex = Math.min(comboCount - 2, comboColors.length - 1);

    this.game.comboText.text = `combo ${comboCount - 1}`;
    this.game.comboText.style.fill = comboColors[colorIndex];

    // 重設比例以確保動畫從頭開始
    this.game.comboText.scale.set(1);
    this.game.comboText.alpha = 1;

    // 創建彈跳動畫
    const timeline = gsap.timeline();

    // 基本彈跳效果
    timeline
      .to(this.game.comboText.scale, {
        x: 1.5,
        y: 1.5,
        duration: 0.15,
        ease: "power2.out",
      })
      .to(this.game.comboText.scale, {
        x: 1,
        y: 1,
        duration: 0.4,
        ease: "elastic.out(1.2, 0.5)",
      });

    // 高combo特效
    if (comboCount > 5) {
      // 添加發光效果
      this.game.comboText.style.dropShadow = true;
      this.game.comboText.style.dropShadowColor = comboColors[colorIndex];
      this.game.comboText.style.dropShadowBlur = 6;
      this.game.comboText.style.dropShadowDistance = 0;

      // 添加旋轉震動
      timeline.to(
        this.game.comboText,
        {
          rotation: 0.1,
          duration: 0.1,
          repeat: 3,
          yoyo: true,
          ease: "none",
          onComplete: () => {
            this.game.comboText.rotation = 0;
          },
        },
        "-=0.3"
      );
    } else {
      // 移除發光效果
      this.game.comboText.style.dropShadow = false;
    }
  }

  async showGameOverAnimation() {
    // 創建背景面板
    const panel = new Graphics();
    panel.roundRect(0, 0, 800, 600, 30);
    panel.fill({ color: 0xffffff, alpha: 0.95 });
    panel.stroke({ width: 8, color: 0x6a8783 });
    panel.x = 560;
    panel.y = 240;

    // 裝飾性的頂部條紋
    const topStripe = new Graphics();
    topStripe.roundRect(0, 0, 800, 80, { tl: 30, tr: 30, bl: 0, br: 0 });
    topStripe.fill(0x6a8783);
    topStripe.x = 560;
    topStripe.y = 240;

    // 遊戲結束文字
    const endText = new Text({
      text: "遊戲結束",
      style: {
        ...titleStyle,
        fill: 0xffffff,
      },
    });
    endText.anchor.set(0.5);
    endText.x = 960;
    endText.y = 280;

    // 分數展示背景
    const scoreBG = new Graphics();
    scoreBG.roundRect(0, 0, 400, 120, 20);
    scoreBG.fill(0xf0f0f0);
    scoreBG.stroke({ width: 4, color: 0x6a8783 });
    scoreBG.x = 760;
    scoreBG.y = 450;

    // 分數標題文字
    const scoreTitle = new Text({
      text: `最終分數`,
      style: {
        ...infoStyle,
        fontSize: 36,
        fill: 0x6a8783,
      },
    });
    scoreTitle.anchor.set(0.5);
    scoreTitle.x = 960;
    scoreTitle.y = 480;

    // 實際分數
    const scoreNumber = new Text({
      text: `${this.game.score}`,
      style: {
        ...infoStyle,
        fontSize: 48,
        fill: 0x6a8783,
        fontWeight: "bold",
      },
    });
    scoreNumber.anchor.set(0.5);
    scoreNumber.x = 960;
    scoreNumber.y = 530;

    // 確定按鈕容器
    const confirmCon = new Container();
    confirmCon.x = 960;
    confirmCon.y = 680;

    // 確定按鈕
    const confirmButton = new Graphics();
    confirmButton.roundRect(-170, -50, 340, 100, 50);
    confirmButton.fill(0x6a8783);
    confirmButton.stroke({ width: 6, color: 0x557571 });

    // 按鈕文字
    const confirmText = new Text({
      text: "查看排行榜",
      style: {
        ...infoStyle2,
        fill: 0xffffff,
      },
    });
    confirmText.anchor.set(0.5);
    // 組合元素
    confirmCon.addChild(glow, confirmButton, confirmText);

    // 設置互動事件
    confirmButton.eventMode = "static";
    confirmButton.cursor = "pointer";
    confirmButton.on("pointerdown", () => {
      playSound(gameSound.button);
      this.game.leaderboard();
    });

    // 互動動畫
    confirmButton.on("pointerover", () => {
      playSound(gameSound.select);
      gsap.to(confirmButton, {
        pixi: {
          tint: 0x7ab5b0,
          scaleX: 1.05,
          scaleY: 1.05,
        },
        duration: 0.2,
      });
      gsap.to(confirmText, {
        pixi: { scaleX: 1.05, scaleY: 1.05 },
        duration: 0.2,
      });
      gsap.to(glow, {
        alpha: 0.3,
        duration: 0.2,
      });
    });

    confirmButton.on("pointerout", () => {
      gsap.to(confirmButton, {
        pixi: {
          tint: 0xffffff,
          scaleX: 1,
          scaleY: 1,
        },
        duration: 0.2,
      });
      gsap.to(confirmText, {
        pixi: { scaleX: 1, scaleY: 1 },
        duration: 0.2,
      });
      gsap.to(glow, {
        alpha: 0,
        duration: 0.2,
      });
    });

    // 將所有元素添加到場景
    this.game.sceneContainer.addChild(panel, topStripe, endText, scoreBG, scoreTitle, scoreNumber, confirmCon);

    // 設置初始透明度為0
    const elements = [panel, topStripe, endText, scoreBG, scoreTitle, scoreNumber, confirmCon];
    elements.forEach((el) => (el.alpha = 0));

    // 創建依序淡入的動畫序列
    const timeline = gsap.timeline();

    // 背景面板淡入
    timeline.to([panel, topStripe], {
      alpha: 1,
      duration: 0.3,
      ease: "power2.out",
    });

    // 標題淡入
    timeline.to(
      endText,
      {
        alpha: 1,
        duration: 0.3,
        ease: "power2.out",
      },
      "-=0.1"
    );

    // 分數背景和標題淡入
    timeline.to(
      [scoreBG, scoreTitle],
      {
        alpha: 1,
        duration: 0.3,
        ease: "power2.out",
      },
      "-=0.1"
    );

    // 分數彈出動畫
    timeline.to(scoreNumber, {
      pixi: {
        scale: 1,
        alpha: 1,
      },
      duration: 0.5,
      ease: "back.out(1.7)",
    });

    // 按鈕彈入動畫
    timeline.from(confirmCon, {
      pixi: {
        y: "+=50",
        alpha: 0,
      },
      duration: 0.5,
      ease: "back.out(1.7)",
    });

    return timeline;
  }

  async animateLeaderboard(container, leaderboard, userName) {
    let touchStartY = 0;
    let scrollY = 0;
    let currentY = 0;
    let velocity = 0;
    let isScrolling = false;

    const leaderboardContainer = new Container();
    container.addChild(leaderboardContainer);

    // 添加觸摸事件
    leaderboardContainer.eventMode = "static";

    leaderboardContainer.on("touchstart", (e) => {
      isScrolling = true;
      touchStartY = e.data.global.y;
      currentY = scrollY;
      velocity = 0;
    });

    leaderboardContainer.on("touchmove", (e) => {
      if (!isScrolling) return;

      const touchCurrentY = e.data.global.y;
      const delta = touchCurrentY - touchStartY;

      scrollY = currentY + delta;

      // 邊界檢查
      const minY = -(leaderboardContainer.height - container.height);
      scrollY = Math.min(0, Math.max(minY, scrollY));

      leaderboardContainer.y = scrollY;
    });

    leaderboardContainer.on("touchend", () => {
      isScrolling = false;

      // 添加慣性滾動
      const scroll = () => {
        if (Math.abs(velocity) > 0.5) {
          scrollY += velocity;
          velocity *= 0.95; // 摩擦力

          // 邊界檢查
          const minY = -(leaderboardContainer.height - container.height);
          scrollY = Math.min(0, Math.max(minY, scrollY));

          leaderboardContainer.y = scrollY;
          requestAnimationFrame(scroll);
        }
      };

      requestAnimationFrame(scroll);
    });

    const VIEWPORT_WIDTH = 1000;
    const VIEWPORT_HEIGHT = 600;
    const ENTRY_HEIGHT = 100;
    const START_X = 460;
    const START_Y = 250;

    //建立背景
    const bgRect = new Graphics();
    bgRect.roundRect(START_X, START_Y, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 20);
    bgRect.fill(0xffffff);
    bgRect.stroke({ width: 5, color: 0x6a8783 });
    container.addChild(bgRect);

    const mask = new Graphics();
    mask.roundRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 20);
    mask.fill(0xffffff);
    mask.x = START_X;
    mask.y = START_Y;
    container.addChild(mask);

    //建立滾動容器
    const scrollContainer = new Container();
    scrollContainer.x = START_X;
    scrollContainer.y = START_Y;
    scrollContainer.mask = mask;
    container.addChild(scrollContainer);

    const contentHeight = leaderboard.data.length * ENTRY_HEIGHT;
    const maxScroll = Math.max(0, contentHeight - VIEWPORT_HEIGHT);

    const scrollbarBG = new Graphics();
    scrollbarBG.roundRect(START_X + VIEWPORT_WIDTH + 10, START_Y, 20, VIEWPORT_HEIGHT, 10);
    scrollbarBG.fill(0xcccccc);

    const handleHeight = Math.max(50, (VIEWPORT_HEIGHT / contentHeight) * VIEWPORT_HEIGHT);
    const scrollbarHandle = new Graphics();
    scrollbarHandle.roundRect(0, 0, 20, handleHeight, 10);
    scrollbarHandle.fill(0x6a8783);
    scrollbarHandle.x = START_X + VIEWPORT_WIDTH + 10;
    scrollbarHandle.y = START_Y;

    container.addChild(scrollbarBG, scrollbarHandle);

    //滾動條事件
    const topIndicator = new Graphics();
    topIndicator.fill({ color: 0x6a8783, alpha: 0.5 });
    topIndicator.moveTo(-20, 0);
    topIndicator.lineTo(20, 0);
    topIndicator.lineTo(0, -20);
    topIndicator.closePath();
    topIndicator.x = START_X + VIEWPORT_WIDTH / 2;
    topIndicator.y = START_Y - 10;
    topIndicator.visible = false;

    const bottomIndicator = new Graphics();
    bottomIndicator.fill({ color: 0x6a8783, alpha: 0.5 });
    bottomIndicator.moveTo(-20, 0);
    bottomIndicator.lineTo(20, 0);
    bottomIndicator.lineTo(0, 20);
    bottomIndicator.closePath();
    bottomIndicator.x = START_X + VIEWPORT_WIDTH / 2;
    bottomIndicator.y = START_Y + VIEWPORT_HEIGHT + 10;
    bottomIndicator.visible = false;

    container.addChild(topIndicator, bottomIndicator);

    //建立標題
    const headerBG = new Graphics();
    headerBG.roundRect(START_X, START_Y - 85, VIEWPORT_WIDTH, 70, 10);
    headerBG.fill(0x6a8783);

    const rankHeader = new Text({ text: "排名", style: infoStyle2 });
    rankHeader.x = START_X + 40;
    rankHeader.y = START_Y - 90;

    const nameHeader = new Text({ text: "玩家", style: infoStyle2 });
    nameHeader.x = START_X + 270;
    nameHeader.y = START_Y - 90;

    const scoreHeader = new Text({
      text: "分數",
      style: infoStyle2,
    });
    scoreHeader.x = START_X + 720;
    scoreHeader.y = START_Y - 90;

    container.addChild(headerBG, rankHeader, nameHeader, scoreHeader);

    //建立排行榜資料條目
    const createEntryContainer = (player, index, isAnimated = false) => {
      const entryContainer = new Container();
      entryContainer.y = index * ENTRY_HEIGHT;

      if (isAnimated) {
        entryContainer.y += ENTRY_HEIGHT;
        entryContainer.alpha = 0;
      }

      const entryBG = new Graphics();
      entryBG.roundRect(0, 0, VIEWPORT_WIDTH - 20, 80, 10);
      entryBG.fill(player.name === userName ? 0xffda2a : 0xf0fff0);
      entryBG.stroke({ width: 3, color: 0x6a8783 });

      let rankPrefix = "";
      if (index === 0) rankPrefix = "🥇 ";
      else if (index === 1) rankPrefix = "🥈 ";
      else if (index === 2) rankPrefix = "🥉 ";

      const rankText = new Text({
        text: `${rankPrefix}${index + 1}`,
        style: defaultStyle,
      });
      rankText.x = 40;
      rankText.y = 20;

      const nameText = new Text({
        text: player.name,
        style: defaultStyle,
      });
      nameText.x = 270;
      nameText.y = 20;

      const scoreText = new Text({
        text: player.score.toString(),
        style: defaultStyle,
      });
      scoreText.x = 720;
      scoreText.y = 20;

      entryContainer.addChild(entryBG, rankText, nameText, scoreText);
      return entryContainer;
    };

    let currentScroll = 0;
    const updateScroll = (newScroll) => {
      if (this.currentScrollAnimation) {
        this.currentScrollAnimation.kill();
      }

      currentScroll = Math.max(0, Math.min(newScroll, maxScroll));

      this.currentScrollAnimation = gsap.to(scrollContainer, {
        y: START_Y - currentScroll,
        duration: 0.3,
        ease: "power2.out",
        onUpdate: () => {
          const scrollPercentage = currentScroll / maxScroll;
          const scrollRange = VIEWPORT_HEIGHT - handleHeight;
          scrollbarHandle.y = START_Y + scrollRange * scrollPercentage;

          topIndicator.visible = currentScroll > 0;
          bottomIndicator.visible = currentScroll < maxScroll;
        },
      });
    };

    const throttledScroll = (e) => {
      if (this.scrollThrottleTimeout) return;

      this.scrollThrottleTimeout = setTimeout(() => {
        const newScroll = currentScroll + e.deltaY;
        updateScroll(newScroll);
        this.scrollThrottleTimeout = null;
      }, 16);
    };

    //更新排行榜
    leaderboard.data.forEach((player, index) => {
      const isCurrentPlayer = player.name === userName;
      const entryContainer = createEntryContainer(player, index, isCurrentPlayer);
      scrollContainer.addChild(entryContainer);

      if (isCurrentPlayer) {
        const targetScroll = Math.max(0, Math.min(index * ENTRY_HEIGHT - VIEWPORT_HEIGHT / 2 + ENTRY_HEIGHT / 2, maxScroll));
        //排行榜動畫
        gsap
          .timeline()
          .to(scrollContainer, {
            y: START_Y - targetScroll,
            duration: 0.8,
            ease: "power2.inOut",
          })
          .to(
            entryContainer,
            {
              y: index * ENTRY_HEIGHT,
              alpha: 1,
              duration: 0.5,
              ease: "back.out",
            },
            "+=0.2"
          )
          .to(
            scrollbarHandle,
            {
              y: START_Y + (targetScroll / maxScroll) * (VIEWPORT_HEIGHT - handleHeight),
              duration: 0.5,
              ease: "power2.inOut",
            },
            "-=0.5"
          );
      }
    });

    if (bgRect.eventMode === "static") {
      bgRect.removeAllListeners();
    }
    bgRect.eventMode = "static";
    bgRect.on("wheel", throttledScroll);

    const cleanup = () => {
      if (this.scrollThrottleTimeout) {
        clearTimeout(this.scrollThrottleTimeout);
      }
      if (this.currentScrollAnimation) {
        this.currentScrollAnimation.kill();
      }
      if (bgRect.eventMode === "static") {
        bgRect.removeAllListeners();
      }
    };

    return cleanup;
  }

  animateInWave(pineappleArray) {
    this.stopWaveAnimation();

    pineappleArray.forEach((pineapple, i) => {
      if (!pineapple.originalY) {
        pineapple.originalY = pineapple.y; //記錄初始 Y 位置
      } else {
        pineapple.y = pineapple.originalY;
      }
      //每個鳳梨在 Y 軸上下跳動
      const tl = gsap.to(pineapple, {
        y: pineapple.y - 30,
        duration: 0.5,
        ease: "power1.inOut",
        repeat: -1, //無限重複
        yoyo: true, //來回
        delay: i * 0.1, //每個鳳梨延遲 0.1 秒
      });
      this.game.waveTimelines.push(tl);
    });
  }

  stopWaveAnimation() {
    this.game.waveTimelines.forEach((tl) => {
      tl.kill();
    });
    this.game.waveTimelines = [];
  }

  async fadeElement(element, newText = null) {
    await gsap.to(element, {
      alpha: 0,
      duration: 0.3,
      ease: "power2.out",
    });

    if (newText !== null) {
      element.text = newText;
    }

    await gsap.to(element, {
      alpha: 1,
      duration: 0.3,
      ease: "power2.in",
    });
  }

  async fadeOutScene(sceneContainer) {
    return new Promise((resolve) => {
      gsap.to(sceneContainer, {
        alpha: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }

  async fadeInScene(sceneContainer) {
    return new Promise((resolve) => {
      gsap.to(sceneContainer, {
        alpha: 1,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }
}
