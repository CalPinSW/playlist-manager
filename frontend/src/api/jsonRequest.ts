import { openInNewTab } from ".";

export const backendUrl = process.env.BACKEND_URL;

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
      openInNewTab(`${process.env.FRONTEND_URL}/login`);
    }
  }
  const apiResponse = response.json().then((data: any) => data as O);
  return apiResponse;
};
