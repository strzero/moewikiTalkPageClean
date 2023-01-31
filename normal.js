// ==UserScript==
// @name         ClearTalkPage
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://zh.moegirl.org.cn/*
// @match        https://mzh.moegirl.org.cn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=moegirl.org.cn
// @grant        none
// ==/UserScript==

$(function () {
    var deleteTagList = ['BIG', 'I', 'B'];
    var separatorList = ['—', '-'];

    var findImage = function (node) {
        if (node.tagName == 'IMG') {
            deleteImages(node);
        }
        var child = node.firstChild;
        while (child) {
            // 防止检查到其他讨论条
            if (child.tagName != 'DL') {
                findImage(child);
            }
            child = child.nextSibling;
        }
    }

    var deleteImages = function (image) {
        // if (image.height >= 22.4) {
        //     if (image.parentNode.tagName == 'SPAN' || image.parentNode.tagName == 'DIV') {
        //         image.parentNode.remove();
        //     }
        //     else {
        image.remove();
        //     }
        // }
    }

    var deleteTag = function (node) {
        var child = node.firstChild;
        while (child) {
            node.parentNode.insertBefore(child, node);
            child = child.nextSibling;
        }
        node.remove();
    }

    var clean = function (node) {
        // 将给定元素及其所有子元素的class和style全部清除
        if (node.nodeType != 3) {
            node.removeAttribute("style");
            node.removeAttribute("class");
            if (node.tagName != 'DL') {
                var child = node.firstChild;
                while (child) {
                    clean(child);

                    // 如果发现特殊标签，删除标签
                    var makeDeleteTag = false;
                    deleteTagList.forEach((value) => { if (node.tagName == value) makeDeleteTag = true; })
                    if (makeDeleteTag) {
                        var temp = child.nextSibling;
                        deleteTag(node);
                        child = temp;
                    } else {
                        child = child.nextSibling;
                    }
                }
            }
        }
    }

    var isUserLink = function (node) {
        // 检查所有子元素，查找是否有用户链接
        if (node.tagName == 'A' && (node.title.search('用户') != -1 || node.title.search(/user/gi) != -1)) {
            return true;
        }
        var child = node.firstChild;
        while (child) {
            // 如果tag是DL不继续向下检索，避免检索到其他讨论条
            if (child.tagName != 'DL' && isUserLink(child)) {
                return true;
            }
            child = child.nextSibling;
        }
        return false;
    }

    var cleanAllUserLink = function (node) {
        var child = node.firstChild;
        while (child) {
            if (isUserLink(child)) {
                clean(child);
            }
            child = child.nextSibling;
        }
    }


    var cleanFromSeparator = function (node) {
        var allClean = false;

        var child = node.firstChild;
        while (child) {
            // 如果满足下述条件，任何情况都清理触发条件之后的任何元素
            if (child.nodeType == 3) {
                separatorList.forEach((value) => { if (child.nodeValue.lastIndexOf(value) != -1) allClean = true; })

            }
            // 如果已发现分隔符，那么清除所有样式。
            if (allClean) {
                clean(child);
            }
            child = child.nextSibling;
        }

        if (allClean == false) {
            // 如果不加分割符，就清除所有用户链接的样式
            cleanAllUserLink(node);
        }

    }

    var DealSignNode = function (node) {
        // 如果时间戳在span标签内，清除span标签及子元素的任何样式。
        // if (node.parentNode.tagName == 'SPAN') {
        //     clean(node.parentNode);
        // }

        // 获取时间戳外文本上层的子元素。（防止时间戳被套Span标签）
        var parent = node.parentNode;
        while (parent.tagName != 'P' && parent.tagName != 'DD') {
            parent = parent.parentNode;
        }

        findImage(parent);
        cleanFromSeparator(parent);
    }


    var checkAllElement = function (node) {
        var regex = /[1-9]\d{3}年(?:0?[1-9]|1[012])月(?:0?[1-9]|[12]\d|3[01])日 *(?:[(（](?:[金木水火土日月]|(?:星期)?[一二三四五六日])[)）])? *(?:[01]\d|2[0-3]):(?:[0-5]\d)(?::[0-5]\d)? *[(（]([CJ]ST|UTC(?:[+-](?:[1-9]|1[012]))?)[)）]/g;
        if (node.nodeType == 3) {
            // 如果找到时间戳就进行签名样式处理
            if (node.nodeValue.match(regex)) {
                DealSignNode(node);
            }
        }
        else {
            // 不需要的元素就继续向下检查
            var child = node.firstChild;
            while (child) {
                checkAllElement(child);
                child = child.nextSibling;
            }
        }
    };

    checkAllElement(document.getElementsByClassName('mw-parser-output')[0]);
});





