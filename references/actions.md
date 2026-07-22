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
| `image` | `transform` | `image` 或 `reference_image_urls`、`prompt` | 参考图生成或改图。 |
| `image` | `expand` | `image`、`aspect_ratio` | 通过生图接口生成式扩展画布。 |
| `image` | `enhance` | `image` | 生成式重绘为 `2k` 或 `4k`；`resolution` 默认 `2k`。 |
| `image` | `cutout` | `image` | 抠图去背景。 |
| `image` | `ocr-submit` | `image` | 创建 OCR 任务。 |
| `image` | `ocr-status` | `task_id` | 查询一个 OCR 任务。 |
| `image` | `ocr` | `image` | 创建并轮询 OCR 任务。 |
| `image` | `translate` | `image`、`lang_from`、`lang_to` | 翻译并重绘图片文字。 |
| `video` | `translate-submit` | 视频翻译 API 兼容输入 | 创建视频翻译任务。 |
| `video` | `translate-status` | `task_id`、`task_ids`、`batch_id` 三选一 | 查询视频翻译任务。 |
| `video` | `translate` | 视频翻译创建参数 | 创建并轮询单个视频任务。 |

抠图、OCR 和图片翻译可接受 HTTPS URL、base64 data URL或本地图片路径。生图参考图必须为公网 HTTPS URL；视频也必须为公网 HTTPS URL。CLI 会拒绝不符合要求的输入并给出可操作提示。

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
