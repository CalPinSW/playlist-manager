// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseRequestBody = async (request: Request): Promise<any> => {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 0) {
    return await request.json();
  } else {
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseRequestBodyBetter = async (request: Request): Promise<any> => {
  const contentLength = request.headers.get('content-length');
  console.log('Content-Length:', contentLength);
  if (contentLength && parseInt(contentLength) > 0) {
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await request.json();
    } else if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      const data: Record<string, string> = {};
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });
      return data;
    } else {
      throw new Error('Unsupported content type');
    }
  } else {
    return null;
  }
};
