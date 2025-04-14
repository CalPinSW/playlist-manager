export const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
export const useCors = process.env.EXPO_PUBLIC_USE_CORS;

export enum RequestMethod {
	GET = "get",
	POST = "post",
	PUT = "put",
}

export const openInNewTab = (url: string) => {
	const newWindow = window.open(url, "_self", "noopener,noreferrer");
	if (newWindow) newWindow.opener = null;
};

export const jsonRequest = async <I, O>(
	endpoint: string,
	method: RequestMethod = RequestMethod.GET,
	data?: I,
	headers?: HeadersInit,
	redirectOnUnauthorized = true,
) => {
	let fetchOptions: RequestInit = { credentials: "include", headers };
	switch (method) {
		case RequestMethod.POST:
		case RequestMethod.PUT:
			fetchOptions = {
				...fetchOptions,
				method: method,
				credentials: "include",
				mode: "cors",
				headers: {
					"Content-Type": "application/json",
					...fetchOptions.headers
				},
				body: JSON.stringify(data),
			};
	}
	const response = await fetch(`${backendUrl}/${endpoint}`, fetchOptions);
	if (response.status === 401 && redirectOnUnauthorized) {
		const refresh_response = await fetch(
			`${backendUrl}/auth/refresh-user-code`,
			{ credentials: "include" },
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
	headers?: HeadersInit,
	redirectOnUnauthorized = true,
) => {
	let fetchOptions: RequestInit = { credentials: "include", headers };
	switch (method) {
		case RequestMethod.POST:
		case RequestMethod.PUT:
			fetchOptions = {
				...fetchOptions,
				method: method,
				credentials: "include",
				mode: "cors",
				headers: {
					"Content-Type": "application/json",
					...fetchOptions.headers
				},
				body: JSON.stringify(data),
			};
	}
	const response = await fetch(`${backendUrl}/${endpoint}`, fetchOptions);
	if (response.status === 401 && redirectOnUnauthorized) {
		const refresh_response = await fetch(
			`${backendUrl}/auth/refresh-user-code`,
			{ credentials: "include" },
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
