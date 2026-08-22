export async function onRequest({ request, env }) {
	const url = new URL(request.url);
	const kakaoUrl = new URL("https://dapi.kakao.com/v3/search/book");
	kakaoUrl.search = url.search;

	const response = await fetch(kakaoUrl.toString(), {
		headers: {
			Authorization: `KakaoAK ${env.VITE_KAKAO_API_KEY}`,
		},
	});

	const data = await response.json();

	return new Response(JSON.stringify(data), {
		status: response.status,
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": "*",
		},
	});
}
