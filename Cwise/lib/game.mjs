import { AnimationManager } from "./animation.mjs";
import { DraggableList } from "./draggableList.mjs";
import { Container, Graphics, Sprite, Texture } from "./pixi.mjs";

export { Game };
class Game {
  constructor() {
    this.container = new Container();
    this.sceneContainer = new Container();
    this.imageList = [
      "電池.png",
      "電線.png",
      "碳棒.png",
      "銅片.png",
      "廣用試紙.png",
      "鋅片.png",
      "鋅銅電池組合.png",
      "鋅銅電池雙燒杯.png",
      "燈泡.png",
      "燒杯.png",
      "檢流計.png",
      "U型管.png",
    ];

    this.animation = new AnimationManager(this);

    this.init();
  }

  init() {
    this.container.addChild(this.sceneContainer);

    // 背景
    this.solidBg = new Graphics();
    this.solidBg.rect(0, 0, 1920, 1080);
    this.solidBg.fill(0xe4ecf2);

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

    this.startTitle();
  }

  async startTitle() {
    const bg = new Sprite(Texture.from("底圖.png"));
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
    this.sceneContainer.addChild(this.solidBg);
    this.sceneContainer.addChild(this.reloadbtn);

    const draggableList = new DraggableList(
      this.imageList,
      5, //項目數
      [9, 1, 0, 8, 4] // 選定的索引
    );

    this.sceneContainer.addChild(draggableList.container);

    this.reloadbtn.on("pointerup", () => {
      draggableList.container.removeChildren();
      draggableList.init();
    });
  }

  advancedPage() {
    this.sceneContainer.removeChildren();
    this.sceneContainer.addChild(this.solidBg);
    this.sceneContainer.addChild(this.reloadbtn);

    // 模組 2: 所有項目
    const draggableList = new DraggableList(this.imageList);

    this.sceneContainer.addChild(draggableList.container);

    this.reloadbtn.on("pointerup", () => {
      draggableList.container.removeChildren();
      draggableList.init();
    });
  }

  update(time) {}
}
