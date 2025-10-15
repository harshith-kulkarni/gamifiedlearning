/**
 * Resource monitoring utilities for PDF upload performance
 */

export interface ResourceMetrics {
  timestamp: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  performanceTiming?: {
    navigationStart?: number;
    loadEventEnd?: number;
    domContentLoaded?: number;
  };
}

export class ResourceMonitor {
  private metrics: ResourceMetrics[] = [];
  private monitoring = false;
  private intervalId?: NodeJS.Timeout;

  /**
   * Get current memory usage (browser only)
   */
  private getMemoryUsage() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }

  /**
   * Get performance timing information
   */
  private getPerformanceTiming() {
    if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      return {
        navigationStart: timing.navigationStart,
        loadEventEnd: timing.loadEventEnd,
        domContentLoaded: timing.domContentLoadedEventEnd
      };
    }
    return undefined;
  }

  /**
   * Start monitoring resources
   */
  startMonitoring(intervalMs: number = 1000): void {
    if (this.monitoring) {
      return;
    }

    this.monitoring = true;
    this.metrics = [];

    this.intervalId = setInterval(() => {
      const metric: ResourceMetrics = {
        timestamp: Date.now(),
        memoryUsage: this.getMemoryUsage(),
        performanceTiming: this.getPerformanceTiming()
      };

      this.metrics.push(metric);

      // Keep only last 100 measurements to prevent memory bloat
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }
    }, intervalMs);

    console.log('📊 Resource monitoring started');
  }

  /**
   * Stop monitoring resources
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.monitoring = false;
    console.log('📊 Resource monitoring stopped');
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): ResourceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get all collected metrics
   */
  getAllMetrics(): ResourceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats() {
    if (this.metrics.length === 0) {
      return null;
    }

    const memoryUsages = this.metrics.map(m => m.memoryUsage.used);
    const min = Math.min(...memoryUsages);
    const max = Math.max(...memoryUsages);
    const avg = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;

    return {
      min: min / 1024 / 1024, // Convert to MB
      max: max / 1024 / 1024,
      avg: avg / 1024 / 1024,
      current: (this.getCurrentMetrics()?.memoryUsage.used || 0) / 1024 / 1024
    };
  }

  /**
   * Check if memory usage is concerning
   */
  isMemoryUsageHigh(): boolean {
    const current = this.getCurrentMetrics();
    return current ? current.memoryUsage.percentage > 80 : false;
  }

  /**
   * Generate monitoring report
   */
  generateReport(): string {
    const stats = this.getMemoryStats();
    const current = this.getCurrentMetrics();

    if (!stats || !current) {
      return 'No monitoring data available';
    }

    return `
# Resource Monitoring Report

## Memory Usage Statistics
- **Current**: ${stats.current.toFixed(2)} MB (${current.memoryUsage.percentage.toFixed(1)}%)
- **Average**: ${stats.avg.toFixed(2)} MB
- **Peak**: ${stats.max.toFixed(2)} MB
- **Minimum**: ${stats.min.toFixed(2)} MB

## Performance Status
- **Memory Status**: ${this.isMemoryUsageHigh() ? '⚠️ HIGH' : '✅ NORMAL'}
- **Monitoring Duration**: ${this.metrics.length} measurements
- **Data Points**: ${this.metrics.length > 0 ? 
    `${new Date(this.metrics[0].timestamp).toLocaleTimeString()} - ${new Date(current.timestamp).toLocaleTimeString()}` : 
    'N/A'}

## Recommendations
${this.isMemoryUsageHigh() ? 
  '- Consider reducing file size or processing in smaller chunks\n- Monitor for memory leaks\n- Consider implementing cleanup routines' :
  '- Memory usage is within normal limits\n- System is performing well'}
`;
  }

  /**
   * Clear all collected metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// Global instance for easy access
export const resourceMonitor = new ResourceMonitor();