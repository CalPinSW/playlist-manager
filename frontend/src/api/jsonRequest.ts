import { openInNewTab } from ".";

export const backendUrl = process.env.BACKEND_URL;
export const useCors = process.env.USE_CORS;

export enum RequestMethod {
	GET = "get",
	POST = "post",
	PUT = "put",
}

export const jsonRequest = async <I, O>(
	endpoint: string,
	method: RequestMethod = RequestMethod.GET,
	data?: I,
	redirectOnUnauthorized = true,
) => {
	let fetchOptions: RequestInit = useCors ? { credentials: "include", mode: "cors" } : {credentials: "include"};
	switch (method) {
		case RequestMethod.POST:
		case RequestMethod.PUT:
			fetchOptions = {
				...fetchOptions,
				method: method,
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
			fetchOptions,
		);
		if (refresh_response.status != 401) {
			const retried_response = await fetch(
				`${backendUrl}/${endpoint}`,
				fetchOptions,
			);
			return retried_response.json().then((data) => data as O);
		} else {
			openInNewTab(`/login`);
		}
	}
	const apiResponse = response.json().then((data) => data as O);
	return apiResponse;
};

export const request = async <I>(
	endpoint: string,
	method: RequestMethod = RequestMethod.GET,
	data?: I,
	redirectOnUnauthorized = true,
) => {
	let fetchOptions: RequestInit = useCors ? { credentials: "include", mode: "cors" } : {credentials: "include"};
	switch (method) {
		case RequestMethod.POST:
		case RequestMethod.PUT:
			fetchOptions = {
				...fetchOptions,
				method: method,
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
			fetchOptions
		);
		if (refresh_response.status != 401) {
			const retried_response = await fetch(
				`${backendUrl}/${endpoint}`,
				fetchOptions,
			);
			return retried_response;
		} else {
			openInNewTab(`/login`);
		}
	}
	const apiResponse = response;
	return apiResponse;
};
