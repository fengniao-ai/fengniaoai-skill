# fengniaoai-skill

面向通用 AI Agent 的蜂鸟AI翻译与生图技能包。用自然语言完成图片、视频翻译，以及图片生成、编辑和电商设计；无需让用户理解模型或 API 参数。

[蜂鸟AI官网](https://fengniaoai.com/) · [使用文档](https://github.com/fengniao-ai/fengniaoai-skill#readme) · [问题反馈](https://github.com/fengniao-ai/fengniaoai-skill/issues) · [获取 Project ID 与 Api key](https://fengniaoai.com/userCenter/key) · [Apache-2.0 License](./LICENSE.txt)

隐私提示：处理用户主动提供的本地图片或视频时，Skill 会将素材临时上传到蜂鸟AI进行处理；只上传当前任务需要的素材，不写入 Skill 或用户仓库。

## 能做什么

### AI 翻译（图片、视频）

- **图片翻译**：30+ 语言一键互译，尽量保留原图版式；支持自动识别源语言，并可选择是否保护商品名称和包装文字。
- **视频翻译**：翻译字幕、保留双语字幕、擦除原字幕、生成 AI 配音或原声克隆。
- **语言与音色校验**：内置图片和视频语言映射，以及 258 条官方 AI 配音音色；用户可以直接说“中文翻译成英文”，不必填写语言代码。

### AI 生图

- **图片生成**：文生图、最多 6 张有序参考图生图、比例与模型选择；可为每张参考图指定主体、角度、细节或风格职责。
- **图片编辑**：改图、扩图、2K/4K 生成式高清增强、抠图、透明底、白底和文字坐标识别。
- **电商套图**：围绕同一商品生成主图、场景图、卖点图和多尺寸渠道套图，并保持商品与视觉风格一致。
- **常用场景**：通用创作、修图、电商、社媒和营销设计。

## 对话示例

安装后直接在支持 Agent Skills 的客户端中说：

```text
使用 $fengniaoai-skill，把这张商品图里的中文翻译成英文，商品名称也一起翻译。
```

也可以直接使用自然语言启动：

```text
蜂鸟翻译：擦掉这个视频的中文字幕，生成英文字幕和英文配音。
蜂鸟设计：生成一张夏日饮品海报，竖版 3:4，明亮清爽。
把这张商品图抠成白底图。
保留商品和包装文字，把背景扩成 1:1 的厨房场景。
用这张商品图做一套亚马逊 Listing 图。
```

如果只说“蜂鸟AI翻译”或“蜂鸟AI设计”，Agent 会先用简短易懂的方式询问你想完成什么，再逐步补齐必要素材。

## 安装

运行要求：

- Node.js 18 或更高版本
- Agent 客户端支持执行本地命令和访问 HTTPS 网络

从 GitHub 安装：

```bash
npx -y skills add https://github.com/fengniao-ai/fengniaoai-skill --skill fengniaoai-skill -g
```

只安装到 Codex：

```bash
npx -y skills add https://github.com/fengniao-ai/fengniaoai-skill --skill fengniaoai-skill -g -a codex
```

从已下载的本地目录安装：

```bash
npx -y skills add . --skill fengniaoai-skill -g
```

### 升级 Skill

GitHub 发布新版本后，全局安装的用户执行：

```bash
npx -y skills update fengniaoai-skill -g -y
```

项目级安装则在对应项目目录执行：

```bash
npx -y skills update fengniaoai-skill -p -y
```

从 `1.1.0` 开始，Skill 在正常使用时最多每 24 小时检查一次 GitHub 版本。没有更新或检查失败时不会打断任务；发现新版时，Agent 会在当前任务结束后询问是否升级，获得同意后才执行更新。旧版本无法远程获得提醒能力，需要先手动升级一次。

升级完成后，重新打开 Agent 客户端或开始新对话以加载新版说明。蜂鸟AI凭证保存在用户配置目录中，不会被升级覆盖。

这是一个根 Skill 入口和 5 个内置子 Skill 组成的完整技能包。用户只需安装 `fengniaoai-skill`；图片生成、图片工具、图片翻译、视频翻译和电商套图会随根 Skill 一起安装，并由 Agent 按任务自动路由，不需要使用 `--full-depth` 分别安装。

兼容性边界：本项目采用 `SKILL.md`、相对路径资源和本地 CLI 的通用 Agent Skills 结构，并提供 `agents/openai.yaml` 与 `claw.json`。支持 Agent Skills、允许执行本地命令、读写任务文件且能访问 HTTPS 网络的 Agent 客户端可以直接安装使用。不同 Agent 平台尚未统一清单格式和权限模型，因此不承诺所有纯聊天或禁止 shell、文件系统、网络访问的平台零适配运行。

安装完成后，可以直接发送：

```text
使用 $fengniaoai-skill 开启蜂鸟AI，问我想翻译图片或视频，还是进行AI生图、修图或设计。
```

## 首次连接蜂鸟AI

安装 Skill 不需要立即填写凭证。第一次真正执行任务时，Agent 会在保留当前任务内容的同时引导你完成连接：

1. 前往 [蜂鸟AI](https://fengniaoai.com/) 登录或注册并获取点数。
2. 打开 [Key 页面](https://fengniaoai.com/userCenter/key)，点击“复制给 Agent”。
3. 将复制的两行配置粘贴到你信任的私有 Agent 对话。
4. Agent 会安全保存配置、查询剩余点数，然后继续刚才的任务。

凭证不会写入仓库、Skill 目录或 shell profile，也不会出现在命令参数和正常输出中。服务器与 CI 也可以使用环境变量：

```bash
export FENGNIAO_PROJECT_ID="你的 Project ID"
export FENGNIAO_API_KEY="你的 Api key"
```

调用生成、编辑或翻译接口会消耗蜂鸟AI点数。Agent 可在执行前查询余额；点数不足时会保留任务参数并引导你前往官网处理。

## 素材支持

| 能力 | 本地图片 | HTTPS 链接 | 说明 |
| --- | :---: | :---: | --- |
| 文生图 | — | — | 直接描述画面即可 |
| 抠图、OCR、图片翻译 | ✓ | ✓ | 可直接发送本地图片 |
| 参考图改图、扩图、2K/4K 高清增强 | ✓ | ✓ | 本地素材由 CLI 自动临时直传 |
| 电商套图 | ✓ | ✓ | 商品参考图会自动完成临时直传 |
| 视频翻译 | ✓ | ✓ | 本地视频会自动流式直传 |

2K/4K 能力属于生成式高清增强或高清重绘，不承诺无损超分。图片和视频的格式、大小及语言范围会在执行前由 CLI 校验。

本地素材由 CLI 自动完成临时直传、失败重试和限流退避，用户无需先上传到网盘或理解 OSS。批量图片按能力采用受控并发；图片翻译按 5 QPS 调度，生图按 20 QPS 调度；多个视频会优先合并为一次批量创建并统一查询，避免高频逐个请求。

同一套参考图生成多张结果时，每张使用独立任务和 request ID。用户可以说“重做第 3 张”或“只修改这一张”；Agent 会复用该张的参考图顺序与 Prompt 基线，只提交指定结果，并在再次扣点前确认。

## 结果自动下载

任务成功后，CLI 默认将生成的图片、视频、音频和字幕下载到当前工作区：

```text
output/fengniaoai-skill/
```

Agent 会优先展示本地文件。如果某个产物下载失败，已完成的 API 任务仍保持成功，并使用结果中的远程 URL 交付，不会因为本地下载问题重复扣点。

可以通过任务输入或环境变量关闭自动下载、指定输出目录和调整单文件大小限制。详细说明见 [`references/actions.md`](./references/actions.md)。

## Included Skills

| Skill | 用途 |
| --- | --- |
| `fengniaoai-skill` | 根入口、自然语言路由、账号配置与点数查询 |
| `fengniao-image-generate` | 文生图、参考图改图、白底图、扩图、2K/4K 高清增强 |
| `fengniao-image-tools` | 用户明确要求时执行抠图/去背景，以及 OCR 与文字坐标识别 |
| `fengniao-image-translate` | 图片翻译、语言与引擎选择、商品文字保护 |
| `fengniao-video-translate` | 视频字幕翻译、擦字幕、AI 配音与原声克隆 |
| `fengniao-ecommerce-kit` | 商品一致性控制和多渠道电商套图工作流 |

## Repository Structure

```text
fengniaoai-skill/
├── SKILL.md                  # 根 Skill 与对话路由
├── agents/openai.yaml        # Codex/OpenAI 客户端展示信息
├── api/actions.json          # 14 个机器可读动作定义
├── claw.json                 # OpenClaw 兼容清单
├── scripts/fengniaoai.mjs    # 统一 API、轮询、下载与错误处理
├── skills/                   # 5 个子 Skill
├── references/               # 语言、音色、接口与电商视觉知识
└── test/                     # 离线契约测试
```

接口调用、轮询、错误归一化和产物下载集中在一个 CLI 中，子 Skill 只负责理解用户目标、补齐必要信息并选择正确动作。

## 开发与验证

查看 CLI 支持的动作：

```bash
node scripts/fengniaoai.mjs --help
```

运行不调用付费接口的离线契约测试：

```bash
node --test test/*.test.mjs
```

## License

本项目使用 [Apache License 2.0](./LICENSE.txt)。
