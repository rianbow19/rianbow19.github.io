class ExperimentObject {
  constructor(type, initialPosition) {
    this.type = type;
    this.position = initialPosition;
    this.connections = []; // 存儲所有連接點
    this.connectedTo = new Map(); // 追踪與其他物件的連接關係
    this.sprite = null;
    this.connectionPoints = []; // 連接點的視覺元素
  }
}

// 3. 實驗模組基類
class ExperimentModule {
  constructor() {
    this.objects = new Set(); // 當前模組中的所有物件
    this.connectionRules = new Map(); // 定義允許的連接規則
  }

  // 檢查實驗條件
  checkExperimentConditions() {
    // 檢查實驗所需的連接和配置是否正確
  }

  // 執行實驗效果
  executeExperiment() {
    // 根據連接狀態執行對應的實驗效果
  }
}

// 4. 具體實驗模組實現
class ElectrolysisModule extends ExperimentModule {
  constructor() {
    super();
    this.setupRules();
  }

  setupRules() {
    // 設置電解實驗的特定規則
  }
}

// 5. 視覺效果管理器
class VisualEffectManager {
  constructor() {
    this.lines = new Map(); // 存儲所有連接線
    this.connectionPoints = new Map(); // 存儲連接點視覺元素
  }

  // 繪製連接線
  drawConnection(startPoint, endPoint, type = "wire") {
    // 使用 Graphics 繪製連接線和端點
  }

  // 更新連接點外觀
  updateConnectionPoint(point, status) {
    // 更新連接點的視覺狀態（如高亮、選中等）
  }
}

// 6. 主要控制器
class ExperimentController {
  constructor(moduleType) {
    this.connectionManager = new ConnectionManager();
    this.visualManager = new VisualEffectManager();
    this.currentModule = this.createModule(moduleType);
    this.draggingState = null;
  }

  // 處理拖曳開始
  handleDragStart(event, object) {
    // 處理物件拖曳邏輯
  }

  // 處理連接點互動
  handleConnectionPoint(point) {
    // 處理連接點的點擊和懸停事件
  }

  // 更新實驗狀態
  updateExperiment() {
    // 定期檢查並更新實驗狀態
  }
}

class EventSystem {
  constructor() {
    this.listeners = new Map();
  }

  // 註冊事件監聽器
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // 觸發事件
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }
}

export { ExperimentObject, ExperimentModule, ElectrolysisModule, VisualEffectManager, ExperimentController };
