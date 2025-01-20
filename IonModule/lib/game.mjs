import { ItemsList } from "./itemsList.mjs";
import { DropdownMenu } from "./dropdownMenu.mjs";
import { Container, Graphics, Sprite, Texture, Text } from "./pixi.mjs";
import { defaultStyle, defaultStyle2, listStyle } from "./textStyle.mjs";
import { ItemsCanvas } from "./itemsCanvas.mjs";
import { IonModule } from "./experimentModule.mjs";

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
    this.ionModule = new IonModule(this.itemCanvas);
    this.itemCanvas.setIonModule(this.ionModule);

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
      this.ionModule.reset();
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
      // 找到場景中的燒杯
      const beaker = this.itemCanvas.components.children.find((child) => child.isBeaker);

      if (beaker) {
        const oldScale = this.sceneContainer.scale.x;
        const newScale = !this.isZoomedIn ? oldScale + 0.7 : oldScale - 0.7;

        // 計算燒杯在世界座標中的位置
        const beakerWorldPos = {
          x: beaker.x * oldScale + this.sceneContainer.x,
          y: beaker.y * oldScale + this.sceneContainer.y,
        };

        // 更新容器縮放
        this.sceneContainer.scale.set(newScale);

        // 計算新的容器位置以保持燒杯在同一位置
        const newX = beakerWorldPos.x - beaker.x * newScale;
        const newY = beakerWorldPos.y - beaker.y * newScale;

        this.sceneContainer.position.set(newX, newY);
      } else {
        // 如果沒有燒杯，使用普通縮放
        this.sceneContainer.scale.set(!this.isZoomedIn ? this.sceneContainer.scale.x + 0.18 : this.sceneContainer.scale.x - 0.18);
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

    // 第一組選項
    const basesec = [{ text: "離子分兩派實驗模組", action: this.modlePage3.bind(this) }];

    // 創建第一組選項
    const group1Result = createOptionGroup(basesec, 0);
    const group1Container = new Container();
    group1Container.addChild(group1Result.groupBg, ...group1Result.optionContainers);

    group1Container.x = 1920 / 2;
    group1Container.y = 680;
    this.UIContainer.addChild(group1Container);
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

    this.itemCanvas.setItemsList(draggableList);
    this.UIContainer.addChild(draggableList.container);

    //組合模組
    this.setbtnCon.on("pointerup", () => {
      console.log("組合模組");
    });

    // 離子顯示checkbox
    this.ionCon = createCheckboxBlock(
      "顯示離子",
      1650,
      160,
      () => {
        this.ionModule.setIonsVisible(true);
      },
      () => {
        this.ionModule.setIonsVisible(false);
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
    drugs.onSelect = (item) => {
      this.ionModule.setSolution(item);
    };
    this.UIContainer.addChild(drugs.container);
  }

  update(time) {
    const currentTime = Date.now();
    this.ionModule.update(currentTime);
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
