import { AnimationManager } from "./animation.mjs";
import { DraggableList } from "./draggableList.mjs";
import { Container, Graphics, Sprite, Texture, Text } from "./pixi.mjs";
import { defaultStyle, listStyle, scoreStyle } from "./textStyle.mjs";

export { Game };
class Game {
  constructor() {
    this.container = new Container();
    this.sceneContainer = new Container();
    this.UIContainer = new Container();
    this.imageList = [
      "燒杯.png",
      "電線.png",
      "電池.png",
      "燈泡.png",
      "廣用試紙.png",
      "碳棒.png",
      "銅片.png",

      "鋅片.png",
      "鋅銅電池組合.png",
      "鋅銅電池雙燒杯.png",

      "檢流計.png",
      "U型管.png",
    ];
    this.isZoomedIn = false;

    this.animation = new AnimationManager(this);

    this.init();
  }

  init() {
    this.container.addChild(this.sceneContainer);
    this.container.addChild(this.UIContainer);

    // 重新整理按鈕
    this.reloadbtn = new Sprite(Texture.from("reload.png"));
    this.reloadbtn.anchor.set(0.5);
    this.reloadbtn.scale.set(0.22);
    this.reloadbtn.x = 1800;
    this.reloadbtn.y = 950;

    this.reloadbtn.eventMode = "static";
    this.reloadbtn.cursor = "pointer";

    this.reloadbtn.on("pointerover", () => {
      this.reloadbtn.scale.set(0.223);
      this.reloadbtn.alpha = 0.8;
    });
    this.reloadbtn.on("pointerout", () => {
      this.reloadbtn.scale.set(0.22);
      this.reloadbtn.alpha = 1;
    });

    //放大縮小按鈕
    const scaleUp = new Sprite(Texture.from("放大鏡.png"));
    scaleUp.anchor.set(0.5);
    scaleUp.scale.set(0.3);
    scaleUp.x = 0;
    scaleUp.y = 0;

    const scaleUpText = new Text({ text: "+", style: defaultStyle });
    scaleUpText.anchor.set(0.5);
    scaleUpText.x = -10;
    scaleUpText.y = -13;

    // 更新縮放文字的函數
    const updateZoomText = () => {
      scaleUpText.text = this.isZoomedIn ? "+" : "-";
    };

    scaleUp.eventMode = "static";
    scaleUp.cursor = "pointer";
    scaleUp.on("pointerup", () => {
      if (!this.isZoomedIn) {
        this.sceneContainer.scale.set(this.sceneContainer.scale.x + 0.18);
      } else {
        this.sceneContainer.scale.set(this.sceneContainer.scale.x - 0.18);
      }
      updateZoomText();
      this.isZoomedIn = !this.isZoomedIn;

      this.sceneContainer.pivot.set(this.sceneContainer.width / 2, this.sceneContainer.height / 2);
      this.sceneContainer.position.set(1920 / 2, 1080 / 2);
    });
    scaleUp.on("pointerover", () => {
      scaleUp.scale.set(0.32);
      scaleUp.alpha = 0.8;
    });
    scaleUp.on("pointerout", () => {
      scaleUp.scale.set(0.3);
      scaleUp.alpha = 1;
    });
    this.scaleUpCon = new Container();
    this.scaleUpCon.x = 120;
    this.scaleUpCon.y = 950;
    this.scaleUpCon.addChild(scaleUp, scaleUpText);

    //題目
    this.topicText = new Text({ text: "模組一｜電解實驗模組", style: defaultStyle });
    this.topicText.anchor.set(0.5);

    const topicBg = new Graphics();
    topicBg.roundRect(-200, -40, 400, 80, 20);
    topicBg.fill(0xfcfcfc);
    topicBg.stroke({ color: 0x3c3c3c, width: 2 });

    this.topicCon = new Container();
    this.topicCon.x = 400;
    this.topicCon.y = 70;
    this.topicCon.addChild(topicBg, this.topicText);

    this.startTitle();
  }

  async startTitle() {
    const bg = new Sprite(Texture.from("底圖.png"));
    bg.y = -80;
    this.sceneContainer.addChild(bg);

    const title = new Sprite(Texture.from("標題字.png"));
    title.y = -120;
    this.sceneContainer.addChild(title);

    const baseButton = new Sprite(Texture.from("基礎.png"));
    baseButton.anchor.set(0.5);
    baseButton.x = 620;
    baseButton.y = 700;
    baseButton.tint = 0xf0f0f0;
    this.sceneContainer.addChild(baseButton);

    const advancedButton = new Sprite(Texture.from("進階.png"));
    advancedButton.anchor.set(0.5);
    advancedButton.x = 1320;
    advancedButton.y = 700;
    advancedButton.tint = 0xe0e0e0;
    this.sceneContainer.addChild(advancedButton);

    baseButton.eventMode = "static";
    baseButton.cursor = "pointer";
    baseButton.on("pointerdown", () => {
      this.basePage();
    });
    baseButton.on("pointerover", () => {
      baseButton.scale.set(1.01);
      baseButton.tint = 0xffffff;
    });
    baseButton.on("pointerout", () => {
      baseButton.scale.set(1);
      baseButton.tint = 0xf0f0f0;
    });

    advancedButton.eventMode = "static";
    advancedButton.cursor = "pointer";
    advancedButton.on("pointerdown", () => {
      this.advancedPage();
    });
    advancedButton.on("pointerover", () => {
      advancedButton.scale.set(1.01);
      advancedButton.tint = 0xffffff;
    });
    advancedButton.on("pointerout", () => {
      advancedButton.scale.set(1);
      advancedButton.tint = 0xe0e0e0;
    });
  }

  basePage() {
    this.sceneContainer.removeChildren();
    this.UIContainer.removeChildren();
    this.UIContainer.addChild(this.reloadbtn);
    this.UIContainer.addChild(this.scaleUpCon);

    const draggableList = new DraggableList(
      this.imageList,
      5, //項目數
      [0, 1, 2, 3, 4] // 選定的索引
    );

    this.UIContainer.addChild(draggableList.container);
    this.sceneContainer.addChild(draggableList.sceneItemsContainer);

    this.reloadbtn.on("pointerup", () => {
      draggableList.reset();
    });

    // 模組 1: 電解實驗模組
    this.UIContainer.addChild(this.topicCon);
  }

  advancedPage() {
    this.sceneContainer.removeChildren();
    this.UIContainer.removeChildren();
    this.UIContainer.addChild(this.reloadbtn);
    this.UIContainer.addChild(this.scaleUpCon);

    //所有項目
    const draggableList = new DraggableList(this.imageList);

    this.UIContainer.addChild(draggableList.container);
    this.sceneContainer.addChild(draggableList.sceneItemsContainer);

    this.reloadbtn.on("pointerup", () => {
      draggableList.reset();
    });

    // 模組 2: 離子分兩派實模組
    this.UIContainer.addChild(this.topicCon);
    this.topicText.text = "模組二｜離子分兩派實驗模組";
  }

  advancedPage2() {
    this.sceneContainer.removeChildren();
    this.UIContainer.removeChildren();
    this.UIContainer.addChild(this.reloadbtn);
    this.UIContainer.addChild(this.scaleUpCon);

    //所有項目
    const draggableList = new DraggableList(this.imageList);

    this.UIContainer.addChild(draggableList.container);
    this.sceneContainer.addChild(draggableList.sceneItemsContainer);

    this.reloadbtn.on("pointerup", () => {
      draggableList.reset();
    });

    // 模組 3: 鋅銅電池模組
    this.UIContainer.addChild(this.topicCon);
    this.topicText.text = "模組三｜鋅銅電池模組";
  }

  update(time) {}
}
