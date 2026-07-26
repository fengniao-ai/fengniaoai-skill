---
name: fengniao-image-generate
description: >-
  蜂鸟AI 生图的生成与设计能力。0 门槛用一句话生成图片，也可以参考现有图片换背景、制作白底图、
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
| 提升清晰度或制作 2K/4K | “请提供本地原图或 HTTPS 图片；明确需要 2K 或 4K 时也请直接告诉我。” | `enhance` |

遵守以下对话节奏：

1. 每次只问一到两个关键信息，不询问模型名称。
2. `generate` 缺少具体画面时，优先问主体或用途；用户给出其中一项后，由 Agent 补全合理的场景、构图和光线，不继续做风格问卷。
3. `transform` 的关键不是泛泛询问“想怎么改”，而是确认“必须保留什么、需要改变什么”。商品名称、包装文字、人物身份或品牌元素只有用户明确要求保持时才写入保留项。
4. `expand` 未给具体比例但表达明确时可直接映射：方图 `1:1`、横版 `16:9`、普通竖版 `3:4`、全屏竖版 `9:16`；无法判断用途时再追问一次。
5. `enhance` 未指定清晰度时按普通高清增强处理，不追问规格；用户明确要求 2K 或 4K 时使用对应高清模型，并提示这是生成式高清重绘。
6. 用户要求图片内出现准确文案时逐字写进提示词；用户指定产物语言但未提供逐字文案时，所有新增可见文字都使用该目标语言。不要擅自翻译或改写精确文案，也不编造商品功效、折扣或品牌信息；Agent 的对话语言不能改变产物语言。
7. 用户只说“白底图”“白底主图”“换成白色背景”时，使用 `transform`，写清要保留的商品事实、纯白背景、主体位置和画面比例；不能调用 `cutout`。只有用户明确表达抠图或去除背景时才路由图片工具。

执行前使用一句自然语言确认结果，例如：“好的，我会保留商品和包装文字，把背景换成清爽的夏日海边，并保持原图比例。”不要向用户展示内部提示词、action 或模型别名。

## 补齐参数

1. `generate` 和 `transform` 必须有提示词。
2. `transform`、`expand` 和 `enhance` 必须有源图，最多支持六张参考图；多图按“主图 → 侧面/背面 → 细节 → 风格参考”的顺序提供。本地图片由 CLI 自动直传，不要求用户处理上传步骤或重复描述任务。
3. 多张参考图可使用 `reference_images` 数组，也兼容 `image` 数组和 `reference_image_urls`；不要混用本地文件与 HTTPS URL。第一张作为主体和 `original` 比例基准，其余图片只补充用户明确的角度、结构、材质或风格信息。
4. 需要明确职责时传入与图片数量一致的 `reference_roles`，例如 `["商品正面主图", "包装背面文字", "材质细节"]`；CLI 会把职责按编号写入 Prompt，同时保持上传后的 key 顺序不变。
5. 只有目标版式不明确时才追问比例。文生图默认 `1:1`，保持源图的改图/增强默认 `original`。
6. 不要求普通用户选择模型别名；没有明确模型要求时统一使用 `tpro-1k`：
   - `tpro-1k`：主力创意与设计模型，默认用于设计、生图、参考生图、纯改图、局部修改和未指定规格的普通增强；尤其适合海报、封面、信息图、营销活动主图、社媒素材、电商主图、商品场景图及含文字层级的复杂构图。生成标题、价格或品牌文案后仍需校对可读文字。
   - `tpro-2k`：更高分辨率的视觉设计。
   - `pro-1k`：仅在用户明确指定模型时使用。
   - `pro-2k`、`pro-4k`：用户明确要求 2K/4K 高清重绘时使用；用户显式指定模型时以用户指定为准。
7. 每次请求固定生成一张；多张结果必须拆成多个新 `request_id` 的请求。多任务执行前建立清单，记录“任务编号、用途、Prompt 版本、参考图顺序、比例、request_id、结果路径”；只重做指定任务，其他任务不重复提交。

多任务不是一次接口调用：每张图片独立计费、独立重试和独立结果。执行前先确认总张数与点数；同一套参考图可复用，但每个任务必须保持相同顺序和一致性基线。用户说“重做第 N 张”时，复用该任务的参考图与 Prompt，只应用新增修改并使用新的 `request_id`，执行前提示会再次消耗点数。

## 多任务与大批量任务

共享同一组商品参考图的电商套图从 2 张起优先使用持久化批量 action；普通独立任务达到 11 张时必须使用，不由 Agent 自行启动大量命令：

1. 调用 `batch-submit` 创建本地批次。它只校验任务、生成独立 `request_id`、计算预计点数并返回确认信息，不立即扣点。
2. 调用 `account balance` 查询实时点数，向用户说明总张数、预计消耗和当前余额。用户确认后调用 `batch-resume` 并传 `approve_cost=true`。
3. 超过 50 张时默认先生成 3 张样图。至少一张成功才进入 `awaiting_preview_confirmation`；直接展示成功样图，用户确认后传 `approve_preview=true` 继续。三张全部失败会进入 `preview_failed`，不能强行放行整批，应先处理失败原因或重建批次。用户在开始时明确要求跳过样图才传 `skip_preview=true`。
4. 使用最多 10 个滑动工作槽，任一任务结束立即补入下一张；状态逐张原子保存。同一组共享参考图只上传一次，结果完成后立即下载。
5. 使用 `batch-status` 查询已知批次的进度。新对话不知道 `batch_dir` 时先用 `batch-list` 列出最近批次，让用户按时间、状态和数量选择；不要让用户手工寻找目录。平台允许 Agent 在当前任务中持续轮询时，每完成约 10% 或每 60 秒最多更新一次；不支持主动后台通知的平台只在用户询问时查询，不承诺自动推送。没有变化时不刷屏。默认只展示总数、完成、处理中、等待、失败和最近结果，不输出几百行任务。
6. 用户说暂停时调用 `batch-pause`，停止补入新任务并让在途任务正常收口；继续时调用 `batch-resume`。用户说取消时调用 `batch-cancel`，只取消未开始任务。
7. 限流、点数不足或 worker 意外退出会暂停队列。保留原任务和 `request_id`；稍后、充值到账或检测到 `interrupted` 后调用 `batch-resume`，不要求用户重新上传或描述。
8. 失败项不影响成功结果。先调用 `batch-retry` 计算数量和预计额外点数，不立即重新排队；用户确认后再次调用并传 `approve_cost=true`，再调用 `batch-resume`。不传 `task_ids` 时只重试 `retryable=true` 的失败项；用户明确指出某张不合格时，传对应 `task_ids` 可重做失败或已完成图片。重做使用新 request ID 并保存为 `-v2`、`-v3`，不得覆盖旧图。

批次业务目录由 `batch-submit` 返回，后续 action 使用 `batch_dir`；结果直接保存为 `<batch_dir>/<id>.<实际格式>`，内部状态隐藏在 `<batch_dir>/.fengniao/`。重做同一任务时保存为 `<id>-v2`、`<id>-v3`，不覆盖旧图。CLI 优先维护用户级索引，索引不可写时 `batch-list` 会从默认结果根目录发现批次；查找自定义目录时传 `output_dir`。批次文件不得写入 Skill 安装目录。

`batch-resume` 默认前台运行，适配会回收子进程的通用 Agent。只有当前平台明确支持长驻后台进程时才传 `background=true`；后台意外中断时继续同一 `batch_dir`，不能新建批次。

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
