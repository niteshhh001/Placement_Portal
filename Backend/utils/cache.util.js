const NodeCache = require("node-cache");

// Cache with different TTLs (time to live in seconds)
const cache = new NodeCache({
  stdTTL: 300,        // default 5 minutes
  checkperiod: 60,    // check for expired keys every 60 seconds
  useClones: false,   // better performance
});

// Cache keys
const CACHE_KEYS = {
  STATS: "admin_stats",
  ALL_JOBS: "all_jobs",
  OPEN_JOBS: "open_jobs",
  ALL_STUDENTS: "all_students",
};

// TTL values in seconds
const TTL = {
  STATS: 300,       // 5 minutes
  JOBS: 120,        // 2 minutes
  STUDENTS: 180,    // 3 minutes
};

// Performance tracker
const performanceLog = [];

const trackPerformance = (key, duration, fromCache) => {
  performanceLog.push({
    key,
    duration,
    fromCache,
    timestamp: new Date(),
  });

  // Keep only last 100 entries
  if (performanceLog.length > 100) {
    performanceLog.shift();
  }

  const source = fromCache ? "CACHE ⚡" : "DATABASE 🔄";
  console.log(`[${source}] ${key}: ${duration}ms`);
};

const getPerformanceStats = () => {
  if (performanceLog.length === 0) return null;

  const dbRequests = performanceLog.filter((p) => !p.fromCache);
  const cacheRequests = performanceLog.filter((p) => p.fromCache);

  const avgDb = dbRequests.length
    ? Math.round(dbRequests.reduce((a, b) => a + b.duration, 0) / dbRequests.length)
    : 0;

  const avgCache = cacheRequests.length
    ? Math.round(cacheRequests.reduce((a, b) => a + b.duration, 0) / cacheRequests.length)
    : 0;

  const speedImprovement = avgDb && avgCache
    ? Math.round(((avgDb - avgCache) / avgDb) * 100)
    : 0;

  return {
    totalRequests: performanceLog.length,
    dbRequests: dbRequests.length,
    cacheRequests: cacheRequests.length,
    cacheHitRate: performanceLog.length
      ? Math.round((cacheRequests.length / performanceLog.length) * 100)
      : 0,
    avgDbTime: avgDb,
    avgCacheTime: avgCache,
    speedImprovement: `${speedImprovement}%`,
    recentLogs: performanceLog.slice(-10).reverse(),
  };
};

// Cache wrapper function
const withCache = async (key, ttl, fetchFn, req = null) => {
  const start = Date.now();

  // Check cache first
  const cached = cache.get(key);
  if (cached !== undefined) {
    const duration = Date.now() - start;
    trackPerformance(key, duration, true);
    return cached;
  }

  // Fetch from database
  const data = await fetchFn();
  const duration = Date.now() - start;
  trackPerformance(key, duration, false);

  // Store in cache
  cache.set(key, data, ttl);

  return data;
};

// Invalidate cache by key or pattern
const invalidateCache = (...keys) => {
  keys.forEach((key) => {
    cache.del(key);
    console.log(`[CACHE] Invalidated: ${key}`);
  });
};

// Invalidate all cache
const invalidateAll = () => {
  cache.flushAll();
  console.log("[CACHE] All cache cleared");
};

module.exports = {
  cache,
  CACHE_KEYS,
  TTL,
  withCache,
  invalidateCache,
  invalidateAll,
  getPerformanceStats,
};