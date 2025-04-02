/**
 * 简单的事件总线实现
 * 用于组件间通信
 */

class EventEmitter {
  constructor() {
    this.events = {};
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    
    // 返回取消订阅函数
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {any} payload - 传递的数据
   */
  emit(event, payload) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => {
      callback(payload);
    });
  }

  /**
   * 清除所有事件监听器
   */
  clear() {
    this.events = {};
  }
}

// 创建并导出事件总线实例
const eventBus = new EventEmitter();
export default eventBus; 