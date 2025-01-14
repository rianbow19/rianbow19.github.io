import { Color, FillGradient, TextStyle } from "./pixi.mjs";

export const defaultStyle = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 45,
  fontWeight: "bold",
  fill: "#000000",
});

export const listStyle = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 18,
  fill: "#272727",
  stroke: { color: "#ffffff", width: 2, join: "round" },
});

export const scoreStyle = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 60,
  fontWeight: "bold",
  fill: "#ffffff",
  stroke: { color: "#000000", width: 15, join: "round" },
});

export const comboStyle = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 80,
  fontWeight: "bold",
  fill: "#ffd700",
  stroke: { color: "#ffffff", width: 15, join: "round" },
});

export const infoStyle = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 45,
  fontWeight: "bold",
  fill: "#3C3C3C",
  stroke: { color: "#F0FFF0", width: 5, join: "round" },
  wordWrap: true,
  wordWrapWidth: 1200,
  breakWords: true,
  align: "left",
});

export const infoStyle2 = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 45,
  fontWeight: "bold",
  fill: "#F0FFF0",
  stroke: { color: "#3C3C3C", width: 15, join: "round" },
});

export const infoStyle3 = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 36,
  fontWeight: "bold",
  fill: "#F0FFF0",
  stroke: { color: "#3C3C3C", width: 10, join: "round" },
});

const fill = new FillGradient(0, 0, 0, 10 * 1.7 * 7);
const colors = ["#6a8783", "#01b468"].map((color) => Color.shared.setValue(color).toNumber());
colors.forEach((number, index) => {
  const ratio = index / colors.length;

  fill.addColorStop(ratio, number);
});
export const gdStyle = new TextStyle({
  fontFamily: "impact, sans-serif",
  fontSize: 200,
  fontWeight: "bold",
  fill: fill,
  stroke: { color: "#ffffff", width: 15, join: "round" },
});
