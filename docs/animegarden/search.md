# 高级搜索

> 👷‍♂️ 文档内容仍在建设中。

在搜索框，支持以下几种高级指令:

+ **标题匹配**：
  + `标题:xxx`：返回的每一条结果的标题必须**匹配其指定的某一个关键词**
  + `包含:xxx` 或者 `+xxx`：返回的每一条结果的标题必须**匹配其指定的所有关键词**
  + `排除:xxx` 或者 `-xxx`：返回的每一条结果的标题不能包含**其指定的所有关键词**
+ `fansub:xxx`：返回某一字幕组的所有结果
+ `after:xxx`：返回结果的创建时间在 `xxx` **之后**
+ `before:xxx`：返回结果的创建时间在 `xxx` **之前**

## 标题匹配

AnimeGarden 使用了**两套搜索策略**：

+ 如果你不使用**标题匹配指令**，AnimeGarden 将会根据你的输入，使用**搜索引擎**进行**模糊匹配**
+ 使用**标题匹配指令**，AnimeGarden 将会依照对应的逻辑，筛选结果

举例来说：

`标题:葬送的芙莉莲`，将会匹配所有**标题包含** _"葬送的芙莉莲"_ 的条目。

`标题:葬送的芙莉莲 标题:"Sousou no Frieren"`，将会匹配所有**标题包含** _"葬送的芙莉莲"_ **或者** _"Sousou no Frieren"_ 的条目。

`标题:葬送的芙莉莲 标题:"Sousou no Frieren" 包含:简体内嵌 包含:桜都字幕组`，将会匹配所有**标题包含** _"葬送的芙莉莲"_ **或者** _"Sousou no Frieren"_，并且**标题包含** _"简体内嵌"_ **和** _"桜都字幕组"_ 的条目。

`标题:葬送的芙莉莲 标题:"Sousou no Frieren" 包含:简体内嵌 包含:桜都字幕组 排除:繁`，将会匹配所有**标题包含** _"葬送的芙莉莲"_ **或者** _"Sousou no Frieren"_，并且**标题包含** _"简体内嵌"_ **和** _"桜都字幕组"_，并且**标题不包含** _"繁"_ 的条目。

如果你对数理逻辑比较熟悉, 你可以理解为（省略了字符串包含）：

```text
(标题1 OR 标题2 OR ...) AND (包含1 AND 包含2 AND ...) AND (not 排除1 AND not 排除2 AND ...)
```

## 结合字幕组和类型筛选器

下面以 "葬送的芙莉莲" 为例, 介绍如何一步步地筛选出你想要的资源。

首先，**输入一个标题关键词 "葬送的芙莉莲"**，进行初步地模糊检索。

![模糊检索](/search-1.png)

然后, 你注意到了 "桜都字幕组" 字幕组, 你想要进一步筛选它的结果，你可以直接**点击右边任何一个 "桜都字幕组" 按钮**。

![字幕组筛选](/search-2.png)

![字幕组筛选结果](/search-3.png)

最后，你发现返回的结果中包含简体和繁体两种，你现在可以使用标题匹配的关键词来进一步筛选，你可以在**搜索框输入** "葬送的芙莉莲 字幕组:桜都字幕组 **+简体内嵌**"。

![最终结果](/search-4.png)

在检索过程中，你可以结合使用**搜索框的标题搜索或者匹配**，也可以**点击字幕组或者类型**，来进一步筛选结果。