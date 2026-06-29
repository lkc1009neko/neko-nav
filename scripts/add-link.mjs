import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'
import rules from './category-rules.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = resolve(__dirname, '..', 'src', 'data', 'links.ts')
const CAT_FILE = resolve(__dirname, '..', 'src', 'data', 'categories.ts')
const MARKER = '// <auto-append>'
const CAT_MARKER = '// <auto-append>'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
function ask(q) { return new Promise(r => rl.question(q, r)) }

const PROXY_FILE = resolve(__dirname, '..', 'functions', 'api', 'proxy', '[path].ts')

function parseTargets() {
  if (!existsSync(PROXY_FILE)) return {}
  const content = readFileSync(PROXY_FILE, 'utf-8')
  const start = content.indexOf('const TARGETS:')
  if (start === -1) return {}
  const braceStart = content.indexOf('{', start)
  const braceEnd = content.indexOf('}', braceStart)
  if (braceStart === -1 || braceEnd === -1) return {}

  const targets = {}
  const section = content.slice(braceStart + 1, braceEnd)
  for (const line of section.split('\n')) {
    const m = line.match(/\s*([\w-]+):\s*'([^']*)'\s*,?\s*/)
    if (m) targets[m[1]] = m[2]
  }
  return targets
}

function writeTargetEntry(key, value) {
  if (!existsSync(PROXY_FILE)) return
  const targets = parseTargets()
  targets[key] = value
  let content = readFileSync(PROXY_FILE, 'utf-8')
  const start = content.indexOf('const TARGETS:')
  const braceStart = content.indexOf('{', start)
  const braceEnd = content.indexOf('}', braceStart)
  const lines = Object.entries(targets).map(([k, v]) => `  ${k}: '${v}',`)
  content = content.slice(0, braceStart) + '{\n' + lines.join('\n') + '\n}' + content.slice(braceEnd + 1)
  writeFileSync(PROXY_FILE, content)
}

function removeTargetEntry(key) {
  if (!existsSync(PROXY_FILE)) return
  let content = readFileSync(PROXY_FILE, 'utf-8')
  const regex = new RegExp(`\\s{2}${key}:\\s*'[^']*',?\\s*\\n?`)
  const newContent = content.replace(regex, '\n')
  if (newContent !== content) {
    writeFileSync(PROXY_FILE, newContent)
    return true
  }
  return false
}

function resolveUrl(base, href) {
  try { return new URL(href, base).href } catch { return null }
}

function extractFavicon(html, baseUrl) {
  const patterns = [
    /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m) { const url = resolveUrl(baseUrl, m[1]); if (url) return url }
  }
  return `${baseUrl.replace(/\/+$/, '')}/favicon.ico`
}

function extractMeta(html, names) {
  for (const n of names) {
    const p = new RegExp(`<meta[^>]+(?:name|property)=["']${n}["'][^>]+content=["']([^"']+)["']`, 'i')
    const m = html.match(p)
    if (m) return m[1]
    const p2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${n}["']`, 'i')
    const m2 = html.match(p2)
    if (m2) return m2[1]
  }
  return ''
}

function guessCategory(title, desc) {
  const text = `${title} ${desc}`.toLowerCase()
  for (const rule of rules) {
    if (rule.keywords.some(k => text.includes(k))) {
      let matchedSub = ''
      for (const [subId, subKw] of Object.entries(rule.subCats)) {
        if (subKw.some(k => text.includes(k))) { matchedSub = subId; break }
      }
      return { cat: rule.cat, subCategory: matchedSub, matched: rule.keywords.filter(k => text.includes(k)) }
    }
  }
  return { cat: 'tool', subCategory: '', matched: [] }
}

const EMOJI_RULES = [
  { emoji: '📷', keywords: ['摄影', '拍照', '相机', 'photo', '摄影'] },
  { emoji: '🎬', keywords: ['影视', '电影', '番剧', '视频', 'film', 'movie'] },
  { emoji: '🎮', keywords: ['游戏', '电竞', 'game', 'gaming', 'play'] },
  { emoji: '🎵', keywords: ['音乐', '音频', 'music', 'audio', 'song'] },
  { emoji: '🔧', keywords: ['工具', '实用', 'tool', 'utility', '开发'] },
  { emoji: '💬', keywords: ['社区', '论坛', '社交', 'chat', 'community', 'bbs'] },
  { emoji: '🎨', keywords: ['绘画', '艺术', '设计', 'art', 'design', 'creative'] },
  { emoji: '💻', keywords: ['编程', '代码', '技术', 'tech', 'code', 'dev'] },
  { emoji: '📖', keywords: ['阅读', '书籍', '小说', 'book', 'read', 'novel'] },
  { emoji: '🤖', keywords: ['ai', '人工智能', 'chatgpt', '智能', 'robot'] },
  { emoji: '🛒', keywords: ['购物', '电商', 'shop', 'buy', 'mall'] },
  { emoji: '🍜', keywords: ['美食', '烹饪', 'food', 'cook', 'eat'] },
  { emoji: '📚', keywords: ['学习', '教育', 'study', 'learn', 'edu'] },
  { emoji: '📰', keywords: ['新闻', '资讯', 'news', 'media'] },
  { emoji: '📺', keywords: ['直播', 'tv', '电视', 'channel', 'media'] },
  { emoji: '✈️', keywords: ['旅行', '旅游', 'travel', 'trip'] },
  { emoji: '⚡', keywords: ['科技', '数码', 'tech', 'digital', 'gadget'] },
  { emoji: '☁️', keywords: ['云', '云服务', 'cloud', 'hosting'] },
  { emoji: '📝', keywords: ['笔记', '文档', '写作', 'note', 'doc', 'write'] },
  { emoji: '🐱', keywords: ['猫', '宠物', 'cat', 'pet'] },
  { emoji: '🌐', keywords: ['网络', '全球', 'web', 'global', 'internet'] },
  { emoji: '🚀', keywords: ['创业', 'startup', 'launch', '产品'] },
  { emoji: '🎓', keywords: ['大学', '学术', 'research', 'academic'] },
  { emoji: '💼', keywords: ['工作', '求职', 'job', 'career', 'business'] },
]

const COMMON_EMOJIS = ['📷', '🎬', '🎮', '🎵', '🔧', '💬', '🎨', '💻', '📖', '🤖', '📺', '📰', '⚡', '☁️', '📝', '🌐', '🚀', '💼', '🛒', '📚']

async function pickEmoji(label) {
  const text = label.toLowerCase()
  const matched = EMOJI_RULES.find(r => r.keywords.some(k => text.includes(k)))
  const candidates = [matched?.emoji, ...COMMON_EMOJIS].filter(Boolean)
  const seen = new Set()
  const unique = candidates.filter(e => { if (seen.has(e)) return false; seen.add(e); return true }).slice(0, 20)

  console.log(`\n${matched ? '🎯 推荐:' : '📦 可选图标:'}`)
  unique.forEach((emoji, i) => {
    const hint = EMOJI_RULES.find(r => r.emoji === emoji)
    const suffix = i === 0 && matched ? ` (自动匹配 "${label}")` : hint ? ` (${hint.keywords[0]})` : ''
    console.log(`  ${i + 1}) ${emoji}${suffix}`)
  })
  console.log(`  0) 自定义输入`)

  const choice = (await ask(`\n选择 [1]: `)).trim()
  if (choice === '0') return (await ask('输入图标 (emoji): ')).trim() || '📁'
  const idx = parseInt(choice) || 1
  return unique[idx - 1] || unique[0] || '📁'
}

const CAT_DEFAULT_TAGS = {
  anime: ['动漫', '番剧'],
  game: ['游戏'],
  music: ['音乐'],
  tool: ['工具'],
  community: ['社区'],
  art: ['绘画', '插画'],
}

function extractTagsFromHtml(html, cat) {
  const tags = []

  // meta keywords
  const kw = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i)
  if (kw) tags.push(...kw[1].split(/[,，、/]/).map(s => s.trim()).filter(Boolean))

  // meta article:tag
  const artTags = html.matchAll(/<meta[^>]+property=["']article:tag["'][^>]+content=["']([^"']+)["']/gi)
  for (const m of artTags) tags.push(m[1])

  // category defaults
  if (cat && CAT_DEFAULT_TAGS[cat]) tags.push(...CAT_DEFAULT_TAGS[cat])

  // deduplicate
  return [...new Set(tags)].map(s => s.trim()).filter(Boolean).slice(0, 6)
}

function escape(v) {
  if (v === undefined || v === null) return ''
  return String(v).replace(/'/g, "\\'")
}

// ── Parse helpers ──
function extractValue(line, key) {
  const re = new RegExp(`${key}:\\s*'((?:\\\\'|[^'])*)'`)
  const m = line.match(re)
  return m ? m[1].replace(/\\'/g, "'") : ''
}

function extractTags(line) {
  const m = line.match(/tags:\s*\[([^\]]*)\]/)
  if (!m) return []
  return m[1].split(',').map(s => s.trim().replace(/^'|'$/g, '')).filter(Boolean)
}

function parseEntries() {
  if (!existsSync(DATA_FILE)) return []
  const content = readFileSync(DATA_FILE, 'utf-8')
  const idx = content.indexOf('export const links:')
  const end = content.indexOf(MARKER)
  if (idx === -1 || end === -1) return []

  const entries = []
  for (const line of content.slice(idx, end).split('\n')) {
    if (!line.includes("url:")) continue
    entries.push({
      title: extractValue(line, 'title'),
      url: extractValue(line, 'url'),
      description: extractValue(line, 'description'),
      icon: extractValue(line, 'icon'),
      category: extractValue(line, 'category'),
      subCategory: extractValue(line, 'subCategory'),
      tags: extractTags(line),
      auth: line.includes('auth: true'),
      rating: extractValue(line, 'rating') || 'all',
    })
  }
  return entries
}

function urlExists(url, entries) {
  const norm = url.replace(/\/+$/, '').toLowerCase()
  return entries.some(e => e.url.replace(/\/+$/, '').toLowerCase() === norm)
}

function parseCategories() {
  if (!existsSync(CAT_FILE)) return []
  const content = readFileSync(CAT_FILE, 'utf-8')
  const startIdx = content.indexOf('export const categories:')
  const endIdx = content.indexOf(CAT_MARKER)
  if (startIdx === -1 || endIdx === -1) return []

  const section = content.slice(startIdx, endIdx)
  const cats = []
  let depth = 0
  let current = ''

  for (let i = 0; i < section.length; i++) {
    const ch = section[i]
    if (ch === '{' && depth === 0) {
      depth = 1; current = '{'
    } else if (ch === '{') {
      depth++; current += ch
    } else if (ch === '}') {
      depth--; current += ch
      if (depth === 0) {
        const m = { id: '', label: '', icon: '', children: [] }
        m.id = (current.match(/id:\s*'([^']*)'/) || ['', ''])[1]
        m.label = (current.match(/label:\s*'([^']*)'/) || ['', ''])[1]
        m.icon = (current.match(/icon:\s*'([^']*)'/) || ['', ''])[1]
        if (current.includes('children:')) {
          const childLines = current.split('\n')
          for (const cl of childLines) {
            if (cl.includes('id:') && cl.includes('label:')) {
              m.children.push({
                id: (cl.match(/id:\s*'([^']*)'/) || ['', ''])[1],
                label: (cl.match(/label:\s*'([^']*)'/) || ['', ''])[1],
              })
            }
          }
        }
        if (m.id) cats.push(m)
        current = ''
      }
    } else if (depth > 0) {
      current += ch
    }
  }
  return cats
}

// ── Interactive add link ──
async function interactiveAdd() {
  let cont = true
  while (cont) {
    const url = (await ask('\nURL: ')).trim()
    if (!url) { console.log('已取消'); break }

    const entries = parseEntries()
    if (urlExists(url, entries)) {
      console.log('⚠️  该 URL 已存在，跳过')
      const again = (await ask('继续添加其他链接? [Y/n] ')).toLowerCase()
      if (again === 'n') break
      continue
    }

    console.log('\n🌐 正在抓取...')
    let html
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NekoNav/1.0)' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      html = await res.text()
    } catch (e) {
      console.log(`❌ 抓取失败: ${e.message}`)
      const retry = (await ask('重试? [Y/n] ')).toLowerCase()
      if (retry === 'n') break
      continue
    }

    const title = (html.match(/<title>([^<]*)<\/title>/i) || ['', url.replace(/^https?:\/\//, '').split('/')[0]])[1].trim()
    const desc = extractMeta(html, ['description', 'og:description', 'twitter:description']) || ''
    const icon = extractFavicon(html, url)
    const { cat, subCategory, matched } = guessCategory(title, desc)
    const cats = parseCategories()
    const catCandidates = cats.filter(c => c.id !== 'all').map(c => c.id)
    const catHint = cat || (catCandidates.length ? catCandidates[0] : 'tool')
    const suggestedTags = extractTagsFromHtml(html, catHint)
    const tagsHint = suggestedTags.length ? suggestedTags.join(', ') : ''

    console.log('\n' + '─'.repeat(50))
    console.log(`  📄 标题:  ${title}`)
    console.log(`  📝 描述:  ${desc.length > 60 ? desc.slice(0, 60) + '...' : desc}`)
    console.log(`  🖼 图标:  ${icon}`)
    console.log(`  🏷 分类:  ${catHint}${matched.length ? ' (匹配: ' + matched.join(', ') + ')' : ''}`)
    if (suggestedTags.length) console.log(`  🏷 建议:  ${tagsHint}`)
    console.log('─'.repeat(50))

    const newTitle = (await ask(`\n标题 [${title}]: `)).trim() || title
    const newDesc = (await ask(`描述 [${desc}]: `)).trim() || desc
    const newIcon = (await ask(`图标 [${icon}]: `)).trim() || icon

    const catInput = (await ask(`\n分类 [${catHint}]: `)).trim() || catHint
    if (catInput !== 'all') {
      const existingCats = parseCategories()
      if (!existingCats.some(c => c.id === catInput)) {
        const create = (await ask(`⚠️  分类 "${catInput}" 不存在\n自动创建? [Y/n] `)).toLowerCase()
        if (create !== 'n') {
          const newIcon = await pickEmoji(catInput)
          const catLine = buildCatEntry(catInput, catInput, newIcon, [])
          let catContent = readFileSync(CAT_FILE, 'utf-8')
          const catIdx = catContent.indexOf(CAT_MARKER)
          if (catIdx !== -1) {
            catContent = catContent.slice(0, catIdx).replace(/\s*$/, '') + '\n' + catLine + catContent.slice(catIdx)
            writeFileSync(CAT_FILE, catContent)
            console.log(`✅ 分类 "${catInput}" 已创建`)
          }
        } else {
          console.log('已取消')
          continue
        }
      }
    }
    const subInput = (await ask(`子分类 [${subCategory || '(无)'}]: `)).trim() || subCategory || ''
    const rawTags = (await ask(`标签 (逗号分隔) [${tagsHint}]: `)).trim()
    const tags = rawTags ? rawTags.split(/[,，]/).map(s => s.trim()).filter(Boolean) : suggestedTags
    const ratingInput = (await ask('年龄分级 [all|r12|r15|r18] [all]: ')).trim() || 'all'
    const isR18 = ratingInput === 'r18'
    if (isR18) {
      const confirmR18 = (await ask('⚠️  确认设为 R18 限制级? [y/N] ')).toLowerCase()
      if (confirmR18 !== 'y') { console.log('已取消'); continue }
    }
    const isAuth = isR18 || (await ask('隐私链接? (需登录才可见) [y/N]: ')).toLowerCase() === 'y'
    let proxyTarget = ''
    const isProxyUrl = url.startsWith('/api/proxy/')
    if (isAuth && isProxyUrl) {
      proxyTarget = (await ask('代理目标 URL (真实地址): ')).trim()
      if (!proxyTarget) { console.log('❌ 代理目标 URL 不能为空'); continue }
    } else if (isAuth && !isProxyUrl) {
      console.log('⚠️  提示: 隐私链接的 URL 会出现在前端 JS 中，建议使用 /api/proxy/xxx 格式隐藏真实地址')
    }

    const confirm = (await ask('\n确认添加? [Y/n] ')).toLowerCase()
    if (confirm === 'n') { console.log('已跳过'); continue }

    let line = `  { title: '${escape(newTitle)}', url: '${url}', description: '${escape(newDesc)}', icon: '${newIcon}', category: '${catInput}'`
    if (subInput) line += `, subCategory: '${subInput}'`
    if (tags.length) line += `, tags: [${tags.map(t => `'${escape(t)}'`).join(', ')}]`
    if (ratingInput !== 'all') line += `, rating: '${ratingInput}'`
    if (isAuth) line += `, auth: true`
    line += ' },\n'

    let content = readFileSync(DATA_FILE, 'utf-8')
    const markerIdx = content.indexOf(MARKER)
    if (markerIdx === -1) { console.log('❌ 标记未找到'); break }
    content = content.slice(0, markerIdx).replace(/\s*$/, '') + '\n' + line + content.slice(markerIdx)
    writeFileSync(DATA_FILE, content, 'utf-8')
    console.log('✅ 已追加')
    if (proxyTarget) {
      const key = url.replace('/api/proxy/', '')
      writeTargetEntry(key, proxyTarget)
      console.log('✅ 已添加代理映射')
    }

    const again = (await ask('\n继续添加? [Y/n] ')).toLowerCase()
    if (again === 'n') cont = false
  }
  console.log('Bye~')
}

// ── list links ──
function listLinks() {
  const entries = parseEntries()
  if (!entries.length) { console.log('暂无链接'); return }

  const cats = parseCategories()
  const groupOrder = cats.filter(c => c.id !== 'all').map(c => c.id)
  const groups = {}
  for (const e of entries) {
    if (!groups[e.category]) groups[e.category] = []
    groups[e.category].push(e)
  }

  console.log(`\n📊 共 ${entries.length} 个链接\n`)
  for (const cat of groupOrder) {
    const items = groups[cat]
    if (!items) continue
    const catInfo = cats.find(c => c.id === cat)
    const icon = catInfo?.icon || '🔗'
    console.log(`${icon} ${cat} (${items.length})`)
    for (const item of items) {
      const tags = item.tags.length ? ` [${item.tags.join(', ')}]` : ''
      const sub = item.subCategory ? ` > ${item.subCategory}` : ''
      const auth = item.auth ? ' 🔒' : ''
      const rating = item.rating && item.rating !== 'all' ? ` [${item.rating.toUpperCase()}]` : ''
      const desc = item.description.length > 40 ? item.description.slice(0, 40) + '...' : item.description
      console.log(`  ├ ${item.title}${sub}${rating}${auth}`)
      if (desc) console.log(`  │  ${desc}`)
      if (tags) console.log(`  │  ${tags}`)
    }
    console.log()
  }
}

// ── search links ──
function searchLinks(keyword) {
  if (!keyword) { console.log('用法: node scripts/add-link.mjs search <关键词>'); return }
  const entries = parseEntries()
  const q = keyword.toLowerCase()
  const results = entries.filter(e =>
    e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) ||
    e.url.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) ||
    (e.subCategory || '').toLowerCase().includes(q) ||
    e.tags.some(t => t.toLowerCase().includes(q))
  )
  if (!results.length) { console.log(`🔍 未找到匹配 "${keyword}"`); return }
  console.log(`\n🔍 找到 ${results.length} 个匹配 "${keyword}":\n`)
  for (const item of results) {
    const tags = item.tags.length ? ` [${item.tags.join(', ')}]` : ''
    const sub = item.subCategory ? ` > ${item.subCategory}` : ''
    const auth = item.auth ? ' 🔒' : ''
    const rating = item.rating && item.rating !== 'all' ? ` [${item.rating.toUpperCase()}]` : ''
    console.log(`  ${item.title}${sub}${rating}${auth}${tags}\n    ${item.url}\n`)
  }
}

// ── link edit ──
async function linkEdit(keyword) {
  if (!keyword) { console.log('用法: node scripts/add-link.mjs link edit <关键词>'); return }

  const entries = parseEntries()
  const q = keyword.toLowerCase()
  const results = entries.map((e, i) => ({ ...e, idx: i })).filter(e =>
    e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) ||
    e.url.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q))
  )

  if (!results.length) { console.log(`🔍 未找到匹配 "${keyword}"`); return }

  console.log(`\n🔍 找到 ${results.length} 个匹配:\n`)
  results.forEach((r, i) => {
    console.log(`  ${i + 1}) ${r.title}`)
    console.log(`     ${r.url}`)
    console.log(`     分类: ${r.category}${r.subCategory ? ` > ${r.subCategory}` : ''}  标签: [${r.tags.join(', ')}]`)
  })

  const pick = parseInt((await ask('\n选择编号: ')).trim())
  if (isNaN(pick) || pick < 1 || pick > results.length) { console.log('❌ 无效'); return }

  const entry = results[pick - 1]

  console.log(`\n编辑: ${entry.title}`)
  const newTitle = (await ask(`标题 [${entry.title}]: `)).trim() || entry.title
  const newUrl = (await ask(`URL [${entry.url}]: `)).trim() || entry.url
  const newDesc = (await ask(`描述 [${entry.description}]: `)).trim() || entry.description
  const newCat = (await ask(`分类 [${entry.category}]: `)).trim() || entry.category
  const newSub = (await ask(`子分类 [${entry.subCategory || '(无)'}]: `)).trim() || entry.subCategory || ''
  const rawTags = (await ask(`标签 (逗号分隔) [${entry.tags.join(', ')}]: `)).trim()
  const newTags = rawTags ? rawTags.split(/[,，]/).map(s => s.trim()).filter(Boolean) : entry.tags
  const newRating = (await ask(`年龄分级 [${entry.rating}] (all/r12/r15/r18): `)).trim() || entry.rating
  const authAsk = (await ask(`隐私链接? (需登录才可见) [${entry.auth ? 'Y' : 'n'}]: `)).toLowerCase()
  const isAuth = authAsk === 'y' ? true : authAsk === '' ? entry.auth : false

  const oldIsProxy = entry.url.startsWith('/api/proxy/')
  const newIsProxy = newUrl.startsWith('/api/proxy/')
  const oldProxyKey = oldIsProxy ? entry.url.replace('/api/proxy/', '') : ''
  const newProxyKey = newIsProxy ? newUrl.replace('/api/proxy/', '') : ''
  let proxyTarget = ''

  if (newIsProxy && isAuth) {
    const existingTargets = parseTargets()
    const currentTarget = existingTargets[newProxyKey] || ''
    proxyTarget = (await ask(`代理目标 URL [${currentTarget}]: `)).trim() || currentTarget
    if (!proxyTarget) {
      console.log('❌ 代理目标 URL 不能为空')
      return
    }
  } else if (newIsProxy && !isAuth) {
    console.log('⚠️  取消隐私标记后，/api/proxy/ URL 将不可用，建议改为真实 URL')
  } else if (!newIsProxy && isAuth && !oldIsProxy) {
    console.log('⚠️  隐私链接的 URL 会出现在前端 JS 中，建议使用 /api/proxy/xxx 格式')
  }

  const confirm = (await ask('\n确认更新? [Y/n] ')).toLowerCase()
  if (confirm === 'n') { console.log('已取消'); return }

  let content = readFileSync(DATA_FILE, 'utf-8')
  const escapedUrl = entry.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const urlIdx = content.indexOf(`url: '${escapedUrl}'`)
  if (urlIdx === -1) { console.log('❌ 未在文件中找到该条目'); return }
  const lineStart = content.lastIndexOf('\n', urlIdx) + 1
  const lineEnd = content.indexOf('\n', lineStart)

  const newLine = `  { title: '${escape(newTitle)}', url: '${newUrl}', description: '${escape(newDesc)}', icon: '${entry.icon}', category: '${newCat}'${newSub ? `, subCategory: '${newSub}'` : ''}${newTags.length ? `, tags: [${newTags.map(t => `'${escape(t)}'`).join(', ')}]` : ''}${newRating !== 'all' ? `, rating: '${newRating}'` : ''}${isAuth ? `, auth: true` : ''} }`

  content = content.slice(0, lineStart) + newLine + content.slice(lineEnd)
  writeFileSync(DATA_FILE, content, 'utf-8')
  console.log('✅ 已更新')

  // Update proxy TARGETS
  if (oldProxyKey && oldProxyKey !== newProxyKey) removeTargetEntry(oldProxyKey)
  if (proxyTarget) writeTargetEntry(newProxyKey, proxyTarget)
  if (newIsProxy && isAuth && newProxyKey && !proxyTarget && !oldProxyKey) {
    // URL is proxy but user didn't provide target - ask now
    const lateTarget = (await ask('代理目标 URL: ')).trim()
    if (lateTarget) writeTargetEntry(newProxyKey, lateTarget)
  }
}

// ── link delete ──
async function linkDelete(keyword) {
  if (!keyword) { console.log('用法: node scripts/add-link.mjs link delete <关键词>'); return }

  const entries = parseEntries()
  const q = keyword.toLowerCase()
  const results = entries.map((e, i) => ({ ...e, idx: i })).filter(e =>
    e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) ||
    e.url.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q))
  )

  if (!results.length) { console.log(`🔍 未找到匹配 "${keyword}"`); return }

  console.log(`\n🔍 找到 ${results.length} 个匹配:\n`)
  results.forEach((r, i) => {
    console.log(`  ${i + 1}) ${r.title}  —  ${r.url}`)
  })

  const pick = parseInt((await ask('\n选择编号: ')).trim())
  if (isNaN(pick) || pick < 1 || pick > results.length) { console.log('❌ 无效'); return }

  const entry = results[pick - 1]
  const confirm = (await ask(`\n确认删除 "${entry.title}"? [y/N] `)).toLowerCase()
  if (confirm !== 'y') { console.log('已取消'); return }

  let content = readFileSync(DATA_FILE, 'utf-8')
  const escapedUrl = entry.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const urlIdx = content.indexOf(`url: '${escapedUrl}'`)
  if (urlIdx === -1) { console.log('❌ 未在文件中找到'); return }
  const lineStart = content.lastIndexOf('\n', urlIdx) + 1
  const lineEnd = content.indexOf('\n', lineStart)

  content = content.slice(0, lineStart) + content.slice(lineEnd + 1)
  writeFileSync(DATA_FILE, content, 'utf-8')
  console.log('✅ 已删除')

  const proxyKey = entry.url.startsWith('/api/proxy/') ? entry.url.replace('/api/proxy/', '') : ''
  if (proxyKey) {
    const removed = removeTargetEntry(proxyKey)
    if (removed) console.log('✅ 已清除代理映射')
  }
}

// ── link check ──
async function linkCheck() {
  const entries = parseEntries()
  if (!entries.length) { console.log('暂无链接'); return }

  console.log(`\n🔍 正在检查 ${entries.length} 个链接...\n`)

  // Duplicates
  const urlMap = {}
  for (const e of entries) {
    const norm = e.url.replace(/\/+$/, '').toLowerCase()
    if (!urlMap[norm]) urlMap[norm] = []
    urlMap[norm].push(e)
  }

  let dupCount = 0
  for (const [url, items] of Object.entries(urlMap)) {
    if (items.length > 1) {
      dupCount++
      console.log(`⚠️  重复: ${url}`)
      items.forEach(item => console.log(`  ├ ${item.title} (${item.category})`))
      console.log()
    }
  }

  if (!dupCount) console.log('✅ 无重复链接\n')

  // HTTP check
  const doCheck = (await ask('检查链接是否有效? (可能较慢) [y/N] ')).toLowerCase()
  if (doCheck !== 'y') return

  let ok = 0, fail = 0
  for (const e of entries) {
    process.stdout.write(`  ${e.title}... `)
    try {
      const res = await fetch(e.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
      if (res.ok) { ok++; console.log('✅') }
      else { fail++; console.log(`❌ HTTP ${res.status}`) }
    } catch {
      fail++; console.log('❌ 无法访问')
    }
  }
  console.log(`\n📊 结果: ${ok} 有效, ${fail} 失效`)
}

// ── link move ──
async function linkMove(oldCat, newCat) {
  if (!oldCat || !newCat) { console.log('用法: node scripts/add-link.mjs link move <旧分类> <新分类>'); return }

  const entries = parseEntries()
  const affected = entries.filter(e => e.category === oldCat)
  if (!affected.length) { console.log(`⚠️  分类 "${oldCat}" 下没有链接`); return }

  const confirm = (await ask(`确认将 ${affected.length} 个链接从 "${oldCat}" 转移到 "${newCat}"? [y/N] `)).toLowerCase()
  if (confirm !== 'y') { console.log('已取消'); return }

  let content = readFileSync(DATA_FILE, 'utf-8')
  const replaced = content.replace(
    new RegExp(`(category:\\s*')${oldCat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(')`, 'g'),
    `$1${newCat}$2`
  )
  if (replaced === content) { console.log('⚠️  没有找到可替换的条目'); return }

  writeFileSync(DATA_FILE, replaced, 'utf-8')
  console.log(`✅ 已将 ${affected.length} 个链接移到 "${newCat}"`)
}

// ── Category management ──
function buildCatEntry(id, label, icon, children) {
  let line = `  { id: '${id}', label: '${label}', icon: '${icon}'`
  if (children.length) {
    line += `, children: [\n`
    for (const sub of children) line += `    { id: '${sub.id}', label: '${sub.label}' },\n`
    line += `  ]},\n`
  } else {
    line += ' },\n'
  }
  return line
}

async function manageChildren(existing, id) {
  let children = [...existing]
  let done = false
  while (!done) {
    console.log(`\n📂 子分类 (${children.length}):`)
    if (children.length) {
      children.forEach((c, i) => console.log(`  ${i + 1}) ${c.label} (${c.id})`))
    } else {
      console.log('  (无)')
    }

    const op = (await ask('\n操作 [a]添加 [e]编辑 [d]删除 [enter]完成: ')).toLowerCase()
    if (op === 'a') {
      const subId = (await ask(`子分类 ID [${id}-${children.length + 1}]: `)).trim() || `${id}-${children.length + 1}`
      if (children.some(c => c.id === subId)) { console.log('❌ 已存在'); continue }
      const subLabel = (await ask('子分类名称: ')).trim() || subId
      children.push({ id: subId, label: subLabel })
      console.log('✅ 已添加')
    } else if (op === 'e') {
      if (!children.length) { console.log('暂无子分类'); continue }
      const idx = parseInt((await ask('选择编号: ')).trim()) - 1
      if (isNaN(idx) || idx < 0 || idx >= children.length) { console.log('❌ 无效'); continue }
      const newLabel = (await ask(`新名称 [${children[idx].label}]: `)).trim() || children[idx].label
      children[idx].label = newLabel
      console.log('✅ 已更新')
    } else if (op === 'd') {
      if (!children.length) { console.log('暂无子分类'); continue }
      const idx = parseInt((await ask('选择编号: ')).trim()) - 1
      if (isNaN(idx) || idx < 0 || idx >= children.length) { console.log('❌ 无效'); continue }
      const confirm = (await ask(`确认删除 "${children[idx].label}"? [y/N] `)).toLowerCase()
      if (confirm === 'y') { children.splice(idx, 1); console.log('✅ 已删除') }
    } else {
      done = true
    }
  }
  return children
}

function findCatEntryBounds(content, id) {
  const idx = content.indexOf(`id: '${id}'`)
  if (idx === -1) return null
  const before = content.slice(0, idx)
  const start = before.lastIndexOf('\n') + 1
  let depth = 0, i = idx
  for (; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) { i++; while (content[i] === ',') i++; break }
    }
  }
  return { start, end: i }
}

function categoryList() {
  const cats = parseCategories()
  if (!cats.length) { console.log('暂无分类'); return }
  console.log(`\n📂 共 ${cats.length} 个分类\n`)
  for (const c of cats) {
    if (c.id === 'all') continue
    if (c.children.length) {
      console.log(`${c.icon} ${c.label} (${c.id})`)
      for (const sub of c.children) {
        console.log(`  ├ ${sub.label} (${sub.id})`)
      }
    } else {
      console.log(`${c.icon} ${c.label} (${c.id})`)
    }
  }
  console.log()
}

async function categoryAdd() {
  console.log()
  const id = (await ask('分类 ID: ')).trim()
  if (!id) { console.log('已取消'); return }

  const cats = parseCategories()
  if (cats.some(c => c.id === id)) { console.log(`❌ 分类 "${id}" 已存在`); return }

  const label = (await ask('分类名称: ')).trim() || id
  const icon = await pickEmoji(label)
  const hasChildren = (await ask('是否有子分类? [y/N] ')).toLowerCase() === 'y'

  let children = []
  if (hasChildren) {
    let addMore = true
    while (addMore) {
      const subId = (await ask(`子分类 ID [${id}-${children.length + 1}]: `)).trim() || `${id}-${children.length + 1}`
      const subLabel = (await ask('子分类名称: ')).trim() || subId
      children.push({ id: subId, label: subLabel })
      const cont = (await ask('继续添加子分类? [Y/n] ')).toLowerCase()
      if (cont === 'n') addMore = false
    }
  }

  console.log('\n确认添加:')
  console.log(`  ${icon} ${label} (${id})`)
  for (const sub of children) {
    console.log(`  ├ ${sub.label} (${sub.id})`)
  }

  const confirm = (await ask('\n确认? [Y/n] ')).toLowerCase()
  if (confirm === 'n') { console.log('已取消'); return }

  let line = buildCatEntry(id, label, icon, children)

  let content = readFileSync(CAT_FILE, 'utf-8')
  const markerIdx = content.indexOf(CAT_MARKER)
  if (markerIdx === -1) { console.log('❌ 标记未找到'); return }
  content = content.slice(0, markerIdx).replace(/\s*$/, '') + '\n' + line + content.slice(markerIdx)
  writeFileSync(CAT_FILE, content, 'utf-8')
  console.log('✅ 已追加')
}

async function categoryEdit() {
  const id = (await ask('要编辑的分类 ID: ')).trim()
  if (!id) { console.log('已取消'); return }

  const cats = parseCategories()
  const cat = cats.find(c => c.id === id)
  if (!cat) { console.log(`❌ 分类 "${id}" 不存在`); return }

  console.log(`\n当前: ${cat.icon} ${cat.label} (${cat.id})`)
  const newLabel = (await ask(`名称 [${cat.label}]: `)).trim() || cat.label
  const newIcon = await pickEmoji(newLabel)

  const newChildren = await manageChildren(cat.children, id)

  const confirm = (await ask('\n确认更新? [Y/n] ')).toLowerCase()
  if (confirm === 'n') { console.log('已取消'); return }

  let content = readFileSync(CAT_FILE, 'utf-8')
  const bounds = findCatEntryBounds(content, id)
  if (!bounds) { console.log('❌ 未在文件中找到该分类'); return }

  const newEntry = buildCatEntry(id, newLabel, newIcon, newChildren)
  content = content.slice(0, bounds.start) + newEntry + content.slice(bounds.end)
  writeFileSync(CAT_FILE, content, 'utf-8')
  console.log('✅ 已更新')
}

async function categoryDelete() {
  const id = (await ask('要删除的分类 ID: ')).trim()
  if (!id || id === 'all') { console.log('❌ 不能删除 "all"'); return }

  const cats = parseCategories()
  const cat = cats.find(c => c.id === id)
  if (!cat) { console.log(`❌ 分类 "${id}" 不存在`); return }

  const entries = parseEntries()
  const linked = entries.filter(e => e.category === id)

  console.log(`\n${cat.icon} ${cat.label} (${cat.id})`)
  if (linked.length) {
    console.log(`⚠️  该分类下有 ${linked.length} 个链接`)
    const move = (await ask('转移这些链接到其他分类? [Y/n] ')).toLowerCase()
    if (move !== 'n') {
      const others = cats.filter(c => c.id !== 'all' && c.id !== id).map(c => `  ${c.icon} ${c.label} (${c.id})`).join('\n')
      console.log(`\n可用分类:\n${others}`)
      const target = (await ask('\n目标分类 ID: ')).trim()
      if (!target || !cats.some(c => c.id === target)) {
        console.log('❌ 无效分类，链接将被保留但分类不存在')
      } else {
        let content = readFileSync(DATA_FILE, 'utf-8')
        content = content.replace(
          new RegExp(`(category:\\s*')${id}(')`, 'g'),
          `$1${target}$2`
        )
        writeFileSync(DATA_FILE, content, 'utf-8')
        console.log(`✅ 链接已转移到 ${target}`)
      }
    }
  }

  const confirm = (await ask(`\n确认删除分类 "${cat.label}"? [y/N] `)).toLowerCase()
  if (confirm !== 'y') { console.log('已取消'); return }

  let content = readFileSync(CAT_FILE, 'utf-8')
  // Remove the entry - find from `  { id: '${id}'` to `},\n` or `]},\n`
  const searchStr = `id: '${id}'`
  const idx = content.indexOf(searchStr)
  if (idx === -1) { console.log('❌ 未在文件中找到'); return }

  const before = content.slice(0, idx)
  const lineStart = before.lastIndexOf('\n') + 1

  // Find the end of this entry (could be `},\n` or `]},\n`)
  let endOffset = idx
  let depth = 0
  let foundEnd = false
  for (let i = idx; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) { endOffset = content.indexOf('\n', i) + 1; foundEnd = true; break }
    }
  }

  if (!foundEnd) { console.log('❌ 解析失败'); return }

  content = content.slice(0, lineStart) + content.slice(endOffset)
  writeFileSync(CAT_FILE, content, 'utf-8')
  console.log('✅ 已删除')
}

// ── CLI ──
function showHelp() {
  console.log(`
Neko Nav 数据管理脚本
======================

📌 添加链接（默认模式）
  node scripts/add-link.mjs
  → 交互式输入 URL，自动抓取标题/描述/图标，智能分类 + 标签建议

📋 查看所有链接
  node scripts/add-link.mjs list

🔍 搜索链接
  node scripts/add-link.mjs search <关键词>

📂 分类管理（最多二级，不支持嵌套）
  node scripts/add-link.mjs category list        # 查看所有分类及子分类
  node scripts/add-link.mjs category add         # 添加分类（可带子分类）
  node scripts/add-link.mjs category edit <id>   # 编辑名称/图标/子分类
  node scripts/add-link.mjs category delete <id> # 删除分类（可转移链接到其他分类）

🔗 链接管理
  node scripts/add-link.mjs link edit <关键词>    # 搜索并编辑链接（标题/URL/描述/分类/标签）
  node scripts/add-link.mjs link delete <关键词>  # 搜索并删除链接
  node scripts/add-link.mjs link move <旧分类> <新分类> # 批量移动链接到其他分类
  node scripts/add-link.mjs link check            # 检查重复链接及有效性

示例:
  node scripts/add-link.mjs                                            # 添加链接
  node scripts/add-link.mjs category add                                # 添加分类
  node scripts/add-link.mjs category edit anime                        # 编辑分类
  node scripts/add-link.mjs category delete old-cat                    # 删除分类
  node scripts/add-link.mjs list                                       # 列出链接
  node scripts/add-link.mjs search steam                               # 搜索链接
  node scripts/add-link.mjs link edit bilibili                         # 编辑链接
  node scripts/add-link.mjs link delete bilibili                       # 删除链接
  node scripts/add-link.mjs link move old-cat new-cat                  # 移动链接
  node scripts/add-link.mjs link check                                 # 检查链接
`)
}

const cmd = process.argv[2]
switch (cmd) {
  case 'list':
    listLinks()
    rl.close()
    break
  case 'search':
    searchLinks(process.argv[3])
    rl.close()
    break
  case 'category': {
    const sub = process.argv[3]
    if (sub === 'list') { categoryList(); rl.close() }
    else if (sub === 'add') { categoryAdd().then(() => rl.close()).catch(e => { console.error(e); rl.close() }) }
    else if (sub === 'edit') { categoryEdit().then(() => rl.close()).catch(e => { console.error(e); rl.close() }) }
    else if (sub === 'delete') { categoryDelete().then(() => rl.close()).catch(e => { console.error(e); rl.close() }) }
    else { console.log('用法: category {list|add|edit|delete}'); rl.close() }
    break
  }
  case 'link': {
    const sub = process.argv[3]
    if (sub === 'edit') { linkEdit(process.argv[4]).then(() => rl.close()).catch(e => { console.error(e); rl.close() }) }
    else if (sub === 'delete') { linkDelete(process.argv[4]).then(() => rl.close()).catch(e => { console.error(e); rl.close() }) }
    else if (sub === 'move') { linkMove(process.argv[4], process.argv[5]).then(() => rl.close()).catch(e => { console.error(e); rl.close() }) }
    else if (sub === 'check') { linkCheck().then(() => rl.close()).catch(e => { console.error(e); rl.close() }) }
    else { console.log('用法: link {edit|delete|move|check}'); rl.close() }
    break
  }
  case 'help':
  case '--help':
  case '-h':
    showHelp()
    rl.close()
    break
  default:
    interactiveAdd().catch(e => { console.error(e); process.exit(1) })
    break
}
