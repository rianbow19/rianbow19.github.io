import { TextStyle } from "./pixi.mjs";

export const defaultStyle = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 30,
  fontWeight: "bold",
  fill: "#000000",
});

export const defaultStyle2 = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 30,
  fill: "#000000",
});

export const listStyle = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 18,
  fill: "#272727",
  stroke: { color: "#ffffff", width: 4, join: "round" },
});

export const scoreStyle = new TextStyle({
  fontFamily: "Microsoft JhengHei, PingFang TC, sans-serif",
  fontSize: 60,
  fontWeight: "bold",
  fill: "#ffffff",
  stroke: { color: "#000000", width: 15, join: "round" },
});
