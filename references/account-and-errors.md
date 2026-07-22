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
