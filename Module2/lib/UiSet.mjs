import { Container, Graphics, Text, Sprite, Texture } from "./pixi.mjs";
import { defaultStyle2, defaultStyle } from "./textStyle.mjs";

export class DropdownMenu {
  constructor(options = {}) {
    const {
      x = 0,
      y = 0,
      width = 400,
      items = [],
      label = "Select",
      prefix = "", // 新增：標題前綴
      backgroundColor = 0xffffff,
      borderColor = 0x999999,
      hoverColor = 0xf0f0f0, // 新增：懸停顏色
      columns = 1,
      columnGap = 3,
    } = options;

    this.container = new Container();
    this.container.x = x;
    this.container.y = y;
    this.items = items;
    this.isOpen = false;
    this.width = width;
    this.itemHeight = 80;
    this.prefix = prefix; // 保存前綴

    const columnWidth = (width - (columns - 1) * columnGap) / columns;
    const itemsPerColumn = Math.ceil(this.items.length / columns);

    this.button = new Container();

    const buttonBg = new Graphics();
    buttonBg.roundRect(0, 0, width, this.itemHeight, 10);
    buttonBg.fill(backgroundColor);
    buttonBg.stroke({ color: borderColor, width: 2 });

    const arrow = new Graphics();
    arrow.poly([0, 0, 20, 20, 40, 0]);
    arrow.fill(0xcccccc);
    arrow.pivot.x = 20;
    arrow.pivot.y = 10;
    arrow.x = width - 40;
    arrow.y = this.itemHeight / 2;

    const buttonText = new Text({ text: label, style: defaultStyle2 });
    buttonText.x = 20;
    buttonText.y = this.itemHeight / 2 - buttonText.height / 2;

    this.button.addChild(buttonBg, arrow, buttonText);
    this.container.addChild(this.button);

    this.button.eventMode = "static";
    this.button.cursor = "pointer";
    // 移除 pointerdown 事件監聽

    this.menuContainer = new Container();
    this.menuContainer.y = this.itemHeight + 2;
    this.menuContainer.visible = true; // 改為始終可見
    this.container.addChild(this.menuContainer);

    this.items.forEach((item, index) => {
      const columnIndex = Math.floor(index / itemsPerColumn);
      const rowIndex = index % itemsPerColumn;

      const itemContainer = new Container();
      itemContainer.x = columnIndex * (columnWidth + columnGap);
      itemContainer.y = rowIndex * (this.itemHeight - 18);

      const itemBg = new Graphics();
      itemBg.roundRect(0, 0, columnWidth, this.itemHeight - 20, 10);
      itemBg.stroke({ color: borderColor, width: 2 });
      itemBg.fill(backgroundColor);

      const itemText = new Text({ text: item, style: defaultStyle2 });
      itemText.x = 20;
      itemText.y = (this.itemHeight - 20) / 2 - itemText.height / 2;

      itemContainer.addChild(itemBg, itemText);
      this.menuContainer.addChild(itemContainer);

      // 添加懸停效果
      itemContainer.eventMode = "static";
      itemContainer.cursor = "pointer";

      // 懸停效果：根據 item 判斷使用不同顏色
      itemContainer.on("pointerover", () => {
        itemBg.clear();
        itemBg.roundRect(0, 0, columnWidth, this.itemHeight - 20, 10);
        itemBg.stroke({ color: borderColor, width: 2 });
        // 如果 item 為 "氯化銅" 則使用特殊顏色，否則使用預設 hoverColor
        const fillColor = item === "氯化銅" ? 0xadd8e6 : hoverColor;
        itemBg.fill(fillColor);
      });

      itemContainer.on("pointerout", () => {
        itemBg.clear();
        itemBg.roundRect(0, 0, columnWidth, this.itemHeight - 20, 10);
        itemBg.stroke({ color: borderColor, width: 2 });
        itemBg.fill(backgroundColor);
      });

      itemContainer.on("pointerup", () => {
        this.selectItem(item);
        buttonText.text = this.prefix ? `${this.prefix}：${item}` : item;
      });
    });
  }

  selectItem(item) {
    const buttonText = this.button.children[1];
    // Update button text without closing dropdown
    buttonText.text = this.prefix ? `${this.prefix}：${item}` : item;

    if (this.onSelect) {
      this.onSelect(item);
    }
  }
}

export function createCheckboxBlock(text, x, y, onShow, onHide) {
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

  const container = new Container();
  container.x = x;
  container.y = y;
  container.addChild(ionBg, ionText, checkbox, checkmark);

  container.eventMode = "static";
  container.cursor = "pointer";
  let isChecked = false;
  container.on("pointerdown", () => {
    isChecked = !isChecked;
    checkmark.visible = isChecked;
    if (isChecked) {
      onShow();
    } else {
      onHide();
    }
  });
  return container;
}

export function createOptionGroup(options) {
  const optionContainers = [];
  const width = 500;
  const height = 100;
  const bgHeight = 110 * options.length;
  const yOffset = options.length === 1 ? -5 : ((options.length - 1) * height - (options.length === 2 ? 20 : 10)) / 2;

  const groupBg = new Graphics();
  groupBg.roundRect(-width / 2, (-height / 2) * options.length, width, bgHeight, 20);
  groupBg.fill(0xffffff);
  groupBg.stroke({ color: 0x3a398d, width: 5 });
  groupBg.alpha = 0.7;

  options.forEach((option, index) => {
    const yPos = -yOffset + index * height;
    const optionGraphics = new Graphics();
    optionGraphics.rect((-width + 10) / 2, -height / 2, width - 10, height);
    optionGraphics.fill(0xadadad);
    optionGraphics.alpha = 0;
    optionGraphics.y = yPos;

    const optionText = new Text({ text: option.text, style: defaultStyle2 });
    optionText.anchor.set(0.5);
    optionText.y = yPos;

    optionGraphics.eventMode = "static";
    optionGraphics.cursor = "pointer";
    optionGraphics.on("pointerup", option.action);
    optionGraphics.on("pointerover", () => (optionGraphics.alpha = 0.8));
    optionGraphics.on("pointerout", () => (optionGraphics.alpha = 0));
    optionGraphics.on("pointerdown", () => (optionGraphics.alpha = 0.8));

    optionContainers.push(optionGraphics, optionText);
  });

  return { groupBg, optionContainers };
}

export function createButton({ text, x, y, onClick }) {
  const buttonText = new Text({ text, style: defaultStyle });
  buttonText.anchor.set(0.5);

  const buttonBg = new Graphics();
  buttonBg.roundRect(-200, -40, 400, 80, 10);
  buttonBg.fill(0xffffe0);
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
  buttonContainer.on("pointerdown", () => {
    buttonContainer.alpha = 0.8;
  });

  return buttonContainer;
}
