# 蜂鸟AI 图片工具

使用共享 CLI `scripts/fengniaoai.mjs`。

## 抠图

必须提供一张图片，并且用户必须明确表达抠图或去除背景意图。仅说“做成白底图”“白底主图”“换成白色背景”时不要调用本能力，改用图片生成工作流的 `image transform`。明确抠图后，将用户意图映射为稳定的公开参数：

| 用户意图 | `subject_type` | `background` |
| --- | --- | --- |
| 人像 | `person` | 用户要求的输出 |
| 商品 | `product` | 用户要求的输出 |
| 服装 | `clothing` | 用户要求的输出 |
| Logo、宠物或其他 | `general` | 用户要求的输出 |

`background` 使用 `transparent`、`white` 或 `crop`。透明底和主体裁切由接口返回带 Alpha 通道的裁切 PNG；不要把黑白 `mask` 遮罩图作为透明底交付。

```bash
node scripts/fengniaoai.mjs image cutout --input-json '{"image":"https://example.com/product.jpg","subject_type":"product","background":"transparent"}'
```

## OCR 和文字坐标

默认使用 `image ocr`：先提交 `/api/v1/editor/ocr`，再轮询 `/api/v1/editor/task/info` 直到完成或超时。

```bash
node scripts/fengniaoai.mjs image ocr --input-json '{"image":"https://example.com/poster.jpg"}'
```

仅在用户需要非阻塞执行或继续查询已有任务时使用 `ocr-submit` 和 `ocr-status`。

OCR 完成结果位于 `data.texts`。保留接口返回的坐标结构；除非用户明确要求，否则不自行虚构边界框或归一化坐标。

## 交付

- 直接展示抠图结果。
- OCR 结果以结构化数据或简洁表格呈现文字和坐标。
- OCR 仍在处理中时返回 `task_id`，说明可以继续查询。
