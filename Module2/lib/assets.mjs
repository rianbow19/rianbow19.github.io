import { Assets } from "./pixi.mjs";

const resource = [
  "底圖.png",
  "基礎.png",
  "進階.png",
  "電池.png",
  "電線.png",
  "碳棒.png",
  "廣用試紙.png",
  "標題字.png",
  "標題字2.png",
  "燈泡.png",
  "燈泡光.png",
  "燒杯.png",
  "檢流計.png",
  "藥品罐.png",
  "U型管.png",
  "reload.png",
  "check.png",
  "set.png",
  "迴紋針.png",
  "棉花.png",
  "weight.png",
  "skull.png",
  "開關.png",
  "鋅片.png",
];

class AssetsLoader {
  constructor() {
    this.loadDone = false;
  }

  async loadAllTexture() {
    return new Promise((resolve, reject) => {
      let loadArray = [];

      resource.forEach((element) => {
        Assets.add({ alias: element, src: `img/${element}` });
        loadArray.push(element);
      });

      const texturesPromise = Assets.load(loadArray, this.showProgress);
      texturesPromise.then((textures) => {
        this.loadDone = true;
        console.log("Load Finished.");
        resolve(true);
      });

      texturesPromise.onerror = reject;
    });
  }

  showProgress(progress) {
    console.log(progress);
  }
}

function randomInt(start, end) {
  return Math.floor(Math.random() * (end - start + 1)) + start;
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function animateToTarget(current, target, speed, deltaTime) {
  let gap = target - current;
  let gapLength = Math.abs(gap);
  let step = Math.max(Math.ceil(gapLength * speed * deltaTime), 1);
  if (gapLength < 1) {
    current = target;
  } else {
    current += gap > 0 ? step : -step;
  }
  return current;
}

export { randomInt, mapRange, animateToTarget };
export { AssetsLoader };
