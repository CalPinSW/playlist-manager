import { openInNewTab } from ".";

export const backendUrl = `http://${process.env.HOST}:${process.env.BACKEND_PORT}`;

export enum RequestMethod {
  GET = "get",
  POST = "post",
}

export const jsonRequest = async <I, O>(
  endpoint: string,
  method: RequestMethod = RequestMethod.GET,
  data?: I,
  redirectOnUnauthorized = true
) => {
  let fetchOptions: RequestInit = { credentials: "include" };
  switch (method) {
    case RequestMethod.POST:
      fetchOptions = {
        ...fetchOptions,
        method: method,
        credentials: "include",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      };
  }
  const response = await fetch(`${backendUrl}/${endpoint}`, fetchOptions);
  if (response.status === 401 && redirectOnUnauthorized) {
    const refresh_response = await fetch(
      `${backendUrl}/auth/refresh-user-code`,
      { credentials: "include" }
    );
    if (refresh_response.status != 401) {
      const retried_response = await fetch(
        `${backendUrl}/${endpoint}`,
        fetchOptions
      );
      return retried_response.json().then((data: any) => data as O);
    } else {
      openInNewTab(
        `http://${process.env.HOST}:${process.env.FRONTEND_PORT}/login`
      );
    }
  }
  const apiResponse = response.json().then((data: any) => data as O);
  return apiResponse;
};
