#!/usr/bin/env node

import { createReadStream, createWriteStream } from "node:fs"
import { access, chmod, mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises"
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path"
import { homedir } from "node:os"
import { createHash, randomUUID } from "node:crypto"
import { spawn } from "node:child_process"
import { Transform } from "node:stream"
import { pipeline } from "node:stream/promises"
import { fileURLToPath } from "node:url"

const DEFAULT_BASE_URL = "https://api.fengniaoai.com"
const SKILL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/fengniao-ai/fengniaoai-skill/main/claw.json"
const DEFAULT_MAX_DOWNLOAD_BYTES = 1024 * 1024 * 1024
const LOGIN_URL = "https://fengniaoai.com/"
const KEY_URL = "https://fengniaoai.com/userCenter/key"
const TERMINAL_STATES = new Set(["completed", "failed", "error", "not_found", "partial_failed"])
const IMAGE_MODELS = new Set(["tpro-1k", "tpro-2k", "pro-1k", "pro-2k", "pro-4k"])
const IMAGE_MODEL_CREDITS = new Map([["tpro-1k", 10], ["tpro-2k", 12], ["pro-1k", 12], ["pro-2k", 12], ["pro-4k", 18]])
const IMAGE_RATIOS = new Set(["1:1", "3:4", "4:3", "9:16", "16:9", "2:3", "3:2", "original"])
const IMAGE_BATCH_ACTIONS = new Set(["generate", "transform", "expand", "enhance"])
const IMAGE_BATCH_TERMINAL_STATES = new Set(["completed", "failed", "cancelled"])
const IMAGE_BATCH_FINAL_STATES = new Set(["completed", "cancelled", "partial_failed"])
const IMAGE_BATCH_GLOBAL_PAUSE_ERRORS = new Set(["RATE_LIMITED", "CREDITS_INSUFFICIENT", "CREDENTIALS_MISSING", "AUTH_ERROR", "PERMISSION_DENIED"])
const PRODUCT_PLATFORMS = new Set(["1688", "taobao", "amazon"])
const AMAZON_DOMAINS = new Set([
  "amazon.com", "amazon.ca", "amazon.com.mx", "amazon.com.br", "amazon.co.uk", "amazon.de",
  "amazon.fr", "amazon.it", "amazon.es", "amazon.nl", "amazon.se", "amazon.pl",
  "amazon.com.be", "amazon.co.jp", "amazon.in", "amazon.com.au", "amazon.sg", "amazon.ae",
  "amazon.sa",
])
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
      "skill check-update",
      "image generate|transform|expand|enhance|batch-submit|batch-list|batch-status|batch-pause|batch-resume|batch-retry|batch-cancel|cutout|ocr-submit|ocr-status|ocr|analyze|translate",
      "product scrape",
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

function configDirectory() {
  const configRoot = String(process.env.XDG_CONFIG_HOME || "").trim()
  return join(configRoot ? resolve(configRoot) : join(homedir(), ".config"), "fengniaoai")
}

function credentialsFile() {
  const explicit = String(process.env.FENGNIAO_CREDENTIALS_FILE || "").trim()
  if (explicit) return resolve(explicit)
  return join(configDirectory(), "credentials.json")
}

function updateStateFile() {
  return join(configDirectory(), "update-check.json")
}

function batchRegistryFile() {
  const explicit = String(process.env.FENGNIAO_STATE_DIR || "").trim()
  return join(explicit ? resolve(explicit) : configDirectory(), "batches.json")
}

async function withBatchRegistryLock(operation) {
  const registry = batchRegistryFile()
  const lockFile = `${registry}.lock`
  await mkdir(dirname(registry), { recursive: true, mode: 0o700 })
  let lock
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      lock = await open(lockFile, "wx", 0o600)
      break
    } catch (error) {
      if (error?.code !== "EEXIST") throw error
      try {
        const lockStat = await stat(lockFile)
        if (Date.now() - lockStat.mtimeMs > 30000) {
          await unlink(lockFile)
          continue
        }
      } catch (statError) {
        if (statError?.code !== "ENOENT") throw statError
      }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 50))
    }
  }
  if (!lock) throw new Error("batch registry lock timeout")
  try {
    return await operation(registry)
  } finally {
    try { await lock.close() } catch { /* noop */ }
    try { await unlink(lockFile) } catch { /* noop */ }
  }
}

async function readBatchRegistry(registry = batchRegistryFile()) {
  try {
    const parsed = JSON.parse(await readFile(registry, "utf8"))
    return Array.isArray(parsed?.batches) ? parsed : { schema_version: "1.0", batches: [] }
  } catch (error) {
    if (error?.code === "ENOENT") return { schema_version: "1.0", batches: [] }
    throw error
  }
}

async function discoverBatchEntries(rootDirectory, { maxDepth = 6, maxDirectories = 1000 } = {}) {
  const root = resolve(rootDirectory)
  const queue = [{ directory: root, depth: 0 }]
  const entries = []
  let visited = 0
  while (queue.length && visited < maxDirectories && entries.length < 200) {
    const current = queue.shift()
    visited += 1
    try {
      const flatManifest = join(current.directory, ".fengniao", "manifest.json")
      try {
        const manifest = JSON.parse(await readFile(flatManifest, "utf8"))
        if (manifest?.batch_id && Array.isArray(manifest.tasks)) {
          entries.push({ batch_id: manifest.batch_id, batch_dir: current.directory, created_at: manifest.created_at || null })
          continue
        }
      } catch { /* not a flat batch workspace */ }
      if (basename(current.directory).startsWith("batch_")) {
        try {
          const manifest = JSON.parse(await readFile(join(current.directory, "manifest.json"), "utf8"))
          if (manifest?.batch_id && Array.isArray(manifest.tasks)) {
            entries.push({ batch_id: manifest.batch_id, batch_dir: current.directory, created_at: manifest.created_at || null })
            continue
          }
        } catch { /* not a legacy batch directory */ }
      }
      if (current.depth >= maxDepth) continue
      const children = await readdir(current.directory, { withFileTypes: true })
      for (const child of children) {
        if (!child.isDirectory() || [".git", ".fengniao", "node_modules", "images"].includes(child.name)) continue
        queue.push({ directory: join(current.directory, child.name), depth: current.depth + 1 })
      }
    } catch { /* an unreadable directory does not block discovery elsewhere */ }
  }
  return entries
}

async function registerBatch(manifest, paths) {
  await withBatchRegistryLock(async (registryFile) => {
    const registry = await readBatchRegistry(registryFile)
    const entry = { batch_id: manifest.batch_id, batch_dir: paths.directory, created_at: manifest.created_at }
    registry.schema_version = "1.0"
    registry.updated_at = new Date().toISOString()
    registry.batches = [entry, ...registry.batches.filter((item) => item?.batch_id !== manifest.batch_id)].slice(0, 200)
    await writeJsonAtomic(registryFile, registry)
  })
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
    `尚未连接蜂鸟AI。请先在 ${LOGIN_URL} 登录或注册，再到 ${KEY_URL} 点击“复制给 Agent”，将复制的配置粘贴到可信的私有对话中。`,
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
  if (!projectId || !apiKey) throw new SkillError("INVALID_INPUT", "没有识别到完整配置。请从 Key 页面重新复制包含 Project ID 和 Api key 的配置。")
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

function boundedInteger(value, fallback, { min = 1, max = 100 } = {}) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < min) return fallback
  return Math.min(parsed, max)
}

function wait(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}

function retryDelayMs(response, attempt) {
  const retryAfter = response?.headers?.get?.("retry-after")
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (Number.isFinite(seconds)) return Math.max(100, seconds * 1000)
    const date = Date.parse(retryAfter)
    if (Number.isFinite(date)) return Math.max(100, date - Date.now())
  }
  const base = boundedInteger(process.env.FENGNIAO_API_RETRY_BASE_MS, 1000, { min: 1, max: 60000 })
  return Math.min(30000, base * (2 ** attempt))
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const results = new Array(values.length)
  let cursor = 0
  async function worker() {
    while (cursor < values.length) {
      const index = cursor
      cursor += 1
      results[index] = await mapper(values[index], index)
    }
  }
  const workerCount = Math.min(values.length, Math.max(1, concurrency))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}

function mimeType(path) {
  const types = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".mp4": "video/mp4", ".mov": "video/quicktime", ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska", ".webm": "video/webm", ".mpg": "video/mpeg",
    ".mpeg": "video/mpeg", ".ts": "video/mp2t", ".flv": "video/x-flv",
    ".3gp": "video/3gpp", ".asf": "video/x-ms-asf", ".wmv": "video/x-ms-wmv",
    ".mxf": "application/mxf",
  }
  return types[extname(path).toLowerCase()]
}

function normalizeAssetInput(value, currentRequestId) {
  if (typeof value !== "string" || !value.trim()) throw new SkillError("INVALID_INPUT", "请提供本地文件路径或 HTTPS URL。", { requestId: currentRequestId })
  let input = value.trim()
  for (let index = 0; index < 2; index += 1) {
    if (input.length >= 2 && input[0] === input.at(-1) && new Set(["'", '"', "`"]).has(input[0])) input = input.slice(1, -1).trim()
  }
  if (/^file:/i.test(input)) {
    try {
      input = fileURLToPath(new URL(input))
    } catch {
      throw new SkillError("INVALID_INPUT", "本地 file URL 无效，请重新选择文件。", { requestId: currentRequestId })
    }
  }
  if (input === "~") input = homedir()
  else if (input.startsWith("~/")) input = join(homedir(), input.slice(2))
  return input
}

function detectImageMime(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg"
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png"
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp"
  if (buffer.length >= 2 && buffer.subarray(0, 2).toString("ascii") === "BM") return "image/bmp"
  return null
}

function validateImageBytes(buffer, declaredMime, currentRequestId) {
  const actualMime = detectImageMime(buffer)
  if (!actualMime) throw new SkillError("INVALID_INPUT", "文件内容不是受支持的图片，或图片已经损坏。", { requestId: currentRequestId })
  if (actualMime !== declaredMime) throw new SkillError("INVALID_INPUT", "图片扩展名或声明格式与实际内容不一致，请使用正确格式的图片。", { requestId: currentRequestId })
}

function detectVideoFamily(buffer) {
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") return "iso-bmff"
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "AVI ") return "avi"
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "ebml"
  if (buffer.length >= 3 && buffer.subarray(0, 3).toString("ascii") === "FLV") return "flv"
  if (buffer.length >= 16 && buffer.subarray(0, 16).equals(Buffer.from([0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11, 0xa6, 0xd9, 0x00, 0xaa, 0x00, 0x62, 0xce, 0x6c]))) return "asf"
  if (buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && [0xba, 0xb3].includes(buffer[3])) return "mpeg"
  if (buffer.length >= 1 && buffer[0] === 0x47) return "mpeg-ts"
  if (buffer.length >= 14 && buffer.subarray(0, 14).equals(Buffer.from([0x06, 0x0e, 0x2b, 0x34, 0x02, 0x05, 0x01, 0x01, 0x0d, 0x01, 0x02, 0x01, 0x01, 0x02]))) return "mxf"
  return null
}

function validateVideoHeader(buffer, declaredMime, currentRequestId) {
  const family = detectVideoFamily(buffer)
  const accepted = {
    "iso-bmff": new Set(["video/mp4", "video/quicktime", "video/3gpp"]),
    avi: new Set(["video/x-msvideo"]),
    ebml: new Set(["video/x-matroska", "video/webm"]),
    flv: new Set(["video/x-flv"]),
    asf: new Set(["video/x-ms-asf", "video/x-ms-wmv"]),
    mpeg: new Set(["video/mpeg"]),
    "mpeg-ts": new Set(["video/mp2t"]),
    mxf: new Set(["application/mxf"]),
  }
  if (!family) throw new SkillError("INVALID_INPUT", "文件内容不是受支持的视频，或视频已经损坏。", { requestId: currentRequestId })
  if (!accepted[family]?.has(declaredMime)) throw new SkillError("INVALID_INPUT", "视频扩展名与实际容器格式不一致，请使用正确格式的视频。", { requestId: currentRequestId })
}

function fileHeader(path, maxBytes = 64) {
  return new Promise((resolvePromise, reject) => {
    const chunks = []
    let size = 0
    const stream = createReadStream(path, { start: 0, end: maxBytes - 1 })
    stream.on("data", (chunk) => {
      chunks.push(chunk)
      size += chunk.length
    })
    stream.on("error", reject)
    stream.on("end", () => resolvePromise(Buffer.concat(chunks, size)))
  })
}

const UPLOAD_PURPOSES = new Map([
  ["image_reference", { maxBytes: 3 * 1024 * 1024, mimes: new Set(["image/jpeg", "image/png", "image/webp"]) }],
  ["image_cutout", { maxBytes: 10 * 1024 * 1024, mimes: new Set(["image/jpeg", "image/png", "image/webp", "image/bmp"]) }],
  ["image_ocr", { maxBytes: 3 * 1024 * 1024, mimes: new Set(["image/jpeg", "image/png", "image/webp", "image/bmp"]) }],
  ["image_translate", { maxBytes: 5 * 1024 * 1024, mimes: new Set(["image/jpeg", "image/png", "image/webp"]) }],
  ["video_translate", { maxBytes: 500 * 1024 * 1024, mimes: new Set(["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm", "video/mpeg", "video/mp2t", "video/x-flv", "video/3gpp", "video/x-ms-asf", "video/x-ms-wmv", "application/mxf"]) }],
])

function bufferMd5(buffer) {
  return createHash("md5").update(buffer).digest("base64")
}

function fileMd5(path) {
  return new Promise((resolvePromise, reject) => {
    const hash = createHash("md5")
    const stream = createReadStream(path)
    stream.on("data", (chunk) => hash.update(chunk))
    stream.on("error", reject)
    stream.on("end", () => resolvePromise(hash.digest("base64")))
  })
}

async function materializeInputAsset(value, { purpose, currentRequestId, refreshIndex = 0 }) {
  const input = normalizeAssetInput(value, currentRequestId)
  if (/^https:\/\//i.test(input)) return { url: input }
  if (/^http:\/\//i.test(input)) throw new SkillError("INVALID_INPUT", "远程文件地址必须使用 HTTPS。", { requestId: currentRequestId })
  if (input.startsWith("api-upload-temp/")) return { key: input }
  const profile = UPLOAD_PURPOSES.get(purpose)
  if (!profile) throw new SkillError("INVALID_INPUT", "不支持的上传用途。", { requestId: currentRequestId })

  let filename
  let contentType
  let size
  let body
  let localPath
  let contentMd5
  if (/^data:/i.test(input)) {
    const match = input.match(/^data:([^;,]+);base64,(.+)$/i)
    if (!match) throw new SkillError("INVALID_INPUT", "data URL 必须使用 base64 编码。", { requestId: currentRequestId })
    contentType = match[1].toLowerCase()
    body = Buffer.from(match[2], "base64")
    size = body.length
    if (contentType.startsWith("image/")) validateImageBytes(body, contentType, currentRequestId)
    contentMd5 = bufferMd5(body)
    const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/").pop()
    filename = `upload.${extension}`
  } else {
    const absolutePath = resolve(input)
    contentType = mimeType(absolutePath)
    if (!contentType) throw new SkillError("INVALID_INPUT", "本地文件格式不受支持。", { requestId: currentRequestId })
    let fileStat
    try { fileStat = await stat(absolutePath) } catch { throw new SkillError("INVALID_INPUT", `无法读取本地文件：${absolutePath}`, { requestId: currentRequestId }) }
    if (!fileStat.isFile()) throw new SkillError("INVALID_INPUT", `不是有效文件：${absolutePath}`, { requestId: currentRequestId })
    filename = basename(absolutePath)
    size = fileStat.size
    if (purpose === "video_translate") {
      try {
        validateVideoHeader(await fileHeader(absolutePath), contentType, currentRequestId)
        contentMd5 = await fileMd5(absolutePath)
      } catch (error) {
        if (error instanceof SkillError) throw error
        throw new SkillError("INVALID_INPUT", `无法读取本地文件：${absolutePath}`, { requestId: currentRequestId })
      }
      localPath = absolutePath
    } else {
      try { body = await readFile(absolutePath) } catch { throw new SkillError("INVALID_INPUT", `无法读取本地文件：${absolutePath}`, { requestId: currentRequestId }) }
      validateImageBytes(body, contentType, currentRequestId)
      contentMd5 = bufferMd5(body)
    }
  }
  if (!profile.mimes.has(contentType)) throw new SkillError("INVALID_INPUT", "文件格式不受当前接口支持。", { requestId: currentRequestId })
  if (size < 1 || size > profile.maxBytes) throw new SkillError("INVALID_INPUT", `文件不能超过 ${Math.floor(profile.maxBytes / 1024 / 1024)} MB。`, { requestId: currentRequestId })

  const uploadFingerprint = createHash("sha256").update([currentRequestId, purpose, contentMd5, refreshIndex].join("\0")).digest("hex").slice(0, 24)
  const uploadRequestId = `${String(currentRequestId).slice(0, 90)}-upload-${uploadFingerprint}`
  const uploadBody = {
    request_id: uploadRequestId,
    purpose,
    filename,
    content_type: contentType,
    size,
    content_md5: contentMd5,
  }
  const maxAttempts = boundedInteger(process.env.FENGNIAO_UPLOAD_MAX_ATTEMPTS, 3, { min: 1, max: 5 })
  let lastStatus
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const payload = await apiRequest("/api/v1/oss/upload-url", uploadBody, currentRequestId)
    const upload = payload.result?.upload
    const assetKey = payload.result?.asset_key
    if (!upload?.url || !assetKey) throw new SkillError("TEMPORARY_UNAVAILABLE", "未能创建文件上传地址，请稍后重试。", { retryable: true, requestId: currentRequestId })
    const method = String(upload.method || "PUT").toUpperCase()
    if (method !== "PUT") throw new SkillError("TEMPORARY_UNAVAILABLE", "文件上传协议暂不受支持，请稍后重试。", { retryable: true, requestId: currentRequestId })
    const configuredTimeout = boundedInteger(process.env.FENGNIAO_UPLOAD_TIMEOUT_MS, 14 * 60 * 1000, { min: 1000, max: 15 * 60 * 1000 })
    const expiresAt = Date.parse(upload.expires_at || "")
    const remainingMs = Number.isFinite(expiresAt) ? expiresAt - Date.now() - 5000 : configuredTimeout
    if (remainingMs <= 1000) {
      if (attempt + 1 < maxAttempts) continue
      throw new SkillError("TEMPORARY_UNAVAILABLE", "文件上传地址已过期，请稍后重试。", { retryable: true, requestId: currentRequestId })
    }
    const requestBody = localPath ? createReadStream(localPath) : body
    let response
    try {
      response = await fetch(upload.url, {
        method,
        headers: upload.headers,
        body: requestBody,
        ...(requestBody?.pipe ? { duplex: "half" } : {}),
        signal: AbortSignal.timeout(Math.min(configuredTimeout, remainingMs)),
      })
    } catch {
      if (attempt + 1 < maxAttempts) {
        await wait(retryDelayMs(null, attempt))
        continue
      }
      throw new SkillError("TEMPORARY_UNAVAILABLE", "文件上传暂时失败，请检查网络后重试。", { retryable: true, requestId: currentRequestId })
    }
    lastStatus = response.status
    if (response.ok || response.status === 409) return { key: assetKey }
    if (attempt + 1 < maxAttempts) {
      await wait(retryDelayMs(response, attempt))
      continue
    }
  }
  throw new SkillError("TEMPORARY_UNAVAILABLE", `文件上传暂时失败${lastStatus ? `（HTTP ${lastStatus}）` : ""}，请稍后重试。`, { retryable: true, requestId: currentRequestId })
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
    2060: ["INVALID_INPUT", false, "文件上传参数不正确，请检查格式和大小。"],
    2061: ["TEMPORARY_UNAVAILABLE", true, "暂时无法创建文件上传地址，请稍后重试。"],
    2062: ["INVALID_INPUT", false, "临时文件无效或不属于当前项目，请重新选择文件。"],
    2063: ["TEMPORARY_UNAVAILABLE", true, "OSS 尚未找到上传文件，请使用相同 request_id 重试。"],
    2064: ["INVALID_INPUT", false, "临时文件已过期，请重新选择并上传。"],
    2065: ["TEMPORARY_UNAVAILABLE", true, "临时文件暂时无法校验，请稍后重试。"],
    2070: ["INVALID_INPUT", false, "请检查识图图片和请求参数。"],
    2071: ["TEMPORARY_UNAVAILABLE", true, "图片分析失败，请检查图片内容或稍后重试。"],
    2080: ["INVALID_INPUT", false, "商品平台或链接格式不正确，请提供受支持的完整商品链接。"],
    2081: ["TEMPORARY_UNAVAILABLE", true, "商品数据采集失败，请检查商品是否存在或稍后重试。"],
    30000: ["CREDITS_INSUFFICIENT", false, `蜂鸟AI 点数不足。请登录 ${LOGIN_URL} 获取点数后重试。`],
    30001: ["RATE_LIMITED", true, "请求频率过高，请稍后重试。"],
    4015: ["INVALID_INPUT", false, msg || "剩余点数查询失败，请检查项目渠道。"],
    50002: ["RESULT_SAVE_FAILED", true, "结果保存失败，请稍后重试。"],
  }
  const [errorType, retryable, userHint] = mappings[Number(code)] || ["TEMPORARY_UNAVAILABLE", true, "蜂鸟AI 服务暂时不可用，请稍后重试。"]
  return new SkillError(errorType, userHint, { retryable, requestId: requestIdValue, code })
}

async function apiRequest(path, body, currentRequestId, options = {}) {
  const { projectId, apiKey } = await credentials()
  const baseUrl = String(process.env.FENGNIAO_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "")
  const timeoutMs = Number(process.env.FENGNIAO_REQUEST_TIMEOUT_MS || 190000)
  const configuredAttempts = boundedInteger(process.env.FENGNIAO_API_MAX_ATTEMPTS, 3, { min: 1, max: 5 })
  const maxAttempts = boundedInteger(options.maxAttempts, configuredAttempts, { min: 1, max: 5 })
  const retryUncertainFailures = options.retryUncertainFailures !== false
  const retryableCodes = new Set([429, 2061, 2065, 30001])
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
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
      if (retryUncertainFailures && attempt + 1 < maxAttempts) {
        await wait(retryDelayMs(null, attempt))
        continue
      }
      const timeout = error?.name === "TimeoutError"
      throw new SkillError(
        "TEMPORARY_UNAVAILABLE",
        timeout ? "请求超时，请稍后重试。" : "无法连接蜂鸟AI 服务，请检查网络后重试。",
        { retryable: true, requestId: currentRequestId },
      )
    }
    let payload
    try {
      payload = await response.json()
    } catch {
      if (retryUncertainFailures && attempt + 1 < maxAttempts && response.status >= 500) {
        await wait(retryDelayMs(response, attempt))
        continue
      }
      throw new SkillError("TEMPORARY_UNAVAILABLE", "蜂鸟AI 返回了无法解析的响应，请稍后重试。", { retryable: true, requestId: currentRequestId })
    }
    if (!Object.hasOwn(payload || {}, "code")) {
      throw new SkillError(
        "TEMPORARY_UNAVAILABLE",
        "蜂鸟AI 当前 API 环境未返回标准业务响应，请确认对应能力已发布后重试。",
        { retryable: false, requestId: currentRequestId },
      )
    }
    const businessCode = Number(payload.code)
    if (response.ok && businessCode === 200) return payload
    if (attempt + 1 < maxAttempts && (retryableCodes.has(businessCode) || retryUncertainFailures && response.status >= 500)) {
      await wait(retryDelayMs(response, attempt))
      continue
    }
    throw mapError(businessCode, payload?.msg, payload?.request_id || currentRequestId)
  }
  throw new SkillError("TEMPORARY_UNAVAILABLE", "蜂鸟AI 服务暂时不可用，请稍后重试。", { retryable: true, requestId: currentRequestId })
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

const TASK_SCOPED_DOWNLOAD_ACTIONS = new Set([
  "image.generate", "image.transform", "image.expand", "image.enhance", "image.cutout", "image.translate",
  "video.translate", "video.translate-status",
])

function taskDirectoryName(group, action) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15)
  return `${timestamp}-${safeFilePart(`${group}-${action}`, "task")}-${randomUUID().slice(0, 8)}`
}

function resolveOutputDirectory(input = {}, context = {}) {
  const inputDirectory = String(input.output_dir || "").trim()
  const configuredDirectory = String(process.env.FENGNIAO_OUTPUT_DIR || "").trim()
  const currentDirectory = resolve(process.cwd())
  const baseDirectory = inputDirectory || configuredDirectory
    ? resolve(inputDirectory || configuredDirectory)
    : isInside(SKILL_ROOT, currentDirectory)
      ? join(homedir(), "Downloads", "fengniaoai-skill")
      : join(currentDirectory, "output", "fengniaoai-skill")
  const actionKey = context.group && context.action ? `${context.group}.${context.action}` : ""
  const outputDirectory = !inputDirectory && TASK_SCOPED_DOWNLOAD_ACTIONS.has(actionKey)
    ? join(baseDirectory, taskDirectoryName(context.group, context.action))
    : baseDirectory
  if (isInside(SKILL_ROOT, outputDirectory)) {
    throw new SkillError("INVALID_INPUT", "不能把生成结果写入 Skill 安装目录，请改用工作区 output 目录或其他输出目录。")
  }
  return outputDirectory
}

function prepareDownloadOptions(input, context = {}) {
  const enabled = input.download_artifacts === undefined
    ? booleanSetting(process.env.FENGNIAO_AUTO_DOWNLOAD, true)
    : booleanSetting(input.download_artifacts, true)
  if (!enabled) return { enabled: false }
  const outputDirectory = resolveOutputDirectory(input, context)
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

function inputSourceStem(input = {}) {
  let source = input.filename
  if (!source) {
    for (const field of ["image", "reference_images", "reference_image_urls", "video", "video_url"]) {
      const value = input[field]
      source = Array.isArray(value) ? value[0] : value
      if (typeof source === "string" && source.trim()) break
      source = null
    }
  }
  if (typeof source !== "string" || !source.trim() || source.startsWith("data:")) return ""
  try {
    if (/^https?:\/\//i.test(source)) source = basename(new URL(source).pathname)
    else source = basename(source)
  } catch { return "" }
  return safeFilePart(source.slice(0, source.length - extname(source).length), "")
}

function ratioFilePart(value) {
  return String(value || "").trim().toLowerCase().replace(":", "x")
}

function semanticArtifactStem(actionKey, input, item) {
  const source = inputSourceStem(input) || "image"
  const language = safeFilePart(input.target_language || input.lang_to || item.target_language, "")
  if (actionKey === "image.generate") return "generated-image"
  if (actionKey === "image.transform") return `${source}-edited`
  if (actionKey === "image.expand") return `${source}-expanded-${ratioFilePart(input.aspect_ratio) || "image"}`
  if (actionKey === "image.enhance") return `${source}-enhanced${input.resolution ? `-${String(input.resolution).toLowerCase()}` : ""}`
  if (actionKey === "image.cutout") return `${source}-cutout-${safeFilePart(input.background || "transparent", "transparent")}`
  if (actionKey === "image.translate") {
    if (item.role === "processed") return `${source}-processed-background`
    return `${source}-translated${language ? `-${language}` : ""}`
  }
  if (actionKey === "video.translate" || actionKey === "video.translate-status") {
    const videoSource = inputSourceStem(input) || safeFilePart(item.task_id, "video")
    const role = item.role || item.type || "result"
    return `${videoSource}-${safeFilePart(role, "result")}${language && ["translated", "translated-subtitle"].includes(role) ? `-${language}` : ""}`
  }
  return ""
}

function applySemanticArtifactNames(result, group, action, input) {
  if (!result?.ok || !Array.isArray(result.artifacts) || input.filename_prefix) return result
  const actionKey = `${group}.${action}`
  if (!TASK_SCOPED_DOWNLOAD_ACTIONS.has(actionKey)) return result
  return {
    ...result,
    artifacts: result.artifacts.map((item) => item.filename_stem
      ? item
      : { ...item, filename_stem: semanticArtifactStem(actionKey, input, item) }),
  }
}

function applyProductWorkflowReadiness(result, group, action) {
  if (group !== "product" || action !== "scrape" || !result?.ok) return result
  const metadataReady = result.artifacts?.some((item) => item.role === "product-metadata" && item.local_path)
  const mainImageReady = result.artifacts?.some((item) => /^main-\d+$/.test(String(item.role || "")) && item.local_path)
  const ready = Boolean(metadataReady && mainImageReady)
  return {
    ...result,
    data: { ...result.data, workflow_ready_for_downstream: ready },
    workflow: {
      scope: "product_url",
      state: ready ? "ready" : "blocked",
      allow_downstream_actions: ready,
      unrelated_actions_allowed: true,
      ...(ready ? {} : {
        terminal_for_url_workflow: true,
        automatic_retry: false,
        allow_browser_fallback: false,
        requires_user_confirmation_for_retry: true,
        reason: !metadataReady ? "product_metadata_not_saved" : "product_main_image_not_downloaded",
        user_hint: "商品资料或主图未完整保存，已停止基于该商品链接的后续分析和生成。其他独立任务不受影响；你可以确认重试原链接、提供另一个可信商品链接，或上传真实商品素材。",
        safe_next_steps: [
          "retry_original_url_with_user_confirmation",
          "provide_another_trusted_product_url",
          "upload_trusted_product_materials",
        ],
      }),
    },
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

async function createAvailableDirectory(parentDirectory, stem) {
  await mkdir(parentDirectory, { recursive: true, mode: 0o700 })
  for (let index = 0; index < 10000; index += 1) {
    const suffix = index ? `-${index + 1}` : ""
    const candidate = join(parentDirectory, `${stem}${suffix}`)
    try {
      await mkdir(candidate, { mode: 0o700 })
      return candidate
    } catch (error) {
      if (error?.code !== "EEXIST") throw error
    }
  }
  throw new Error("too many duplicate directories")
}

function artifactOutputDirectory(baseDirectory, relativeDirectory) {
  if (!relativeDirectory) return baseDirectory
  const target = resolve(baseDirectory, String(relativeDirectory))
  if (!isInside(baseDirectory, target)) throw new Error("结果子目录不能超出输出目录")
  return target
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
  const outputDirectory = artifactOutputDirectory(options.outputDirectory, item.relative_dir)
  await mkdir(outputDirectory, { recursive: true, mode: 0o700 })
  const temporaryPath = join(outputDirectory, `.fengniao-download-${process.pid}-${randomUUID()}.tmp`)
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
    const explicitStem = safeFilePart(item.filename_stem, "")
    const defaultPrefix = safeFilePart(options.filenamePrefix || item.role || item.type, `artifact-${index + 1}`)
    const stem = explicitStem || (options.filenamePrefix
      ? safeFilePart(`${options.filenamePrefix}-${item.role || item.type}`, `artifact-${index + 1}`)
      : defaultPrefix)
    const targetPath = await availablePath(outputDirectory, stem, extension)
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
    if (item.local_path) {
      completed += 1
      continue
    }
    if (!item.url || item.role === "source") continue
    const downloadIdentity = [item.url, item.relative_dir || "", item.filename_stem || ""].join("\0")
    if (downloadedUrls.has(downloadIdentity)) {
      item.local_path = downloadedUrls.get(downloadIdentity)
      continue
    }
    try {
      item.local_path = await downloadArtifact(item, options, index)
      downloadedUrls.set(downloadIdentity, item.local_path)
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

function productPlatformFromUrl(value) {
  let parsed
  try { parsed = new URL(value) } catch { return null }
  const host = parsed.hostname.toLowerCase()
  if (host === "detail.1688.com") return "1688"
  if (host === "item.taobao.com" || host === "detail.tmall.com") return "taobao"
  if ([...AMAZON_DOMAINS].some((domain) => host === domain || host.endsWith(`.${domain}`))) return "amazon"
  return null
}

function productIdFromUrl(value, platform) {
  let parsed
  try { parsed = new URL(value) } catch { return null }
  if (platform === "1688") return parsed.pathname.match(/^\/offer\/(\d{9,})\.html$/i)?.[1] || null
  if (platform === "taobao") {
    const productId = parsed.searchParams.get("id")
    return /^\d{9,}$/.test(productId || "") ? productId : null
  }
  if (platform === "amazon") {
    const productId = parsed.pathname.match(/\/(?:dp|gp\/product)\/([a-z0-9]{10})(?:\/|$)/i)?.[1]
    return productId ? productId.toUpperCase() : null
  }
  return null
}

function productUrl(input, currentRequestId) {
  const value = requireString(input, "url", "商品详情页 HTTPS 链接")
  let parsed
  try { parsed = new URL(value) } catch { throw new SkillError("INVALID_INPUT", "商品链接不是有效 URL。", { requestId: currentRequestId }) }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port || parsed.hash) {
    throw new SkillError("INVALID_INPUT", "商品链接必须使用 HTTPS，且不能包含账号、非标准端口或片段。", { requestId: currentRequestId })
  }
  if (value.length > 2048) throw new SkillError("INVALID_INPUT", "商品链接不能超过 2048 个字符。", { requestId: currentRequestId })
  return value
}

function selectedProductImageGroups(input, currentRequestId) {
  const groups = input.image_groups ?? ["main", "sku", "detail"]
  if (!Array.isArray(groups) || !groups.length) throw new SkillError("INVALID_INPUT", "image_groups 至少包含 main、sku 或 detail 中的一项。", { requestId: currentRequestId })
  const normalized = groups.map((group) => String(group || "").trim().toLowerCase())
  if (normalized.some((group) => !new Set(["main", "sku", "detail"]).has(group))) throw new SkillError("INVALID_INPUT", "image_groups 仅支持 main、sku 和 detail。", { requestId: currentRequestId })
  return [...new Set(normalized)]
}

async function productScrape(input) {
  const currentRequestId = requestId(input)
  const url = productUrl(input, currentRequestId)
  const inferredPlatform = productPlatformFromUrl(url)
  const platform = String(input.platform || inferredPlatform || "").trim().toLowerCase()
  if (!PRODUCT_PLATFORMS.has(platform)) throw new SkillError("INVALID_INPUT", "请提供 1688、淘宝/天猫或 Amazon 的完整商品详情页链接。", { requestId: currentRequestId })
  if (!inferredPlatform) throw new SkillError("INVALID_INPUT", "商品链接域名不受支持，请提供 1688、淘宝/天猫或 Amazon 的完整商品详情页链接。", { requestId: currentRequestId })
  if (inferredPlatform !== platform) throw new SkillError("INVALID_INPUT", "platform 与商品链接所属平台不一致。", { requestId: currentRequestId })
  const expectedProductId = productIdFromUrl(url, platform)
  if (!expectedProductId) throw new SkillError("INVALID_INPUT", "商品链接格式不受支持，请提供包含有效商品 ID 的完整详情页链接。", { requestId: currentRequestId })
  const groups = selectedProductImageGroups(input, currentRequestId)
  const body = { request_id: currentRequestId, platform, url }
  if (input.customer_id !== undefined && input.customer_id !== null && String(input.customer_id).trim()) body.customer_id = String(input.customer_id).trim()
  const payload = await apiRequest("/api/v1/product/scrape", body, currentRequestId, { maxAttempts: 1 })
  const result = payload.result
  const resultPlatform = String(result?.platform || "").trim().toLowerCase()
  const resultProductId = String(result?.product_id || "").trim()
  const normalizedResultProductId = platform === "amazon" ? resultProductId.toUpperCase() : resultProductId
  if (!result || Array.isArray(result) || typeof result !== "object" || !resultProductId || resultPlatform !== platform || normalizedResultProductId !== expectedProductId) {
    throw new SkillError("TEMPORARY_UNAVAILABLE", "商品采集未返回完整且匹配的商品资料，已停止后续处理，请稍后重试。", { retryable: true, requestId: payload.request_id || currentRequestId })
  }
  const productId = safeFilePart(result.product_id, "product")
  const productStem = safeFilePart(`${result.platform || platform}-${productId}`, `product-${productId}`)
  const downloadOptions = prepareDownloadOptions(input)
  let productDirectory = null
  let productRelativeDirectory = productStem
  let localSaveWarning = null
  const artifacts = []
  if (downloadOptions.enabled) {
    try {
      productDirectory = await createAvailableDirectory(downloadOptions.outputDirectory, productStem)
      productRelativeDirectory = relative(downloadOptions.outputDirectory, productDirectory)
      const metadataPath = join(productDirectory, "product.json")
      await writeJsonAtomic(metadataPath, { request_id: payload.request_id || currentRequestId, result, usage: payload.usage || {} })
      artifacts.push({ type: "json", role: "product-metadata", local_path: metadataPath })
    } catch {
      productDirectory = null
      localSaveWarning = "商品采集已完成，但暂时无法创建本地商品目录；请使用返回的数据和图片 URL。"
    }
  }
  const imageSets = { main: result.main_images || [], sku: result.sku_images || [], detail: result.detail_images || [] }
  for (const group of groups) {
    const urls = Array.isArray(imageSets[group]) ? imageSets[group] : []
    for (let index = 0; index < urls.length; index += 1) {
      artifacts.push(artifact("image", urls[index], {
        role: `${group}-${index + 1}`,
        product_id: result.product_id,
        relative_dir: join(productRelativeDirectory, "images", group),
        filename_stem: `${productId}-${group}-${String(index + 1).padStart(3, "0")}`,
      }))
    }
  }
  return success("product.scrape", payload.request_id || currentRequestId, "completed", {
    artifacts,
    data: { ...result, product_dir: productDirectory, selected_image_groups: groups, ...(localSaveWarning ? { local_save_warning: localSaveWarning } : {}) },
    usage: payload.usage,
  })
}

async function imageAnalyze(input, refreshIndex = 0) {
  const currentRequestId = requestId(input)
  const source = requireString(input, "image", "要分析的本地图片")
  const normalizedSource = normalizeAssetInput(source, currentRequestId)
  if (/^https?:\/\//i.test(normalizedSource)) throw new SkillError("INVALID_INPUT", "识图分析需要本地图片；请先下载图片，再交给我分析。", { requestId: currentRequestId })
  const asset = await materializeInputAsset(normalizedSource, { purpose: "image_reference", currentRequestId, refreshIndex })
  if (!asset.key) throw new SkillError("INVALID_INPUT", "识图分析需要上传后的本地图片。", { requestId: currentRequestId })
  const body = { request_id: currentRequestId, image_key: asset.key }
  if (input.customer_id !== undefined && input.customer_id !== null && String(input.customer_id).trim()) body.customer_id = String(input.customer_id).trim()
  let payload
  try {
    payload = await apiRequest("/api/v1/img/analyze", body, currentRequestId, { maxAttempts: 1 })
  } catch (error) {
    if (shouldRefreshAsset(error, refreshIndex)) return imageAnalyze(input, refreshIndex + 1)
    throw error
  }
  const result = { analysis: String(payload.result?.analysis || "").trim() }
  if (!result.analysis) throw new SkillError("TEMPORARY_UNAVAILABLE", "图片分析完成但没有返回有效内容，请稍后重试。", { retryable: true, requestId: currentRequestId })
  const artifacts = []
  let localSaveWarning = null
  const downloadOptions = prepareDownloadOptions(input)
  if (downloadOptions.enabled) {
    try {
      const outputDirectory = join(downloadOptions.outputDirectory, "analysis")
      await mkdir(outputDirectory, { recursive: true, mode: 0o700 })
      const sourceName = safeFilePart(input.analysis_id || basename(normalizedSource, extname(normalizedSource)), "image")
      const analysisPath = await availablePath(outputDirectory, `${sourceName}-analysis`, ".md")
      const markdown = `# 图片分析\n\n${result.analysis}\n\n- Request ID：${payload.request_id || currentRequestId}\n`
      await writeFile(analysisPath, markdown, { mode: 0o600 })
      artifacts.push({ type: "text", role: "analysis", local_path: analysisPath })
    } catch {
      localSaveWarning = "识图分析已完成，但暂时无法保存本地分析文件；请直接使用返回的分析文本。"
    }
  }
  return success("image.analyze", payload.request_id || currentRequestId, "completed", {
    artifacts,
    data: { ...result, ...(localSaveWarning ? { local_save_warning: localSaveWarning } : {}) },
    usage: payload.usage,
  })
}

async function accountBalance(input) {
  const currentRequestId = requestId(input)
  const body = { request_id: currentRequestId }
  const payload = await apiRequest("/api/v1/user/available/petrolpak", body, currentRequestId)
  return success("account.balance", currentRequestId, "completed", { data: { petrolpaks: payload.data } })
}

function parseVersion(value) {
  const match = String(value || "").trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/)
  if (!match) return null
  return { numbers: match.slice(1, 4).map(Number), prerelease: match[4] || "" }
}

function compareVersions(leftValue, rightValue) {
  const left = parseVersion(leftValue)
  const right = parseVersion(rightValue)
  if (!left || !right) return null
  for (let index = 0; index < 3; index += 1) {
    if (left.numbers[index] !== right.numbers[index]) return left.numbers[index] > right.numbers[index] ? 1 : -1
  }
  if (left.prerelease === right.prerelease) return 0
  if (!left.prerelease) return 1
  if (!right.prerelease) return -1
  return left.prerelease.localeCompare(right.prerelease)
}

async function localSkillVersion() {
  try {
    const manifest = JSON.parse(await readFile(join(SKILL_ROOT, "claw.json"), "utf8"))
    if (manifest?.name !== "fengniaoai-skill" || !parseVersion(manifest.version)) throw new Error("invalid manifest")
    return manifest.version
  } catch {
    throw new SkillError("TEMPORARY_UNAVAILABLE", "无法读取当前 Skill 版本，暂时不能检查更新。")
  }
}

async function saveUpdateState(state) {
  const file = updateStateFile()
  const directory = dirname(file)
  const temporaryFile = `${file}.${process.pid}.${randomUUID()}.tmp`
  try {
    await mkdir(directory, { recursive: true, mode: 0o700 })
    await chmod(directory, 0o700)
    await writeFile(temporaryFile, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 })
    await chmod(temporaryFile, 0o600)
    await rename(temporaryFile, file)
    await chmod(file, 0o600)
  } catch {
    try { await unlink(temporaryFile) } catch { /* noop */ }
  }
}

async function skillCheckUpdate(input) {
  const installedVersion = await localSkillVersion()
  const cacheHours = boundedInteger(input.cache_hours, 24, { min: 1, max: 168 })
  const now = Date.now()
  if (input.force !== true) {
    try {
      const cached = JSON.parse(await readFile(updateStateFile(), "utf8"))
      const checkedAt = Date.parse(cached.checked_at || "")
      if (cached.installed_version === installedVersion && Number.isFinite(checkedAt) && now - checkedAt < cacheHours * 60 * 60 * 1000) {
        return success("skill.check-update", requestId(input), "completed", { data: { ...cached, cache_hit: true } })
      }
    } catch { /* no usable cache */ }
  }

  const manifestUrl = String(process.env.FENGNIAO_UPDATE_MANIFEST_URL || UPDATE_MANIFEST_URL).trim()
  let state
  try {
    const response = await fetch(manifestUrl, {
      headers: { Accept: "application/json", "User-Agent": `fengniaoai-skill/${installedVersion}` },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const remoteManifest = await response.json()
    const latestVersion = String(remoteManifest?.version || "").trim()
    const comparison = remoteManifest?.name === "fengniaoai-skill" ? compareVersions(latestVersion, installedVersion) : null
    if (comparison === null) throw new Error("invalid remote manifest")
    state = {
      installed_version: installedVersion,
      latest_version: latestVersion,
      update_available: comparison > 0,
      checked_at: new Date(now).toISOString(),
      repository: "https://github.com/fengniao-ai/fengniaoai-skill",
      update_command: "npx -y skills update fengniaoai-skill -g -y",
    }
  } catch {
    state = {
      installed_version: installedVersion,
      latest_version: null,
      update_available: null,
      checked_at: new Date(now).toISOString(),
      check_status: "unavailable",
    }
  }
  await saveUpdateState(state)
  return success("skill.check-update", requestId(input), "completed", { data: { ...state, cache_hit: false } })
}

function referenceUrls(input) {
  if (Array.isArray(input.reference_image_keys)) return input.reference_image_keys
  if (Array.isArray(input.reference_images)) return input.reference_images
  if (Array.isArray(input.reference_image_urls)) return input.reference_image_urls
  if (Array.isArray(input.image)) return input.image
  if (input.image) return [input.image]
  return []
}

function shouldRefreshAsset(error, refreshIndex) {
  return refreshIndex < 1 && (Number(error?.code) === 2063 || Number(error?.code) === 2064)
}

async function prepareReferences(input, refreshIndex = 0) {
  const sourceFields = ["image", "reference_images", "reference_image_urls", "reference_image_keys"].filter((field) => input[field] !== undefined)
  if (sourceFields.length !== 1) throw new SkillError("INVALID_INPUT", "参考图来源必须且只能传一种。", { requestId: input.request_id })
  const refs = referenceUrls(input)
  if (!refs.length) throw new SkillError("INVALID_INPUT", "请提供参考图片。", { requestId: input.request_id })
  if (refs.length > 6) throw new SkillError("INVALID_INPUT", "图片生成最多支持六张参考图。", { requestId: input.request_id })
  const currentRequestId = requestId(input)
  const hasRemoteInputs = refs.some((item) => typeof item === "string" && /^https:\/\//i.test(item.trim()))
  const hasOwnedInputs = refs.some((item) => typeof item !== "string" || !/^https:\/\//i.test(item.trim()))
  if (hasRemoteInputs && hasOwnedInputs) {
    throw new SkillError("INVALID_INPUT", "同一次参考图任务请统一使用本地图片或 HTTPS 图片，避免参考图顺序变化。", { requestId: currentRequestId })
  }
  const uploadConcurrency = boundedInteger(process.env.FENGNIAO_IMAGE_UPLOAD_CONCURRENCY, 4, { min: 1, max: 8 })
  const assets = await mapWithConcurrency(refs, uploadConcurrency, (item) => materializeInputAsset(item, { purpose: "image_reference", currentRequestId, refreshIndex }))
  const hasUrls = assets.some((asset) => asset.url)
  const hasKeys = assets.some((asset) => asset.key)
  if (hasUrls && hasKeys) {
    throw new SkillError("INVALID_INPUT", "同一次参考图任务请统一使用本地图片或 HTTPS 图片，避免参考图顺序变化。", { requestId: currentRequestId })
  }
  if (hasKeys) return { reference_image_keys: assets.map((asset) => asset.key) }
  return { reference_image_urls: assets.map((asset) => asset.url) }
}

function promptWithReferenceRoles(prompt, input, referenceCount) {
  const referenceMode = String(input.reference_mode || "single_subject").trim().toLowerCase()
  if (!new Set(["single_subject", "composition", "variants"]).has(referenceMode)) {
    throw new SkillError("INVALID_INPUT", "reference_mode 仅支持 single_subject、composition 或 variants。", { requestId: input.request_id })
  }
  if (new Set(["composition", "variants"]).has(referenceMode) && referenceCount < 2) {
    throw new SkillError("INVALID_INPUT", `${referenceMode} 模式至少需要两张参考图。`, { requestId: input.request_id })
  }
  let roles = input.reference_roles
  if (roles !== undefined) {
    if (!Array.isArray(roles) || roles.length !== referenceCount) throw new SkillError("INVALID_INPUT", "reference_roles 必须与参考图数量一致。", { requestId: input.request_id })
    roles = roles.map((role) => {
      const normalized = String(role || "").trim()
      if (!normalized || normalized.length > 120) throw new SkillError("INVALID_INPUT", "每个参考图职责必须为 1 到 120 个字符。", { requestId: input.request_id })
      return normalized
    })
  } else if (referenceMode === "composition") {
    throw new SkillError("INVALID_INPUT", "composition 模式必须为每张参考图提供 reference_roles。", { requestId: input.request_id })
  } else if (referenceCount >= 2) {
    roles = Array.from({ length: referenceCount }, (_, index) => index === 0
      ? "主参考图：锁定主体身份、核心外观、构图关系，并作为 original 比例基准"
      : "补充参考图：仅补充同一主体的其他角度、结构、材质或可见细节，不引入新的主体")
  }
  if (referenceCount < 2) return prompt
  const roleLines = roles.map((role, index) => `- 参考图 ${index + 1}：${role}`).join("\n")
  const referencePolicy = referenceMode === "variants"
    ? "这些参考图是同一商品的并列变体，不以参考图 1 覆盖其他变体。严格保持每个编号对应的颜色、图案、Logo、包装和 SKU，不得串色、融合或互换；参考图 1 只作为 original 比例基准。"
    : referenceMode === "composition"
      ? "这些参考图承担彼此独立的主体、构图、细节或风格职责。严格按编号和职责使用，不得擅自融合、替换或改变各自主体身份；只有用户明确要求时才组合对应内容，参考图 1 只作为 original 比例基准。"
      : "严格按编号使用参考图；不同参考图发生冲突时，以参考图 1 和用户明确要求为准。"
  return `## 参考图职责\n\n${roleLines}\n\n${referencePolicy}\n\n${prompt}`
}

async function generateImage(action, input, refreshIndex = 0) {
  const currentRequestId = requestId(input)
  for (const field of ["quantity", "number", "count", "n"]) {
    if (input[field] !== undefined) throw new SkillError("INVALID_INPUT", "图片生成每次固定生成一张，请拆分为多个请求。", { requestId: currentRequestId })
  }
  let body
  if (action === "generate") {
    if (["image", "reference_images", "reference_image_urls", "reference_image_keys", "reference_roles", "reference_mode"].some((field) => input[field] !== undefined)) {
      throw new SkillError("INVALID_INPUT", "文生图不能携带参考图参数；需要参考图片时请使用 image transform。", { requestId: currentRequestId })
    }
    body = {
      request_id: currentRequestId,
      prompt: requireString(input, "prompt", "生图描述"),
      model_alias: input.model_alias || "tpro-1k",
      aspect_ratio: input.aspect_ratio || "1:1",
    }
  } else if (action === "transform") {
    const referenceCount = referenceUrls(input).length
    const references = await prepareReferences(input, refreshIndex)
    body = {
      request_id: currentRequestId,
      prompt: promptWithReferenceRoles(requireString(input, "prompt", "图片修改要求"), input, referenceCount),
      ...references,
      model_alias: input.model_alias || "tpro-1k",
      aspect_ratio: input.aspect_ratio || "original",
    }
  } else if (action === "expand") {
    const referenceCount = referenceUrls(input).length
    const references = await prepareReferences(input, refreshIndex)
    body = {
      request_id: currentRequestId,
      prompt: promptWithReferenceRoles(input.prompt || "Extend the image naturally to the requested aspect ratio. Preserve the main subject, product identity, visible text, colors, lighting, and original composition. Only generate content needed outside the original canvas.", input, referenceCount),
      ...references,
      model_alias: input.model_alias || "tpro-1k",
      aspect_ratio: requireString(input, "aspect_ratio", "目标图片比例"),
    }
  } else {
    const explicitResolution = input.resolution !== undefined && input.resolution !== null && input.resolution !== ""
    const resolution = String(input.resolution || "2k").toLowerCase()
    if (!new Set(["2k", "4k"]).has(resolution)) throw new SkillError("INVALID_INPUT", "高清增强 resolution 仅支持 2k 或 4k。", { requestId: currentRequestId })
    const referenceCount = referenceUrls(input).length
    const references = await prepareReferences(input, refreshIndex)
    body = {
      request_id: currentRequestId,
      prompt: promptWithReferenceRoles(input.prompt || "Create a high-resolution redraw of the reference image. Preserve the subject identity, product details, visible text, composition, colors, and lighting. Do not add or remove content.", input, referenceCount),
      ...references,
      model_alias: input.model_alias || (explicitResolution ? (resolution === "4k" ? "pro-4k" : "pro-2k") : "tpro-1k"),
      aspect_ratio: input.aspect_ratio || "original",
    }
  }
  if (!IMAGE_MODELS.has(body.model_alias)) throw new SkillError("INVALID_INPUT", "不支持的图片生成模型。", { requestId: currentRequestId })
  if (!IMAGE_RATIOS.has(body.aspect_ratio)) throw new SkillError("INVALID_INPUT", "不支持的图片比例。", { requestId: currentRequestId })
  if (body.aspect_ratio === "original" && !body.reference_image_urls?.length && !body.reference_image_keys?.length) throw new SkillError("INVALID_INPUT", "original 比例只能用于带参考图的图生图。", { requestId: currentRequestId })
  if (input.customer_id !== undefined) body.customer_id = input.customer_id
  let payload
  try {
    payload = await apiRequest("/api/v1/img/generate", body, currentRequestId)
  } catch (error) {
    if (shouldRefreshAsset(error, refreshIndex)) return generateImage(action, input, refreshIndex + 1)
    throw error
  }
  return success(`image.${action}`, payload.request_id || currentRequestId, "completed", {
    artifacts: imageArtifacts(payload.result),
    data: payload.result,
    usage: payload.usage,
  })
}

function batchPaths(batchDirectory, layout = "legacy") {
  const directory = resolve(batchDirectory)
  const stateDirectory = layout === "flat" ? join(directory, ".fengniao") : directory
  return {
    directory,
    layout,
    state: stateDirectory,
    manifest: join(stateDirectory, "manifest.json"),
    control: join(stateDirectory, "control.json"),
    progress: join(stateDirectory, "progress.json"),
    results: layout === "flat" ? directory : join(directory, "results"),
    lock: join(stateDirectory, ".worker.lock"),
    cancelled: join(stateDirectory, ".cancelled"),
  }
}

async function writeJsonAtomic(file, value, mode = 0o600) {
  const temporaryFile = `${file}.${process.pid}.${randomUUID()}.tmp`
  try {
    await mkdir(dirname(file), { recursive: true, mode: 0o700 })
    await writeFile(temporaryFile, `${JSON.stringify(value, null, 2)}\n`, { mode })
    await rename(temporaryFile, file)
    await chmod(file, mode)
  } catch (error) {
    try { await unlink(temporaryFile) } catch { /* noop */ }
    throw error
  }
}

async function readBatchManifest(batchDirectory) {
  const directory = resolve(batchDirectory)
  const candidates = basename(directory) === ".fengniao"
    ? [batchPaths(dirname(directory), "flat")]
    : [batchPaths(directory, "flat"), batchPaths(directory, "legacy")]
  for (const paths of candidates) {
    try {
      const manifest = JSON.parse(await readFile(paths.manifest, "utf8"))
      if (!new Set(["1.0", "1.1"]).has(manifest?.schema_version) || !manifest?.batch_id || !Array.isArray(manifest.tasks)) continue
      return { manifest, paths }
    } catch { /* try the other supported layout */ }
  }
  throw new SkillError("INVALID_INPUT", "找不到有效的蜂鸟AI批量任务，请检查 batch_dir。")
}

function batchSummary(manifest) {
  const summary = { total: manifest.tasks.length, pending: 0, running: 0, completed: 0, failed: 0, cancelled: 0 }
  for (const task of manifest.tasks) {
    if (summary[task.status] !== undefined) summary[task.status] += 1
  }
  summary.finished = summary.completed + summary.failed + summary.cancelled
  summary.progress_percent = summary.total ? Math.floor((summary.finished / summary.total) * 100) : 0
  summary.credits_used = manifest.tasks.reduce((total, task) => total + Number(task.result?.usage?.credits_used || 0), 0)
  return summary
}

function publicBatchData(manifest, paths, { includeTasks = false } = {}) {
  const tasks = manifest.tasks.map((task) => ({
    id: task.id,
    action: task.action,
    status: task.status,
    request_id: task.request_id,
    attempts: task.attempts,
    retryable: Boolean(task.error?.retryable),
    error_type: task.error?.error_type || null,
    user_hint: task.error?.user_hint || null,
    artifacts: task.result?.artifacts || [],
    usage: task.result?.usage || {},
    started_at: task.started_at || null,
    finished_at: task.finished_at || null,
  }))
  const recent = tasks
    .filter((task) => IMAGE_BATCH_TERMINAL_STATES.has(task.status))
    .sort((left, right) => Date.parse(right.finished_at || 0) - Date.parse(left.finished_at || 0))
    .slice(0, 10)
  return {
    batch_id: manifest.batch_id,
    batch_dir: paths.directory,
    workspace_dir: paths.directory,
    layout: paths.layout,
    state: manifest.state,
    summary: batchSummary(manifest),
    estimated_credits: manifest.estimated_credits,
    concurrency: manifest.concurrency,
    preview_count: manifest.preview_count,
    preview_approved: manifest.preview_approved,
    pause_reason: manifest.pause_reason || null,
    pause_error: manifest.pause_error || null,
    registry_warning: manifest.registry_warning || null,
    results_dir: paths.results,
    recent_tasks: recent,
    ...(includeTasks ? { tasks } : {}),
  }
}

async function persistBatch(manifest, paths) {
  manifest.updated_at = new Date().toISOString()
  await writeJsonAtomic(paths.manifest, manifest)
  await writeJsonAtomic(paths.progress, {
    batch_id: manifest.batch_id,
    state: manifest.state,
    updated_at: manifest.updated_at,
    summary: batchSummary(manifest),
    pause_reason: manifest.pause_reason || null,
  })
}

function batchReferenceField(input = {}) {
  return ["image", "reference_images", "reference_image_urls", "reference_image_keys"].find((field) => input[field] !== undefined)
}

function defaultBatchAction(input, shared) {
  if (input.action !== undefined) return { action: String(input.action).trim(), explicit: true }
  return { action: batchReferenceField(shared) ? "transform" : "generate", explicit: false }
}

function normalizedBatchTask(rawTask, index, defaultAction) {
  if (!rawTask || Array.isArray(rawTask) || typeof rawTask !== "object") throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项必须是对象。`)
  const id = safeFilePart(rawTask.id || rawTask.name, `image-${String(index + 1).padStart(4, "0")}`)
  const taskInput = rawTask.input && typeof rawTask.input === "object" && !Array.isArray(rawTask.input)
    ? { ...rawTask.input }
    : Object.fromEntries(Object.entries(rawTask).filter(([key]) => !["id", "name", "action"].includes(key)))
  const inferredAction = defaultAction.explicit
    ? defaultAction.action
    : batchReferenceField(taskInput) ? "transform" : defaultAction.action
  const action = String(rawTask.action || inferredAction || "generate").trim()
  if (!IMAGE_BATCH_ACTIONS.has(action)) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项 action 不受支持。`)
  const currentRequestId = requestId({ request_id: taskInput.request_id })
  delete taskInput.request_id
  for (const field of ["quantity", "number", "count", "n"]) {
    if (taskInput[field] !== undefined) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项不能设置 ${field}。`)
  }
  return {
    id,
    action,
    request_id: currentRequestId,
    input: taskInput,
    status: "pending",
    attempts: 0,
    previous_request_ids: [],
    result: null,
    error: null,
  }
}

function batchTaskModel(task, shared) {
  const input = { ...shared, ...task.input }
  if (input.model_alias) return String(input.model_alias)
  if (task.action === "enhance" && input.resolution !== undefined && input.resolution !== null && input.resolution !== "") {
    return String(input.resolution).toLowerCase() === "4k" ? "pro-4k" : "pro-2k"
  }
  return "tpro-1k"
}

function ensureBatchModelAndRatio(task, shared, index) {
  const input = { ...shared, ...task.input }
  const sourceFields = ["image", "reference_images", "reference_image_urls", "reference_image_keys"].filter((field) => input[field] !== undefined)
  if (sourceFields.length > 1) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项只能使用一种参考图来源。`)
  const references = referenceUrls(input)
  if (references.length > 6) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项最多支持六张参考图。`)
  const normalizedReferences = references.map((reference) => normalizeAssetInput(reference, task.request_id))
  const hasRemoteReferences = normalizedReferences.some((reference) => /^https:\/\//i.test(reference))
  const hasOwnedReferences = normalizedReferences.some((reference) => !/^https:\/\//i.test(reference))
  if (hasRemoteReferences && hasOwnedReferences) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项请统一使用本地图片或 HTTPS 图片。`)
  if (task.action === "generate" && (sourceFields.length || input.reference_roles !== undefined || input.reference_mode !== undefined)) {
    throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项是文生图，不能携带参考图参数；请改用 transform。`)
  }
  if (task.action !== "generate") {
    try {
      promptWithReferenceRoles("预检", input, references.length)
    } catch (error) {
      if (error instanceof SkillError) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项：${error.userHint}`)
      throw error
    }
  }
  const model = batchTaskModel(task, shared)
  if (!IMAGE_MODELS.has(model)) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项模型不受支持。`)
  if (task.action === "enhance" && input.resolution !== undefined && !["2k", "4k"].includes(String(input.resolution).toLowerCase())) {
    throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项高清规格仅支持 2K 或 4K。`)
  }
  const ratio = input.aspect_ratio || (task.action === "generate" ? "1:1" : task.action === "expand" ? null : "original")
  if (ratio !== null && !IMAGE_RATIOS.has(ratio)) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项比例不受支持。`)
  if (task.action === "generate" || task.action === "transform") requireString(input, "prompt", `批量任务第 ${index + 1} 项描述`)
  if (task.action === "expand" && !ratio) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项缺少目标比例。`)
  if (task.action !== "generate" && !batchReferenceField(input)) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项缺少参考图。`)
  return IMAGE_MODEL_CREDITS.get(model)
}

async function validateBatchLocalReferences(task, shared, index, validatedFiles) {
  const input = { ...shared, ...task.input }
  for (const rawReference of referenceUrls(input)) {
    const reference = normalizeAssetInput(rawReference, task.request_id)
    if (/^https:\/\//i.test(reference) || reference.startsWith("api-upload-temp/")) continue
    if (/^http:\/\//i.test(reference)) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项：远程参考图必须使用 HTTPS。`)
    if (/^data:/i.test(reference)) {
      const match = reference.match(/^data:([^;,]+);base64,(.+)$/i)
      if (!match) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项：data URL 必须使用 base64 编码。`)
      const contentType = match[1].toLowerCase()
      const body = Buffer.from(match[2], "base64")
      const profile = UPLOAD_PURPOSES.get("image_reference")
      if (!profile.mimes.has(contentType)) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项：data URL 图片格式不受支持。`)
      if (body.length < 1 || body.length > profile.maxBytes) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项参考图不能超过 ${Math.floor(profile.maxBytes / 1024 / 1024)} MB。`)
      try { validateImageBytes(body, contentType, task.request_id) } catch (error) {
        if (error instanceof SkillError) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项：${error.userHint}`)
        throw error
      }
      continue
    }
    const absolutePath = resolve(reference)
    if (validatedFiles.has(absolutePath)) continue
    const contentType = mimeType(absolutePath)
    if (!UPLOAD_PURPOSES.get("image_reference").mimes.has(contentType)) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项：本地参考图格式不受支持。`)
    let fileStat
    try { fileStat = await stat(absolutePath) } catch { throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项无法读取本地参考图：${absolutePath}`) }
    if (!fileStat.isFile()) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项不是有效文件：${absolutePath}`)
    const maximumBytes = UPLOAD_PURPOSES.get("image_reference").maxBytes
    if (fileStat.size < 1 || fileStat.size > maximumBytes) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项参考图不能超过 ${Math.floor(maximumBytes / 1024 / 1024)} MB。`)
    try { validateImageBytes(await fileHeader(absolutePath), contentType, task.request_id) } catch (error) {
      if (error instanceof SkillError) throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项：${error.userHint}`)
      throw new SkillError("INVALID_INPUT", `批量任务第 ${index + 1} 项无法读取本地参考图：${absolutePath}`)
    }
    validatedFiles.add(absolutePath)
  }
}

function launchBatchWorker(batchDirectory) {
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "image", "batch-worker", "--input-json", JSON.stringify({ batch_dir: batchDirectory })], {
    cwd: batchDirectory,
    env: process.env,
    detached: true,
    stdio: "ignore",
  })
  child.on("error", () => { /* batch-status will mark a worker that never starts as interrupted */ })
  child.unref()
  return child.pid
}

async function createBatchWorkspace(input) {
  const baseDirectory = resolveOutputDirectory(input)
  if (!String(input.output_dir || "").trim()) {
    return createAvailableDirectory(baseDirectory, taskDirectoryName("image", "batch"))
  }
  await mkdir(baseDirectory, { recursive: true, mode: 0o700 })
  const occupied = [batchPaths(baseDirectory, "flat").manifest, batchPaths(baseDirectory, "legacy").manifest]
  for (const manifestPath of occupied) {
    try {
      await access(manifestPath)
      return createAvailableDirectory(dirname(baseDirectory), basename(baseDirectory))
    } catch (error) {
      if (error?.code !== "ENOENT") throw error
    }
  }
  return baseDirectory
}

async function imageBatchSubmit(input) {
  if (!Array.isArray(input.tasks) || input.tasks.length < 1 || input.tasks.length > 1000) {
    throw new SkillError("INVALID_INPUT", "批量生图 tasks 必须包含 1 到 1000 个任务。")
  }
  const shared = input.shared && typeof input.shared === "object" && !Array.isArray(input.shared) ? { ...input.shared } : {}
  const defaultAction = defaultBatchAction(input, shared)
  const tasks = input.tasks.map((task, index) => normalizedBatchTask(task, index, defaultAction))
  const ids = new Set()
  const requestIds = new Set()
  const validatedFiles = new Set()
  let estimatedCredits = 0
  for (const [index, task] of tasks.entries()) {
    if (ids.has(task.id)) throw new SkillError("INVALID_INPUT", `批量任务 id 重复：${task.id}`)
    if (requestIds.has(task.request_id)) throw new SkillError("INVALID_INPUT", `批量任务 request_id 重复：${task.request_id}`)
    ids.add(task.id)
    requestIds.add(task.request_id)
    estimatedCredits += ensureBatchModelAndRatio(task, shared, index)
    await validateBatchLocalReferences(task, shared, index, validatedFiles)
  }
  const concurrency = boundedInteger(input.concurrency, 10, { min: 1, max: 10 })
  const defaultPreviewCount = tasks.length > 50 ? 3 : 0
  const previewCount = boundedInteger(input.preview_count, defaultPreviewCount || 1, { min: 0, max: Math.min(10, tasks.length) })
  const effectivePreviewCount = input.preview_count === 0 || defaultPreviewCount === 0 && input.preview_count === undefined ? 0 : previewCount
  const batchId = `batch_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}_${randomUUID().slice(0, 8)}`
  const workspaceDirectory = await createBatchWorkspace(input)
  const paths = batchPaths(workspaceDirectory, "flat")
  await mkdir(paths.state, { recursive: true, mode: 0o700 })
  const manifest = {
    schema_version: "1.1",
    layout: "flat",
    batch_id: batchId,
    state: "awaiting_start_confirmation",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    concurrency,
    preview_count: effectivePreviewCount,
    preview_approved: effectivePreviewCount === 0,
    cost_approved: false,
    estimated_credits: estimatedCredits,
    shared,
    shared_prepared: null,
    shared_refresh_index: 0,
    download_artifacts: input.download_artifacts === undefined ? true : booleanSetting(input.download_artifacts, true),
    tasks,
    pause_reason: null,
    pause_error: null,
    worker_pid: null,
  }
  await persistBatch(manifest, paths)
  await writeJsonAtomic(paths.control, { desired_state: "paused", updated_at: new Date().toISOString() })
  try {
    await registerBatch(manifest, paths)
  } catch {
    manifest.registry_warning = "用户级批次索引未写入；仍可通过结果目录发现并恢复本批次。"
    try { await persistBatch(manifest, paths) } catch { /* the batch remains usable through batch_dir */ }
  }
  return success("image.batch-submit", batchId, "awaiting_confirmation", {
    data: {
      ...publicBatchData(manifest, paths),
      confirmation_required: true,
      confirmation_hint: `共 ${tasks.length} 张，预计消耗 ${estimatedCredits} 点。确认后开始${effectivePreviewCount ? `，先生成 ${effectivePreviewCount} 张样图` : ""}。`,
      next_action: "image.batch-resume",
    },
  })
}

async function imageBatchList(input) {
  const limit = boundedInteger(input.limit, 20, { min: 1, max: 100 })
  const includeCompleted = input.include_completed === undefined ? true : booleanSetting(input.include_completed, true)
  let registry = { schema_version: "1.0", batches: [] }
  let registryWarning = null
  try {
    registry = await readBatchRegistry()
  } catch {
    registryWarning = "用户级批次索引暂时无法读取，已改从结果目录查找。"
  }
  const discoveryRoot = String(input.output_dir || "").trim() ? resolve(input.output_dir) : resolveOutputDirectory({})
  const discovered = await discoverBatchEntries(discoveryRoot)
  const indexedEntries = String(input.output_dir || "").trim()
    ? registry.batches.filter((entry) => entry?.batch_dir && isInside(discoveryRoot, resolve(entry.batch_dir)))
    : registry.batches
  const mergedEntries = [...indexedEntries, ...discovered]
    .filter((entry, index, entries) => entry?.batch_id && entries.findIndex((candidate) => candidate?.batch_id === entry.batch_id) === index)
    .sort((left, right) => Date.parse(right.created_at || 0) - Date.parse(left.created_at || 0))
  const batches = []
  let missingCount = 0
  for (const entry of mergedEntries) {
    if (batches.length >= limit) break
    try {
      const result = await imageBatchStatus({ batch_dir: entry.batch_dir })
      if (!includeCompleted && IMAGE_BATCH_FINAL_STATES.has(result.state)) continue
      const data = result.data
      batches.push({
        batch_id: data.batch_id,
        batch_dir: data.batch_dir,
        created_at: entry.created_at || null,
        state: data.state,
        summary: data.summary,
        estimated_credits: data.estimated_credits,
        preview_count: data.preview_count,
        pause_reason: data.pause_reason,
        results_dir: data.results_dir,
      })
    } catch {
      missingCount += 1
    }
  }
  return success("image.batch-list", requestId(input), "completed", {
    data: { batches, count: batches.length, missing_count: missingCount, discovery_root: discoveryRoot, ...(registryWarning ? { registry_warning: registryWarning } : {}) },
  })
}

async function imageBatchStatus(input) {
  const { manifest, paths } = await readBatchManifest(requireString(input, "batch_dir", "batch_dir"))
  const activeWorkerPid = await batchWorkerPid(manifest, paths)
  const control = await readBatchControl(paths)
  if (control.desired_state === "cancelled" && !activeWorkerPid && manifest.state !== "completed") {
    markBatchCancelled(manifest)
    await persistBatch(manifest, paths)
  } else if (["queued", "preparing", "running", "previewing"].includes(manifest.state) && !activeWorkerPid) {
    const queuedAt = Date.parse(manifest.updated_at || "")
    const startupGraceElapsed = manifest.state !== "queued" || !Number.isFinite(queuedAt) || Date.now() - queuedAt > 2000
    if (control.desired_state === "paused") {
      for (const task of manifest.tasks) if (task.status === "running") task.status = "pending"
      manifest.state = "paused"
    } else if (startupGraceElapsed) {
      for (const task of manifest.tasks) if (task.status === "running") task.status = "pending"
      manifest.state = "interrupted"
      manifest.pause_reason = "WORKER_INTERRUPTED"
      manifest.pause_error = { error_type: "WORKER_INTERRUPTED", retryable: true, user_hint: "批量后台任务意外中断，可以继续原批次。", code: null }
      await writeBatchControl(paths, "paused")
    }
    if (manifest.state !== "queued") {
      manifest.worker_pid = null
      await persistBatch(manifest, paths)
    }
  }
  return success("image.batch-status", manifest.batch_id, manifest.state, {
    data: publicBatchData(manifest, paths, { includeTasks: input.include_tasks === true }),
  })
}

async function writeBatchControl(paths, desiredState) {
  if (desiredState === "cancelled") {
    await writeJsonAtomic(paths.cancelled, { cancelled_at: new Date().toISOString() })
  } else {
    try {
      await access(paths.cancelled)
      return { desired_state: "cancelled" }
    } catch { /* no cancellation marker */ }
  }
  await writeJsonAtomic(paths.control, { desired_state: desiredState, updated_at: new Date().toISOString() })
  return { desired_state: desiredState }
}

async function readBatchControl(paths) {
  try {
    await access(paths.cancelled)
    return { desired_state: "cancelled" }
  } catch { /* no cancellation marker */ }
  try { return JSON.parse(await readFile(paths.control, "utf8")) } catch { return { desired_state: "running" } }
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false
  try { process.kill(pid, 0); return true } catch { return false }
}

function markBatchCancelled(manifest) {
  for (const task of manifest.tasks) if (["pending", "running"].includes(task.status)) task.status = "cancelled"
  manifest.state = "cancelled"
  manifest.worker_pid = null
  manifest.pause_reason = null
  manifest.pause_error = null
}

async function batchWorkerPid(manifest, paths) {
  if (processIsAlive(manifest.worker_pid)) return manifest.worker_pid
  try {
    const lockPid = Number(String(await readFile(paths.lock, "utf8")).trim())
    return processIsAlive(lockPid) ? lockPid : null
  } catch {
    return null
  }
}

async function imageBatchPause(input) {
  const { manifest, paths } = await readBatchManifest(requireString(input, "batch_dir", "batch_dir"))
  if (IMAGE_BATCH_FINAL_STATES.has(manifest.state)) return success("image.batch-pause", manifest.batch_id, manifest.state, { data: publicBatchData(manifest, paths) })
  const activeWorkerPid = await batchWorkerPid(manifest, paths)
  const control = await writeBatchControl(paths, "paused")
  if (control.desired_state === "cancelled" && !activeWorkerPid) {
    markBatchCancelled(manifest)
    await persistBatch(manifest, paths)
    return success("image.batch-pause", manifest.batch_id, "cancelled", { data: publicBatchData(manifest, paths) })
  }
  if (!activeWorkerPid) {
    for (const task of manifest.tasks) if (task.status === "running") task.status = "pending"
    manifest.state = "paused"
    manifest.worker_pid = null
    await persistBatch(manifest, paths)
  }
  const state = activeWorkerPid ? "pausing" : "paused"
  return success("image.batch-pause", manifest.batch_id, state, { data: { ...publicBatchData(manifest, paths), message: "已停止补入新任务；正在生成的图片会正常收口。" } })
}

async function imageBatchCancel(input) {
  const { manifest, paths } = await readBatchManifest(requireString(input, "batch_dir", "batch_dir"))
  if (IMAGE_BATCH_FINAL_STATES.has(manifest.state)) return success("image.batch-cancel", manifest.batch_id, manifest.state, { data: publicBatchData(manifest, paths) })
  const activeWorkerPid = await batchWorkerPid(manifest, paths)
  await writeBatchControl(paths, "cancelled")
  if (!activeWorkerPid) {
    markBatchCancelled(manifest)
    await persistBatch(manifest, paths)
  }
  return success("image.batch-cancel", manifest.batch_id, manifest.state === "cancelled" ? "cancelled" : "cancelling", { data: publicBatchData(manifest, paths) })
}

async function imageBatchRetry(input) {
  const { manifest, paths } = await readBatchManifest(requireString(input, "batch_dir", "batch_dir"))
  if (await batchWorkerPid(manifest, paths)) throw new SkillError("TASK_RUNNING", "批量任务仍在运行，请先暂停后再重试失败项。")
  if ((await readBatchControl(paths)).desired_state === "cancelled") {
    markBatchCancelled(manifest)
    await persistBatch(manifest, paths)
    return success("image.batch-retry", manifest.batch_id, "cancelled", { data: publicBatchData(manifest, paths) })
  }
  let selected = null
  if (input.task_ids !== undefined) {
    if (!Array.isArray(input.task_ids) || !input.task_ids.length) throw new SkillError("INVALID_INPUT", "task_ids 必须是非空任务 ID 数组。")
    const requestedIds = input.task_ids.map((value) => String(value || "").trim())
    if (requestedIds.some((value) => !value)) throw new SkillError("INVALID_INPUT", "task_ids 不能包含空任务 ID。")
    selected = new Set(requestedIds)
    const tasksById = new Map(manifest.tasks.map((task) => [task.id, task]))
    const missingIds = [...selected].filter((id) => !tasksById.has(id))
    if (missingIds.length) throw new SkillError("INVALID_INPUT", `找不到任务 ID：${missingIds.join("、")}。请先用 batch-status 查看任务清单。`)
    const unavailableIds = [...selected].filter((id) => !["completed", "failed"].includes(tasksById.get(id).status))
    if (unavailableIds.length) throw new SkillError("INVALID_INPUT", `以下任务尚未完成或失败，不能重做：${unavailableIds.join("、")}。`)
  }
  const retryTasks = manifest.tasks.filter((task) => selected
    ? selected.has(task.id) && ["completed", "failed"].includes(task.status)
    : task.status === "failed" && task.error?.retryable === true)
  if (!retryTasks.length) {
    const hint = selected
      ? "没有符合条件的已完成或失败任务可以重做。"
      : "没有可自动重试的失败任务；如需重做不可重试项，请明确提供 task_ids。"
    throw new SkillError("INVALID_INPUT", hint)
  }
  const estimatedRetryCredits = retryTasks.reduce((total, task, index) => total + ensureBatchModelAndRatio(task, manifest.shared, index), 0)
  if (input.approve_cost !== true) {
    return success("image.batch-retry", manifest.batch_id, "awaiting_retry_confirmation", {
      data: {
        ...publicBatchData(manifest, paths),
        retry_count: retryTasks.length,
        estimated_retry_credits: estimatedRetryCredits,
        confirmation_required: true,
        confirmation_hint: `重做 ${retryTasks.length} 张预计额外消耗 ${estimatedRetryCredits} 点，确认后重新排队并保留旧结果。`,
        next_action: "image.batch-retry",
      },
    })
  }
  let count = 0
  for (const task of retryTasks) {
    task.previous_request_ids.push(task.request_id)
    task.request_id = requestId({})
    task.status = "pending"
    task.error = null
    task.result = null
    task.started_at = null
    task.finished_at = null
    count += 1
  }
  manifest.state = "paused"
  manifest.pause_reason = null
  manifest.pause_error = null
  manifest.retry_approved_at = new Date().toISOString()
  manifest.retry_estimated_credits = estimatedRetryCredits
  await persistBatch(manifest, paths)
  const control = await writeBatchControl(paths, "paused")
  if (control.desired_state === "cancelled") {
    markBatchCancelled(manifest)
    await persistBatch(manifest, paths)
    return success("image.batch-retry", manifest.batch_id, "cancelled", { data: publicBatchData(manifest, paths) })
  }
  return success("image.batch-retry", manifest.batch_id, "paused", { data: { ...publicBatchData(manifest, paths), retry_count: count, estimated_retry_credits: estimatedRetryCredits, next_action: "image.batch-resume" } })
}

function batchPauseError(error) {
  const normalized = error instanceof SkillError ? error : new SkillError("TEMPORARY_UNAVAILABLE", "批量任务准备失败，请稍后重试。", { retryable: true })
  return {
    normalized,
    data: {
      error_type: normalized.errorType,
      retryable: normalized.retryable,
      user_hint: normalized.userHint,
      code: normalized.code || null,
    },
  }
}

function batchPausedState(errorType) {
  if (errorType === "RATE_LIMITED") return "paused_rate_limit"
  if (errorType === "CREDITS_INSUFFICIENT") return "paused_credits"
  if (["CREDENTIALS_MISSING", "AUTH_ERROR", "PERMISSION_DENIED"].includes(errorType)) return "paused_account"
  return "paused"
}

async function prepareBatchSharedReferences(manifest, paths, refreshIndex = manifest.shared_refresh_index || 0) {
  const sourceField = batchReferenceField(manifest.shared)
  if (!sourceField || manifest.shared_prepared) return
  const prepared = await prepareReferences({
    ...manifest.shared,
    request_id: `${manifest.batch_id}_shared`,
  }, refreshIndex)
  manifest.shared_prepared = prepared
  manifest.shared_refresh_index = refreshIndex
  await persistBatch(manifest, paths)
}

const batchSharedRefreshes = new WeakMap()

async function refreshBatchSharedReferences(manifest, paths) {
  const existing = batchSharedRefreshes.get(manifest)
  if (existing) return existing
  const refresh = (async () => {
    const nextRefreshIndex = Number(manifest.shared_refresh_index || 0) + 1
    manifest.shared_prepared = null
    await prepareBatchSharedReferences(manifest, paths, nextRefreshIndex)
  })()
  batchSharedRefreshes.set(manifest, refresh)
  try {
    return await refresh
  } finally {
    batchSharedRefreshes.delete(manifest)
  }
}

function taskUsesSharedReferences(task, manifest) {
  return !batchReferenceField(task.input) && Boolean(batchReferenceField(manifest.shared))
}

function executableBatchTaskInput(task, manifest) {
  const merged = { ...manifest.shared, ...task.input, request_id: task.request_id }
  if (taskUsesSharedReferences(task, manifest) && manifest.shared_prepared) {
    for (const field of ["image", "reference_images", "reference_image_urls", "reference_image_keys"]) delete merged[field]
    Object.assign(merged, manifest.shared_prepared)
  }
  merged.download_artifacts = false
  return merged
}

async function executeBatchTask(task, manifest, paths, persist) {
  task.status = "running"
  task.started_at = new Date().toISOString()
  task.attempts += 1
  task.error = null
  await persist()
  try {
    let result
    const sharedRefreshIndex = Number(manifest.shared_refresh_index || 0)
    try {
      result = await generateImage(task.action, executableBatchTaskInput(task, manifest))
    } catch (error) {
      if (Number(error?.code) === 2064 && taskUsesSharedReferences(task, manifest)) {
        if (Number(manifest.shared_refresh_index || 0) === sharedRefreshIndex) {
          try {
            await refreshBatchSharedReferences(manifest, paths)
          } catch (refreshError) {
            if (refreshError && typeof refreshError === "object") refreshError.batchGlobal = true
            throw refreshError
          }
        }
        result = await generateImage(task.action, executableBatchTaskInput(task, manifest))
      } else {
        throw error
      }
    }
    const resultStem = task.attempts > 1 ? `${task.id}-v${task.attempts}` : task.id
    const namedResult = {
      ...result,
      artifacts: result.artifacts.map((item) => item.role === "source" ? item : { ...item, filename_stem: resultStem }),
    }
    const downloaded = await materializeArtifacts(namedResult, {
      enabled: manifest.download_artifacts,
      outputDirectory: paths.results,
      filenamePrefix: "",
      maximumBytes: Number(process.env.FENGNIAO_MAX_DOWNLOAD_BYTES || DEFAULT_MAX_DOWNLOAD_BYTES),
    })
    task.status = "completed"
    task.result = { artifacts: downloaded.artifacts, usage: downloaded.usage, data: downloaded.data, download: downloaded.download, download_warning: downloaded.download_warning }
    task.finished_at = new Date().toISOString()
    await persist()
    return
  } catch (error) {
    const normalized = error instanceof SkillError ? error : new SkillError("TEMPORARY_UNAVAILABLE", "图片生成失败，请稍后重试。", { retryable: true })
    if (IMAGE_BATCH_GLOBAL_PAUSE_ERRORS.has(normalized.errorType) || normalized.batchGlobal === true) {
      task.status = "pending"
      task.error = { error_type: normalized.errorType, retryable: normalized.retryable, user_hint: normalized.userHint, code: normalized.code || null }
      manifest.pause_reason = normalized.errorType
      manifest.pause_error = task.error
      await writeBatchControl(paths, "paused")
    } else {
      task.status = "failed"
      task.error = { error_type: normalized.errorType, retryable: normalized.retryable, user_hint: normalized.userHint, code: normalized.code || null }
      task.finished_at = new Date().toISOString()
    }
    await persist()
  }
}

async function imageBatchWorker(input) {
  const { manifest, paths } = await readBatchManifest(requireString(input, "batch_dir", "batch_dir"))
  let lock
  try {
    lock = await open(paths.lock, "wx", 0o600)
    await lock.writeFile(`${process.pid}\n`)
  } catch (error) {
    if (error?.code === "EEXIST") {
      let existingPid = 0
      try { existingPid = Number(String(await readFile(paths.lock, "utf8")).trim()) } catch { /* invalid stale lock */ }
      if (processIsAlive(existingPid)) return success("image.batch-worker", manifest.batch_id, "running", { data: publicBatchData(manifest, paths) })
      try { await unlink(paths.lock) } catch { /* noop */ }
      lock = await open(paths.lock, "wx", 0o600)
      await lock.writeFile(`${process.pid}\n`)
    } else {
      throw error
    }
  }
  let writeChain = Promise.resolve()
  const persist = () => {
    const snapshot = structuredClone(manifest)
    writeChain = writeChain.then(() => persistBatch(snapshot, paths))
    return writeChain
  }
  try {
    const initialControl = await readBatchControl(paths)
    if (initialControl.desired_state !== "running") {
      if (initialControl.desired_state === "cancelled") markBatchCancelled(manifest)
      else {
        for (const task of manifest.tasks) if (task.status === "running") task.status = "pending"
        manifest.state = "paused"
        manifest.worker_pid = null
      }
      await persistBatch(manifest, paths)
      return success("image.batch-worker", manifest.batch_id, manifest.state, { data: publicBatchData(manifest, paths) })
    }
    for (const task of manifest.tasks) if (task.status === "running") task.status = "pending"
    manifest.worker_pid = process.pid
    manifest.state = "preparing"
    await persist()
    await prepareBatchSharedReferences(manifest, paths)
    const previewMode = !manifest.preview_approved && manifest.preview_count > 0
    const candidateIndices = manifest.tasks
      .map((task, index) => ({ task, index }))
      .filter(({ task, index }) => task.status === "pending" && (!previewMode || index < manifest.preview_count))
      .map(({ index }) => index)
    manifest.state = previewMode ? "previewing" : "running"
    await persist()
    let cursor = 0
    const workers = Array.from({ length: Math.min(manifest.concurrency, candidateIndices.length) }, async () => {
      while (cursor < candidateIndices.length) {
        const control = await readBatchControl(paths)
        if (control.desired_state !== "running" || manifest.pause_reason) return
        const index = candidateIndices[cursor]
        cursor += 1
        await executeBatchTask(manifest.tasks[index], manifest, paths, persist)
      }
    })
    await Promise.all(workers)
    await writeChain
    const control = await readBatchControl(paths)
    if (control.desired_state === "cancelled") {
      for (const task of manifest.tasks) if (task.status === "pending") task.status = "cancelled"
      manifest.state = "cancelled"
    } else if (manifest.pause_reason) {
      manifest.state = batchPausedState(manifest.pause_reason)
    } else if (control.desired_state === "paused") {
      manifest.state = "paused"
    } else if (previewMode) {
      const summary = batchSummary(manifest)
      if (summary.completed === 0) {
        manifest.state = "preview_failed"
        manifest.pause_reason = "PREVIEW_FAILED"
        manifest.pause_error = {
          error_type: "PREVIEW_FAILED",
          retryable: summary.failed > 0 && manifest.tasks.some((task, index) => index < manifest.preview_count && task.error?.retryable === true),
          user_hint: "样图没有成功生成，请先重试失败项或调整任务后重新创建批次。",
          code: null,
        }
      } else {
        manifest.state = "awaiting_preview_confirmation"
      }
      await writeBatchControl(paths, "paused")
    } else {
      const summary = batchSummary(manifest)
      manifest.state = summary.failed ? "partial_failed" : "completed"
      await writeBatchControl(paths, "completed")
    }
    const latestControl = await readBatchControl(paths)
    if (latestControl.desired_state === "cancelled") markBatchCancelled(manifest)
    else manifest.worker_pid = null
    await persist()
    await writeChain
    return success("image.batch-worker", manifest.batch_id, manifest.state, { data: publicBatchData(manifest, paths) })
  } catch (error) {
    const control = await readBatchControl(paths)
    if (control.desired_state === "cancelled") {
      markBatchCancelled(manifest)
    } else {
      const { normalized, data } = batchPauseError(error)
      for (const task of manifest.tasks) if (task.status === "running") task.status = "pending"
      manifest.state = IMAGE_BATCH_GLOBAL_PAUSE_ERRORS.has(normalized.errorType) ? batchPausedState(normalized.errorType) : "paused_setup_error"
      manifest.pause_reason = normalized.errorType
      manifest.pause_error = data
      await writeBatchControl(paths, "paused")
    }
    manifest.worker_pid = null
    await persistBatch(manifest, paths)
    return success("image.batch-worker", manifest.batch_id, manifest.state, { data: publicBatchData(manifest, paths) })
  } finally {
    try { await lock?.close() } catch { /* noop */ }
    try { await unlink(paths.lock) } catch { /* noop */ }
  }
}

async function imageBatchResume(input) {
  const { manifest, paths } = await readBatchManifest(requireString(input, "batch_dir", "batch_dir"))
  if (await batchWorkerPid(manifest, paths)) throw new SkillError("TASK_RUNNING", "批量任务已经在运行。")
  if ((await readBatchControl(paths)).desired_state === "cancelled") {
    markBatchCancelled(manifest)
    await persistBatch(manifest, paths)
    return success("image.batch-resume", manifest.batch_id, "cancelled", { data: publicBatchData(manifest, paths) })
  }
  if (["completed", "cancelled"].includes(manifest.state)) return success("image.batch-resume", manifest.batch_id, manifest.state, { data: publicBatchData(manifest, paths) })
  if (manifest.state === "preview_failed") {
    throw new SkillError("INVALID_INPUT", "样图没有成功生成，请先重试失败项或调整任务后重新创建批次。")
  }
  if (manifest.state === "partial_failed" && !manifest.tasks.some((task) => task.status === "pending")) {
    throw new SkillError("INVALID_INPUT", "当前批次只剩失败项，请先确认并重试失败图片。")
  }
  if (!manifest.cost_approved) {
    if (input.approve_cost !== true) throw new SkillError("INVALID_INPUT", `开始前需要确认预计消耗 ${manifest.estimated_credits} 点。`)
    manifest.cost_approved = true
    manifest.cost_approved_at = new Date().toISOString()
    if (input.skip_preview === true) manifest.preview_approved = true
  }
  if (manifest.state === "awaiting_preview_confirmation" && !manifest.preview_approved) {
    if (input.approve_preview !== true) throw new SkillError("INVALID_INPUT", "请先确认样图，再继续剩余批量任务。")
    manifest.preview_approved = true
    manifest.preview_approved_at = new Date().toISOString()
  }
  manifest.state = "queued"
  manifest.pause_reason = null
  manifest.pause_error = null
  await persistBatch(manifest, paths)
  const control = await writeBatchControl(paths, "running")
  if (control.desired_state === "cancelled") {
    markBatchCancelled(manifest)
    await persistBatch(manifest, paths)
    return success("image.batch-resume", manifest.batch_id, "cancelled", { data: publicBatchData(manifest, paths) })
  }
  if (input.background !== true) return imageBatchWorker({ batch_dir: paths.directory })
  const pid = launchBatchWorker(paths.directory)
  return success("image.batch-resume", manifest.batch_id, "starting", { data: { ...publicBatchData(manifest, paths), worker_pid: pid, message: "批量任务已在后台启动，可使用 batch-status 查看进度。" } })
}

async function cutout(input, refreshIndex = 0) {
  const currentRequestId = requestId(input)
  const subjectTypes = { person: "body", product: "commodity", clothing: "cloth", general: "common" }
  const backgrounds = { transparent: "crop", white: "whiteBK", crop: "crop" }
  const subjectType = input.subject_type || "general"
  const background = input.background || "transparent"
  if (!subjectTypes[subjectType]) throw new SkillError("INVALID_INPUT", "subject_type 仅支持 person、product、clothing 或 general。", { requestId: currentRequestId })
  if (!backgrounds[background]) throw new SkillError("INVALID_INPUT", "background 仅支持 transparent、white 或 crop。", { requestId: currentRequestId })
  const asset = await materializeInputAsset(input.image, { purpose: "image_cutout", currentRequestId, refreshIndex })
  let payload
  try {
    payload = await apiRequest("/api/v1/img/cutout", {
      request_id: currentRequestId,
      customer_id: input.customer_id,
      ...(asset.key ? { image_key: asset.key } : { image: asset.url }),
      type: subjectTypes[subjectType],
      output_mode: backgrounds[background],
    }, currentRequestId, { retryUncertainFailures: false })
  } catch (error) {
    if (shouldRefreshAsset(error, refreshIndex)) return cutout(input, refreshIndex + 1)
    throw error
  }
  return success("image.cutout", payload.request_id || currentRequestId, "completed", {
    artifacts: imageArtifacts(payload.result),
    data: payload.result,
    usage: payload.usage,
  })
}

async function ocrSubmit(input, refreshIndex = 0) {
  const currentRequestId = requestId(input)
  const asset = await materializeInputAsset(input.image, { purpose: "image_ocr", currentRequestId, refreshIndex })
  let payload
  try {
    payload = await apiRequest("/api/v1/editor/ocr", asset.key ? { image_key: asset.key } : { image: asset.url }, currentRequestId, { retryUncertainFailures: false })
  } catch (error) {
    if (shouldRefreshAsset(error, refreshIndex)) return ocrSubmit(input, refreshIndex + 1)
    throw error
  }
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
  const rawState = task.status
  const state = ({ 1: "pending", 2: "processing", 3: "completed", 4: "failed", 5: "permission_denied" })[String(rawState)] || rawState || "pending"
  if (state === "not_found") throw new SkillError("TASK_NOT_FOUND", task.errMsg || "OCR 任务不存在或结果已过期。", { requestId: currentRequestId })
  if (state === "failed" || state === "error") throw new SkillError("TEMPORARY_UNAVAILABLE", "OCR 任务处理失败，请检查图片后重试。", { retryable: true, requestId: currentRequestId })
  if (state === "permission_denied") throw new SkillError("CREDITS_INSUFFICIENT", "OCR 任务没有权限执行，请检查项目权限或剩余点数。", { requestId: currentRequestId })
  return success("image.ocr-status", currentRequestId, state, {
    taskId,
    data: { texts: task.result?.texts || [], progress: task.progress ?? null, raw_status: rawState ?? null },
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

async function translateImage(input, refreshIndex = 0) {
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
  const asset = await materializeInputAsset(source, { purpose: "image_translate", currentRequestId, refreshIndex })
  const body = {
    request_id: currentRequestId,
    ...(asset.key ? { image_key: asset.key } : { image: asset.url }),
    lang_from: langFrom,
    lang_to: langTo,
    engine,
    commodity_protection: Boolean(input.commodity_protection),
    glossary_enabled: Boolean(input.glossary_enabled),
    brand_protect: Boolean(input.brand_protect),
  }
  if (filename) body.filename = filename
  let payload
  try {
    payload = await apiRequest("/api/v1/img/translate-save", body, currentRequestId, { retryUncertainFailures: false })
  } catch (error) {
    if (shouldRefreshAsset(error, refreshIndex)) return translateImage(input, refreshIndex + 1)
    throw error
  }
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
  const sourceFields = ["video_url", "video_urls", "video_key", "video_keys"].filter((field) => input[field] !== undefined)
  if (sourceFields.length !== 1) throw new SkillError("INVALID_INPUT", "视频来源必须且只能传一种。", { requestId: currentRequestId })
  const sourceField = sourceFields[0]
  if (sourceField === "video_url") validateHttpsUrl(input.video_url, "视频地址")
  if (sourceField === "video_urls") {
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

async function videoSubmit(input, refreshIndex = 0) {
  const currentRequestId = requestId(input)
  let normalizedInput = {
    ...input,
    source_language: normalizeVideoLanguage(input.source_language, "源语言"),
    target_language: normalizeVideoLanguage(input.target_language, "目标语言"),
  }
  const localFields = ["video", "videos"].filter((field) => normalizedInput[field] !== undefined)
  const remoteFields = ["video_url", "video_urls", "video_key", "video_keys"].filter((field) => normalizedInput[field] !== undefined)
  if (localFields.length + remoteFields.length !== 1) throw new SkillError("INVALID_INPUT", "请提供一个本地视频、视频列表或 HTTPS 视频地址。", { requestId: currentRequestId })
  if (localFields.length) {
    const values = localFields[0] === "videos" ? normalizedInput.videos : [normalizedInput.video]
    if (!Array.isArray(values) || values.length < 1 || values.length > 10) throw new SkillError("INVALID_INPUT", "视频列表必须包含 1 到 10 个文件。", { requestId: currentRequestId })
    const uploadConcurrency = boundedInteger(process.env.FENGNIAO_VIDEO_UPLOAD_CONCURRENCY, 2, { min: 1, max: 4 })
    const assets = await mapWithConcurrency(values, uploadConcurrency, (value) => materializeInputAsset(value, { purpose: "video_translate", currentRequestId, refreshIndex }))
    delete normalizedInput.video
    delete normalizedInput.videos
    const urls = assets.flatMap((asset) => asset.url ? [asset.url] : [])
    const keys = assets.flatMap((asset) => asset.key ? [asset.key] : [])
    if (urls.length && keys.length) throw new SkillError("INVALID_INPUT", "同一批视频请统一使用本地文件或 HTTPS 地址。", { requestId: currentRequestId })
    if (values.length === 1) Object.assign(normalizedInput, keys.length ? { video_key: keys[0] } : { video_url: urls[0] })
    else Object.assign(normalizedInput, keys.length ? { video_keys: keys } : { video_urls: urls })
  }
  if (normalizedInput.tts?.voice_id !== undefined) normalizedInput.tts = { ...normalizedInput.tts, voice_id: String(normalizedInput.tts.voice_id).trim() }
  await validateVideoCreateInput(normalizedInput, currentRequestId)
  const body = { ...cleanControlFields(normalizedInput), request_id: currentRequestId }
  let payload
  try {
    payload = await apiRequest("/api/v1/video/translate/create", body, currentRequestId)
  } catch (error) {
    if (shouldRefreshAsset(error, refreshIndex)) return videoSubmit(input, refreshIndex + 1)
    throw error
  }
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
    artifact("video", item.video_url, { role: "translated", task_id: item.task_id, target_language: item.target_language }),
    artifact("image", item.cover_url, { role: "cover", task_id: item.task_id, target_language: item.target_language }),
    artifact("audio", item.assets?.original_audio_url, { role: "original-audio", task_id: item.task_id, target_language: item.target_language }),
    artifact("subtitle", item.assets?.translated_subtitle_srt_url, { role: "translated-subtitle", task_id: item.task_id, target_language: item.target_language }),
    artifact("subtitle", item.assets?.original_dialog_srt_url, { role: "original-dialog", task_id: item.task_id, target_language: item.target_language }),
    artifact("subtitle", item.assets?.original_intro_srt_url, { role: "original-intro", task_id: item.task_id, target_language: item.target_language }),
    artifact("video", item.assets?.erased_video_url, { role: "subtitle-erased", task_id: item.task_id, target_language: item.target_language }),
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
  if (group === "skill" && action === "check-update") return skillCheckUpdate(input)
  if (group === "image" && new Set(["generate", "transform", "expand", "enhance"]).has(action)) return generateImage(action, input)
  if (group === "image" && action === "batch-submit") return imageBatchSubmit(input)
  if (group === "image" && action === "batch-list") return imageBatchList(input)
  if (group === "image" && action === "batch-status") return imageBatchStatus(input)
  if (group === "image" && action === "batch-pause") return imageBatchPause(input)
  if (group === "image" && action === "batch-resume") return imageBatchResume(input)
  if (group === "image" && action === "batch-retry") return imageBatchRetry(input)
  if (group === "image" && action === "batch-cancel") return imageBatchCancel(input)
  if (group === "image" && action === "batch-worker") return imageBatchWorker(input)
  if (group === "image" && action === "cutout") return cutout(input)
  if (group === "image" && action === "ocr-submit") return ocrSubmit(input)
  if (group === "image" && action === "ocr-status") return ocrStatus(input)
  if (group === "image" && action === "ocr") return ocr(input)
  if (group === "image" && action === "analyze") return imageAnalyze(input)
  if (group === "image" && action === "translate") return translateImage(input)
  if (group === "product" && action === "scrape") return productScrape(input)
  if (group === "video" && action === "translate-submit") return videoSubmit(input)
  if (group === "video" && action === "translate-status") return videoStatus(input)
  if (group === "video" && action === "translate") return videoTranslate(input)
  throw new SkillError("INVALID_INPUT", `不支持的操作：${group} ${action}。运行 --help 查看可用操作。`)
}

async function main() {
  let parsed = null
  try {
    parsed = await parseArgs(process.argv.slice(2))
    if (parsed.help) return printJson(usage())
    const downloadOptions = prepareDownloadOptions(parsed.input, { group: parsed.group, action: parsed.action })
    const result = await run(parsed.group, parsed.action, parsed.input)
    const namedResult = applySemanticArtifactNames(result, parsed.group, parsed.action, parsed.input)
    const materialized = await materializeArtifacts(namedResult, downloadOptions)
    printJson(applyProductWorkflowReadiness(materialized, parsed.group, parsed.action))
  } catch (error) {
    const normalized = error instanceof SkillError
      ? error
      : new SkillError("TEMPORARY_UNAVAILABLE", "执行失败，请稍后重试。", { retryable: true })
    const terminalProductWorkflow = parsed?.group === "product" && parsed?.action === "scrape"
    const productFailurePolicy = terminalProductWorkflow ? {
      scope: "current_product_url_workflow",
      terminal_for_url_workflow: true,
      automatic_retry: false,
      allow_browser_fallback: false,
      allow_downstream_actions: false,
      unrelated_actions_allowed: true,
      safe_next_steps: [
        "retry_original_url_with_user_confirmation",
        "provide_another_trusted_product_url",
        "upload_trusted_product_materials",
      ],
    } : null
    printJson({
      ok: false,
      ...(terminalProductWorkflow ? { action: "product.scrape", state: "terminated" } : {}),
      error_type: normalized.errorType,
      retryable: terminalProductWorkflow ? false : normalized.retryable,
      ...(terminalProductWorkflow ? { user_retry_allowed: normalized.retryable, requires_user_confirmation_for_retry: true } : {}),
      user_hint: terminalProductWorkflow
        ? "商品采集失败，已终止当前 URL 工作流，尚未开始识图或套图生成。请确认重试原链接、提供另一个可信商品链接，或上传真实商品素材。"
        : normalized.userHint,
      request_id: normalized.requestId || null,
      code: normalized.code || null,
      ...(productFailurePolicy ? { failure_policy: productFailurePolicy } : {}),
    })
    process.exitCode = 1
  }
}

await main()
