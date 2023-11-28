async function setMangaListFilterOptions() {
	const url = 'https://www.idmzj.com/api/v1/comic1/filter_type';
	try {
		let result = [{
				label: '状态',
				name: 'status',
				options: []
			},
			{
				label: '受众',
				name: 'audience',
				options: []
			},
			{
				label: '题材',
				name: 'theme',
				options: []
			},
			{
				label: '类别',
				name: 'cate',
				options: []
			},
			{
				label: '首字母',
				name: 'firstLetter',
				options: []
			},
			{
				label: '排序',
				name: 'sortType',
				options: []
			}
		]
		const rawResponse = await window.Rulia.httpRequest({
			url: url,
			method: 'GET',
			payload: ''
		});
		const response = JSON.parse(rawResponse);
		for (var item of response.data.status) {
			result[0].options.push({
				label: item.name,
				value: item.id
			})
		}
		for (var item of response.data.audience) {
			result[1].options.push({
				label: item.name,
				value: item.id
			})
		}
		for (var item of response.data.theme) {
			result[2].options.push({
				label: item.name,
				value: item.id
			})
		}
		for (var item of response.data.cate) {
			result[3].options.push({
				label: item.name,
				value: item.id
			})
		}
		for (var item of response.data.firstLetter) {
			result[4].options.push({
				label: item.name,
				value: item.val
			})
		}
		for (var item of response.data.sortType) {
			result[5].options.push({
				label: item.name,
				value: item.id
			})
		}
		window.Rulia.endWithResult(result);
	} catch (error) {
		window.Rulia.endWithResult([])
	}
}

async function getMangaListByCategory(page, pageSize, filterOptions) {
	const url = 'https://www.idmzj.com/api/v1/comic1/filter';
	try {
		const payload = new URLSearchParams({
			channel: 'pc',
			app_name: 'dmzj',
			version: '1.0.0',
			timestamp: Date.now().toString(),
			uid: ''
		});
		payload.append('page', page.toString());
		payload.append('size', pageSize.toString());
		if (filterOptions.status) {
			payload.set('status', filterOptions.status);
		}
		if (filterOptions.audience) {
			payload.set('audience', filterOptions.audience);
		}
		if (filterOptions.theme) {
			payload.set('theme', filterOptions.theme);
		}
		if (filterOptions.cate) {
			payload.set('cate', filterOptions.cate);
		}
		if (filterOptions.firstLetter) {
			payload.set('firstLetter', filterOptions.firstLetter);
		}
		if (filterOptions.sortType) {
			payload.set('sortType', filterOptions.sortType);
		}
		const rawResponse = await window.Rulia.httpRequest({
			url: url,
			method: 'GET',
			payload: payload.toString()
		});
		const response = JSON.parse(rawResponse);
		var result = {
			list: []
		}
		for (var manga of response.data.comicList) {
			var comic = {
				title: manga.name,
				url: 'https://www.idmzj.com/info/' + manga.comic_py,
				coverUrl: manga.cover
			}
			result.list.push(comic);
		}
		window.Rulia.endWithResult(result);
	} catch (error) {
		window.Rulia.endWithException(error.message);
	}
}

async function getMangaListBySearching(page, pageSize, keyword) {
	let url = 'https://www.idmzj.com/npi/search/fuzzyWithLevel/0/';
	try {
		const payload = new URLSearchParams({
			type: 0
		});
		payload.append('page', page.toString());
		payload.append('size', pageSize.toString());
		payload.append('con', encodeURIComponent(keyword.toString()));
		const rawResponse = await window.Rulia.httpRequest({
			url: url + encodeURIComponent(keyword.toString()) + '.json',
			method: 'GET',
			payload: payload.toString()
		});
		const response = JSON.parse(rawResponse);
		var result = {
			list: []
		}
		for (var manga of response) {
			var comic = {
				title: manga.alias_name,
				url: 'https://www.idmzj.com/info/' + manga.comic_py,
				coverUrl: manga.cover
			}
			result.list.push(comic);
		}
		window.Rulia.endWithResult(result);
	} catch (error) {
		window.Rulia.endWithException(error.message);
	}
}

async function getMangaList(page, pageSize, keyword, rawFilterOptions) {
	if (keyword) {
		return await getMangaListBySearching(page, pageSize, keyword);
	} else {
		return await getMangaListByCategory(page, pageSize, JSON.parse(rawFilterOptions));
	}
}

async function getMangaData(dataPageUrl) {
	const seasonIdMatchExp = /https?:\/\/www\.idmzj\.com\/info\/(\w+)/;
	const seasonIdMatch = dataPageUrl.match(seasonIdMatchExp);
	const url = 'https://www.idmzj.com/api/v1/comic1/comic/detail';
	try {
		const payload = new URLSearchParams({
			channel: 'pc',
			app_name: 'dmzj',
			version: '1.0.0',
			timestamp: Date.now().toString(),
			uid: ''
		});
		payload.append('comic_py', seasonIdMatch[1].toString());
		const rawResponse = await window.Rulia.httpRequest({
			url: url,
			method: 'GET',
			payload: payload.toString()
		});
		const response = JSON.parse(rawResponse);
		var result = {
			title: response.data.comicInfo.title,
			description: response.data.comicInfo.description,
			coverUrl: response.data.comicInfo.cover,
			chapterList: []
		}
		if (response.data.comicInfo.chapterList != null) {
			for (var manga of response.data.comicInfo.chapterList[0].data) {
				var comic = {
					title: '[' + manga.chapter_title + '][' + (new Date(manga.updatetime * 1000)
						.toLocaleDateString(
							'zh-CN', {
								year: 'numeric',
								month: '2-digit',
								day: '2-digit',
								separator: '/'
							})) + ']',
					url: 'https://www.idmzj.com/view/' + seasonIdMatch[1] + '/' + manga.chapter_id
				}
				result.chapterList.push(comic);
			}
			result.chapterList.reverse();
		} else {
			result.description += '\n\n[因版权、国家法规等原因，动漫之家漫画网已不再提供此漫画在线观看]\n[欢迎大家继续观看其他更多精彩漫画，此漫画恢复情况请关注动漫之家漫画网]';
		}
		window.Rulia.endWithResult(result);
	} catch (error) {
		window.Rulia.endWithException(error.message);
	}
}

async function getChapterImageList(chapterUrl) {
	const [, title, chapter_id] = /view\/(.+?)\/(\d+)(?:\?.+)?$/.exec(chapterUrl) || [];
	const mangaDetailUrl = 'https://www.idmzj.com/api/v1/comic1/comic/detail';
	const url = 'https://www.idmzj.com/api/v1/comic1/chapter/detail';
	const mangaDetailPayload = new URLSearchParams({
		channel: 'pc',
		app_name: 'dmzj',
		version: '1.0.0',
		timestamp: Date.now().toString(),
		uid: '',
		comic_py: title
	});
	const mangaDetailRawResponse = await window.Rulia.httpRequest({
		url: mangaDetailUrl,
		method: 'GET',
		payload: mangaDetailPayload.toString()
	});
	const mangaDetailResponse = JSON.parse(mangaDetailRawResponse);
	const payload = new URLSearchParams({
		channel: 'pc',
		app_name: 'dmzj',
		version: '1.0.0',
		timestamp: Date.now().toString(),
		uid: '',
		comic_id: mangaDetailResponse.data.comicInfo.id,
		chapter_id: chapter_id
	});
	const rawResponse = await window.Rulia.httpRequest({
		url: url,
		method: 'GET',
		payload: payload.toString()
	});
	const response = JSON.parse(rawResponse);
	var result = [];
	for (var i = 0; i < response.data.chapterInfo.page_url_hd.length; i++) {
		result.push({
			url: response.data.chapterInfo.page_url_hd[i],
			index: i,
			width: 1,
			height: 1
		});
	}
	window.Rulia.endWithResult(result);
}

async function getImageUrl(path) {
	window.Rulia.endWithResult(path);
}
