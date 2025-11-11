/**
 * 任务队列管理器
 * 支持最多同时执行 maxConcurrent 个任务
 */

export interface QueueTask {
  id: string;
  execute: () => Promise<unknown>;
}

export interface QueueStatus {
  running: number;
  waiting: number;
  completed: number;
  failed: number;
}

export class TaskQueue {
  private maxConcurrent: number;
  private running: number = 0;
  private queue: QueueTask[] = [];
  private completed: number = 0;
  private failed: number = 0;
  private statusListeners: Set<(status: QueueStatus) => void> = new Set();
  private taskResultMap: Map<string, unknown> = new Map();

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * 添加任务到队列
   */
  public enqueue(task: QueueTask): void {
    this.queue.push(task);
    this.notifyStatusChange();
    this.process();
  }

  /**
   * 批量添加任务
   */
  public enqueueBatch(tasks: QueueTask[]): void {
    this.queue.push(...tasks);
    this.notifyStatusChange();
    this.process();
  }

  /**
   * 处理队列中的任务
   */
  private async process(): Promise<void> {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) break;

      this.running++;
      this.notifyStatusChange();

      try {
        const result = await task.execute();
        this.taskResultMap.set(task.id, result);
        this.completed++;
      } catch (error) {
        this.failed++;
        // 记录错误但继续处理其他任务
        console.error(`任务 ${task.id} 失败:`, error);
      } finally {
        this.running--;
        this.notifyStatusChange();
        // 继续处理下一个任务
        if (this.queue.length > 0) {
          this.process();
        }
      }
    }
  }

  /**
   * 订阅队列状态变化
   */
  public onStatusChange(listener: (status: QueueStatus) => void): () => void {
    this.statusListeners.add(listener);
    // 返回取消订阅函数
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * 获取当前队列状态
   */
  public getStatus(): QueueStatus {
    return {
      running: this.running,
      waiting: this.queue.length,
      completed: this.completed,
      failed: this.failed,
    };
  }

  /**
   * 获取任务结果
   */
  public getTaskResult(taskId: string): unknown {
    return this.taskResultMap.get(taskId);
  }

  /**
   * 重置队列
   */
  public reset(): void {
    this.queue = [];
    this.running = 0;
    this.completed = 0;
    this.failed = 0;
    this.taskResultMap.clear();
    this.notifyStatusChange();
  }

  /**
   * 通知状态变化
   */
  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('状态监听器错误:', error);
      }
    });
  }

  /**
   * 等待所有任务完成
   */
  public async waitAll(): Promise<void> {
    return new Promise(resolve => {
      if (this.running === 0 && this.queue.length === 0) {
        resolve();
        return;
      }

      const checkCompletion = () => {
        if (this.running === 0 && this.queue.length === 0) {
          resolve();
        } else {
          setTimeout(checkCompletion, 100);
        }
      };

      checkCompletion();
    });
  }
}

/**
 * 创建一个全局任务队列实例
 */
export const createQueue = (maxConcurrent: number = 3): TaskQueue => {
  return new TaskQueue(maxConcurrent);
};
