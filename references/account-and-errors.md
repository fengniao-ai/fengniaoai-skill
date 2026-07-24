# 账号与错误引导

## 账号配置

面向用户时仅使用以下官方地址：

- 登录、注册和获取点数：https://fengniaoai.com/
- 获取或检查 Project ID 与 Api key：https://fengniaoai.com/userCenter/key

推荐让用户在 Key 页面点击“复制给 Agent”，将下面格式的两行内容粘贴到可信的私有对话：

```bash
export FENGNIAO_PROJECT_ID="Project ID"
export FENGNIAO_API_KEY="Api key"
```

收到后不回显内容，通过 `account configure --input-stdin` 保存到用户级私密配置文件，并调用 `account balance` 验证。环境变量仍可作为服务器、CI 和不支持安全标准输入的平台配置方式，并优先于配置文件。

## 统一错误

| error_type | 用户引导 | 是否重试 |
| --- | --- | --- |
| `CREDENTIALS_MISSING` | 登录或注册，获取 Project ID 和 Api key 后设置环境变量。 | 配置后重试 |
| `AUTH_ERROR` | 前往 Key 页面检查或重新生成凭证。 | 修正后重试 |
| `PERMISSION_DENIED` | 确认当前项目拥有所请求接口的权限。 | 修正后重试 |
| `CREDITS_INSUFFICIENT` | 登录官网获取点数并保留任务参数。 | 不自动重试 |
| `RATE_LIMITED` | 短暂等待后以相同 request ID 重试同一请求。 | 是 |
| `TASK_RUNNING` | 相同幂等请求仍在处理中，等待后使用相同 request ID 查询或重试。 | 是 |
| `SAFETY_REJECTED` | 调整提示词或源素材。 | 修改后重试 |
| `INVALID_INPUT` | 修正具体参数。 | 修正后重试 |
| `TASK_NOT_FOUND` | 检查任务 ID，或说明任务结果可能已过期。 | 否 |
| `TEMPORARY_UNAVAILABLE` | 稍后重试。 | 是 |
| `RESULT_SAVE_FAILED` | 使用相同逻辑 request ID 稍后重试。 | 是 |

## 点数响应

`/api/v1/user/available/petrolpak` 响应中的 `data` 是剩余点数的事实来源。如果返回多个油包，不自行虚构一个总数；按接口返回展示各油包可用值和有效期。

余额查询默认发送 `channel=fengn`，以兼容当前生产接口。只有私有部署使用其他渠道时才通过 action 输入或 `FENGNIAO_CHANNEL` 覆盖；`uid` 不传时由服务端按已鉴权 App ID 查询绑定用户。

## 余额刷新策略

- 首次配置成功后查询一次，验证凭证和余额连接。
- 单次生图、翻译或其他付费工作流完成后查询一次，在同一轮交付真实余额。
- 批量任务开始前查询一次以确认可用点数，整批结束后查询一次；批量内部不逐项查询。
- 用户说“已充值”“充值好了”“刷新点数”时立即查询。若充值到账存在短暂延迟，可在约 3 秒、10 秒后再查询，最多 3 次；更新后继续之前因余额不足而保留的任务。
- 余额不足后不定时轮询，也不自动重试付费任务；等待用户确认充值或再次要求执行。
- 余额查询失败不影响已成功的业务结果。继续交付产物，只说明余额暂时无法刷新。
- 旧余额、接口返回的 `usage` 和模型单价可以用于解释本次消耗，但不能通过相减推算并展示为“当前余额”。当前余额必须来自最近一次余额查询响应。
