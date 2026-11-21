# 每日新闻制图 / Daily News Studio

## 中文 · 第一次使用

1. [打开网页工具](https://xialin99.github.io/makefun-news-studio/)。无需安装或登录。
2. 选择图片日期，默认是今天。想先看效果，可以点击 **试用虚构示例**。
3. 在文本框每行输入一条自己整理的标题，或点 **导入 TXT** 选择 UTF-8 纯文本文件。想附来源，写成 `标题 | https://example.com/story`。最多 12 条，每张图可选 6 条。
4. 点击 **生成预览**，勾选想保留的标题，再点 **下载 PNG**。图片会保存到浏览器的下载文件夹。

界面默认中文，右上角可切换 **English**。手动输入、文件读取和制图都在浏览器完成。公开版不自动抓取、缓存或展示第三方新闻。导入和发布图片时，请使用自己有权分享的内容。

## English · First use

1. [Open the browser tool](https://xialin99.github.io/makefun-news-studio/). No install or account is required.
2. Choose a poster date. It defaults to today. Select **Try fictional examples** to see a sample.
3. Enter one headline per line, or choose **Import TXT** to open a UTF-8 text file. Add an optional source in the form `Headline | https://example.com/story`. Enter up to 12 headlines and choose up to 6 to include.
4. Select **Generate preview**, choose the headlines, then **Download PNG**. Find the image in your browser’s downloads.

The editor reads files and creates the image in your browser. The public app does not collect, cache, or display third-party news automatically. Use content you have the right to share.

## 本地运行 / Run locally

安装 Python 3，在解压后的项目目录运行 `python -m http.server 8080`，再访问 `http://localhost:8080`。

With Python 3 installed, run `python -m http.server 8080` in the extracted project folder, then open `http://localhost:8080`.

## 许可证 / License

项目代码使用 [MIT 许可证](LICENSE)。导入内容的许可取决于其权利人。 / The software is [MIT licensed](LICENSE). Imported content remains subject to its own rights.
