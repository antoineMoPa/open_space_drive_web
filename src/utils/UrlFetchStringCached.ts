
export default class URLFetchStringCached {
    private static resultMapByUrl = {};
    static async getUrl(url) {
        if (url in URLFetchStringCached.resultMapByUrl) {
            return URLFetchStringCached.resultMapByUrl[url];
        }
        URLFetchStringCached.resultMapByUrl[url] = new Promise(async (resolve) => {
            const result = await fetch(url);
            const text = await result.text();
            URLFetchStringCached.resultMapByUrl[url] = text;
            resolve(text);
        });

        return URLFetchStringCached.resultMapByUrl[url];
    }
}
