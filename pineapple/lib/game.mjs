import { Container, Sprite, Texture, Text, Graphics } from "./pixi.mjs";
import { TextInput } from "./input.mjs";
import { leaderboard } from "./leaderboardData.mjs";
import { gsap } from "../node_modules/gsap/index.js";
import { HitEventManager } from "./hitEventManager.mjs";
import { gameSound, playSound, playBGM, stopBGM } from "./soundManager.mjs";
import { titleStyle, infoStyle, infoStyle2, defaultStyle, scoreStyle, comboStyle } from "./textStyle.mjs";
import { AnimationManager } from "./animationManager.mjs";

export { Game };

const gameTime = 5;
const gravity = 0.55;

const QUESTION_TYPE = {
  SEXUAL: "有性生殖",
  ASEXUAL: "無性生殖",
};

// 每種題目的正確素材名稱
const correctTextures = {
  [QUESTION_TYPE.SEXUAL]: ["基因轉殖鳳梨.png", "種子鳳梨.png"],
  [QUESTION_TYPE.ASEXUAL]: ["冠芽鳳梨.png", "組織培養的鳳梨.png", "吸芽鳳梨.png", "裔芽鳳梨.png"],
};
// 所有錯誤素材
const wrongTextures = ["香蕉.png", "草莓.png"];

class Game {
  constructor() {
    this.container = new Container();
    this.sceneContainer = new Container();

    //初始化變數
    this.score = 0;
    this.time = gameTime;
    this.userName = "";

    this.isGameRunning = false;
    this.inputListener = null;

    this.currentScrollAnimation = null;
    this.scrollThrottleTimeout = null;
    this.waveTimelines = [];
    this.availableFruits = [];

    this.hitEventManager = new HitEventManager(this);
    this.animationManager = new AnimationManager(this);

    // 取得所有可能的值並隨機選擇一個
    this.currentQuestion = Object.values(QUESTION_TYPE)[Math.floor(Math.random() * Object.values(QUESTION_TYPE).length)];
    this.comboCount = 0; // combo 數
    this.currentScoreValue = 10; // 每次答對的加分（初始 10）

    //圖片
    this.bg = new Sprite(Texture.from("BG.png"));
    this.pineMom = new Sprite(Texture.from("鳳梨媽媽.png"));
    this.objects = [];

    //鳳梨媽媽容器
    this.pineMom.scale.set(0.15);
    this.pineMom.anchor.set(0.5);

    this.questionText = new Text({
      text: this.currentQuestion,
      style: infoStyle2,
    });
    this.questionText.anchor.set(0.5);
    this.questionText.y = 230;

    this.questBG = new Graphics();
    this.questBG.roundRect(-150, -50, 300, 100, 20);
    this.questBG.fill(0xffffff);
    this.questBG.stroke({ width: 10, color: 0x6a8783 });
    this.questBG.y = 230;

    this.pineMomCon = new Container();
    this.pineMomCon.addChild(this.pineMom, this.questBG, this.questionText);

    //初始化
    this.container.addChild(this.bg);
    this.container.addChild(this.sceneContainer);

    this.startTitle();
  }

  async fadeOutScene() {
    return new Promise((resolve) => {
      gsap.to(this.sceneContainer, {
        alpha: 0,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }

  async fadeInScene() {
    return new Promise((resolve) => {
      gsap.to(this.sceneContainer, {
        alpha: 1,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }

  async startTitle() {
    await this.fadeOutScene();
    this.sceneContainer.removeChildren();

    this.score = 0;
    this.comboCount = 0;
    this.currentScoreValue = 10;
    this.time = gameTime;
    this.userName = "";
    this.timeText = false;
    this.isGameRunning = false;

    // 移除舊的input
    if (this.inputBox) {
      if (this.inputListener) {
        this.inputBox.domInput.removeEventListener("input", this.inputListener);
        this.inputListener = null;
      }
      if (this.inputBox.domInput && this.inputBox.domInput.parentNode) {
        this.inputBox.domInput.parentNode.removeChild(this.inputBox.domInput);
      }
      this.inputBox.destroy();
    }

    const title = new Sprite(Texture.from("標題.png"));
    const truck = new Sprite(Texture.from("鳳梨卡車.png"));
    const book = new Sprite(Texture.from("鳳梨生態秘笈.png"));
    this.sceneContainer.addChild(truck, title, book);

    //書
    book.scale.set(0.35);
    book.anchor.set(0.5);
    book.x = 180;
    book.y = 120;

    //書的左右擺動動畫
    const bookAnimation = gsap.timeline({ repeat: -1, yoyo: true });
    bookAnimation.to(book, {
      duration: 1,
      rotation: -0.15,
      ease: "power2.in",
    });
    bookAnimation.to(book, {
      duration: 1,
      rotation: 0.15,
      ease: "power2.out",
    });

    const bookText = new Text({
      text: "鳳梨生態秘笈",
      style: infoStyle2,
    });
    bookText.x = 50;
    bookText.y = 200;
    this.sceneContainer.addChild(bookText);

    book.eventMode = "static";
    book.cursor = "pointer";
    book.removeAllListeners();
    book.on("pointerdown", () => {
      playSound("button");
      this.bookPage();
    });

    book.on("pointerover", () => {
      book.scale.set(0.36);
      bookText.tint = 0xffda2a;
    });
    book.on("pointerout", () => {
      book.scale.set(0.35);
      bookText.tint = 0xffffff;
    });

    //開始文字
    const startText = new Text({ text: "START", style: titleStyle });
    startText.anchor.set(0.5);

    //開始按鈕
    const startButton = new Graphics();
    startButton.rect(-170, -50, 340, 100);
    startButton.fill(0xffda2a);
    startButton.alpha = 0;

    //輸入文字框
    this.inputBox = new TextInput({
      width: 500,
      height: 100,
      fontSize: 50,
      stroke: 0x6a8783,
      stroke_width: 10,
      textColor: 0x000000,
      focus_color: 0x000000,
      focus_width: 0,
      placeholder: "輸入你的名字",
      placeholderColor: 0xacacac,
    });

    this.inputBox.x = 960;
    this.inputBox.y = 580;

    this.sceneContainer.addChild(this.inputBox);

    //開始按鈕容器
    this.startButCon = new Container();
    this.startButCon.addChild(startButton, startText);
    this.startButCon.x = 960;
    this.startButCon.y = 470;
    this.sceneContainer.addChild(this.startButCon);

    //初始化按钮
    startText.tint = 0x6a8783;

    //輸入框事件監聽
    this.inputListener = (event) => {
      const value = event.target.value;

      this.inputBox.showtext.text = value;
      this.inputBox.enterLine.x = this.inputBox.showtext.width / 2 + 5;
      this.inputBox.placeholder.visible = value.length === 0;

      const isValidInput = value.trim().length > 0;

      if (isValidInput) {
        startButton.removeAllListeners();
        startButton.eventMode = "static";
        startButton.cursor = "pointer";

        startButton.on("pointerdown", () => {
          if (this.time === gameTime) {
            playSound("button");
            this.userName = value.trim();
            this.inputBox.showtext.text = "";
            startButton.removeAllListeners();
            this.ReadyGo();
          }
        });

        startButton.on("pointerover", () => {
          startText.tint = 0xffda2a;
          startText.scale.set(1.05);
        });

        startButton.on("pointerout", () => {
          startText.tint = 0xffffff;
          startText.scale.set(1);
        });
      } else {
        startButton.eventMode = "none";
        startButton.cursor = "default";
        startText.tint = 0x6a8783;
        startButton.removeAllListeners();
      }
    };
    this.inputBox.domInput.addEventListener("input", this.inputListener);

    await this.fadeInScene();
  }

  async bookPage() {
    await this.fadeOutScene();
    this.sceneContainer.removeChildren();

    const BG1 = new Graphics();
    BG1.roundRect(110, 40, 1700, 1000, 50);
    BG1.fill(0x01b468);
    BG1.stroke({ width: 5, color: 0x01814a });
    BG1.alpha = 0.7;

    const BG2 = new Graphics();
    BG2.roundRect(135, 120, 1650, 900, 50);
    BG2.fill(0xffffff);
    BG2.stroke({ width: 5, color: 0x01814a });
    BG2.alpha = 0.7;

    const BG3 = new Graphics();
    BG3.roundRect(180, 65, 40, 40, 40);
    BG3.fill(0xffffff);
    BG3.alpha = 0.7;

    const BG4 = new Graphics();
    BG4.roundRect(240, 65, 40, 40, 40);
    BG4.fill(0xffffff);
    BG4.alpha = 0.7;

    const BGCon = new Container();
    BGCon.addChild(BG1, BG2, BG3, BG4);
    this.sceneContainer.addChild(BGCon);

    //創建有性生殖分類背景
    const sexualBG = new Graphics();
    sexualBG.roundRect(1200, 630, 400, 300, 300);
    sexualBG.fill(0x01b468);
    sexualBG.alpha = 0;

    //創建無性生殖分類背景
    const asexualBG = new Graphics();
    asexualBG.roundRect(300, 630, 630, 300, 300);
    asexualBG.fill(0x01b468);
    asexualBG.alpha = 0;

    this.sceneContainer.addChild(sexualBG, asexualBG);

    //說明文字
    const explainText = new Text({
      text: `遊戲畫面會隨機出現六種鳳梨梨寶寶及其他水果。
      鳳梨媽媽在畫面右上每隔10秒變換題目，玩家需依據題目切割相應的鳳梨。
      切割正確的鳳梨得分，若切到錯誤的鳳梨則扣分，連續答對可獲得更高分數。`,
      style: infoStyle,
    });
    explainText.x = 200;
    explainText.y = 150;
    this.sceneContainer.addChild(explainText);

    const pineappleTextures = ["基因轉殖鳳梨.png", "種子鳳梨.png", "冠芽鳳梨.png", "組織培養的鳳梨.png", "裔芽鳳梨.png", "吸芽鳳梨.png"];

    const topPineapples = pineappleTextures
      .slice(0, 2) //基因鳳梨和種子鳳梨
      .map((textureName, index) => {
        const pineapple = new Sprite(Texture.from(textureName));
        pineapple.textureName = textureName.replace(/\.png$/, ""); //去掉 .png
        pineapple.scale.set(0.22);
        pineapple.anchor.set(0.5);
        pineapple.x = 1300 + index * 250;
        pineapple.y = 780;
        return pineapple;
      });

    const bottomPineapples = pineappleTextures
      .slice(2) //其他四個鳳梨
      .map((textureName, index) => {
        const pineapple = new Sprite(Texture.from(textureName));
        pineapple.textureName = textureName.replace(/\.png$/, "");
        pineapple.scale.set(0.22);
        pineapple.anchor.set(0.5);
        pineapple.x = 300 + index * 220;
        pineapple.y = 750;
        return pineapple;
      });

    const pineapples = [...topPineapples, ...bottomPineapples];

    pineapples.forEach((pineapple) => {
      pineapple.eventMode = "static";
      pineapple.on("pointerover", () => {
        playSound("select");
        pineapple.scale.set(0.23);
        const nameText = new Text({
          text: pineapple.textureName,
          style: infoStyle2,
        });
        nameText.anchor.set(0.5);
        nameText.x = pineapple.x;
        nameText.y = pineapple.y + pineapple.height / 2 + 20;
        this.sceneContainer.addChild(nameText);
        pineapple._nameText = nameText;
      });

      pineapple.on("pointerout", () => {
        pineapple.scale.set(0.22);
        if (pineapple._nameText) {
          this.sceneContainer.removeChild(pineapple._nameText);
          pineapple._nameText = null;
        }
      });
    });

    this.sceneContainer.addChild(...pineapples);

    //鳳梨媽媽容器
    this.sceneContainer.addChild(this.pineMomCon);
    this.pineMomCon.x = 1600;
    this.pineMomCon.y = 280;
    this.questionText.text = "點擊查看";

    this.pineMomCon.eventMode = "static";
    this.pineMomCon.cursor = "pointer";
    this.pineMomCon.off("pointerdown");
    this.pineMomCon.on("pointerdown", () => {
      playSound("button");
      if (this.currentQuestion === QUESTION_TYPE.SEXUAL) {
        this.currentQuestion = QUESTION_TYPE.ASEXUAL;
        sexualBG.alpha = 0;
        asexualBG.alpha = 0.5;

        this.animationManager.stopWaveAnimation();
        this.animationManager.animateInWave(bottomPineapples);
      } else {
        this.currentQuestion = QUESTION_TYPE.SEXUAL;
        sexualBG.alpha = 0.5;
        asexualBG.alpha = 0;
        this.animationManager.stopWaveAnimation();
        this.animationManager.animateInWave(topPineapples);
      }
      this.questionText.text = this.currentQuestion;
    });
    this.pineMomCon.on("pointerover", () => {
      this.pineMomCon.scale.set(1.01);
      this.questBG.tint = 0x01b468;
    });
    this.pineMomCon.on("pointerout", () => {
      this.pineMomCon.scale.set(1);
      this.questBG.tint = 0xffffff;
    });

    //關閉按鈕
    const closeBtn = new Sprite(Texture.from("close.png"));
    closeBtn.eventMode = "static";
    closeBtn.cursor = "pointer";
    closeBtn.scale.set(0.2);
    closeBtn.anchor.set(0.5);
    closeBtn.x = 1700;
    closeBtn.y = 80;
    closeBtn.tint = 0xb8b8b8;
    closeBtn.on("pointerdown", () => {
      playSound("button");
      this.startTitle();
    });
    closeBtn.on("pointerover", () => {
      closeBtn.scale.set(0.22);
      closeBtn.tint = 0xffffff;
    });
    closeBtn.on("pointerout", () => {
      closeBtn.scale.set(0.2);
      closeBtn.tint = 0xb8b8b8;
    });

    this.sceneContainer.addChild(closeBtn);

    await this.fadeInScene();
  }

  spawnRandomObject() {
    let textures = [];
    // 如果是有性生殖題目，增加有性生殖水果的比例
    if (this.currentQuestion === QUESTION_TYPE.SEXUAL) {
      textures = [
        "基因轉殖鳳梨.png",
        "基因轉殖鳳梨.png", // 加倍有性生殖的鳳梨
        "種子鳳梨.png",
        "種子鳳梨.png",
        "冠芽鳳梨.png",
        "組織培養的鳳梨.png",
        "香蕉.png",
        "草莓.png",
      ];
    } else {
      // 無性生殖題目時使用原本的比例
      textures = ["基因轉殖鳳梨.png", "種子鳳梨.png", "冠芽鳳梨.png", "組織培養的鳳梨.png", "裔芽鳳梨.png", "吸芽鳳梨.png", "香蕉.png", "草莓.png"];
    }

    // 如果沒有可用的水果，重置數組
    if (this.availableFruits.length === 0) {
      this.availableFruits = [...textures];
      // 使用 Fisher-Yates 算法打亂數組
      for (let i = this.availableFruits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.availableFruits[i], this.availableFruits[j]] = [this.availableFruits[j], this.availableFruits[i]];
      }
    }

    // 從打亂的數組中獲取下一個水果
    const textureName = this.availableFruits.pop();

    try {
      // 創建精靈
      const sprite = new Sprite(Texture.from(textureName));
      if (!sprite.texture || sprite.texture.valid === false) {
        console.error("紋理加載失敗:", textureName);
        return;
      }
      sprite.scale.set(0.3);
      sprite.anchor.set(0.5);
      sprite._textureName = textureName;

      // 設定初始位置，檢查是否和其他物件 x 位置太近
      let newX;
      let tooClose;
      do {
        newX = Math.random() * 1400 + 100;
        tooClose = false;
        for (let obj of this.objects) {
          if (Math.abs(obj.sprite.x - newX) < 100) {
            tooClose = true;
            break;
          }
        }
      } while (tooClose);

      sprite.x = newX;
      sprite.y = 1080; // 起始Y位置

      //跳躍高度範圍控制
      const minHeight = 700;
      const maxHeight = 1000;
      const jumpHeight = Math.random() * (maxHeight - minHeight) + minHeight;

      // 計算跳躍速度
      const vy = -Math.sqrt(2 * gravity * jumpHeight);

      // 水平速度範圍控制
      const minVx = -2;
      const maxVx = 2;
      const vx = minVx + Math.random() * (maxVx - minVx);

      // 把記錄存入this.objects
      this.objects.push({
        sprite,
        vx,
        vy,
        gravity: gravity,
        canBeCut: true,
      });

      this.sceneContainer.addChild(sprite);
    } catch (error) {}
  }

  handleCut(sprite) {
    const name = sprite._textureName;

    console.log("被切到的是:", name);
    if (!sprite._textureName) {
      console.error("切割的 sprite 缺少 textureName");
      return;
    }

    //判斷對錯
    const isCorrect = correctTextures[this.currentQuestion]?.includes(name);
    const isWrong = wrongTextures.includes(name);

    if (isCorrect) {
      //答對Combo+1
      this.comboCount++;

      //若連續答對>5，將分值提升為 20
      if (this.comboCount > 5) {
        this.currentScoreValue = 20;
      } else if (this.comboCount > 4) {
        this.currentScoreValue = 18;
      } else if (this.comboCount > 3) {
        this.currentScoreValue = 15;
      } else if (this.comboCount > 2) {
        this.currentScoreValue = 12;
      }

      this.score += this.currentScoreValue;
      playSound("correct");
      this.animationManager.animateCombo(this.comboCount);

      console.log("正確，+" + this.currentScoreValue + "分");
    } else if (isWrong) {
      playSound("wrong");
      //答錯Combo歸零,切割完全錯誤的水果扣15分
      this.comboCount = 0;
      this.currentScoreValue = 10;
      this.score = Math.max(this.score - 15, 0);
      this.animationManager.animateCombo(this.comboCount);
      console.log("錯誤，-15分");
    } else {
      playSound("wrong");
      //答錯Combo歸零
      this.comboCount = 0;
      this.currentScoreValue = 10;
      this.score = Math.max(this.score - 10, 0);
      this.animationManager.animateCombo(this.comboCount);

      console.log("錯誤，-10分");
    }

    //創建上下半部分的 Sprite
    const topSprite = new Sprite(Texture.from(name));
    const bottomSprite = new Sprite(Texture.from(name));
    const flashColor = isCorrect ? 0x00ff00 : 0xff0000; // 正確為綠色，錯誤為紅色
    topSprite.tint = flashColor;
    bottomSprite.tint = flashColor;

    // 設置一個計時器來恢復原色
    setTimeout(() => {
      topSprite.tint = 0xffffff;
      bottomSprite.tint = 0xffffff;
    }, 100);

    //設定上下半部分的位置、大小、錨點
    topSprite.scale.set(sprite.scale.x, sprite.scale.y);
    bottomSprite.scale.set(sprite.scale.x, sprite.scale.y);

    topSprite.anchor.set(0.5);
    bottomSprite.anchor.set(0.5);

    topSprite.x = sprite.x;
    topSprite.y = sprite.y;
    bottomSprite.x = sprite.x;
    bottomSprite.y = sprite.y;

    //設定上下半部分的遮罩
    const topMask = new Graphics();
    topMask.rect(-sprite.width / 2, -sprite.height / 2, sprite.width, sprite.height / 2);
    topMask.fill(0x00ff00);

    const bottomMask = new Graphics();
    bottomMask.rect(-sprite.width / 2, 0, sprite.width, sprite.height / 2);
    bottomMask.fill(0xff0000);

    topSprite.mask = topMask;
    bottomSprite.mask = bottomMask;

    topMask.x = topSprite.x;
    topMask.y = topSprite.y;
    bottomMask.x = bottomSprite.x;
    bottomMask.y = bottomSprite.y;

    //設定上下半部分的運動
    const speed = 5;
    const angle = (Math.random() * Math.PI) / 4 + Math.PI / 8; //22.5 ~ 67.5 度

    this.objects.push({
      sprite: topSprite,
      vx: -speed * Math.cos(angle),
      vy: -speed * Math.sin(angle),
      gravity: gravity,
      rotation: -Math.random() * 0.1 - 0.05,
      canBeCut: false,
      mask: topMask,
    });

    this.objects.push({
      sprite: bottomSprite,
      vx: speed * Math.cos(angle),
      vy: -speed * Math.sin(angle),
      gravity: gravity,
      rotation: Math.random() * 0.1 - 0.05,
      canBeCut: false,
      mask: bottomMask,
    });

    this.sceneContainer.addChild(topSprite, bottomSprite);
    this.sceneContainer.addChild(topMask, bottomMask);

    //移除原本的 sprite
    this.sceneContainer.removeChild(sprite);
    const idx = this.objects.findIndex((obj) => obj.sprite === sprite);
    if (idx >= 0) {
      this.objects.splice(idx, 1);
    }
  }

  async ReadyGo() {
    // 播放音效
    playSound("readyGo");
    this.sceneContainer.removeChildren();
    await this.animationManager.showReadyGoAnimation();

    setTimeout(() => {
      this.GameStart();
    }, 1800);
  }

  async GameStart() {
    if (this.isGameRunning) {
      return;
    }
    this.isGameRunning = true;
    await this.fadeOutScene();

    // 清理之前的定時器
    if (this.gameIntervals) {
      Object.values(this.gameIntervals).forEach((interval) => clearInterval(interval));
    }

    playBGM();

    // 初始化定時器對象
    this.gameIntervals = {};

    this.sceneContainer.removeChildren();
    this.objects = [];

    this.sceneContainer.addChild(this.hitEventManager.trailSystem.graphics);
    this.sceneContainer.addChild(this.pineMomCon);
    this.pineMomCon.x = 1700;
    this.pineMomCon.y = 180;

    this.comboText = new Text({
      text: "",
      style: comboStyle,
    });
    this.comboText.anchor.set(0.5);
    this.comboText.x = 1100;
    this.comboText.y = 140;
    this.sceneContainer.addChild(this.comboText);

    //分數時間顯示
    this.scoreText = new Text({
      text: `分數: ${this.score}`,
      style: scoreStyle,
    });
    this.scoreText.x = 100;
    this.scoreText.y = 100;

    this.timeText = new Text({
      text: `時間: ${this.time}`,
      style: scoreStyle,
    });
    this.timeText.x = 500;
    this.timeText.y = 100;

    this.sceneContainer.addChild(this.scoreText, this.timeText);

    // 切換題目的定時器
    this.gameIntervals.questionInterval = setInterval(() => {
      if (this.currentQuestion === QUESTION_TYPE.SEXUAL) {
        this.currentQuestion = QUESTION_TYPE.ASEXUAL;
        this.availableFruits.length = 0;
      } else {
        this.currentQuestion = QUESTION_TYPE.SEXUAL;
        this.availableFruits.length = 0;
      }
      playChangeSound();
      console.log("切換題目:", this.currentQuestion);
    }, 10000);

    // 初始生成水果
    for (let i = 0; i < 1; i++) {
      this.spawnRandomObject();
    }

    // 定期生成水果的定時器
    this.gameIntervals.spawnInterval = setInterval(() => {
      if (this.isGameRunning && this.objects.length < 8) {
        this.spawnRandomObject();
      }
    }, 700);

    // 倒數計時的定時器
    this.gameIntervals.timeInterval = setInterval(() => {
      if (!this.isGameRunning) return;

      this.time--;
      if (this.time < 2) {
        clearInterval(this.gameIntervals.spawnInterval);
        clearInterval(this.gameIntervals.questionInterval);
      }
      if (this.time === 0) {
        playSound("timeUp");
      }
      if (this.time < 0) {
        this.time = 0;
        clearInterval(this.gameIntervals.timeInterval);
        this.endGame();
      }
    }, 1000);

    // 添加頁面可見性變化的事件監聽器
    this.handleVisibilityChange = () => {
      if (document.hidden) {
        this.pauseGame();
        console.log("遊戲暫停");
      } else {
        this.resumeGame();
        console.log("遊戲恢復");
      }
    };
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    this.hitEventManager.setupMouseEvents();
    await this.fadeInScene();
  }

  // 新增暫停遊戲方法
  pauseGame() {
    this.isGameRunning = false;
    if (this.gameIntervals) {
      Object.values(this.gameIntervals).forEach((interval) => clearInterval(interval));
    }
  }

  // 新增恢復遊戲方法
  resumeGame() {
    if (this.time <= 0) return; // 如果遊戲已結束，不要恢復

    this.isGameRunning = true;

    // 重新設置所有定時器
    this.gameIntervals.questionInterval = setInterval(() => {
      if (this.currentQuestion === QUESTION_TYPE.SEXUAL) {
        this.currentQuestion = QUESTION_TYPE.ASEXUAL;
      } else {
        this.currentQuestion = QUESTION_TYPE.SEXUAL;
      }
      playChangeSound();
    }, 10000);

    this.gameIntervals.spawnInterval = setInterval(() => {
      if (this.isGameRunning) {
        this.spawnRandomObject();
      }
    }, 550);

    this.gameIntervals.timeInterval = setInterval(() => {
      if (!this.isGameRunning) return;

      this.time--;
      if (this.time < 2) {
        clearInterval(this.gameIntervals.spawnInterval);
        clearInterval(this.gameIntervals.questionInterval);
      }
      if (this.time === 0) {
        playSound("timeUp");
      }
      if (this.time < 0) {
        this.time = 0;
        clearInterval(this.gameIntervals.timeInterval);
        this.endGame();
      }
    }, 1000);
  }

  async endGame() {
    stopBGM();
    // 移除頁面可見性事件監聽器
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

    // 清理所有定時器
    if (this.gameIntervals) {
      Object.values(this.gameIntervals).forEach((interval) => clearInterval(interval));
    }

    await this.fadeOutScene();
    this.sceneContainer.removeChildren();
    this.isGameRunning = false;

    await this.fadeOutScene();
    this.sceneContainer.removeChildren();
    this.isGameRunning = false;

    // 添加到排行榜
    leaderboard.addPlayer(this.userName, this.score);

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
      text: `${this.score}`,
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
    confirmCon.addChild(confirmButton, confirmText);
    this.sceneContainer.addChild(panel, topStripe, endText, scoreBG, scoreTitle, scoreNumber, confirmCon);

    // 設置互動事件
    confirmButton.eventMode = "static";
    confirmButton.cursor = "pointer";
    confirmButton.on("pointerdown", () => {
      playSound("button");
      this.leaderboard();
    });
    confirmButton.on("pointerover", () => ((confirmButton.tint = 0xe0e0e0), confirmCon.scale.set(1.01)));
    confirmButton.on("pointerout", () => ((confirmButton.tint = 0xffffff), confirmCon.scale.set(1)));

    await this.fadeInScene();
  }

  async leaderboard() {
    await this.fadeOutScene();
    this.sceneContainer.removeChildren();

    const cleanup = await this.animationManager.animateLeaderboard(this.sceneContainer, leaderboard, this.userName);

    const isOnLeaderboard = leaderboard.data.some((player) => player.name === this.userName);
    const playerRank = leaderboard.data.findIndex((player) => player.name === this.userName);

    if (playerRank >= 0 && playerRank < 3) {
      playSound("winRank");
    } else if (!isOnLeaderboard) {
      playSound("uhOh");
    }

    if (!isOnLeaderboard) {
      const encourageText = new Text({
        text: "噢不！找不到你，別灰心！再接再厲！",
        style: infoStyle,
      });
      encourageText.anchor.set(0.5);
      encourageText.x = 960;
      encourageText.y = 130;
      this.sceneContainer.addChild(encourageText);
    }

    //再試一次按鈕
    const retryCon = new Container();
    retryCon.x = 960;
    retryCon.y = 930;

    const retryButton = new Graphics();
    retryButton.roundRect(-170, -50, 340, 100, 50);
    retryButton.fill(0x6a8783);
    retryButton.stroke({ width: 6, color: 0x557571 });

    const retryText = new Text({
      text: "再試一次",
      style: infoStyle2,
    });
    retryText.anchor.set(0.5);

    retryCon.addChild(retryButton, retryText);
    this.sceneContainer.addChild(retryCon);

    retryButton.eventMode = "static";
    retryButton.cursor = "pointer";
    retryButton.on("pointerdown", () => {
      playSound("button");
      cleanup();
      this.sceneContainer.removeChildren();
      this.startTitle();
    });
    retryButton.on("pointerover", () => {
      retryButton.tint = 0xe0e0e0;
      retryCon.scale.set(1.01);
    });
    retryButton.on("pointerout", () => {
      retryButton.tint = 0xffffff;
      retryCon.scale.set(1);
    });

    await this.fadeInScene();
  }

  updateScoreAndTime() {
    this.timeText.text = `時間: ${this.time}`;
    this.scoreText.text = `分數: ${this.score}`;
    this.questionText.text = this.currentQuestion;
    this.questBG.tint = this.currentQuestion === QUESTION_TYPE.SEXUAL ? 0x779938 : 0xffffff;
  }

  update(delta) {
    //確認開始遊戲
    if (!this.timeText) return;

    if (this.hitEventManager.mouseState.isDown) {
      const pressDuration = Date.now() - this.hitEventManager.mouseState.pressStartTime;
      if (pressDuration > this.hitEventManager.mouseState.MAX_PRESS_DURATION) {
        this.hitEventManager.mouseState.isDown = false;
        this.hitEventManager.mouseState.pressStartTime = 0;
        this.hitEventManager.endCurrentTrailLine();
      }
    }

    this.hitEventManager.drawTrailLines();

    //更新時間分數顯示
    this.updateScoreAndTime();

    //更新所有飛行物件
    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];

      obj.sprite.x += obj.vx;
      obj.sprite.y += obj.vy;
      obj.vy += obj.gravity;

      if (obj.rotation) {
        obj.sprite.rotation += obj.rotation * 0.1;
      }
      if (obj.mask) {
        obj.mask.x = obj.sprite.x;
        obj.mask.y = obj.sprite.y;
        obj.mask.rotation = obj.sprite.rotation;
      }

      //如果飛出畫面，就移除
      if (obj.sprite.y > 1080 || obj.sprite.x < -100 || obj.sprite.x > 2020) {
        this.sceneContainer.removeChild(obj.sprite);
        if (obj.mask) this.sceneContainer.removeChild(obj.mask);
        this.objects.splice(i, 1);
        i--; //刪除後索引往回
      }
    }
  }

  //鳳梨說明動畫效果
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
      this.waveTimelines.push(tl);
    });
  }

  //停止動畫
  stopWaveAnimation() {
    this.waveTimelines.forEach((tl) => {
      tl.kill();
    });
    this.waveTimelines = [];
  }
}
