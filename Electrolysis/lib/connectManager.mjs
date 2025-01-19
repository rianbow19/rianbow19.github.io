export class ConnectManager {
  constructor() {
    this.connections = new Map(); // 存儲所有連接關係
    this.activeConnection = null; // 當前正在建立的連接
  }

  // 檢查連接是否有效
  validateConnection(objA, objB) {
    // 根據不同模組檢查連接規則
    return true;
  }

  // 建立連接
  createConnection(pointA, pointB) {
    // 建立物件間的連接，更新連接狀態
  }

  // 斷開連接
  breakConnection(connection) {
    // 移除連接，更新相關物件狀態
  }
}

export const ConnectionPointsConfig = {
  燒杯: [
    { x: -50, y: 0 },
    { x: 50, y: 0 },
    { x: 0, y: -50 },
    { x: 0, y: 50 },
  ],
  電線: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
  電池: [
    { x: -80, y: 0 },
    { x: 80, y: 0 },
  ],
  燈泡: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
  廣用試紙: [
    { x: -50, y: -50 },
    { x: 50, y: 50 },
  ],
  碳棒: [
    { x: 0, y: -50 },
    { x: 0, y: 50 },
  ],
  銅片: [
    { x: 0, y: -50 },
    { x: 0, y: 50 },
  ],
  鋅片: [
    { x: 0, y: -50 },
    { x: 0, y: 50 },
  ],
  U型管: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
  檢流計: [
    { x: -30, y: 0 },
    { x: 30, y: 0 },
  ],
  鋅銅電池雙燒杯: [
    { x: -50, y: 0 },
    { x: 50, y: 0 },
    { x: 0, y: -50 },
    { x: 0, y: 50 },
  ],
  鋅銅電池組合: [
    { x: -50, y: 0 },
    { x: 50, y: 0 },
    { x: 0, y: -50 },
    { x: 0, y: 50 },
  ],
};
