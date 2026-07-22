#!/usr/bin/env node

import { createWriteStream } from "node:fs"
import { access, chmod, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises"
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path"
import { homedir } from "node:os"
import { randomUUID } from "node:crypto"
import { Transform } from "node:stream"
import { pipeline } from "node:stream/promises"
import { fileURLToPath } from "node:url"

const DEFAULT_BASE_URL = "https://api.fengniaoai.com"
const SKILL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const DEFAULT_MAX_DOWNLOAD_BYTES = 1024 * 1024 * 1024
const LOGIN_URL = "https://fengniaoai.com/"
const KEY_URL = "https://fengniaoai.com/userCenter/key"
const TERMINAL_STATES = new Set(["completed", "failed", "error", "not_found", "partial_failed"])
const IMAGE_MODELS = new Set(["tpro-1k", "tpro-2k", "pro-1k", "pro-2k", "pro-4k"])
const IMAGE_RATIOS = new Set(["1:1", "3:4", "4:3", "9:16", "16:9", "2:3", "3:2", "original"])
const IMAGE_LANGUAGE_ALIASES = new Map([
  ["自动", "auto"], ["自动检测", "auto"], ["自动识别", "auto"],
  ["中文", "zh"], ["简体中文", "zh"], ["中文简体", "zh"], ["中文（简）", "zh"], ["中文（简体）", "zh"], ["汉语", "zh"], ["chinese", "zh"],
  ["繁体中文", "zh-tw"], ["中文繁体", "zh-tw"], ["中文（繁）", "zh-tw"], ["中文（繁体）", "zh-tw"], ["traditional chinese", "zh-tw"],
  ["英语", "en"], ["英文", "en"], ["english", "en"],
  ["日语", "ja"], ["日文", "ja"], ["japanese", "ja"],
  ["韩语", "ko"], ["韩文", "ko"], ["korean", "ko"],
  ["俄语", "ru"], ["俄文", "ru"], ["russian", "ru"],
  ["泰语", "th"], ["泰文", "th"], ["thai", "th"],
  ["马来语", "ms"], ["malay", "ms"], ["越南语", "vi"], ["vietnamese", "vi"],
  ["印尼语", "id"], ["印度尼西亚语", "id"], ["indonesian", "id"],
  ["菲律宾语", "fil"], ["菲律宾文", "fil"], ["filipino", "fil"], ["孟加拉语", "bn"], ["bengali", "bn"],
  ["高棉语", "km"], ["柬埔寨语", "km"], ["khmer", "km"],
  ["阿拉伯语", "ar"], ["arabic", "ar"], ["土耳其语", "tr"], ["turkish", "tr"],
  ["希伯来语", "he"], ["hebrew", "he"], ["印地语", "hi"], ["hindi", "hi"],
  ["西班牙语", "es"], ["spanish", "es"], ["葡萄牙语", "pt"], ["portuguese", "pt"],
  ["德语", "de"], ["德文", "de"], ["german", "de"], ["法语", "fr"], ["法文", "fr"], ["french", "fr"],
  ["意大利语", "it"], ["italian", "it"], ["荷兰语", "nl"], ["dutch", "nl"],
  ["波兰语", "pl"], ["polish", "pl"], ["瑞典语", "sv"], ["swedish", "sv"],
  ["丹麦语", "da"], ["danish", "da"], ["希腊语", "el"], ["greek", "el"],
  ["匈牙利语", "hu"], ["hungarian", "hu"], ["罗马尼亚语", "ro"], ["romanian", "ro"],
  ["哈萨克语", "kk"], ["kazakh", "kk"], ["乌尔都语", "ur"], ["urdu", "ur"],
  ["乌克兰语", "uk"], ["ukrainian", "uk"], ["捷克语", "cs"], ["czech", "cs"],
])
const IMAGE_ENGINE_SOURCE_LANGUAGES = new Map([
  ["1", new Set(["en", "zh", "zh-tw", "ru", "ko", "ja", "ms", "vi", "id", "ar", "tr", "es", "pt", "de", "fr", "it", "nl", "pl", "sv", "da", "el", "hu", "ro"])],
  ["2", new Set(["auto", "en", "zh", "zh-tw", "ru", "th", "ko", "ja", "ms", "vi", "id", "fil", "bn", "km", "ar", "tr", "he", "es", "pt", "de", "fr", "it", "nl", "pl", "sv", "da", "el", "hu", "ro", "kk", "ur", "uk", "cs"])],
  ["3", new Set(["en", "zh", "zh-tw", "ru", "ko", "ja", "id", "ms", "vi", "th", "bn", "km", "ar", "tr", "he", "es", "pt", "de", "fr", "it", "nl", "pl", "sv", "ro", "da", "el", "hu", "uk", "cs", "hi", "kk", "ur"])],
])
const IMAGE_ENGINE_TARGET_LANGUAGES = new Map([
  ["1", new Set(["en", "zh", "zh-tw", "ru", "th", "ko", "ja", "ms", "vi", "id", "fil", "bn", "km", "ar", "tr", "he", "es", "pt", "de", "fr", "it", "nl", "pl", "sv", "ro", "kk", "ur", "uk", "cs"])],
  ["2", new Set(["en", "zh", "zh-tw", "ru", "th", "ko", "ja", "ms", "vi", "id", "fil", "bn", "km", "ar", "tr", "he", "es", "pt", "de", "fr", "it", "nl", "pl", "sv", "ro", "kk", "ur", "uk", "cs"])],
  ["3", new Set(["en", "zh", "zh-tw", "ru", "ko", "ja", "id", "ms", "vi", "th", "bn", "km", "ar", "tr", "he", "es", "pt", "de", "fr", "it", "nl", "pl", "sv", "ro", "da", "el", "hu", "uk", "cs", "hi", "kk", "ur"])],
])
const VIDEO_SOURCE_LANGUAGES = new Set(["zh-CN", "zh-TW", "en-US", "fr-FR", "de-DE", "es-ES", "pt-PT", "ru-RU", "ja-JP", "ko-KR", "th-TH", "ar-SA", "id-ID", "vi-VN", "fil-PH"])
const VIDEO_SUBTITLE_LANGUAGES = new Set(["zh-CN", "zh-HK", "zh-TW", "en-US", "fr-FR", "de-DE", "es-ES", "pt-PT", "ru-RU", "ja-JP", "ko-KR", "th-TH", "ar-SA", "id-ID", "vi-VN", "fil-PH", "tr-TR", "pl-PL", "hi-IN", "ur-PK", "bn-BD"])
const VIDEO_AI_DUB_LANGUAGES = new Set(["zh-CN", "zh-HK", "zh-TW", "en-US", "fr-FR", "de-DE", "es-ES", "pt-PT", "ru-RU", "ja-JP", "ko-KR", "th-TH", "ar-SA", "id-ID", "vi-VN", "fil-PH"])
const VIDEO_VOICE_CLONE_LANGUAGES = new Set(["zh-CN", "zh-HK", "zh-TW", "en-US", "fr-FR", "de-DE", "es-ES", "ru-RU", "ja-JP", "ko-KR"])
const VIDEO_LANGUAGE_ALIASES = new Map([
  ["中文", "zh-CN"], ["简体中文", "zh-CN"], ["中文简体", "zh-CN"], ["普通话", "zh-CN"], ["chinese", "zh-CN"], ["simplified chinese", "zh-CN"],
  ["繁体中文", "zh-TW"], ["中文繁体", "zh-TW"], ["台湾中文", "zh-TW"], ["traditional chinese", "zh-TW"],
  ["中文香港", "zh-HK"], ["香港中文", "zh-HK"], ["粤语", "zh-HK"], ["广东话", "zh-HK"], ["cantonese", "zh-HK"],
  ["英语", "en-US"], ["英文", "en-US"], ["english", "en-US"],
  ["法语", "fr-FR"], ["法文", "fr-FR"], ["french", "fr-FR"],
  ["德语", "de-DE"], ["德文", "de-DE"], ["german", "de-DE"],
  ["西班牙语", "es-ES"], ["西班牙文", "es-ES"], ["spanish", "es-ES"],
  ["葡萄牙语", "pt-PT"], ["葡萄牙文", "pt-PT"], ["portuguese", "pt-PT"],
  ["俄语", "ru-RU"], ["俄文", "ru-RU"], ["russian", "ru-RU"],
  ["日语", "ja-JP"], ["日文", "ja-JP"], ["japanese", "ja-JP"],
  ["韩语", "ko-KR"], ["韩文", "ko-KR"], ["korean", "ko-KR"],
  ["泰语", "th-TH"], ["泰文", "th-TH"], ["thai", "th-TH"],
  ["阿拉伯语", "ar-SA"], ["阿拉伯文", "ar-SA"], ["arabic", "ar-SA"],
  ["印尼语", "id-ID"], ["印度尼西亚语", "id-ID"], ["印尼文", "id-ID"], ["indonesian", "id-ID"],
  ["越南语", "vi-VN"], ["越南文", "vi-VN"], ["vietnamese", "vi-VN"],
  ["菲律宾语", "fil-PH"], ["菲律宾文", "fil-PH"], ["filipino", "fil-PH"],
  ["土耳其语", "tr-TR"], ["土耳其文", "tr-TR"], ["turkish", "tr-TR"],
  ["波兰语", "pl-PL"], ["波兰文", "pl-PL"], ["polish", "pl-PL"],
  ["印地语", "hi-IN"], ["印地文", "hi-IN"], ["hindi", "hi-IN"],
  ["乌尔都语", "ur-PK"], ["乌尔都文", "ur-PK"], ["urdu", "ur-PK"],
  ["孟加拉语", "bn-BD"], ["孟加拉文", "bn-BD"], ["bengali", "bn-BD"],
])
for (const code of VIDEO_SUBTITLE_LANGUAGES) VIDEO_LANGUAGE_ALIASES.set(code.toLowerCase(), code)
const VIDEO_EXTENSIONS = new Set(["mp4", "flv", "mov", "3gp", "avi", "mpg", "asf", "wmv", "mkv", "ts", "webm", "mxf"])
const VIDEO_VOICE_GROUP_LANGUAGES = new Map([
  ["中文 \\(普通话\\)", ["zh-CN", "zh-TW"]],
  ["中文 \\(粤语\\)", ["zh-HK", "zh-TW"]],
  ["英文", ["en-US"]],
  ["法文", ["fr-FR"]],
  ["德文", ["de-DE"]],
  ["西班牙文", ["es-ES"]],
  ["葡萄牙文", ["pt-PT"]],
  ["俄文", ["ru-RU"]],
  ["日文", ["ja-JP"]],
  ["韩文", ["ko-KR"]],
  ["泰文", ["th-TH"]],
  ["阿拉伯文", ["ar-SA"]],
  ["印尼文", ["id-ID"]],
  ["越南文", ["vi-VN"]],
  ["菲律宾文", ["fil-PH"]],
])
let videoVoiceLanguageMapPromise

class SkillError extends Error {
  constructor(errorType, userHint, options = {}) {
    super(userHint)
    this.errorType = errorType
    this.userHint = userHint
    this.retryable = Boolean(options.retryable)
    this.requestId = options.requestId
    this.code = options.code
  }
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

function usage() {
  return {
    ok: true,
    usage: "node scripts/fengniaoai.mjs <group> <action> [--input-json '<JSON>' | --input-stdin]",
    actions: [
      "account configure|balance",
      "image generate|transform|expand|enhance|cutout|ocr-submit|ocr-status|ocr|translate",
      "video translate-submit|translate-status|translate",
    ],
  }
}

async function readStandardInput() {
  let value = ""
  for await (const chunk of process.stdin) value += chunk
  return value.trim()
}

async function parseArgs(argv) {
  if (argv.includes("--help") || argv.includes("-h")) return { help: true }
  const [group, action, ...rest] = argv
  if (!group || !action) throw new SkillError("INVALID_INPUT", "请指定能力组和操作。运行 --help 查看可用操作。")
  let inputJson = "{}"
  let inputFromStdin = false
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === "--input-json") {
      if (inputFromStdin) throw new SkillError("INVALID_INPUT", "--input-json 与 --input-stdin 不能同时使用。")
      inputJson = rest[index + 1]
      index += 1
    } else if (rest[index] === "--input-stdin") {
      if (inputJson !== "{}") throw new SkillError("INVALID_INPUT", "--input-json 与 --input-stdin 不能同时使用。")
      inputFromStdin = true
    } else {
      throw new SkillError("INVALID_INPUT", `不支持的命令参数：${rest[index]}`)
    }
  }
  if (inputJson === undefined) throw new SkillError("INVALID_INPUT", "--input-json 缺少 JSON 值。")
  if (inputFromStdin) inputJson = await readStandardInput()
  let input
  try {
    input = JSON.parse(inputJson)
  } catch {
    if (inputFromStdin && inputJson) input = { config: inputJson }
    else throw new SkillError("INVALID_INPUT", "输入不是有效 JSON。")
  }
  if (!input || Array.isArray(input) || typeof input !== "object") {
    throw new SkillError("INVALID_INPUT", "--input-json 必须是 JSON 对象。")
  }
  return { group, action, input }
}

function requestId(input) {
  const existing = input.request_id
  if (typeof existing === "string" && existing.trim()) return existing.trim()
  if (typeof existing === "number" && Number.isFinite(existing)) return String(existing)
  return `agent_${randomUUID().replaceAll("-", "")}`
}

function credentialsFile() {
  const explicit = String(process.env.FENGNIAO_CREDENTIALS_FILE || "").trim()
  if (explicit) return resolve(explicit)
  const configRoot = String(process.env.XDG_CONFIG_HOME || "").trim()
  return join(configRoot ? resolve(configRoot) : join(homedir(), ".config"), "fengniaoai", "credentials.json")
}

async function credentials() {
  const projectId = String(process.env.FENGNIAO_PROJECT_ID || "").trim()
  const apiKey = String(process.env.FENGNIAO_API_KEY || "").trim()
  if (projectId && apiKey) return { projectId, apiKey }
  try {
    const saved = JSON.parse(await readFile(credentialsFile(), "utf8"))
    const savedProjectId = String(saved.project_id || "").trim()
    const savedApiKey = String(saved.api_key || "").trim()
    if (savedProjectId && savedApiKey) return { projectId: savedProjectId, apiKey: savedApiKey }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw new SkillError("CREDENTIALS_MISSING", `蜂鸟AI 本地配置无法读取。请重新从 ${KEY_URL} 复制配置并发送给 Agent。`)
    }
  }
  throw new SkillError(
    "CREDENTIALS_MISSING",
    `尚未连接蜂鸟AI。请先在 ${LOGIN_URL} 登录或注册，再到 ${KEY_URL} 点击“复制给 Agent”，将复制的两行配置粘贴到可信的私有对话中。`,
  )
}

function pastedCredential(input, envName, aliases = []) {
  for (const field of [envName, ...aliases]) {
    const direct = input[field]
    if (typeof direct === "string" && direct.trim()) return direct.trim()
  }
  const text = String(input.config || input.content || input.pasted_config || "").replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  const match = text.match(new RegExp(`(?:^|\\n)\\s*(?:export\\s+)?${envName}\\s*=\\s*(?:"([^"\\r\\n]+)"|'([^'\\r\\n]+)'|([^\\s#\\r\\n]+))`, "m"))
  return String(match?.[1] || match?.[2] || match?.[3] || "").trim()
}

async function accountConfigure(input) {
  const projectId = pastedCredential(input, "FENGNIAO_PROJECT_ID", ["project_id"])
  const apiKey = pastedCredential(input, "FENGNIAO_API_KEY", ["api_key"])
  if (!projectId || !apiKey) throw new SkillError("INVALID_INPUT", "没有识别到完整配置。请从 Key 页面重新复制同时包含 Project ID 和 Api key 的两行内容。")
  if (/\s/.test(projectId) || /\s/.test(apiKey)) throw new SkillError("INVALID_INPUT", "Project ID 或 Api key 格式不正确，请从 Key 页面重新复制。")
  const file = credentialsFile()
  const directory = dirname(file)
  const temporaryFile = `${file}.${process.pid}.${randomUUID()}.tmp`
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 })
    await chmod(directory, 0o700)
    await writeFile(temporaryFile, `${JSON.stringify({ project_id: projectId, api_key: apiKey }, null, 2)}\n`, { mode: 0o600 })
    await rename(temporaryFile, file)
    await chmod(file, 0o600)
  } catch {
    try { await unlink(temporaryFile) } catch { /* noop */ }
    throw new SkillError("TEMPORARY_UNAVAILABLE", "无法保存蜂鸟AI 配置。请检查 Agent 是否拥有用户配置目录写入权限。", { retryable: true })
  }
  return success("account.configure", requestId(input), "completed", {
    data: { configured: true, credentials_file: file, next_action: "account.balance" },
  })
}

function requireString(input, field, hint = field) {
  const value = input[field]
  if (typeof value !== "string" || !value.trim()) throw new SkillError("INVALID_INPUT", `请提供${hint}。`, { requestId: input.request_id })
  return value.trim()
}

function mimeType(path) {
  const types = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
  }
  return types[extname(path).toLowerCase()]
}

async function normalizeImageInput(value, { httpsOnly = false, maxBytes, allowedMimes } = {}) {
  if (typeof value !== "string" || !value.trim()) throw new SkillError("INVALID_INPUT", "请提供图片 URL 或本地图片路径。")
  const trimmed = value.trim()
  if (/^https:\/\//i.test(trimmed)) return trimmed
  if (/^http:\/\//i.test(trimmed)) throw new SkillError("INVALID_INPUT", "图片地址必须使用 HTTPS。")
  if (/^data:image\//i.test(trimmed)) {
    if (httpsOnly) throw new SkillError("INVALID_INPUT", "图片生成参考图目前只支持公网 HTTPS URL，请先将本地图片上传为可访问的 HTTPS 地址。")
    const match = trimmed.match(/^data:([^;,]+);base64,(.+)$/i)
    if (!match) throw new SkillError("INVALID_INPUT", "图片 data URL 必须使用 base64 编码。")
    if (allowedMimes && !allowedMimes.has(match[1].toLowerCase())) throw new SkillError("INVALID_INPUT", "图片格式不受当前接口支持。")
    if (maxBytes && Buffer.byteLength(match[2], "base64") > maxBytes) throw new SkillError("INVALID_INPUT", `图片不能超过 ${Math.floor(maxBytes / 1024 / 1024)} MB。`)
    return trimmed
  }
  if (httpsOnly) throw new SkillError("INVALID_INPUT", "图片生成参考图目前只支持公网 HTTPS URL，请先将本地图片上传为可访问的 HTTPS 地址。")
  const absolutePath = resolve(trimmed)
  const type = mimeType(absolutePath)
  if (!type) throw new SkillError("INVALID_INPUT", "本地图片仅支持 JPG、PNG、WEBP 或 BMP。")
  if (allowedMimes && !allowedMimes.has(type)) throw new SkillError("INVALID_INPUT", "图片格式不受当前接口支持。")
  let bytes
  try {
    bytes = await readFile(absolutePath)
  } catch {
    throw new SkillError("INVALID_INPUT", `无法读取本地图片：${absolutePath}`)
  }
  if (maxBytes && bytes.length > maxBytes) throw new SkillError("INVALID_INPUT", `图片不能超过 ${Math.floor(maxBytes / 1024 / 1024)} MB。`)
  return `data:${type};base64,${bytes.toString("base64")}`
}

function mapError(code, msg, requestIdValue) {
  const mappings = {
    400: ["INVALID_INPUT", false, "请求参数不正确，请检查输入后重试。"],
    401: ["AUTH_ERROR", false, `Project ID 或 Api key 无效，请到 ${KEY_URL} 检查并重新配置。`],
    403: ["PERMISSION_DENIED", false, `当前项目没有此接口权限，请到 ${KEY_URL} 检查 Project ID。`],
    429: ["RATE_LIMITED", true, "请求频率过高，请稍后使用相同 request_id 重试。"],
    1000: ["TEMPORARY_UNAVAILABLE", true, "图片翻译处理失败，请检查图片或稍后重试。"],
    1001: ["INVALID_INPUT", false, "图片尺寸过小，请使用尺寸大于 50 像素的图片。"],
    1002: ["INVALID_INPUT", false, "图片格式不受支持，请改用 JPG、PNG 或 WEBP。"],
    1003: ["TEMPORARY_UNAVAILABLE", true, "图片文字识别失败，请确认图片清晰度或稍后重试。"],
    1004: ["INVALID_INPUT", false, "图片内容不够清晰，无法识别文字。"],
    1005: ["TEMPORARY_UNAVAILABLE", true, "图片文字识别失败，请稍后重试。"],
    1010: ["TEMPORARY_UNAVAILABLE", true, "图片下载超时，请检查链接有效期后重试。"],
    1011: ["INVALID_INPUT", false, "图片下载失败，请检查链接、防盗链或访问权限。"],
    1020: ["TEMPORARY_UNAVAILABLE", true, "翻译服务暂时不可用，请稍后重试。"],
    1030: ["TEMPORARY_UNAVAILABLE", true, "图片文字擦除处理失败，请稍后重试。"],
    1031: ["TEMPORARY_UNAVAILABLE", true, "图片处理服务繁忙，请稍后重试。"],
    1040: ["RESULT_SAVE_FAILED", true, "翻译结果上传失败，请稍后重试。"],
    1050: ["INVALID_INPUT", false, "请求数据格式错误，请检查参数。"],
    1051: ["INVALID_INPUT", false, "图片 Base64 解码失败，请检查编码。"],
    1052: ["INVALID_INPUT", false, "语言参数错误，请检查源语言和目标语言代码。"],
    2000: ["TEMPORARY_UNAVAILABLE", true, "图片处理失败，请检查图片格式或稍后重试。"],
    2001: ["INVALID_INPUT", false, "请检查抠图主体类型和背景输出模式。"],
    2011: ["TEMPORARY_UNAVAILABLE", true, "文字识别失败，请检查图片清晰度或稍后重试。"],
    2040: ["INVALID_INPUT", false, "请检查生图参数；每个新任务应使用新的 request_id。"],
    2041: ["TEMPORARY_UNAVAILABLE", true, "图片生成失败，请稍后重试。"],
    2042: ["TASK_RUNNING", true, "相同请求正在处理中，请稍后查询或重试。"],
    2043: ["SAFETY_REJECTED", false, "内容未通过安全审核，请调整提示词或参考图后重试。"],
    2044: ["RESULT_SAVE_FAILED", true, "图片结果保存失败，请稍后重试。"],
    2050: ["INVALID_INPUT", false, "请检查视频翻译参数。"],
    2051: ["TEMPORARY_UNAVAILABLE", true, "视频翻译任务创建失败，请稍后重试。"],
    2052: ["TASK_NOT_FOUND", false, "未找到视频翻译任务，请检查任务 ID。"],
    2053: ["TEMPORARY_UNAVAILABLE", true, "视频翻译服务暂时不可用，请稍后重试。"],
    2054: ["TASK_RUNNING", true, "相同视频翻译请求正在处理中。"],
    2055: ["SAFETY_REJECTED", false, "视频地址未通过安全校验，请更换后重试。"],
    30000: ["CREDITS_INSUFFICIENT", false, `蜂鸟AI 点数不足。请登录 ${LOGIN_URL} 获取点数后重试。`],
    30001: ["RATE_LIMITED", true, "请求频率过高，请稍后重试。"],
    4015: ["INVALID_INPUT", false, msg || "剩余点数查询失败，请检查项目渠道。"],
    50002: ["RESULT_SAVE_FAILED", true, "结果保存失败，请稍后重试。"],
  }
  const [errorType, retryable, userHint] = mappings[Number(code)] || ["TEMPORARY_UNAVAILABLE", true, "蜂鸟AI 服务暂时不可用，请稍后重试。"]
  return new SkillError(errorType, userHint, { retryable, requestId: requestIdValue, code })
}

async function apiRequest(path, body, currentRequestId) {
  const { projectId, apiKey } = await credentials()
  const baseUrl = String(process.env.FENGNIAO_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "")
  const timeoutMs = Number(process.env.FENGNIAO_REQUEST_TIMEOUT_MS || 190000)
  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Fengniaoai-Project": projectId,
        "Content-Type": "application/json",
        "X-Request-Id": currentRequestId,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    const timeout = error?.name === "TimeoutError"
    throw new SkillError(
      "TEMPORARY_UNAVAILABLE",
      timeout ? "请求超时，请使用相同 request_id 重试。" : "无法连接蜂鸟AI 服务，请检查网络后重试。",
      { retryable: true, requestId: currentRequestId },
    )
  }
  let payload
  try {
    payload = await response.json()
  } catch {
    throw new SkillError("TEMPORARY_UNAVAILABLE", "蜂鸟AI 返回了无法解析的响应，请稍后重试。", { retryable: true, requestId: currentRequestId })
  }
  const businessCode = Number(payload?.code ?? response.status)
  if (!response.ok || businessCode !== 200) throw mapError(businessCode, payload?.msg, payload?.request_id || currentRequestId)
  return payload
}

function artifact(type, url, extra = {}) {
  return url ? { type, url, ...extra } : null
}

function success(action, currentRequestId, state, options = {}) {
  return {
    ok: true,
    action,
    request_id: currentRequestId,
    state,
    task_id: options.taskId || null,
    artifacts: (options.artifacts || []).filter(Boolean),
    data: options.data ?? {},
    usage: options.usage ?? {},
  }
}

function imageArtifacts(result = {}) {
  return [
    artifact("image", result.url, { width: result.width, height: result.height, mime_type: result.mime_type }),
    artifact("image", result.translatedUrl, { role: "translated" }),
    artifact("image", result.processedUrl, { role: "processed" }),
  ]
}

function translatedImageArtifacts(result = {}) {
  return [
    artifact("image", result.translatedUrl, { role: "translated" }),
    artifact("image", result.processedUrl, { role: "processed" }),
    artifact("image", result.url, { role: "source" }),
  ]
}

function booleanSetting(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback
  if (typeof value === "boolean") return value
  const normalized = String(value).trim().toLowerCase()
  if (["1", "true", "yes", "on"].includes(normalized)) return true
  if (["0", "false", "no", "off"].includes(normalized)) return false
  throw new SkillError("INVALID_INPUT", "download_artifacts 仅支持 true 或 false。")
}

function isInside(parent, target) {
  const pathDifference = relative(parent, target)
  return pathDifference === "" || (!pathDifference.startsWith(`..${sep}`) && pathDifference !== ".." && !pathDifference.startsWith(sep))
}

function safeFilePart(value, fallback) {
  const cleaned = String(value || "")
    .normalize("NFKC")
    .replace(/[\x00-\x1f\x7f<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80)
  return cleaned || fallback
}

function prepareDownloadOptions(input) {
  const enabled = input.download_artifacts === undefined
    ? booleanSetting(process.env.FENGNIAO_AUTO_DOWNLOAD, true)
    : booleanSetting(input.download_artifacts, true)
  if (!enabled) return { enabled: false }
  const explicitDirectory = String(input.output_dir || process.env.FENGNIAO_OUTPUT_DIR || "").trim()
  const currentDirectory = resolve(process.cwd())
  const outputDirectory = explicitDirectory
    ? resolve(explicitDirectory)
    : isInside(SKILL_ROOT, currentDirectory)
      ? join(homedir(), "Downloads", "fengniaoai-skill")
      : join(currentDirectory, "output", "fengniaoai-skill")
  if (isInside(SKILL_ROOT, outputDirectory)) {
    throw new SkillError("INVALID_INPUT", "不能把生成结果写入 Skill 安装目录，请改用工作区 output 目录或其他输出目录。")
  }
  const maximumBytes = Number(process.env.FENGNIAO_MAX_DOWNLOAD_BYTES || DEFAULT_MAX_DOWNLOAD_BYTES)
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 1) {
    throw new SkillError("INVALID_INPUT", "FENGNIAO_MAX_DOWNLOAD_BYTES 必须是大于 0 的整数。")
  }
  return {
    enabled: true,
    outputDirectory,
    filenamePrefix: safeFilePart(input.filename_prefix, ""),
    maximumBytes,
  }
}

const MIME_EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/gif", ".gif"],
  ["image/avif", ".avif"], ["video/mp4", ".mp4"], ["video/webm", ".webm"], ["video/quicktime", ".mov"],
  ["audio/mpeg", ".mp3"], ["audio/wav", ".wav"], ["audio/x-wav", ".wav"], ["audio/mp4", ".m4a"],
  ["application/x-subrip", ".srt"], ["text/srt", ".srt"], ["text/plain", ".txt"],
])

const ALLOWED_URL_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".mp4", ".webm", ".mov", ".mp3", ".wav", ".m4a", ".srt", ".txt"])

function extensionFromBytes(bytes, artifactType) {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return ".jpg"
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png"
  if (bytes.subarray(0, 6).toString("ascii") === "GIF87a" || bytes.subarray(0, 6).toString("ascii") === "GIF89a") return ".gif"
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return ".webp"
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WAVE") return ".wav"
  if (bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = bytes.subarray(8, 32).toString("ascii").toLowerCase()
    if (brand.includes("avif") || brand.includes("avis")) return ".avif"
    if (artifactType === "audio" || brand.includes("m4a")) return ".m4a"
    if (brand.includes("qt  ")) return ".mov"
    return ".mp4"
  }
  if (bytes.subarray(0, 3).toString("ascii") === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return ".mp3"
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return ".webm"
  return null
}

function extensionForDownload(response, url, bytes, artifactType) {
  const detected = extensionFromBytes(bytes, artifactType)
  if (detected) return detected
  const contentType = String(response.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase()
  if (MIME_EXTENSIONS.has(contentType)) return MIME_EXTENSIONS.get(contentType)
  const fromUrl = extname(new URL(url).pathname).toLowerCase()
  if (ALLOWED_URL_EXTENSIONS.has(fromUrl)) return fromUrl === ".jpeg" ? ".jpg" : fromUrl
  return artifactType === "subtitle" ? ".srt" : artifactType === "video" ? ".mp4" : artifactType === "audio" ? ".mp3" : ".bin"
}

async function availablePath(outputDirectory, stem, extension) {
  for (let index = 0; index < 10000; index += 1) {
    const suffix = index ? `-${index + 1}` : ""
    const candidate = join(outputDirectory, `${stem}${suffix}${extension}`)
    try {
      await access(candidate)
    } catch (error) {
      if (error?.code === "ENOENT") return candidate
      throw error
    }
  }
  throw new Error("too many duplicate files")
}

function validateDownloadUrl(value) {
  const parsed = new URL(value)
  if (parsed.protocol === "https:") return
  if (parsed.protocol === "http:" && ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname)) return
  throw new Error("仅允许下载 HTTPS 结果地址")
}

async function downloadArtifact(item, options, index) {
  validateDownloadUrl(item.url)
  const response = await fetch(item.url, { redirect: "follow", signal: AbortSignal.timeout(Number(process.env.FENGNIAO_DOWNLOAD_TIMEOUT_MS || 600000)) })
  validateDownloadUrl(response.url)
  if (!response.ok || !response.body) throw new Error(`下载响应异常（HTTP ${response.status}）`)
  const declaredLength = Number(response.headers.get("content-length") || 0)
  if (declaredLength > options.maximumBytes) throw new Error(`文件超过下载上限 ${options.maximumBytes} 字节`)
  const temporaryPath = join(options.outputDirectory, `.fengniao-download-${process.pid}-${randomUUID()}.tmp`)
  let byteCount = 0
  let header = Buffer.alloc(0)
  const limiter = new Transform({
    transform(chunk, encoding, callback) {
      byteCount += chunk.length
      if (byteCount > options.maximumBytes) return callback(new Error(`文件超过下载上限 ${options.maximumBytes} 字节`))
      if (header.length < 64) header = Buffer.concat([header, chunk.subarray(0, 64 - header.length)])
      callback(null, chunk)
    },
  })
  try {
    await pipeline(response.body, limiter, createWriteStream(temporaryPath, { flags: "wx", mode: 0o600 }))
    const extension = extensionForDownload(response, item.url, header, item.type)
    const defaultPrefix = safeFilePart(options.filenamePrefix || item.role || item.type, `artifact-${index + 1}`)
    const stem = options.filenamePrefix
      ? safeFilePart(`${options.filenamePrefix}-${item.role || item.type}`, `artifact-${index + 1}`)
      : defaultPrefix
    const targetPath = await availablePath(options.outputDirectory, stem, extension)
    await rename(temporaryPath, targetPath)
    return targetPath
  } catch (error) {
    try { await unlink(temporaryPath) } catch { /* noop */ }
    throw error
  }
}

async function materializeArtifacts(result, options) {
  if (!result?.ok || !Array.isArray(result.artifacts) || !result.artifacts.length) return result
  if (!options.enabled) return { ...result, download: { enabled: false, completed: 0, failed: 0, warnings: [] } }
  const artifacts = result.artifacts.map((item) => ({ ...item }))
  const warnings = []
  const downloadedUrls = new Map()
  let completed = 0
  let failed = 0
  try {
    await mkdir(options.outputDirectory, { recursive: true })
  } catch {
    return {
      ...result,
      artifacts,
      download: { enabled: true, output_dir: options.outputDirectory, completed: 0, failed: artifacts.filter((item) => item.role !== "source").length, warnings: ["无法创建结果输出目录；请检查目录权限。"] },
      download_warning: "结果已生成，但无法创建本地输出目录；请使用远程 URL。",
    }
  }
  for (let index = 0; index < artifacts.length; index += 1) {
    const item = artifacts[index]
    if (!item.url || item.role === "source") continue
    if (downloadedUrls.has(item.url)) {
      item.local_path = downloadedUrls.get(item.url)
      continue
    }
    try {
      item.local_path = await downloadArtifact(item, options, index)
      downloadedUrls.set(item.url, item.local_path)
      completed += 1
    } catch (error) {
      failed += 1
      warnings.push(`${item.role || item.type || "artifact"} 下载失败：${error?.message || "未知错误"}`)
    }
  }
  return {
    ...result,
    artifacts,
    download: { enabled: true, output_dir: options.outputDirectory, completed, failed, warnings },
    ...(warnings.length ? { download_warning: "部分结果未能自动下载，请使用 artifacts 中保留的远程 URL。" } : {}),
  }
}

async function accountBalance(input) {
  const currentRequestId = requestId(input)
  const channel = String(input.channel || process.env.FENGNIAO_CHANNEL || "fengn").trim()
  const body = { request_id: currentRequestId, channel }
  if (input.uid !== undefined && input.uid !== null && String(input.uid).trim()) body.uid = String(input.uid).trim()
  const payload = await apiRequest("/api/v1/user/available/petrolpak", body, currentRequestId)
  return success("account.balance", currentRequestId, "completed", { data: { petrolpaks: payload.data } })
}

function referenceUrls(input) {
  if (Array.isArray(input.reference_image_urls)) return input.reference_image_urls
  if (input.image) return [input.image]
  return []
}

async function prepareReferences(input) {
  const refs = referenceUrls(input)
  if (!refs.length) throw new SkillError("INVALID_INPUT", "请提供参考图片。", { requestId: input.request_id })
  if (refs.length > 6) throw new SkillError("INVALID_INPUT", "图片生成最多支持六张参考图。", { requestId: input.request_id })
  return Promise.all(refs.map((item) => normalizeImageInput(item, { httpsOnly: true })))
}

async function generateImage(action, input) {
  const currentRequestId = requestId(input)
  for (const field of ["quantity", "number", "count", "n"]) {
    if (input[field] !== undefined) throw new SkillError("INVALID_INPUT", "图片生成每次固定生成一张，请拆分为多个请求。", { requestId: currentRequestId })
  }
  let body
  if (action === "generate") {
    body = {
      request_id: currentRequestId,
      prompt: requireString(input, "prompt", "生图描述"),
      model_alias: input.model_alias || "tpro-1k",
      aspect_ratio: input.aspect_ratio || "1:1",
    }
  } else if (action === "transform") {
    body = {
      request_id: currentRequestId,
      prompt: requireString(input, "prompt", "图片修改要求"),
      reference_image_urls: await prepareReferences(input),
      model_alias: input.model_alias || "pro-1k",
      aspect_ratio: input.aspect_ratio || "original",
    }
  } else if (action === "expand") {
    body = {
      request_id: currentRequestId,
      prompt: input.prompt || "Extend the image naturally to the requested aspect ratio. Preserve the main subject, product identity, visible text, colors, lighting, and original composition. Only generate content needed outside the original canvas.",
      reference_image_urls: await prepareReferences(input),
      model_alias: input.model_alias || "pro-1k",
      aspect_ratio: requireString(input, "aspect_ratio", "目标图片比例"),
    }
  } else {
    const resolution = String(input.resolution || "2k").toLowerCase()
    if (!new Set(["2k", "4k"]).has(resolution)) throw new SkillError("INVALID_INPUT", "高清增强 resolution 仅支持 2k 或 4k。", { requestId: currentRequestId })
    body = {
      request_id: currentRequestId,
      prompt: input.prompt || "Create a high-resolution redraw of the reference image. Preserve the subject identity, product details, visible text, composition, colors, and lighting. Do not add or remove content.",
      reference_image_urls: await prepareReferences(input),
      model_alias: input.model_alias || (resolution === "4k" ? "pro-4k" : "pro-2k"),
      aspect_ratio: input.aspect_ratio || "original",
    }
  }
  if (!IMAGE_MODELS.has(body.model_alias)) throw new SkillError("INVALID_INPUT", "不支持的图片生成模型。", { requestId: currentRequestId })
  if (!IMAGE_RATIOS.has(body.aspect_ratio)) throw new SkillError("INVALID_INPUT", "不支持的图片比例。", { requestId: currentRequestId })
  if (body.aspect_ratio === "original" && !body.reference_image_urls?.length) throw new SkillError("INVALID_INPUT", "original 比例只能用于带参考图的图生图。", { requestId: currentRequestId })
  if (input.customer_id !== undefined) body.customer_id = input.customer_id
  const payload = await apiRequest("/api/v1/img/generate", body, currentRequestId)
  return success(`image.${action}`, payload.request_id || currentRequestId, "completed", {
    artifacts: imageArtifacts(payload.result),
    data: payload.result,
    usage: payload.usage,
  })
}

async function cutout(input) {
  const currentRequestId = requestId(input)
  const subjectTypes = { person: "body", product: "commodity", clothing: "cloth", general: "common" }
  const backgrounds = { transparent: "mask", white: "whiteBK", crop: "crop" }
  const subjectType = input.subject_type || "general"
  const background = input.background || "transparent"
  if (!subjectTypes[subjectType]) throw new SkillError("INVALID_INPUT", "subject_type 仅支持 person、product、clothing 或 general。", { requestId: currentRequestId })
  if (!backgrounds[background]) throw new SkillError("INVALID_INPUT", "background 仅支持 transparent、white 或 crop。", { requestId: currentRequestId })
  const payload = await apiRequest("/api/v1/img/cutout", {
    request_id: currentRequestId,
    customer_id: input.customer_id,
    image: await normalizeImageInput(input.image),
    type: subjectTypes[subjectType],
    output_mode: backgrounds[background],
  }, currentRequestId)
  return success("image.cutout", payload.request_id || currentRequestId, "completed", {
    artifacts: imageArtifacts(payload.result),
    data: payload.result,
    usage: payload.usage,
  })
}

async function ocrSubmit(input) {
  const currentRequestId = requestId(input)
  const payload = await apiRequest("/api/v1/editor/ocr", { image: await normalizeImageInput(input.image) }, currentRequestId)
  const task = payload.data?.data || payload.data || {}
  const taskId = task.id || task.task_id
  if (!taskId) throw new SkillError("TEMPORARY_UNAVAILABLE", "OCR 任务已提交但未返回任务 ID，请稍后重试。", { retryable: true, requestId: currentRequestId })
  return success("image.ocr-submit", currentRequestId, "pending", { taskId, data: { query_key: String(task.key || "2") } })
}

function firstTask(payload) {
  const value = payload.data?.data || payload.data || []
  return Array.isArray(value) ? value[0] : value
}

async function ocrStatus(input) {
  const currentRequestId = requestId(input)
  const taskId = requireString(input, "task_id", "OCR task_id")
  const queryKey = String(input.query_key || "2")
  const payload = await apiRequest("/api/v1/editor/task/info", { ids: [{ key: queryKey, value: taskId }] }, currentRequestId)
  const task = firstTask(payload) || {}
  const state = task.status || "pending"
  if (state === "not_found") throw new SkillError("TASK_NOT_FOUND", task.errMsg || "OCR 任务不存在或结果已过期。", { requestId: currentRequestId })
  if (state === "failed" || state === "error") throw new SkillError("TEMPORARY_UNAVAILABLE", "OCR 任务处理失败，请检查图片后重试。", { retryable: true, requestId: currentRequestId })
  return success("image.ocr-status", currentRequestId, state, {
    taskId,
    data: { texts: task.result?.texts || [], progress: task.progress ?? null },
  })
}

async function poll(action, statusFunction, input, submitted, terminal = TERMINAL_STATES) {
  const videoAction = action === "video.translate"
  const timeoutSeconds = Number(input.timeout_seconds || (videoAction ? 1800 : 90))
  const intervalMs = Number(input.poll_interval_ms || (videoAction ? 5000 : 1500))
  const deadline = Date.now() + Math.max(1, timeoutSeconds) * 1000
  let latest = submitted
  while (Date.now() < deadline) {
    latest = await statusFunction({ task_id: submitted.task_id, query_key: submitted.data?.query_key, request_id: submitted.request_id })
    if (terminal.has(latest.state)) return { ...latest, action }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, Math.max(100, intervalMs)))
  }
  return { ...latest, action, state: "pending", data: { ...latest.data, user_hint: "任务仍在处理中，可使用 task_id 继续查询。" } }
}

async function ocr(input) {
  const submitted = await ocrSubmit(input)
  return poll("image.ocr", ocrStatus, input, submitted)
}

async function translateImage(input) {
  const currentRequestId = requestId(input)
  const languageCode = (value) => {
    const normalized = String(value || "").trim().toLowerCase()
    return IMAGE_LANGUAGE_ALIASES.get(normalized) || normalized
  }
  const requestedFrom = languageCode(requireString(input, "lang_from", "源语言；不确定时可使用自动识别"))
  const requestedTo = languageCode(requireString(input, "lang_to", "目标语言"))
  let engine = input.engine
  if (engine === undefined || engine === null || engine === "") {
    if (requestedFrom === "auto") engine = 2
    else if (IMAGE_ENGINE_SOURCE_LANGUAGES.get("3").has(requestedFrom) && IMAGE_ENGINE_TARGET_LANGUAGES.get("3").has(requestedTo)) engine = 3
    else if (IMAGE_ENGINE_SOURCE_LANGUAGES.get("2").has(requestedFrom) && IMAGE_ENGINE_TARGET_LANGUAGES.get("2").has(requestedTo)) engine = 2
    else engine = 3
  }
  if (![1, 2, 3, "1", "2", "3"].includes(engine)) throw new SkillError("INVALID_INPUT", "图片翻译 engine 仅支持 1、2 或 3。", { requestId: currentRequestId })
  const engineKey = String(engine)
  const langFrom = requestedFrom
  const langTo = requestedTo
  if (langFrom === "auto" && String(engine) !== "2") throw new SkillError("INVALID_INPUT", "自动识别源语言只支持图片翻译引擎 2。", { requestId: currentRequestId })
  if (!IMAGE_ENGINE_SOURCE_LANGUAGES.get(engineKey).has(langFrom)) throw new SkillError("INVALID_INPUT", "当前图片翻译版本不支持该源语言，请换用支持的语言或使用自动识别。", { requestId: currentRequestId })
  if (!IMAGE_ENGINE_TARGET_LANGUAGES.get(engineKey).has(langTo)) throw new SkillError("INVALID_INPUT", "当前图片翻译版本不支持该目标语言，请查看图片翻译语言表后重试。", { requestId: currentRequestId })
  if (langFrom !== "auto" && langFrom === langTo) throw new SkillError("INVALID_INPUT", "源语言和目标语言不能相同。", { requestId: currentRequestId })
  if (Boolean(input.return_text) || Boolean(input.return_raw)) {
    throw new SkillError("INVALID_INPUT", "保存历史记录的图片翻译接口不返回文字区域数据；需要文字与坐标时请使用 image ocr。", { requestId: currentRequestId })
  }
  const source = requireString(input, "image", "待翻译图片")
  let filename = String(input.filename || "").trim()
  if (!filename && !source.startsWith("data:")) {
    try {
      filename = /^https?:\/\//i.test(source) ? basename(new URL(source).pathname) : basename(source)
    } catch { /* keep empty */ }
  }
  if (filename) {
    filename = filename.split(/[\\/]/).pop().replace(/[\x00-\x1f\x7f]/g, "").trim()
    if (!filename || filename.length > 255) throw new SkillError("INVALID_INPUT", "图片 filename 不能超过 255 个字符。", { requestId: currentRequestId })
  }
  const body = {
    request_id: currentRequestId,
    image: await normalizeImageInput(source, {
      maxBytes: 5 * 1024 * 1024,
      allowedMimes: new Set(["image/jpeg", "image/png", "image/webp"]),
    }),
    lang_from: langFrom,
    lang_to: langTo,
    engine,
    commodity_protection: Boolean(input.commodity_protection),
    glossary_enabled: Boolean(input.glossary_enabled),
    brand_protect: Boolean(input.brand_protect),
  }
  if (filename) body.filename = filename
  const payload = await apiRequest("/api/v1/img/translate-save", body, currentRequestId)
  return success("image.translate", payload.request_id || currentRequestId, "completed", {
    taskId: payload.taskId,
    artifacts: translatedImageArtifacts(payload.result),
    data: {
      ...payload.result,
      task_id: payload.taskId || null,
      image_id: payload.imgId || null,
      filename: filename || null,
    },
    usage: payload.usage,
  })
}

function cleanControlFields(input) {
  const body = { ...input }
  delete body.timeout_seconds
  delete body.poll_interval_ms
  delete body.download_artifacts
  delete body.output_dir
  delete body.filename_prefix
  return body
}

function validateHttpsUrl(value, hint) {
  if (typeof value !== "string" || !/^https:\/\//i.test(value.trim())) throw new SkillError("INVALID_INPUT", `${hint}必须是公网 HTTPS URL。`)
  const url = value.trim()
  if (url.length > 1024) throw new SkillError("INVALID_INPUT", `${hint}不能超过 1024 个字符。`)
  let extension
  try {
    extension = new URL(url).pathname.split(".").pop().toLowerCase()
  } catch {
    throw new SkillError("INVALID_INPUT", `${hint}不是有效 URL。`)
  }
  if (!VIDEO_EXTENSIONS.has(extension)) throw new SkillError("INVALID_INPUT", `${hint}必须带受支持的视频文件后缀。`)
  return url
}

async function loadVideoVoiceLanguageMap() {
  if (!videoVoiceLanguageMapPromise) {
    videoVoiceLanguageMapPromise = readFile(new URL("../references/video-voices.md", import.meta.url), "utf8").then((markdown) => {
      const voiceLanguages = new Map()
      let currentLanguages = null
      for (const line of markdown.split(/\r?\n/)) {
        if (line.startsWith("### ")) {
          currentLanguages = null
          for (const [group, languages] of VIDEO_VOICE_GROUP_LANGUAGES) {
            if (line.includes(group)) {
              currentLanguages = languages
              break
            }
          }
          continue
        }
        if (!currentLanguages) continue
        const row = line.match(/^\|[^|]*\|[^|]*\|[^|]*\|`([^`]+)`\|/)
        if (row) voiceLanguages.set(row[1], currentLanguages)
      }
      if (!voiceLanguages.size) throw new Error("empty voice table")
      return voiceLanguages
    }).catch(() => {
      throw new SkillError("TEMPORARY_UNAVAILABLE", "无法读取随 Skill 安装的音色知识库，请检查 Skill 文件是否完整。")
    })
  }
  return videoVoiceLanguageMapPromise
}

function normalizeVideoLanguage(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new SkillError("INVALID_INPUT", `请提供视频翻译${label}。`)
  const normalized = value.trim()
  return VIDEO_LANGUAGE_ALIASES.get(normalized.toLowerCase()) || normalized
}

async function validateVideoCreateInput(input, currentRequestId) {
  if (currentRequestId.length > 128) throw new SkillError("INVALID_INPUT", "视频翻译 request_id 长度不能超过 128。", { requestId: currentRequestId })
  if (input.callback_url !== undefined && String(input.callback_url || "").trim()) throw new SkillError("INVALID_INPUT", "视频翻译当前不支持 callback_url。", { requestId: currentRequestId })
  if (input.custom_data !== undefined && Buffer.byteLength(JSON.stringify(input.custom_data)) > 4096) throw new SkillError("INVALID_INPUT", "custom_data 不能超过 4 KB。", { requestId: currentRequestId })
  const hasSingle = input.video_url !== undefined
  const hasBatch = input.video_urls !== undefined
  if (hasSingle === hasBatch) throw new SkillError("INVALID_INPUT", "video_url 和 video_urls 必须且只能传一个。", { requestId: currentRequestId })
  if (hasSingle) validateHttpsUrl(input.video_url, "视频地址")
  if (hasBatch) {
    if (!Array.isArray(input.video_urls) || input.video_urls.length < 1 || input.video_urls.length > 10) throw new SkillError("INVALID_INPUT", "video_urls 必须包含 1 到 10 个视频地址。", { requestId: currentRequestId })
    const urls = input.video_urls.map((url) => validateHttpsUrl(url, "视频地址"))
    if (new Set(urls).size !== urls.length) throw new SkillError("INVALID_INPUT", "video_urls 不能包含重复地址。", { requestId: currentRequestId })
  }
  if (!VIDEO_SOURCE_LANGUAGES.has(input.source_language)) throw new SkillError("INVALID_INPUT", "视频翻译不支持该源语言代码。", { requestId: currentRequestId })
  if (!VIDEO_SUBTITLE_LANGUAGES.has(input.target_language)) throw new SkillError("INVALID_INPUT", "视频翻译不支持该目标语言代码。", { requestId: currentRequestId })
  const types = input.translation_type_list
  if (!Array.isArray(types) || !types.length || types.some((type) => !new Set(["subtitle", "speech"]).has(type))) throw new SkillError("INVALID_INPUT", "translation_type_list 至少包含 subtitle 或 speech。", { requestId: currentRequestId })
  if (new Set(types).size !== types.length) throw new SkillError("INVALID_INPUT", "translation_type_list 不能包含重复能力。", { requestId: currentRequestId })
  if (types.includes("speech")) {
    if (!input.tts || !new Set(["AI_DUB", "VOICE_CLONE"]).has(input.tts.type)) throw new SkillError("INVALID_INPUT", "语音翻译必须选择 AI_DUB 或 VOICE_CLONE。", { requestId: currentRequestId })
    if (input.tts.type === "AI_DUB") {
      if (!VIDEO_AI_DUB_LANGUAGES.has(input.target_language)) throw new SkillError("INVALID_INPUT", "AI 配音不支持该目标语言。", { requestId: currentRequestId })
      if (typeof input.tts.voice_id !== "string" || !input.tts.voice_id.trim()) throw new SkillError("INVALID_INPUT", "AI 配音必须提供兼容目标语言的 voice_id。", { requestId: currentRequestId })
      const voiceId = input.tts.voice_id.trim()
      const supportedLanguages = (await loadVideoVoiceLanguageMap()).get(voiceId)
      if (!supportedLanguages) throw new SkillError("INVALID_INPUT", "该 voice_id 不在随 Skill 安装的官方音色表中，请从音色知识库选择。", { requestId: currentRequestId })
      if (!supportedLanguages.includes(input.target_language)) throw new SkillError("INVALID_INPUT", `该 voice_id 不支持目标语言 ${input.target_language}，请改选对应语言的音色。`, { requestId: currentRequestId })
    } else {
      if (!VIDEO_VOICE_CLONE_LANGUAGES.has(input.target_language)) throw new SkillError("INVALID_INPUT", "原声克隆不支持该目标语言。", { requestId: currentRequestId })
      if (input.tts.voice_id !== undefined) throw new SkillError("INVALID_INPUT", "原声克隆不要传 voice_id。", { requestId: currentRequestId })
    }
  }
}

async function videoSubmit(input) {
  const currentRequestId = requestId(input)
  const normalizedInput = {
    ...input,
    source_language: normalizeVideoLanguage(input.source_language, "源语言"),
    target_language: normalizeVideoLanguage(input.target_language, "目标语言"),
  }
  if (normalizedInput.tts?.voice_id !== undefined) normalizedInput.tts = { ...normalizedInput.tts, voice_id: String(normalizedInput.tts.voice_id).trim() }
  await validateVideoCreateInput(normalizedInput, currentRequestId)
  const body = { ...cleanControlFields(normalizedInput), request_id: currentRequestId }
  const payload = await apiRequest("/api/v1/video/translate/create", body, currentRequestId)
  const result = payload.result || {}
  const taskId = result.task_id || null
  return success("video.translate-submit", payload.request_id || currentRequestId, result.status || "pending", {
    taskId,
    data: result,
    usage: payload.usage,
  })
}

async function videoStatus(input) {
  const currentRequestId = requestId(input)
  const body = { request_id: currentRequestId }
  for (const field of ["task_id", "task_ids", "batch_id"]) if (input[field] !== undefined) body[field] = input[field]
  const selectors = ["task_id", "task_ids", "batch_id"].filter((field) => body[field] !== undefined)
  if (selectors.length !== 1) throw new SkillError("INVALID_INPUT", "task_id、task_ids、batch_id 必须且只能传一种。", { requestId: currentRequestId })
  if (body.task_ids !== undefined && (!Array.isArray(body.task_ids) || body.task_ids.length < 1 || body.task_ids.length > 20)) throw new SkillError("INVALID_INPUT", "task_ids 必须包含 1 到 20 个任务 ID。", { requestId: currentRequestId })
  const payload = await apiRequest("/api/v1/video/translate/query", body, currentRequestId)
  const result = payload.result || {}
  const state = result.status || "pending"
  const resultArtifacts = (item) => [
    artifact("video", item.video_url, { role: "translated", task_id: item.task_id }),
    artifact("image", item.cover_url, { role: "cover", task_id: item.task_id }),
    artifact("audio", item.assets?.original_audio_url, { role: "original-audio", task_id: item.task_id }),
    artifact("subtitle", item.assets?.translated_subtitle_srt_url, { role: "translated-subtitle", task_id: item.task_id }),
    artifact("subtitle", item.assets?.original_dialog_srt_url, { role: "original-dialog", task_id: item.task_id }),
    artifact("subtitle", item.assets?.original_intro_srt_url, { role: "original-intro", task_id: item.task_id }),
    artifact("video", item.assets?.erased_video_url, { role: "subtitle-erased", task_id: item.task_id }),
  ]
  const artifacts = [...resultArtifacts(result), ...(result.tasks || []).flatMap(resultArtifacts)]
  return success("video.translate-status", payload.request_id || currentRequestId, state, {
    taskId: result.task_id,
    artifacts,
    data: result,
    usage: payload.usage,
  })
}

async function videoTranslate(input) {
  if (Array.isArray(input.video_urls)) throw new SkillError("INVALID_INPUT", "阻塞式 video translate 仅支持单个 video_url；批量任务请使用 translate-submit。")
  const submitted = await videoSubmit(input)
  if (!submitted.task_id) return submitted
  return poll("video.translate", videoStatus, input, submitted)
}

async function run(group, action, input) {
  if (group === "account" && action === "configure") return accountConfigure(input)
  if (group === "account" && action === "balance") return accountBalance(input)
  if (group === "image" && new Set(["generate", "transform", "expand", "enhance"]).has(action)) return generateImage(action, input)
  if (group === "image" && action === "cutout") return cutout(input)
  if (group === "image" && action === "ocr-submit") return ocrSubmit(input)
  if (group === "image" && action === "ocr-status") return ocrStatus(input)
  if (group === "image" && action === "ocr") return ocr(input)
  if (group === "image" && action === "translate") return translateImage(input)
  if (group === "video" && action === "translate-submit") return videoSubmit(input)
  if (group === "video" && action === "translate-status") return videoStatus(input)
  if (group === "video" && action === "translate") return videoTranslate(input)
  throw new SkillError("INVALID_INPUT", `不支持的操作：${group} ${action}。运行 --help 查看可用操作。`)
}

async function main() {
  try {
    const parsed = await parseArgs(process.argv.slice(2))
    if (parsed.help) return printJson(usage())
    const downloadOptions = prepareDownloadOptions(parsed.input)
    const result = await run(parsed.group, parsed.action, parsed.input)
    printJson(await materializeArtifacts(result, downloadOptions))
  } catch (error) {
    const normalized = error instanceof SkillError
      ? error
      : new SkillError("TEMPORARY_UNAVAILABLE", "执行失败，请稍后重试。", { retryable: true })
    printJson({
      ok: false,
      error_type: normalized.errorType,
      retryable: normalized.retryable,
      user_hint: normalized.userHint,
      request_id: normalized.requestId || null,
      code: normalized.code || null,
    })
    process.exitCode = 1
  }
}

await main()
