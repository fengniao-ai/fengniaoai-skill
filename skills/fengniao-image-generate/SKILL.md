---
name: fengniao-image-generate
description: >-
  蜂鸟AI 生图的生成与设计能力。0 门槛用一句话生成图片，也可以参考现有图片换背景、
  换场景、改风格、保持人物或商品主体，扩展画面和转换横竖比例，并生成 2K/4K
  高清版本。当用户说“帮我生成一张图”“照这张图改一下”“把背景换成…”
  “扩成 16:9”“做成高清/2K/4K”，或需要海报、封面、商品场景图时使用。
---

# 蜂鸟AI 图片生成

使用共享 CLI `../../scripts/fengniaoai.mjs`。所有 action 都调用 `/api/v1/img/generate`。

## 选择 action

- 不需要源图时使用 `image generate`。
- 参考图改图、换场景、保持商品/人物或风格变化时使用 `image transform`。
- 需要更宽、更高或不同画幅时使用 `image expand`。
- 需要 2K/4K 生成式高清重绘时使用 `image enhance`，不能称为无损超分。

## 互动引导

只有用户只说“想生图”而没有具体目标时，才提供下面四类选择；用户已经说清目标时直接进入对应 action：

| 用户想得到的结果 | 友好引导 | Action |
| --- | --- | --- |
| 从零做一张新图 | “说说想要的主体、场景或用途，一句话就可以。” | `generate` |
| 参考现有图片修改 | “请提供一张或多张本地图片或 HTTPS 参考图，并告诉我哪些要保留、哪些要改变。” | `transform` |
| 补全画面或转换横竖比例 | “请提供本地原图或 HTTPS 图片，再告诉我想要横版、竖版、方图或具体比例。” | `expand` |
| 提升到 2K/4K | “请提供本地原图或 HTTPS 图片；没有指定时我先按 2K 高清增强处理。” | `enhance` |

遵守以下对话节奏：

1. 每次只问一到两个关键信息，不询问模型名称。
2. `generate` 缺少具体画面时，优先问主体或用途；用户给出其中一项后，由 Agent 补全合理的场景、构图和光线，不继续做风格问卷。
3. `transform` 的关键不是泛泛询问“想怎么改”，而是确认“必须保留什么、需要改变什么”。商品名称、包装文字、人物身份或品牌元素只有用户明确要求保持时才写入保留项。
4. `expand` 未给具体比例但表达明确时可直接映射：方图 `1:1`、横版 `16:9`、普通竖版 `3:4`、全屏竖版 `9:16`；无法判断用途时再追问一次。
5. `enhance` 未指定清晰度时默认 2K，不追问；用户明确要求 4K 时直接使用 4K，并提示这是生成式高清重绘。
6. 用户要求图片内出现准确文案时，将其作为精确文本写进提示词，不擅自改写，也不编造商品功效、折扣或品牌信息。

执行前使用一句自然语言确认结果，例如：“好的，我会保留商品和包装文字，把背景换成清爽的夏日海边，并保持原图比例。”不要向用户展示内部提示词、action 或模型别名。

## 补齐参数

1. `generate` 和 `transform` 必须有提示词。
2. `transform`、`expand` 和 `enhance` 必须有源图，最多支持六张参考图；多图按“主图 → 侧面/背面 → 细节 → 风格参考”的顺序提供。本地图片由 CLI 自动直传，不要求用户处理上传步骤或重复描述任务。
3. 多张参考图可使用 `reference_images` 数组，也兼容 `image` 数组和 `reference_image_urls`；不要混用本地文件与 HTTPS URL。第一张作为主体和 `original` 比例基准，其余图片只补充用户明确的角度、结构、材质或风格信息。
4. 需要明确职责时传入与图片数量一致的 `reference_roles`，例如 `["商品正面主图", "包装背面文字", "材质细节"]`；CLI 会把职责按编号写入 Prompt，同时保持上传后的 key 顺序不变。
5. 只有目标版式不明确时才追问比例。文生图默认 `1:1`，保持源图的改图/增强默认 `original`。
6. 不要求普通用户选择模型别名，按意图选择：
   - `tpro-1k`：默认视觉设计、海报、封面、文字排版或复杂构图。
   - `tpro-2k`：更高分辨率的视觉设计。
   - `pro-1k`：保持商品/人物的参考图改图。
   - `pro-2k`：2K 生成式高清增强。
   - `pro-4k`：4K 生成式高清增强。
7. 每次请求固定生成一张；多张结果必须拆成多个新 `request_id` 的请求。多任务执行前建立清单，记录“任务编号、用途、Prompt 版本、参考图顺序、比例、request_id、结果路径”；只重做指定任务，其他任务不重复提交。

多任务不是一次接口调用：每张图片独立计费、独立重试和独立结果。执行前先确认总张数与点数；同一套参考图可复用，但每个任务必须保持相同顺序和一致性基线。用户说“重做第 N 张”时，复用该任务的参考图与 Prompt，只应用新增修改并使用新的 `request_id`，执行前提示会再次消耗点数。

选择模型、比例或处理参考图与重试前，读取 `../../references/image-generation.md`。

## 执行

```bash
node ../../scripts/fengniaoai.mjs image generate --input-json '{"prompt":"A clean product hero image","aspect_ratio":"1:1"}'
node ../../scripts/fengniaoai.mjs image transform --input-json '{"image":"https://example.com/product.jpg","prompt":"Place the product in a clean studio scene"}'
node ../../scripts/fengniaoai.mjs image expand --input-json '{"image":"https://example.com/product.jpg","aspect_ratio":"16:9"}'
node ../../scripts/fengniaoai.mjs image enhance --input-json '{"image":"https://example.com/product.jpg","resolution":"4k"}'
```

## 交付

直接展示返回的图片。用户要求像素级一致时，明确扩图和增强属于生成式处理。遇到 `CREDITS_INSUFFICIENT` 时保留输入，并引导用户登录 https://fengniaoai.com/ 获取点数。
