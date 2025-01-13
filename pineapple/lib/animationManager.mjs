import { Text, Container, Graphics } from "./pixi.mjs";
import { gsap } from "../gsap_src/index.js";
import { gdStyle, infoStyle2, defaultStyle } from "./textStyle.mjs";

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

  async animateLeaderboard(sceneContainer, leaderboard, userName, currentScore) {
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
    sceneContainer.addChild(bgRect);

    const mask = new Graphics();
    mask.roundRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, 20);
    mask.fill(0xffffff);
    mask.x = START_X;
    mask.y = START_Y;
    sceneContainer.addChild(mask);

    //建立滾動容器
    const scrollContainer = new Container();
    scrollContainer.x = START_X;
    scrollContainer.y = START_Y;
    scrollContainer.mask = mask;
    sceneContainer.addChild(scrollContainer);

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

    sceneContainer.addChild(scrollbarBG, scrollbarHandle);

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

    sceneContainer.addChild(topIndicator, bottomIndicator);

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

    sceneContainer.addChild(headerBG, rankHeader, nameHeader, scoreHeader);

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

    // 找到玩家當前分數的位置
    let targetIndex = -1;

    // 1. 先找目前分數
    targetIndex = leaderboard.data.findIndex((entry) => entry.name === userName && entry.score === currentScore);

    // 2. 如果沒找到，找相同名字最高分
    if (targetIndex === -1) {
      const sameNameEntries = leaderboard.data.filter((entry) => entry.name === userName);
      if (sameNameEntries.length > 0) {
        // 找出最高分的index
        const highestScore = Math.max(...sameNameEntries.map((entry) => entry.score));
        targetIndex = leaderboard.data.findIndex((entry) => entry.name === userName && entry.score === highestScore);
      }
    }

    // 滾動到目標位置
    if (targetIndex !== -1) {
      const targetScroll = Math.max(0, Math.min(targetIndex * ENTRY_HEIGHT - VIEWPORT_HEIGHT / 2 + ENTRY_HEIGHT / 2, maxScroll));

      gsap.timeline().to(scrollContainer, {
        y: START_Y - targetScroll,
        duration: 0.8,
        ease: "power2.inOut",
        onUpdate: () => {
          const scrollPercentage = targetScroll / maxScroll;
          const scrollRange = VIEWPORT_HEIGHT - handleHeight;
          scrollbarHandle.y = START_Y + scrollRange * scrollPercentage;

          topIndicator.visible = targetScroll > 0;
          bottomIndicator.visible = targetScroll < maxScroll;
        },
      });
    }

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
      duration: 0.25,
      ease: "power2.out",
    });

    if (newText !== null) {
      element.text = newText;
    }

    await gsap.to(element, {
      alpha: 1,
      duration: 0.25,
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

  animateScoreChange(scoreText, newScore) {
    const oldScore = parseInt(scoreText.text.split(": ")[1]);
    const duration = 0.5;
    const frameRate = 60;
    const totalFrames = duration * frameRate;
    const increment = (newScore - oldScore) / totalFrames;

    let currentScore = oldScore;
    const updateScore = () => {
      currentScore += increment;
      scoreText.text = `分數: ${Math.round(currentScore)}`;
      if (Math.abs(currentScore - newScore) > Math.abs(increment)) {
        requestAnimationFrame(updateScore);
      } else {
        scoreText.text = `分數: ${newScore}`;
      }
    };

    updateScore();
  }
}
