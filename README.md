# 每日新闻制图 / Daily News Studio

[自动新闻版 / Automatic news](https://xialin99.github.io/makefun-news-studio/) · [手动录入版 / Manual editor](https://xialin99.github.io/makefun-news-studio/manual/)

## 中文 · 第一次使用

自动版可按日期读取来源。在[手动版](https://xialin99.github.io/makefun-news-studio/manual/)，可以录入或导入 UTF-8 TXT，单独在浏览器里制图。

1. [打开在线工具](https://xialin99.github.io/makefun-news-studio/)。打开时会尝试加载今天的新闻。
2. 想看历史日期，在日历里选日期，点击 **加载新闻**。首次试用可点击 **2026-11-20** 或 **2026-11-21**，这两个离线样例随项目附带。
3. 每张图最多选六条。检查右侧预览后，点击 **下载 PNG**。图片保存到浏览器的下载位置。
4. 当天的资料暂未收录或网络无法连接时，可以展开 **手动录入新闻**，每行写一个标题，再点击 **使用这些新闻**。

右上角可以切换 **English**。新闻正文按资料来源显示，英文档案回退会在界面提示。Wikipedia 按档案日期，GDELT 按用户本地时区的索引收录日期。数据覆盖因日期、语言和来源而异。编辑与生成 PNG 在浏览器里完成。

## English · First use

Use automatic lookup by date, or open the [manual editor](https://xialin99.github.io/makefun-news-studio/manual/) to type or import a UTF-8 TXT file and render it locally.

1. [Open Daily News Studio](https://xialin99.github.io/makefun-news-studio/). It tries to load today’s stories on opening.
2. Pick another date and choose **Load news**. Use either dated offline example for a quick first run.
3. Select up to six stories, check the preview, and choose **Download PNG**.
4. If a source has no coverage or a connection fails, expand **Enter your own stories**. Add one title per line and choose **Use these stories**.

News follows the source language. Wikipedia uses its archive date. GDELT indexes stories in a date range based on your browser’s local time zone. Coverage can vary. The browser renders the PNG locally.

## 本地运行 / Run locally

有 Python 3 时，在解压后的项目目录运行 `python -m http.server 8080`，再打开 `http://localhost:8080`。在线版无需安装。

With Python 3, run `python -m http.server 8080` in the extracted project folder, then open `http://localhost:8080`.

## 资料与许可 / Sources and licensing

- [Wikipedia’s current events archive](https://en.wikipedia.org/wiki/Portal:Current_events) and [中文维基百科新闻动态](https://zh.wikipedia.org/wiki/Portal:新聞動態)。Wikipedia 内容带原页出处，适用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。
- [GDELT Article List RSS](https://blog.gdeltproject.org/announcing-the-gdelt-article-list-rss-feed/) 提供定时更新的「今天」备用收录；缓存保留原文标题、报道链接和收录时间。 / The dated backup uses the public GDELT Article List RSS and retains source headlines, links and index timestamps.
- [GDELT DOC API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/)。索引结果链接到原发布者，报道及标题的权利归相应权利人。
- [11 月 20 日参赛原稿](https://github.com/xialin99/makefun-world-news-2026-11-20) · [11 月 21 日参赛原稿](https://github.com/xialin99/makefun-world-ledger-2026-11-21)。
- 项目代码使用 [MIT 许可证](LICENSE) / Project code is [MIT licensed](LICENSE).
