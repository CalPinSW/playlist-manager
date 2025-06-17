async function executeWithRetries<T>(fn: () => Promise<T>, retries: number = 3, delayMs: number = 2000): Promise<T> {
  let lastError: Error;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  }
  throw lastError;
}

export default executeWithRetries;
