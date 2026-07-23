---
name: fengniao-video-translate
description: >-
  蜂鸟AI翻译的视频翻译能力。可以识别并翻译视频字幕，保留双语字幕或擦除原字幕后合成译文，
  也能生成目标语言 AI 配音或尽量保留原说话人声音的原声克隆，并持续查询长任务进度。
  当用户说“翻译这个视频”“把字幕换成英文”“去掉原字幕”“做双语字幕”
  “给视频配音/克隆原声”，或想查询视频翻译进度时使用。
---

# 蜂鸟AI 视频翻译

使用共享 CLI `../../scripts/fengniaoai.mjs`。视频翻译是异步任务。

## 补齐参数

1. 阻塞式便捷 action 接受一个本地 `video` 或公网 HTTPS `video_url`；1–10 个视频使用一次 `translate-submit` 批量创建，本地视频由 CLI 以最多 2 个并发自动流式直传。
2. 必须明确源语言、目标语言，且 `translation_type_list` 至少包含 `subtitle` 或 `speech`。用户可以直接说语言名称，CLI 会转换为接口代码。
3. 语音使用 `AI_DUB` 时，先按 `target_language` 筛选 `../../references/video-voices.md`，再选择兼容的 `tts.voice_id`。
4. 语音使用 `VOICE_CLONE` 时不传 `tts.voice_id`。
5. 只有目标结果不明确时才追问是否擦除原字幕。

选择语言与语音能力、组装字幕参数或处理批量/计费/轮询前，必须读取 `../../references/video-translation.md`；不能只按字幕语言范围推断 AI 配音或原声克隆也支持。

需要 AI 配音时还必须读取 `../../references/video-voices.md`：

- 用户指定性别、年龄或内容场景时，从兼容目标语言的音色中推荐 1–3 个，并用中文说明推荐理由。
- 用户已指定音色名称或 `voice_id` 时，核对它是否支持目标语言；不兼容时给出同语言替代项。
- 用户没有音色偏好且希望直接处理时，可选择该语言中说明最符合内容场景的通用音色，不必强制追问。
- `zh-TW` 可选中文普通话或粤语音色；其他目标语言只使用自身分组音色。
- 不得根据名称猜测或自行拼接 `voice_id`，只能逐字使用表内值。

## 执行

```bash
node ../../scripts/fengniaoai.mjs video translate --input-json '{"video_url":"https://example.com/video.mp4","source_language":"zh-CN","target_language":"en-US","translation_type_list":["subtitle"]}'
```

继续已有任务时，使用 `video translate-status`，并在 `task_id`、`task_ids`、`batch_id` 中三选一。

批量任务优先使用创建结果的 `batch_id` 统一查询；没有 `batch_id` 时一次查询最多 20 个 `task_ids`。轮询间隔保持 5–10 秒，不逐个高频查询，也不把最多 2 QPS 的创建上限用满。

完成后展示结果视频。仍在处理中时返回任务 ID 和当前进度，不能把轮询超时当作任务失败。
