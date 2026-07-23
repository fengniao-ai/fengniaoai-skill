# 视频翻译接口

## 语言支持矩阵

普通用户只需说“中文”“英文”“粤语”等语言名称；CLI 会统一转换为接口区域代码，也兼容直接传入 `zh-CN`、`en-US` 等代码。源语言与目标语言仍分别按下面的能力范围校验。

### 源语言（15 种）

| 语言 | 参数值 | 语言 | 参数值 |
| --- | --- | --- | --- |
| 中文简体 | `zh-CN` | 中文繁体 | `zh-TW` |
| 英语 | `en-US` | 法语 | `fr-FR` |
| 德语 | `de-DE` | 西班牙语 | `es-ES` |
| 葡萄牙语 | `pt-PT` | 俄语 | `ru-RU` |
| 日语 | `ja-JP` | 韩语 | `ko-KR` |
| 泰语 | `th-TH` | 阿拉伯语 | `ar-SA` |
| 印尼语 | `id-ID` | 越南语 | `vi-VN` |
| 菲律宾语 | `fil-PH` |  |  |

### 目标语言与能力

| 语言 | 参数值 | 字幕 | AI 配音 | 原声克隆 |
| --- | --- | :---: | :---: | :---: |
| 中文简体 | `zh-CN` | ✓ | ✓ | ✓ |
| 中文香港 | `zh-HK` | ✓ | ✓ | ✓ |
| 中文繁体 | `zh-TW` | ✓ | ✓ | ✓ |
| 英语 | `en-US` | ✓ | ✓ | ✓ |
| 法语 | `fr-FR` | ✓ | ✓ | ✓ |
| 德语 | `de-DE` | ✓ | ✓ | ✓ |
| 西班牙语 | `es-ES` | ✓ | ✓ | ✓ |
| 葡萄牙语 | `pt-PT` | ✓ | ✓ | — |
| 俄语 | `ru-RU` | ✓ | ✓ | ✓ |
| 日语 | `ja-JP` | ✓ | ✓ | ✓ |
| 韩语 | `ko-KR` | ✓ | ✓ | ✓ |
| 泰语 | `th-TH` | ✓ | ✓ | — |
| 阿拉伯语 | `ar-SA` | ✓ | ✓ | — |
| 印尼语 | `id-ID` | ✓ | ✓ | — |
| 越南语 | `vi-VN` | ✓ | ✓ | — |
| 菲律宾语 | `fil-PH` | ✓ | ✓ | — |
| 土耳其语 | `tr-TR` | ✓ | — | — |
| 波兰语 | `pl-PL` | ✓ | — | — |
| 印地语 | `hi-IN` | ✓ | — | — |
| 乌尔都语 | `ur-PK` | ✓ | — | — |
| 孟加拉语 | `bn-BD` | ✓ | — | — |

AI 配音还要求 `tts.voice_id` 支持目标语言。随 Skill 安装的完整音色知识库见 `video-voices.md`；线上最新版本可参考官方[视频翻译 AI 配音音色表](https://fengniaoai.feishu.cn/wiki/CoR5wxtemidyd8ksJfKcC5xxnUh)。

## 创建限制与参数联动

- 创建：`POST /api/v1/video/translate/create`；查询：`POST /api/v1/video/translate/query`。
- `video_url` 与 `video_urls` 必须二选一。批量最多 10 个且不能重复；单 URL 最长 1024 字符。
- 支持本地视频或公网 HTTPS 视频，最长 30 分钟。本地视频由 CLI 流式直传 OSS；常见后缀包括 mp4、flv、mov、avi、mkv、webm，服务端还接受 3gp、mpg、asf、wmv、ts、mxf。
- `request_id` 长度 1–128；`custom_data` 最大 4 KB。
- 当前实现不支持非空 `callback_url`，不要为异步任务配置回调地址。
- `translation_type_list` 使用 `subtitle`、`speech` 或两者。
- 包含字幕时默认 `recognition_type=OCR`、`target_subtitle_compose=true`；仅语音时默认 `ASR`、`false`。
- AI 配音使用 `tts.type=AI_DUB` 且必须传兼容的 `voice_id`；先按目标语言查 `video-voices.md`。`zh-TW` 同时兼容普通话和粤语音色。
- 原声克隆使用 `tts.type=VOICE_CLONE`，不要传 `voice_id`。

## 字幕处理

| 用户结果 | 关键配置 |
| --- | --- |
| 只翻译字幕 | `subtitle` + `OCR` + `target_subtitle_compose=true` |
| 擦除原字幕并只显示译文 | 上述配置，再设 `desubtitle.enabled=true` |
| 保留原字幕显示双语 | 合成目标字幕，但不启用擦除 |
| 只擦字幕 | `target_subtitle_compose=false` + `desubtitle.enabled=true` |
| 只做配音 | `speech` + `ASR` + `target_subtitle_compose=false` |

- `text_type_list` 可选 `dialog`、`castName`、`castDescription`、`other`。
- 擦除类型可选 `global`、`dialog`、`manual`；模型可选 `v3`、`v4`，默认 `v4`。
- 手动擦除必须提供 `area_list`；OCR 或擦除区域各最多 20 个。坐标为非负像素，宽高大于 0；有起止时间时 `end > start`。
- 字幕字体支持 `Hei`、`Song`、`Kai`，对齐支持 `left`、`center`、`right`；其余颜色、字号、描边等配置仅在需要定制样式时传。

## 查询、结果和轮询

- 查询时 `task_id`、`task_ids`、`batch_id` 必须三选一；`task_ids` 最多 20 个。
- 单任务状态：`running`、`completed`、`failed`。批量还可能为 `partial_failed`。
- 建议每 5–10 秒查询一次；处理超时可设为 30 分钟。轮询超时只表示仍在处理，不等于任务失败。
- 成功结果除 `video_url`、`cover_url` 外，还可能包含原音频、翻译字幕 SRT、原对白 SRT、原介绍 SRT、擦字幕视频；交付时保留所有可用附件。

## 点数与幂等

视频时长按每 30 秒向上取整：字幕 OCR 5 点；v3 擦字幕按分辨率为 15/19/23 点；v4 擦字幕 15 点；AI 配音 5 点；原声克隆 20 点。各能力按每 30 秒计。

创建时不立即扣费。`billing_status` 依次可能为 `none`、`locked`、`consuming`、`consumed`、`releasing`、`released`；`settle_unknown` 需要联系技术支持。成功才扣费，失败释放点数。

同一 `request_id`、相同参数返回原任务；参数变化会报错。批量幂等重试还必须保持 `video_urls` 顺序一致。
