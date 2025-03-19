// ==UserScript==
// @name         豆瓣原图重定向加载
// @namespace    http://github.com/lns103
// @version      1.0
// @description  访问 *.doubanio.com 的图片时，自动跳转到 img9.doubanio.com 原图，并支持点击放大/缩小
// @match        https://*.doubanio.com/view/photo/*/public/*
// @grant        GM_xmlhttpRequest
// @connect      img9.doubanio.com
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href;
    const regex = /\/public\/(p\d+\.(jpg|png))/i;
    const match = currentUrl.match(regex);
    if (match) {
        document.title = "正在加载原图"; // 仅在匹配成功后设置标题

        const filename = match[1];
        const targetUrl = 'https://img9.doubanio.com/view/photo/o/public/' + filename;
        console.log('正在重定向至原图地址：', targetUrl);

        GM_xmlhttpRequest({
            method: "GET",
            url: targetUrl,
            headers: { "Referer": "https://movie.douban.com/" },
            responseType: "blob",
            onload: function(response) {
                const blob = response.response;
                const blobUrl = URL.createObjectURL(blob);
                const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2); // 计算大小（MB）

                // 创建图片元素
                const img = document.createElement("img");
                img.src = blobUrl;
                img.style.maxWidth = "100%";
                img.style.maxHeight = "100vh"; // 限制高度适应窗口
                img.style.display = "block";
                img.style.margin = "auto";
                img.style.cursor = "zoom-in"; // 初始状态为放大

                // 变量：控制缩放
                let scale = 1;
                let originalWidth, originalHeight;
                let isLoaded = false;

                // 监听图片加载完成，获取原始尺寸
                img.onload = function() {
                    originalWidth = img.naturalWidth;
                    originalHeight = img.naturalHeight;
                    document.title = `${filename} (${originalWidth} x ${originalHeight})`;

                    // 更新下载按钮的文本，添加分辨率和大小
                    downloadLink.textContent = `⬇ 下载原图（${originalWidth} x ${originalHeight}, ${fileSizeMB}MB）`;

                    isLoaded = true;
                };

                // 监听点击，放大/缩小到鼠标位置
                img.onclick = function(event) {
                    if (!isLoaded) return;

                    const rect = img.getBoundingClientRect();
                    const ratioX = (event.clientX - rect.left) / rect.width;
                    const ratioY = (event.clientY - rect.top) / rect.height;

                    if (scale === 1) {
                        scale = Math.min(3, window.innerWidth / img.clientWidth); // 放大到 3 倍或最大适应宽度
                        img.style.maxWidth = `${originalWidth * scale}px`;
                        img.style.maxHeight = `${originalHeight * scale}px`;
                        img.style.cursor = "zoom-out"; // 变为缩小样式
                    } else {
                        scale = 1;
                        img.style.maxWidth = "100%";
                        img.style.maxHeight = "100vh";
                        img.style.cursor = "zoom-in"; // 变为放大样式
                    }

                    adjustScrollPosition(ratioX, ratioY);
                };

                // 调整滚动条位置，使得点击后鼠标位置保持在原点
                function adjustScrollPosition(ratioX, ratioY) {
                    const newWidth = img.clientWidth;
                    const newHeight = img.clientHeight;

                    const scrollX = ratioX * newWidth - window.innerWidth / 2;
                    const scrollY = ratioY * newHeight - window.innerHeight / 2;

                    window.scrollTo(scrollX, scrollY);
                }

                // 下载按钮
                const downloadLink = document.createElement("a");
                downloadLink.href = blobUrl;
                downloadLink.download = filename;
                downloadLink.textContent = "⬇ 下载原图"; // 先设置基础文本，后续加载完成再更新
                downloadLink.style.position = "fixed";
                downloadLink.style.top = "20px";
                downloadLink.style.right = "20px";
                downloadLink.style.background = "rgba(0, 0, 0, 0.6)";
                downloadLink.style.color = "#fff";
                downloadLink.style.padding = "10px 15px";
                downloadLink.style.borderRadius = "5px";
                downloadLink.style.textDecoration = "none";
                downloadLink.style.fontSize = "14px";
                downloadLink.style.cursor = "pointer";
                downloadLink.style.zIndex = "1000";

                // 清空页面并添加图片和下载按钮
                document.body.innerHTML = "";
                document.body.style.overflow = "auto"; // 允许滚动
                document.body.appendChild(img);
                document.body.appendChild(downloadLink);
            },
            onerror: function(err) {
                console.error('加载原图失败：', err);
                document.title = "加载原图失败";
            }
        });
    }
})();
