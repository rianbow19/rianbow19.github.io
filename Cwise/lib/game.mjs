import { AnimationManager } from "./animation.mjs";
import { DraggableList } from "./draggableList.mjs";
import { DropdownMenu } from "./dropdownMenu.mjs";
import { Container, Graphics, Sprite, Texture, Text } from "./pixi.mjs";
import { defaultStyle, defaultStyle2, listStyle, scoreStyle } from "./textStyle.mjs";

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
      "U型管.png",
      "檢流計.png",
      "鋅銅電池雙燒杯.png",
      "鋅銅電池組合.png",
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
    this.reloadbtn.scale.set(0.16);
    this.reloadbtn.x = 1800;
    this.reloadbtn.y = 950;

    this.reloadbtn.eventMode = "static";
    this.reloadbtn.cursor = "pointer";

    this.reloadbtn.on("pointerover", () => {
      this.reloadbtn.scale.set(0.163);
      this.reloadbtn.alpha = 0.8;
    });
    this.reloadbtn.on("pointerout", () => {
      this.reloadbtn.scale.set(0.16);
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

    //顯示離子
    const ionText = new Text({ text: "顯示離子", style: defaultStyle });
    ionText.anchor.set(0.5);
    ionText.x = -70;

    const ionBg = new Graphics();
    ionBg.roundRect(-200, -40, 400, 80, 20);
    ionBg.fill(0xfcfcfc);
    ionBg.stroke({ color: 0x3c3c3c, width: 2 });

    // 創建checkbox
    const checkbox = new Graphics();
    checkbox.x = -170; // 調整位置到文字左側
    checkbox.rect(-15, -15, 30, 30);
    checkbox.fill(0xfcfcfc);
    checkbox.stroke({ color: 0x3c3c3c, width: 2 });

    // 創建勾選標記（初始隱藏）
    const checkmark = new Sprite(Texture.from("check.png"));
    checkmark.anchor.set(0.5);
    checkmark.scale.set(0.05);
    checkmark.x = -170;
    checkmark.visible = false; // 初始未勾選

    checkbox.eventMode = "static";
    checkbox.cursor = "pointer";

    this.isIonChecked = false;
    checkbox.on("pointerdown", () => {
      this.isIonChecked = !this.isIonChecked;
      checkmark.visible = this.isIonChecked;
      // 這裡可以添加你的回調函數
      if (this.isIonChecked) {
        console.log("顯示離子");
        // 處理顯示離子的邏輯
      } else {
        console.log("隱藏離子");
        // 處理隱藏離子的邏輯
      }
    });
    this.ionCon = new Container();
    this.ionCon.x = 1650;
    this.ionCon.y = 70;
    this.ionCon.addChild(ionBg, ionText, checkbox, checkmark);

    this.startTitle();
  }

  async startTitle() {
    this.sceneContainer.removeChildren();
    this.UIContainer.removeChildren();

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
    baseButton.on("pointerup", () => {
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

    const advancedSecBg = new Graphics();
    advancedSecBg.roundRect(-165, -75, 330, 150, 20);
    advancedSecBg.fill(0xffffff);
    advancedSecBg.stroke({ color: 0xdf84a1, width: 5 });
    advancedSecBg.alpha = 0.7;

    const advancedSec1 = new Graphics();
    advancedSec1.rect(-160, -30, 320, 60, 20);
    advancedSec1.fill(0xadadad);
    advancedSec1.alpha = 0;
    advancedSec1.y = -30;

    const advancedSec2 = new Graphics();
    advancedSec2.rect(-160, -30, 320, 60, 20);
    advancedSec2.fill(0xadadad);
    advancedSec2.alpha = 0;
    advancedSec2.y = 30;

    advancedSec1.eventMode = "static";
    advancedSec1.cursor = "pointer";
    advancedSec1.on("pointerup", () => {
      this.advancedPage();
    });
    advancedSec1.on("pointerover", () => {
      advancedSec1.alpha = 0.8;
    });
    advancedSec1.on("pointerout", () => {
      advancedSec1.alpha = 0;
    });

    advancedSec2.eventMode = "static";
    advancedSec2.cursor = "pointer";
    advancedSec2.on("pointerup", () => {
      this.advancedPage2();
    });
    advancedSec2.on("pointerover", () => {
      advancedSec2.alpha = 0.8;
    });
    advancedSec2.on("pointerout", () => {
      advancedSec2.alpha = 0;
    });

    const advancedSecText = new Text({ text: "", style: defaultStyle2 });
    advancedSecText.text = `離子分兩派實驗模組

鋅銅電池模組`;
    advancedSecText.anchor.set(0.5);

    this.advancedSecCon = new Container();
    this.advancedSecCon.x = 1650;
    this.advancedSecCon.y = 680;
    this.advancedSecCon.addChild(advancedSecBg, advancedSec1, advancedSec2, advancedSecText);
    this.advancedSecCon.visible = false;
    this.sceneContainer.addChild(this.advancedSecCon);

    let isadbtn = false;
    advancedButton.eventMode = "static";
    advancedButton.cursor = "pointer";
    advancedButton.on("pointerup", () => {
      isadbtn = !isadbtn;
      this.advancedSecCon.visible = isadbtn;
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
    this.UIContainer.addChild(this.ionCon);
    this.UIContainer.addChild(this.scaleUpCon);

    const draggableList = new DraggableList(
      this.imageList,
      5, //項目數
      [0, 1, 2, 3, 4, 5] // 選定的索引
    );

    this.UIContainer.addChild(draggableList.container);
    this.sceneContainer.addChild(draggableList.sceneItemsContainer);

    this.reloadbtn.on("pointerup", () => {
      draggableList.reset();
    });

    // 模組 1: 電解實驗模組
    this.UIContainer.addChild(this.topicCon);

    // 創建液體下拉選單
    const liquids = new DropdownMenu({
      x: 1450,
      y: 300,
      items: ["純水", "自來水", "氯化鈉(液體)", "糖(液體)", "氯化鈉(固體)", "糖(固體)", "酒精", "鹽酸", "醋酸", "氫氧化鈉", "小蘇打粉", "氯化銅"],
      label: "選擇液體",
      columns: 2,
      prefix: "液體",
      hoverColor: 0xf0f0f0,
    });
    liquids.onSelect = (item) => console.log("Selected liquid:", item);
    this.UIContainer.addChild(liquids.container);

    // 顯示離子流向按鈕
    const showIonFlowText = new Text({ text: "顯示離子流向", style: defaultStyle });
    showIonFlowText.anchor.set(0.5);

    const showIonFlowBg = new Graphics();
    showIonFlowBg.roundRect(-100, -40, 200, 80, 20);
    showIonFlowBg.fill(0xfcfcfc);
    showIonFlowBg.stroke({ color: 0x3c3c3c, width: 2 });

    const showIonFlowBtn = new Container();
    showIonFlowBtn.x = 1547;
    showIonFlowBtn.y = 160;
    showIonFlowBtn.addChild(showIonFlowBg, showIonFlowText);

    showIonFlowBtn.eventMode = "static";
    showIonFlowBtn.cursor = "pointer";

    showIonFlowBtn.on("pointerover", () => {
      showIonFlowBtn.alpha = 0.8;
    });
    showIonFlowBtn.on("pointerout", () => {
      showIonFlowBtn.alpha = 1;
    });

    showIonFlowBtn.on("pointerup", () => {
      console.log("顯示離子流向");
      // 處理顯示離子流向的邏輯
    });

    this.UIContainer.addChild(showIonFlowBtn);

    // 開始電解按鈕
    const startElectrolysisText = new Text({ text: "開始電解", style: defaultStyle });
    startElectrolysisText.anchor.set(0.5);

    const startElectrolysisBg = new Graphics();
    startElectrolysisBg.roundRect(-100, -40, 200, 80, 20);
    startElectrolysisBg.fill(0xfcfcfc);
    startElectrolysisBg.stroke({ color: 0x3c3c3c, width: 2 });

    const startElectrolysisBtn = new Container();
    startElectrolysisBtn.x = 1750;
    startElectrolysisBtn.y = 160;
    startElectrolysisBtn.addChild(startElectrolysisBg, startElectrolysisText);

    startElectrolysisBtn.eventMode = "static";
    startElectrolysisBtn.cursor = "pointer";

    startElectrolysisBtn.on("pointerover", () => {
      startElectrolysisBtn.alpha = 0.8;
    });
    startElectrolysisBtn.on("pointerout", () => {
      startElectrolysisBtn.alpha = 1;
    });

    startElectrolysisBtn.on("pointerup", () => {
      console.log("開始電解");
      // 處理開始電解的邏輯
    });

    this.UIContainer.addChild(startElectrolysisBtn);
  }

  advancedPage() {
    this.sceneContainer.removeChildren();
    this.UIContainer.removeChildren();
    this.UIContainer.addChild(this.reloadbtn);
    this.UIContainer.addChild(this.scaleUpCon);
    this.UIContainer.addChild(this.ionCon);

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

    // 創建藥品下拉選單
    const drugs = new DropdownMenu({
      x: 1450,
      y: 300,
      items: ["硫酸銅", "硫酸鋅", "硫酸鎂", "硫酸鈣", "硫酸鈉", "硫酸鉀"],
      label: "選擇藥品",
      columns: 1,
      prefix: "藥品",
      hoverColor: 0xf0f0f0,
    });
    drugs.onSelect = (item) => console.log("Selected drug:", item);
  }

  advancedPage2() {
    this.sceneContainer.removeChildren();
    this.UIContainer.removeChildren();
    this.UIContainer.addChild(this.reloadbtn);
    this.UIContainer.addChild(this.ionCon);
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
