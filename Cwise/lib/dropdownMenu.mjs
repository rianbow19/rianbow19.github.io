import { Container, Graphics, Text } from "./pixi.mjs";
import { defaultStyle2 } from "./textStyle.mjs";

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

    this.button.addChild(buttonBg, buttonText, arrow);
    this.container.addChild(this.button);

    this.button.eventMode = "static";
    this.button.cursor = "pointer";
    this.button.on("pointerdown", () => this.toggleDropdown());

    this.menuContainer = new Container();
    this.menuContainer.y = this.itemHeight + 2;
    this.menuContainer.visible = false;
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

      itemContainer.on("pointerover", () => {
        itemBg.clear();
        itemBg.roundRect(0, 0, columnWidth, this.itemHeight - 20, 10);
        itemBg.stroke({ color: borderColor, width: 2 });
        itemBg.fill(hoverColor);
      });

      itemContainer.on("pointerout", () => {
        itemBg.clear();
        itemBg.roundRect(0, 0, columnWidth, this.itemHeight - 20, 10);
        itemBg.stroke({ color: borderColor, width: 2 });
        itemBg.fill(backgroundColor);
      });

      itemContainer.on("pointerdown", () => {
        this.selectItem(item);
        // 添加前綴到選中的文字
        buttonText.text = this.prefix ? `${this.prefix}：${item}` : item;
        arrow.rotation = 0;
      });
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.menuContainer.visible = this.isOpen;

    const arrow = this.button.children[2];
    arrow.rotation = this.isOpen ? Math.PI : 0;
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
