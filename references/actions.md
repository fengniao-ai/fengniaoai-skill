# CLI 操作

机器可读的 action、触发词、必填项、默认值、输入方式和响应方式以 `../api/actions.json` 为准；本文件只提供人类可读的执行与输出说明。

所有操作都从 Skill 根目录执行：

```bash
node scripts/fengniaoai.mjs <group> <action> --input-json '<JSON>'
```

CLI 优先从环境变量读取凭证，也支持由 `account configure` 保存的用户级配置文件，并输出一个 JSON 对象。

| Group | Action | 必填输入 | 用途 |
| --- | --- | --- | --- |
| `account` | `configure` | Key 页面复制的两行配置，通过 `--input-stdin` 输入 | 安全保存 Project ID 与 Api key，不回显凭证。 |
| `account` | `balance` | 无 | 查询剩余油包/点数；`channel` 默认 `fengn`，可选 `uid`。 |
| `image` | `generate` | `prompt` | 文生图。 |
| `image` | `transform` | `image`、`reference_images` 或 `reference_image_urls`，以及 `prompt` | 单图或多参考图生成、改图。 |
| `image` | `expand` | 参考图、`aspect_ratio` | 通过生图接口生成式扩展画布。 |
| `image` | `enhance` | 参考图 | 普通生成式高清增强；用户明确传 `resolution=2k/4k` 时使用对应高清模型。 |
| `image` | `batch-submit` | `tasks` | 创建可恢复的大批量生图任务并计算预计点数，不立即执行。 |
| `image` | `batch-list` | 无 | 列出当前用户最近的批次；新对话先用它找回 `batch_dir`。 |
| `image` | `batch-status` | `batch_dir` | 查询批次汇总、最近结果；按需返回完整任务清单。 |
| `image` | `batch-resume` | `batch_dir` | 确认点数或样图、从暂停/限流/中断位置继续。 |
| `image` | `batch-pause` | `batch_dir` | 停止补入新任务，让在途任务正常收口。 |
| `image` | `batch-retry` | `batch_dir` | 先计算失败项额外点数，确认后以新 request ID 重新排队。 |
| `image` | `batch-cancel` | `batch_dir` | 取消未开始任务，保留已完成结果。 |
| `image` | `cutout` | `image` | 抠图去背景。 |
| `image` | `ocr-submit` | `image` | 创建 OCR 任务。 |
| `image` | `ocr-status` | `task_id` | 查询一个 OCR 任务。 |
| `image` | `ocr` | `image` | 创建并轮询 OCR 任务。 |
| `image` | `translate` | `image`、`lang_from`、`lang_to` | 翻译并重绘图片文字。 |
| `video` | `translate-submit` | 视频翻译 API 兼容输入 | 创建视频翻译任务。 |
| `video` | `translate-status` | `task_id`、`task_ids`、`batch_id` 三选一 | 查询视频翻译任务。 |
| `video` | `translate` | 视频翻译创建参数 | 创建并轮询单个视频任务。 |

抠图、OCR、图片翻译、生图参考图和视频翻译都可接受本地路径或 HTTPS URL；图片还兼容 base64 data URL。CLI 会把本地文件直接上传到临时 OSS，不把文件字节或 base64 发送给 B 端 API。

生图可通过 `reference_images` 一次提供 1–6 张有序参考图，并用等长的 `reference_roles` 描述每张职责。并发上传保持原顺序；第 1 张是主体和 `original` 比例基准。多张成图仍是多个独立请求，执行与指定重做规则见 `image-generation.md`。

## 本地素材无感直传

Agent 只向用户索取本地图片或视频，不要求用户先上传到网盘，也不向用户解释 OSS、MD5、预签名地址或 asset key。CLI 会自动完成文件校验、申请临时地址、直传 OSS 和业务调用；上传地址 15 分钟有效，临时素材 24 小时内用于本次业务处理。

- 图片和视频在申请上传前校验格式与大小，错误时直接告诉用户应更换什么文件。
- 上传默认最多尝试 3 次，网络错误、`429`、`2061` 和服务端暂时错误按指数退避。
- 相同上传尝试使用稳定 `request_id` 和 `content_md5`；OSS 返回 `409` 时，仅在稳定 key 场景按“对象已存在”继续。
- 业务接口返回 `2063/2064` 时，CLI 自动申请新 key、重新上传并继续原任务；`2065` 使用原 key 退避重试。
- 自动重试仍失败时，只提示用户检查网络或文件并稍后重试，不要求用户手工操作上传流程。
- 预签名 URL、asset key、凭证和文件字节不得出现在对话、日志、错误详情或最终结果中。

默认上传并发为图片 4、视频 2，可分别通过 `FENGNIAO_IMAGE_UPLOAD_CONCURRENCY` 和 `FENGNIAO_VIDEO_UPLOAD_CONCURRENCY` 下调；公开环境不建议提高。上传与 API 重试可用 `FENGNIAO_UPLOAD_MAX_ATTEMPTS`、`FENGNIAO_API_MAX_ATTEMPTS` 和 `FENGNIAO_API_RETRY_BASE_MS` 调整。

## QPS 与批量策略

以下是当前按用户维度执行的服务端上限（以 1 秒窗口计）。Agent 使用更保守的客户端并发和启动节奏，不能把 QPS 上限直接当作推荐并发；QPS 是“每秒可发起的接口请求数”，不是一次请求能处理的图片数量。

| 能力 | 服务端上限 | Agent 默认批量策略 |
| --- | ---: | --- |
| 申请上传地址 | 20 QPS | 图片最多 4 个、视频最多 2 个并发上传；遇到限流自动退避。 |
| 图片生成/改图/扩图/高清增强 | 20 QPS | 理论上每秒最多提交 20 个单图请求，不代表每秒完成 20 张；一个对话内使用最多 10 个工作槽的滑动队列，任一任务结束后立即补入下一张，始终不超过 10 个在途请求。 |
| 抠图 | 10 QPS | 批量最多并发 4 张。 |
| 图片翻译（`translate-save`） | 5 QPS | 不是 20 张/秒；批量最多并发 2 张，发起时间至少间隔约 220ms，每张使用独立业务 `request_id`。 |
| 视频翻译创建 | 2 QPS | 1–10 个视频优先用一次 `video_keys`/`video_urls` 批量创建，不逐个并发创建。 |
| 视频翻译查询 | 20 QPS | 优先使用 `batch_id`，或一次传最多 20 个 `task_ids`；每 5–10 秒查询一次。 |
| OCR | 暂无独立路由限流项 | 保守使用最多 2 个并发，单任务按现有轮询间隔查询。 |

多个 Agent 进程不共享本地并发队列，服务端 `429/30001` 与 CLI 退避重试是最终保护。图片翻译批量调度应同时满足“最多 2 个在途请求”和“每秒不超过 5 次新请求”；如果多个 Agent 共用同一账号，仍以服务端 5 QPS 为总上限。批量任务执行前应说明将产生的操作数量并确认点数；批量中的每个付费图片任务使用独立业务 `request_id`，同一任务的网络重试才复用原值。

电商套图的滑动队列先启动最多 10 张；任一任务成功或不可重试地失败后释放工作槽，并按原任务顺序补入下一张。遇到服务端 `429/30001` 时，该任务仍占用原槽位并复用原 `request_id`：优先等待服务端 `Retry-After`，否则由 CLI 默认约 1 秒、2 秒退避，默认总共尝试 3 次。重试后仍被限流时，暂停新增提交并返回 `RATE_LIMITED`，保留未开始任务和当前任务参数；不要无限重试，也不要换新 `request_id`。稍后恢复时只继续未完成任务，已经成功的图片不得重复提交。

大批量执行器将任务逐张写入 `manifest.json`，并单独维护 `control.json` 和 `progress.json`。后台 worker 使用独占锁避免同一批次重复运行；取消使用不可逆标记，任何并发错误、暂停或恢复都不能覆盖用户的取消指令。异常退出遗留的 `running` 项在恢复时回到 `pending`，仍复用原 `request_id` 取得幂等结果。凭证、权限、点数、共享素材准备或限流错误会暂停整个队列并保存原因，不逐张制造相同失败。一个批次最多 1000 张；超过 50 张默认设置 3 张样图闸门，三张均失败时禁止确认放行整批。共享参考图在同一批次只上传一次，临时素材失效时从原始本地路径重新上传。用户级最近批次索引只保存批次 ID、绝对目录和创建时间，便于新对话通过 `batch-list` 找回任务。

失败重试默认只选择 `retryable=true` 的任务。第一次调用 `batch-retry` 只返回重试数量和预计额外点数；用户明确确认后再传 `approve_cost=true` 重新排队。不可重试失败必须显式提供 `task_ids`，防止参数、安全或素材错误被整批重复扣点。

## 有效期、请求超时与轮询

| 阶段 | 接口要求 | CLI 默认策略 |
| --- | --- | --- |
| OSS 上传地址 | 15 分钟有效 | 单次上传最多 14 分钟，并按接口返回的剩余有效时间进一步缩短；过期自动重新申请。 |
| 临时素材 key | 24 小时有效 | 业务接口返回 `2063/2064` 时自动重新上传，不继续使用失效 key。 |
| 生图、改图、扩图、高清增强 | 请求超时至少 120 秒；2K/4K 建议至少 180 秒 | API 请求默认 190 秒。 |
| 图片翻译 | 同步接口，请求超时至少 120 秒 | API 请求默认 190 秒。 |
| 视频翻译 | 异步任务，建议 5–10 秒查询一次，最长等待约 30 分钟 | 默认每 5 秒查询，等待 30 分钟后返回 pending 和任务 ID，不判定失败。 |
| OCR | 异步任务 | 默认每 1.5 秒查询，最多等待 90 秒；超时后保留任务 ID 供继续查询。 |

`FENGNIAO_REQUEST_TIMEOUT_MS` 只在部署环境确有需要时调整，不应低于同步图片接口要求；`FENGNIAO_UPLOAD_TIMEOUT_MS` 即使配置更大，也会被限制在上传地址有效期以内。

接口专项参数不要从本表推断：生图读取 `image-generation.md`，图片翻译读取 `image-translation.md`，视频翻译读取 `video-translation.md`。

成功输出统一使用以下结构：

```json
{
  "ok": true,
  "action": "image.generate",
  "request_id": "agent_...",
  "state": "completed",
  "task_id": null,
  "artifacts": [],
  "data": {},
  "usage": {}
}
```

失败输出统一包含 `ok=false`、`error_type`、`retryable`、`user_hint` 和 `request_id`。

## 自动下载产物

图片、视频、音频和字幕等最终产物默认自动下载。每个成功下载的 `artifact` 会保留远程 `url`，并增加绝对路径 `local_path`。Agent 应优先把本地文件交付给用户；本地下载失败时使用远程 URL。

可在任意会产生附件的 action 输入中使用以下控制字段；它们只控制本地交付，不会发送给蜂鸟AI 视频接口：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `download_artifacts` | `true` | 传 `false` 时只返回远程 URL。 |
| `output_dir` | 当前工作区的 `output/fengniaoai-skill/` | 指定本地输出目录；禁止指向 Skill 安装目录。 |
| `filename_prefix` | 产物角色或类型 | 指定安全化后的文件名前缀；同名文件自动编号。 |

对应环境变量为 `FENGNIAO_AUTO_DOWNLOAD`、`FENGNIAO_OUTPUT_DIR`。`FENGNIAO_MAX_DOWNLOAD_BYTES` 可调整单个文件上限，默认 1 GB；`FENGNIAO_DOWNLOAD_TIMEOUT_MS` 可调整单次下载超时，默认 10 分钟。输入字段优先于环境变量。

如果命令从 Skill 安装目录内部运行，默认目录回退为 `~/Downloads/fengniaoai-skill/`。下载采用临时文件和流式写入，完成后再原子改名；根据文件内容、响应类型和 URL 判断扩展名，重复文件不会覆盖。

包含附件的成功响应会增加：

```json
{
  "artifacts": [
    {
      "type": "image",
      "role": "translated",
      "url": "https://...",
      "local_path": "/workspace/output/fengniaoai-skill/translated.png"
    }
  ],
  "download": {
    "enabled": true,
    "output_dir": "/workspace/output/fengniaoai-skill",
    "completed": 1,
    "failed": 0,
    "warnings": []
  }
}
```

下载失败不会推翻已经完成并可能扣费的 API 任务：响应仍为 `ok=true`，保留远程 URL，并通过 `download.failed`、`download.warnings` 和 `download_warning` 提示 Agent 回退到远程交付。图片翻译只下载译文图和擦字底图，`role=source` 的原图只作引用；视频翻译会下载接口返回的结果视频、封面、音频、字幕及擦字幕视频。
