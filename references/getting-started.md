# 安装与开始使用

## 安装 Skill

运行要求：Node.js 18 或更高版本，并且 Agent 客户端允许执行本地命令和访问 HTTPS 网络。当前包已按通用 Agent Skills 目录规范组织，并提供 Codex/OpenAI 客户端元数据与 OpenClaw 兼容清单。

当前 Skill 位于 `business_server/fengniaoai-skill`。在仓库根目录安装到支持 Agent Skills 的客户端：

```bash
npx -y skills add ./fengniaoai-skill --skill fengniaoai-skill -g
```

只安装到 Codex 时可以使用：

```bash
npx -y skills add ./fengniaoai-skill --skill fengniaoai-skill -g -a codex
```

后续将 `fengniaoai-skill` 发布为独立 Git 仓库后，市场安装命令使用标准形式：

```bash
npx -y skills add <公开 Git 仓库 URL> --skill fengniaoai-skill -g
```

不要把当前私有 `business_server` 地址写进公开市场页面。发布时应使用只包含 Skill 包的公开仓库，确保用户不需要访问业务服务端源码。

## 连接蜂鸟AI

安装本身不要求填写凭证。用户第一次真正执行图片或视频任务时，如果尚未配置，再引导完成：

1. 前往 https://fengniaoai.com/ 登录或注册并获取点数。
2. 前往 https://fengniaoai.com/userCenter/key 点击“复制给 Agent”。
3. 把复制的两行配置粘贴到当前可信的私有 Agent 对话。
4. Agent 不回显内容，将它通过标准输入交给：

```bash
node scripts/fengniaoai.mjs account configure --input-stdin
```

5. Agent 调用 `account balance` 验证连接，成功后继续原任务。

配置命令将凭证保存到用户级配置文件，不写入仓库、Skill 目录或 shell profile；目录权限为 `0700`，文件权限为 `0600`。环境变量 `FENGNIAO_PROJECT_ID`、`FENGNIAO_API_KEY` 仍适用于服务器与 CI，并优先于配置文件。

只允许在用户信任的私有 Agent 对话中粘贴配置。Agent 不得复述或展示密钥；如果运行环境无法安全地把内容传给标准输入，应改用平台的 Secret/环境变量设置。

## 安装后的首次对话

首次打开以能力和成果为中心，不介绍 API、模型别名或环境变量：

> 你好，我是蜂鸟AI。你可以直接告诉我想生成什么，也可以提供要处理的图片、视频或链接。
>
> **AI 翻译**：图片、视频 30+ 语言一键互译。
> **AI 生图**：0 门槛生成、编辑、设计一体化，覆盖通用、修图、电商、社媒、营销。
>
> 例如：
> - “生成一张夏日饮品海报”
> - “把这张商品图抠成白底并扩成 1:1”
> - “把图片里的中文翻译成英文”
> - “擦掉视频原字幕，生成英文字幕和配音”
> - “用这张商品图做一套亚马逊 Listing 图”
>
> 你想从哪一个开始？

## 体验原则

- 用户有明确任务时直接进入任务，不重复介绍全部能力。
- 优先要求素材或目标，不先要求账号配置。
- 一次只问一到两个关键问题，其他参数采用合理默认值。
- 使用用户熟悉的表达，如“横版 16:9”“英文配音”“透明底”，不要让用户填写 API 字段。
- 凭证缺失时保留已收集的任务内容；引导用户复制粘贴，自动配置并验证后从原处继续。
- 抠图、OCR、图片翻译可以直接使用本地图片；参考图生图与视频翻译当前需要公网 HTTPS 链接，只在对应任务中提示一次。
- 调用 CLI 时将已安装的 Skill 根目录设为工作目录，再执行 `node scripts/fengniaoai.mjs ...`；不要从用户项目目录直接假设存在该脚本。

## 结果自动下载

任务成功后，CLI 默认把最终图片、视频、音频和字幕下载到当前工作区的 `output/fengniaoai-skill/`，并在 `artifacts[].local_path` 返回本地绝对路径。如果命令恰好从 Skill 安装目录运行，则使用 `~/Downloads/fengniaoai-skill/`，避免污染或修改 Skill 包。

Agent 应优先展示本地文件；某个文件下载失败时，任务仍然成功，应使用同一 artifact 保留的远程 `url` 交付。临时关闭自动下载可传 `download_artifacts=false`，指定目录可传 `output_dir`。服务器或 CI 也可设置 `FENGNIAO_AUTO_DOWNLOAD` 和 `FENGNIAO_OUTPUT_DIR`。完整控制字段、大小限制和响应结构见 `references/actions.md`。
