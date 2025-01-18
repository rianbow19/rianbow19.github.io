import { ItemsList } from "./itemsList.mjs";
import { DropdownMenu } from "./dropdownMenu.mjs";
import { Container, Graphics, Sprite, Texture, Text } from "./pixi.mjs";
import { defaultStyle, defaultStyle2, gdStyle, listStyle } from "./textStyle.mjs";
import { ItemsCanvas } from "./itemsCanvas.mjs";
import { ElectrolysisModule, ModuleSetup } from "./experimentModule.mjs";

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
      "鋅銅電池組合.png",
      "銅片.png",
      "鋅片.png",
      "U型管.png",
      "檢流計.png",
      "鋅銅電池雙燒杯.png",

      "迴紋針.png",
      "棉花.png",

      "藥品罐.png",
    ];
    this.isZoomedIn = false;
    this.itemCanvas = new ItemsCanvas();

    this.inPage1 = false;
    // 創建電解實驗模組
    this.electrolysisModule = new ElectrolysisModule(this.itemCanvas);

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
    this.reloadbtn.y = 980;

    this.reloadbtn.eventMode = "static";
    this.reloadbtn.cursor = "pointer";

    this.reloadbtn.on("pointerup", () => {
      this.itemCanvas.reset();
      this.electrolysisModule.reset();
    });
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

    //更新縮放標示文字
    const updateZoomText = () => {
      scaleUpText.text = this.isZoomedIn ? "+" : "-";
    };
    scaleUp.eventMode = "static";
    scaleUp.cursor = "pointer";

    //放大縮小邏輯
    scaleUp.on("pointerup", () => {
      if (!this.isZoomedIn) {
        this.sceneContainer.scale.set(this.sceneContainer.scale.x + 0.18);
      } else {
        this.sceneContainer.scale.set(this.sceneContainer.scale.x - 0.18);
      }
      updateZoomText();
      this.isZoomedIn = !this.isZoomedIn;
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
    this.scaleUpCon.y = 980;
    this.scaleUpCon.addChild(scaleUp, scaleUpText);

    //一件生成電路模組按鈕
    const setbtn = new Sprite(Texture.from("set.png"));
    setbtn.anchor.set(0.5);
    setbtn.scale.set(0.15);

    const setbtnText = new Text({ text: "組合模組", style: listStyle });
    setbtnText.anchor.set(0.5);
    setbtnText.y = 40;

    const setbtnBg = new Graphics();
    setbtnBg.roundRect(-60, -60, 120, 120, 15);
    setbtnBg.fill(0xeeeeee);
    setbtnBg.stroke({ color: 0x3c3c3c, width: 2 });

    this.setbtnCon = new Container();
    this.setbtnCon.addChild(setbtnBg, setbtn, setbtnText);
    this.setbtnCon.x = 260;
    this.setbtnCon.y = 240;
    this.setbtnCon.eventMode = "static";
    this.setbtnCon.cursor = "pointer";
    this.setbtnCon.on("pointerover", () => {
      this.setbtnCon.alpha = 0.8;
    });
    this.setbtnCon.on("pointerout", () => {
      this.setbtnCon.alpha = 1;
    });
    this.setbtnCon.visible = false;

    //標題
    this.titlebg = new Sprite(Texture.from("標題字2.png"));
    this.topicText = new Text({ text: "模組一｜電解實驗模組", style: defaultStyle });
    this.topicText.anchor.set(0.5);
    this.titlebg.anchor.set(0.5);
    this.titlebg.x = -300;

    const topicBg = new Graphics();
    topicBg.roundRect(-200, -40, 400, 80, 20);
    topicBg.fill(0xfcfcfc);
    topicBg.stroke({ color: 0x3c3c3c, width: 2 });

    this.titlebg.eventMode = "static";
    this.titlebg.cursor = "pointer";
    this.titlebg.on("pointerup", () => {
      this.startTitle();
    });

    this.topicCon = new Container();
    this.topicCon.x = 400;
    this.topicCon.y = 70;
    this.topicCon.addChild(topicBg, this.topicText, this.titlebg);

    this.startTitle();
  }

  async startTitle() {
    this.sceneContainer.removeChildren();
    this.UIContainer.removeChildren();
    this.inPage1 = false;

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
    this.UIContainer.addChild(baseButton);

    const advancedButton = new Sprite(Texture.from("進階.png"));
    advancedButton.anchor.set(0.5);
    advancedButton.x = 1320;
    advancedButton.y = 700;
    advancedButton.tint = 0xe0e0e0;
    this.UIContainer.addChild(advancedButton);

    // 第一組選項
    const basesec = [
      { text: "電解實驗模組", action: this.modlePage1.bind(this) },
      { text: "離子分兩派實驗模組", action: this.modlePage3.bind(this) },
    ];

    // 第二組選項
    const advansec = [{ text: "電解氯化銅模組", action: this.modlePage2.bind(this) }];

    // 創建第一組選項
    const group1Result = createOptionGroup(basesec, 0);
    const group1Container = new Container();
    group1Container.addChild(group1Result.groupBg, ...group1Result.optionContainers);

    // 創建第二組選項
    const group2Result = createOptionGroup(advansec, 0);
    const group2Container = new Container();
    group2Container.addChild(group2Result.groupBg, ...group2Result.optionContainers);

    // 主容器
    this.modelSecCon = new Container();
    this.modelSecCon.x = 1920 / 2;
    this.modelSecCon.y = 680;

    // 基礎按鈕
    baseButton.eventMode = "static";
    baseButton.cursor = "pointer";
    baseButton.on("pointerup", () => {
      this.setbtnCon.visible = true;
      this.UIContainer.removeChildren();
      this.modelSecCon.removeChildren();
      this.modelSecCon.addChild(group1Container);
      this.UIContainer.addChild(this.modelSecCon);
    });
    baseButton.on("pointerover", () => {
      baseButton.scale.set(1.01);
      baseButton.tint = 0xffffff;
    });
    baseButton.on("pointerout", () => {
      baseButton.scale.set(1);
      baseButton.tint = 0xf0f0f0;
    });

    // 進階按鈕
    advancedButton.eventMode = "static";
    advancedButton.cursor = "pointer";
    advancedButton.on("pointerup", () => {
      this.setbtnCon.visible = false;
      this.UIContainer.removeChildren();
      this.modelSecCon.removeChildren();
      this.modelSecCon.addChild(group2Container);
      this.UIContainer.addChild(this.modelSecCon);
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

  // 模組一｜電解實驗模組
  modlePage1() {
    this.sceneContainer.removeChildren();
    this.UIContainer.removeChildren();
    this.itemCanvas.reset();
    this.UIContainer.addChild(this.reloadbtn); //重新整理按鈕
    this.UIContainer.addChild(this.scaleUpCon); //放大縮小按鈕
    this.UIContainer.addChild(this.setbtnCon); //電路模組按鈕

    this.sceneContainer.addChild(this.itemCanvas.container); //場景畫布

    this.inPage1 = true;

    //清單項目
    const draggableList = new ItemsList(
      this.imageList,
      this.itemCanvas,
      5, //項目數
      [0, 4] // 選定的索引
    );
    this.UIContainer.addChild(draggableList.container);

    // 開始電解按鈕
    this.startElectrolysisBtn = createButton({
      text: "開始電解",
      x: 1550,
      y: 245,
      onClick: () => {
        this.electrolysisModule.startElectrolysis();
      },
    });
    this.UIContainer.addChild(this.startElectrolysisBtn); //開始電解按鈕

    // 顯示離子流向按鈕
    this.showIonFlow = createCheckboxBlock(
      "顯示離子流向",
      1650,
      160,
      () => {
        console.log("顯示離子");
      },
      () => {
        console.log("隱藏離子");
      }
    );
    this.UIContainer.addChild(this.showIonFlow);

    // 離子顯示checkbox
    this.ionCon = createCheckboxBlock(
      "顯示離子",
      1650,
      75,
      () => {
        this.itemCanvas.createComponentIons();
        if (this.electrolysisModule.isAssembled) {
          this.electrolysisModule.toggleIonAnimation(true);
        }
      },
      () => {
        this.electrolysisModule.toggleIonAnimation(false);
      }
    );
    this.UIContainer.addChild(this.ionCon);

    this.setbtnCon.on("pointerup", () => {
      this.electrolysisModule.showStatusText("組裝中...");
      // 直接設置組件
      const components = this.electrolysisModule.moduleSetup.setupElectrolysisModule();

      // 更新狀態
      this.electrolysisModule.isAssembled = true;
      this.electrolysisModule.validCircuit = true;
      this.electrolysisModule.isAllitem = true;

      // 如果需要顯示離子
      if (this.ionCon?.children[3]?.visible) {
        this.electrolysisModule.toggleIonAnimation(true);
      }
    });

    // 標題
    this.UIContainer.addChild(this.topicCon);
    this.topicText.text = "模組一｜電解實驗模組";

    // 液體下拉選單
    const liquids = new DropdownMenu({
      x: 1450,
      y: 290,
      items: Object.keys(this.electrolysisModule.solutionProperties),
      label: "選擇溶液",
      columns: 2,
      prefix: "溶液",
      hoverColor: 0xf0f0f0,
    });

    liquids.onSelect = (item) => {
      this.electrolysisModule.setSolution(item);
    };
    this.UIContainer.addChild(liquids.container);
  }

  //模組二｜電解氯化銅模組
  modlePage2() {
    this.sceneContainer.removeChildren();
    this.UIContainer.removeChildren();
    this.itemCanvas.reset();
    this.UIContainer.addChild(this.reloadbtn); //重新整理按鈕
    this.UIContainer.addChild(this.scaleUpCon); //放大縮小按鈕
    this.UIContainer.addChild(this.setbtnCon); //電路模組按鈕

    this.sceneContainer.addChild(this.itemCanvas.container); //場景畫布

    //清單項目
    const draggableList = new ItemsList(this.imageList, this.itemCanvas, 5, [0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    this.UIContainer.addChild(draggableList.container);

    // 開始電解按鈕
    this.startElectrolysisBtn = createButton({
      text: "開始電解",
      x: 1548,
      y: 255,
      onClick: () => {
        console.log("22");
      },
    });

    this.checkBtn = createButton({
      text: "組裝完成",
      x: 1548,
      y: 440,
      onClick: () => {
        console.log("222");
      },
    });

    this.UIContainer.addChild(this.startElectrolysisBtn); //開始電解按鈕
    this.UIContainer.addChild(this.checkBtn); //組裝完成按鈕

    // 顯示離子流向按鈕
    this.showIonFlow = createCheckboxBlock(
      "顯示離子流向",
      1650,
      75,
      () => {
        console.log("顯示離子");
      },
      () => {
        console.log("隱藏離子");
      }
    );
    this.UIContainer.addChild(this.showIonFlow);

    // 離子顯示checkbox
    this.ionCon = createCheckboxBlock(
      "顯示離子",
      1650,
      75,
      () => {
        console.log("顯示離子");
      },
      () => {
        console.log("隱藏離子");
      }
    );
    this.UIContainer.addChild(this.ionCon);

    //電極顯示checkbox
    this.eleCon = createCheckboxBlock(
      "顯示電極",
      1650,
      165,
      () => {
        console.log("顯示電極");
      },
      () => {
        console.log("隱藏電極");
      }
    );
    this.UIContainer.addChild(this.eleCon);

    // 電路模組按鈕，模組二電解組合邏輯
    this.setbtnCon.on("pointerup", () => {
      console.log("組合模組");
      this.itemCanvas.createSceneItem("鋅銅電池組合.png", { x: 1000, y: 500 });
    });

    //標題
    this.UIContainer.addChild(this.topicCon);
    this.topicText.text = "模組二｜電解氯化銅模組";

    // 創建溶液下拉選單
    const drugs = new DropdownMenu({
      x: 1450,
      y: 300,
      items: [
        "硫酸銅",
        "硫酸鋅",
        "硝酸鉀",
        "純水",
        "自來水",
        "氯化鈉(液體)",
        "糖(液體)",
        "氯化鈉(固體)",
        "糖(固體)",
        "酒精",
        "鹽酸",
        "醋酸",
        "氫氧化鈉",
        "小蘇打粉",
        "氯化銅",
      ],
      label: "選擇溶液",
      columns: 2,
      prefix: "溶液",
      hoverColor: 0xf0f0f0,
    });
    drugs.onSelect = (item) => console.log("Selected drug:", item);
    this.UIContainer.addChild(drugs.container);
  }

  //模組三｜離子分兩派實驗模組
  modlePage3() {
    this.sceneContainer.removeChildren();
    this.UIContainer.removeChildren();
    this.itemCanvas.reset();
    this.UIContainer.addChild(this.reloadbtn); //重新整理按鈕
    this.UIContainer.addChild(this.scaleUpCon); //放大縮小按鈕
    this.UIContainer.addChild(this.setbtnCon); //電路模組按鈕
    this.sceneContainer.addChild(this.itemCanvas.container); //場景畫布

    //清單項目
    const draggableList = new ItemsList(this.imageList, this.itemCanvas, 5, [0, 14]);
    this.UIContainer.addChild(draggableList.container);

    //組合模組
    this.setbtnCon.on("pointerup", () => {
      console.log("組合模組");
    });

    // 顯示離子流向按鈕
    this.showIonFlow = createCheckboxBlock(
      "顯示離子流向",
      1650,
      75,
      () => {
        console.log("顯示離子");
      },
      () => {
        console.log("隱藏離子");
      }
    );
    this.UIContainer.addChild(this.showIonFlow);

    // 離子顯示checkbox
    this.ionCon = createCheckboxBlock(
      "顯示離子",
      1650,
      75,
      () => {
        console.log("顯示離子");
      },
      () => {
        console.log("隱藏離子");
      }
    );
    this.UIContainer.addChild(this.ionCon);

    //清單項目

    //標題
    this.UIContainer.addChild(this.topicCon);
    this.topicText.text = "模組三｜離子分兩派實驗模組";

    // 創建藥品下拉選單
    const drugs = new DropdownMenu({
      x: 1450,
      y: 205,
      items: ["硫酸銅", "硫酸鋅", "硫酸鎂", "硫酸鈣", "硫酸鈉", "硫酸鉀"],
      label: "選擇藥品",
      columns: 2,
      prefix: "藥品",
      hoverColor: 0xf0f0f0,
    });
    drugs.onSelect = (item) => console.log("Selected drug:", item);
    this.UIContainer.addChild(drugs.container);
  }

  update(time) {
    const currentTime = Date.now();
    if (this.electrolysisModule) {
      this.electrolysisModule.update(time);
      if (this.inPage1) {
        // Only check pH paper connection periodically
        if (currentTime - this.electrolysisModule.lastPHCheckTime >= this.electrolysisModule.PHCheckInterval) {
          this.electrolysisModule.handlePHPaperConnection();
          this.electrolysisModule.lastPHCheckTime = currentTime;
        }
      }
    }
  }
}

function createCheckboxBlock(text, x, y, onShow, onHide) {
  const ionText = new Text({ text: text, style: defaultStyle });
  ionText.anchor.set(0, 0.5);
  ionText.x = -130;

  const ionBg = new Graphics();
  ionBg.roundRect(-200, -40, 400, 80, 10);
  ionBg.fill(0xfcfcfc);
  ionBg.stroke({ color: 0x3c3c3c, width: 2 });

  const checkbox = new Graphics();
  checkbox.x = -170;
  checkbox.rect(-15, -15, 30, 30);
  checkbox.fill(0xfcfcfc);
  checkbox.stroke({ color: 0x3c3c3c, width: 2 });

  const checkmark = new Sprite(Texture.from("check.png"));
  checkmark.anchor.set(0.5);
  checkmark.scale.set(0.05);
  checkmark.x = -170;
  checkmark.visible = false;

  checkbox.eventMode = "static";
  checkbox.cursor = "pointer";
  let isChecked = false;
  checkbox.on("pointerdown", () => {
    isChecked = !isChecked;
    checkmark.visible = isChecked;
    if (isChecked) {
      onShow();
    } else {
      onHide();
    }
  });

  const container = new Container();
  container.x = x;
  container.y = y;
  container.addChild(ionBg, ionText, checkbox, checkmark);

  return container;
}

function createOptionGroup(options, startY) {
  const optionContainers = [];

  const bgHeight = 70 * options.length;
  const yOffset = (options.length - 1) * 30; // 計算背景和選項的偏移量

  // 背景
  const groupBg = new Graphics();
  groupBg.roundRect(-165, -35 * options.length, 330, bgHeight, 20);
  groupBg.fill(0xffffff);
  groupBg.stroke({ color: 0x3a398d, width: 5 });
  groupBg.alpha = 0.7;

  options.forEach((option, index) => {
    const optionGraphics = new Graphics();
    optionGraphics.rect(-160, -30, 320, 60);
    optionGraphics.fill(0xadadad);
    optionGraphics.alpha = 0;
    optionGraphics.y = -yOffset + index * 60; // 選項按偏移量調整 Y 座標

    const optionText = new Text({ text: option.text, style: defaultStyle2 });
    optionText.anchor.set(0.5);
    optionText.y = -yOffset + index * 60;

    optionGraphics.eventMode = "static";
    optionGraphics.cursor = "pointer";
    optionGraphics.on("pointerup", option.action);
    optionGraphics.on("pointerover", () => {
      optionGraphics.alpha = 0.8;
    });
    optionGraphics.on("pointerout", () => {
      optionGraphics.alpha = 0;
    });

    optionContainers.push(optionGraphics, optionText);
  });

  return { groupBg, optionContainers };
}

function createButton({ text, x, y, onClick }) {
  const buttonText = new Text({ text, style: defaultStyle });
  buttonText.anchor.set(0.5);

  const buttonBg = new Graphics();
  buttonBg.roundRect(-100, -40, 200, 80, 10);
  buttonBg.fill(0xfcfcfc);
  buttonBg.stroke({ color: 0x3c3c3c, width: 2 });

  const buttonContainer = new Container();
  buttonContainer.x = x;
  buttonContainer.y = y;
  buttonContainer.addChild(buttonBg, buttonText);
  buttonContainer.eventMode = "static";
  buttonContainer.cursor = "pointer";
  buttonContainer.on("pointerover", () => {
    buttonContainer.alpha = 0.8;
  });
  buttonContainer.on("pointerout", () => {
    buttonContainer.alpha = 1;
  });
  buttonContainer.on("pointerup", onClick);

  return buttonContainer;
}
