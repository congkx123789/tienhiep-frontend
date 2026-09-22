// Webview Injected Script Module for Tiên Hiệp Browser Reader
// Handles in-page text extraction, translation nodes observation, multi-strategy Next/Prev navigation, and Teach Next Mode.

export function createTranslateScript(useTypewriter = false) {
  return `(() => {
    if (!window.__translatorInitialized) {
      window.__translatorInitialized = true;
      window.__autoTranslateEnabled = false;
      window.isTtsPlaying = false;
      
      window.__TienHiepHelpers = {
          extractCleanChapterText: () => {
              const SELECTORS = {
                  "qidian.com": ".read-content, #read-content",
                  "fanqie.com": ".muye-reader-content-novel",
                  "truyenfull.vn": "#chapter-c, .chapter-c",
                  "tangthuvien.vn": ".box-chap, #chapter-content",
                  "metruyenchu.com.vn": "#chapter-detail",
                  "hjwzw.com": "#content, .content",
                  "tw.hjwzw.com": "#content, .content",
                  "uukanshu.com": "#contentbox",
                  "69shuba.com": ".txtnav",
                  "biquge": ".showtxt, #content"
              };

              const host = window.location.hostname;
              let mainEl = null;

              for (const [domain, selector] of Object.entries(SELECTORS)) {
                  if (host.includes(domain)) {
                      const els = selector.split(",").map(s => s.trim());
                      for (const sel of els) {
                          mainEl = document.querySelector(sel);
                          if (mainEl) break;
                      }
                  }
                  if (mainEl) break;
              }

              if (!mainEl) {
                  let bestEl = null;
                  let bestScore = -1;
                  
                  document.querySelectorAll("div, article, section").forEach(el => {
                      const text = el.innerText || "";
                      const textLength = text.trim().length;
                      if (textLength < 400) return;

                      let linkTextLength = 0;
                      el.querySelectorAll("a").forEach(a => linkTextLength += (a.innerText || "").length);

                      const linkDensity = linkTextLength / (textLength || 1);
                      if (linkDensity > 0.12) return;

                      const pCount = el.querySelectorAll("p").length;
                      const brCount = el.querySelectorAll("br").length;
                      const score = textLength * (1 - linkDensity) * (pCount + (brCount / 2) + 1);
                      if (score > bestScore) {
                          bestScore = score;
                          bestEl = el;
                      }
                  });
                  mainEl = bestEl || document.body;
              }

              let chapterTitle = "Chương đọc";
              const headingCandidates = Array.from(document.querySelectorAll("h1, h2, h3, .chapter-title, .title, .title1, .nr_title, #nr_title, .readTitle, [class*='title'], [id*='title']"));
              
              // Ưu tiên 1: Thẻ tiêu đề chứa chữ "Chương" tiếng Việt
              const viHeading = headingCandidates.find(el => {
                  const txt = (el.textContent || "").trim();
                  return /Chương\s*\d+/i.test(txt) || /Chapter\s*\d+/i.test(txt);
              });

              // Ưu tiên 2: Thẻ h1 hoặc .title1 hiển thị trên trang
              const h1Heading = headingCandidates.find(el => {
                  const isH1OrMain = el.tagName === 'H1' || el.classList.contains('title1');
                  const txt = (el.textContent || "").trim();
                  return isH1OrMain && txt.length > 0 && txt.length < 150;
              });

              // Ưu tiên 3: Thẻ tiêu đề chứa chữ "第...章"
              const zhHeading = headingCandidates.find(el => {
                  const txt = (el.textContent || "").trim();
                  return /第\s*\d+\s*[章節页]/.test(txt);
              });

              const heading = viHeading || h1Heading || zhHeading;
              if (heading) {
                  chapterTitle = heading.textContent.trim();
              } else {
                  const viDocMatch = document.title.match(/(Chương\s*\d+[^\-_|]*)/i) || document.title.match(/(Chapter\s*\d+[^\-_|]*)/i);
                  if (viDocMatch) {
                      chapterTitle = viDocMatch[1].trim();
                  } else {
                      const zhDocMatch = document.title.match(/(第\s*\d+\s*[章節页][^\-_|]*)/);
                      if (zhDocMatch) {
                          chapterTitle = zhDocMatch[1].trim();
                      }
                  }
              }

              const clone = mainEl.cloneNode(true);
              clone.querySelectorAll('script, style, iframe, button, a, .ads, .advertisement, .comment, .social-share, .footer, .header, [id*="google_ads"]').forEach(el => el.remove());

              let paragraphs = [];
              const isNav = /^(chương trước|chương sau|trở lại|danh sách|mục lục|trang trước|trang sau|上一章|下一章|回目录)$/i;
              const hasWord = /[a-zA-Z0-9\u4e00-\u9fa5\u00C0-\u1EF9]/;

              const pTags = clone.querySelectorAll("p");
              if (pTags.length > 5) {
                  pTags.forEach(p => {
                      const txt = p.innerText.trim();
                      if (txt && hasWord.test(txt) && !isNav.test(txt)) paragraphs.push(txt);
                  });
              } else {
                  (clone.innerText || "").split(new RegExp("\\n+")).forEach(line => {
                      const txt = line.trim();
                      if (txt && hasWord.test(txt) && !isNav.test(txt)) paragraphs.push(txt);
                  });
              }

              // Kiểm tra tính nhất quán ngôn ngữ giữa tiêu đề và nội dung
              const contentHasVietnamese = paragraphs.some(p => /[a-zA-Z0-9\u00C0-\u1EF9]/.test(p) && !/[\u4e00-\u9fa5]/.test(p));
              const titleIsChinese = /[\u4e00-\u9fa5]/.test(chapterTitle);

              // Nếu nội dung đã dịch sang tiếng Việt nhưng tiêu đề vẫn còn tiếng Trung (do document.title)
              if (contentHasVietnamese && titleIsChinese) {
                  // Cố gắng tìm lại từ candidate không chứa chữ Hán
                  const pureViCandidate = headingCandidates.find(el => {
                      const txt = (el.textContent || "").trim();
                      return txt.length > 2 && txt.length < 100 && !/[\u4e00-\u9fa5]/.test(txt) && (/Chương/i.test(txt) || /Chapter/i.test(txt) || el.tagName === 'H1' || el.classList.contains('title1'));
                  });
                  if (pureViCandidate) {
                      chapterTitle = pureViCandidate.textContent.trim();
                  } else {
                      chapterTitle = "Chương đọc";
                  }
              }

              if (chapterTitle === "Chương đọc" || !chapterTitle) {
                  const docT = (document.title || "").trim();
                  if (docT && !contentHasVietnamese) {
                      chapterTitle = docT.split(/[-_|_]/)[0].trim() || docT;
                  }
              }

              return { title: chapterTitle, text: paragraphs.join("\\n\\n") };
          },
          
          getNovelKeys: () => {
              const host = window.location.hostname;
              const path = window.location.pathname;
              const parts = path.split('/').filter(Boolean);
              let novelKey = host;

              if (parts.length > 1) {
                  const lastPart = parts[parts.length - 1];
                  if (lastPart.includes('.') || /^\\d+$/.test(lastPart)) {
                      novelKey = host + '/' + parts.slice(0, parts.length - 1).join('/');
                  } else {
                      novelKey = host + '/' + parts.join('/');
                  }
              } else if (parts.length === 1) {
                  const onlyPart = parts[0];
                  if (!onlyPart.includes('.') && !/^\\d+$/.test(onlyPart)) {
                      novelKey = host + '/' + onlyPart;
                  }
              }
              return { host, novelKey, pathname: path, url: window.location.href };
          },

          getSavedNextRules: () => {
              try {
                  const allData = JSON.parse(localStorage.getItem('__tienhiep_novel_next_rules') || '{}');
                  const { host, novelKey } = window.__TienHiepHelpers.getNovelKeys();
                  let list = allData[novelKey] || allData[host] || [];
                  if (!Array.isArray(list)) {
                      list = list ? [list] : [];
                  }
                  // Sắp xếp ưu tiên từ MỚI NHẤT đến CŨ NHẤT
                  return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
              } catch (e) {
                  return [];
              }
          },

          getSavedNextRule: () => {
              const list = window.__TienHiepHelpers.getSavedNextRules();
              return list.length > 0 ? list[0] : null;
          },

          saveNextRule: (ruleData) => {
              try {
                  const allData = JSON.parse(localStorage.getItem('__tienhiep_novel_next_rules') || '{}');
                  const { host, novelKey } = window.__TienHiepHelpers.getNovelKeys();
                  let list = allData[novelKey] || allData[host] || [];
                  if (!Array.isArray(list)) list = list ? [list] : [];

                  const newRule = {
                      id: ruleData.id || ('rule_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
                      selector: (ruleData.selector || '').trim(),
                      customUrl: (ruleData.customUrl || '').trim(),
                      selectors: Array.isArray(ruleData.selectors) && ruleData.selectors.length > 0 ? ruleData.selectors : (ruleData.selector ? [ruleData.selector.trim()] : []),
                      containerSelector: ruleData.containerSelector || '',
                      childIndex: ruleData.childIndex,
                      text: (ruleData.text || '').trim(),
                      urlPattern: ruleData.urlPattern || null,
                      pattern: ruleData.pattern || (ruleData.customUrl ? 'direct_url' : 'smart_teach'),
                      title: ruleData.title || (ruleData.selector ? ('Selector: ' + ruleData.selector) : (ruleData.customUrl ? ('URL: ' + ruleData.customUrl) : 'Quy tắc tự học')),
                      updatedAt: Date.now()
                  };

                  // Lọc bỏ các rule trùng lặp cũ nếu trùng cả selector hoặc trùng customUrl
                  list = list.filter(r => {
                      if (newRule.selector && r.selector && r.selector === newRule.selector) return false;
                      if (newRule.customUrl && r.customUrl && r.customUrl === newRule.customUrl) return false;
                      if (r.id === newRule.id) return false;
                      return true;
                  });

                  // Ưu tiên mới nhất: đẩy lên đầu mảng
                  list.unshift(newRule);
                  if (list.length > 20) list = list.slice(0, 20);

                  allData[novelKey] = list;
                  allData[host] = list;
                  localStorage.setItem('__tienhiep_novel_next_rules', JSON.stringify(allData));

                  if (newRule.selector) localStorage.setItem('__tienhiep_custom_next_selector', newRule.selector);
                  if (newRule.text) localStorage.setItem('__tienhiep_custom_next_text', newRule.text);
                  return { success: true, rule: newRule, history: list };
              } catch (e) {
                  return { success: false };
              }
          },

          selectNextRule: (ruleId) => {
              try {
                  const allData = JSON.parse(localStorage.getItem('__tienhiep_novel_next_rules') || '{}');
                  const { host, novelKey } = window.__TienHiepHelpers.getNovelKeys();
                  let list = allData[novelKey] || allData[host] || [];
                  if (!Array.isArray(list)) list = list ? [list] : [];

                  const targetRule = list.find(r => r.id === ruleId);
                  if (targetRule) {
                      targetRule.updatedAt = Date.now();
                      list = [targetRule, ...list.filter(r => r.id !== ruleId)];
                      allData[novelKey] = list;
                      allData[host] = list;
                      localStorage.setItem('__tienhiep_novel_next_rules', JSON.stringify(allData));
                      return { success: true, activeRule: targetRule, history: list };
                  }
                  return { success: false };
              } catch (e) {
                  return { success: false };
              }
          },

          deleteNextRule: (ruleId = null) => {
              try {
                  const allData = JSON.parse(localStorage.getItem('__tienhiep_novel_next_rules') || '{}');
                  const { host, novelKey } = window.__TienHiepHelpers.getNovelKeys();
                  let list = allData[novelKey] || allData[host] || [];
                  if (!Array.isArray(list)) list = list ? [list] : [];

                  if (ruleId) {
                      list = list.filter(r => r.id !== ruleId);
                      allData[novelKey] = list;
                      allData[host] = list;
                  } else {
                      // Xóa sạch toàn bộ rule của truyện & host này
                      delete allData[novelKey];
                      delete allData[host];
                      list = [];
                  }

                  localStorage.setItem('__tienhiep_novel_next_rules', JSON.stringify(allData));
                  if (list.length === 0) {
                      localStorage.removeItem('__tienhiep_custom_next_selector');
                      localStorage.removeItem('__tienhiep_custom_next_text');
                  }
                  return { success: true, history: list };
              } catch (e) {
                  return { success: false };
              }
          },

          clearAllNextRules: () => {
              return window.__TienHiepHelpers.deleteNextRule(null);
          },

          findNextTarget: () => {
              const currentHref = window.location.href;
              const currentPath = window.location.pathname;

              // Danh sách từ khóa cấm tuyệt đối (không bao giờ được là nút Next)
              const negativeTextRegex = /^(目录|回目录|返回目录|目录页|首页|返回首页|书页|书目|书架|加入书签|书签|上一章|上一页|上一頁|上页|上頁|chương trước|trang trước|hồi trước|mục lục|danh sách|trang chủ|tủ sách|dấu trang)$/i;
              const negativeTextContainsRegex = /(回目录|返回目录|目录|首页|书架|书签|上一章|上一页|上一頁|chương trước|mục lục|trang chủ)/i;

              const isNegativeUrl = (urlStr) => {
                  if (!urlStr) return true;
                  const lower = urlStr.toLowerCase();
                  if (lower.startsWith('javascript:') || lower.startsWith('mailto:') || lower.startsWith('tel:')) return true;
                  if (lower.includes('/catalog') || lower.includes('/index') || lower.includes('/dir') || lower.includes('/menu') || lower.includes('/chapterlist') || lower.includes('/list')) return true;
                  if (lower.includes('/login') || lower.includes('/register') || lower.includes('/comment') || lower.includes('/vote') || lower.includes('/user')) return true;
                  return false;
              };

              const isValidNextLink = (targetHref, candidateEl = null) => {
                  if (!targetHref) return false;
                  try {
                      const resolved = new URL(targetHref, window.location.origin);
                      if (resolved.protocol === 'javascript:') return false;
                      if (resolved.href === currentHref) return false;
                      if (resolved.origin === window.location.origin && resolved.pathname === currentPath && resolved.search === window.location.search) return false;
                      
                      // Kiểm tra URL có phải là trang mục lục / trang chủ không
                      if (isNegativeUrl(resolved.pathname) || isNegativeUrl(resolved.href)) return false;

                      // Nếu link trỏ về đúng thư mục gốc truyện (VD: /book/32053/ hoặc /book/32053) -> đó là mục lục truyện, KHÔNG PHẢI chương tiếp theo
                      const pathTrimmed = resolved.pathname.replace(new RegExp('/+$'), '');
                      const currentPathTrimmed = currentPath.replace(new RegExp('/+$'), '');
                      if (currentPathTrimmed.startsWith(pathTrimmed) && currentPathTrimmed.length > pathTrimmed.length) {
                          // candidate URL là thư mục cha hoặc gốc truyện của trang đọc hiện tại
                          return false;
                      }

                      // Nếu có phần tử, kiểm tra text của nó
                      if (candidateEl) {
                          const txt = (candidateEl.textContent || "").trim();
                          if (negativeTextRegex.test(txt) || negativeTextContainsRegex.test(txt)) {
                              return false;
                          }
                      }

                      return resolved.href;
                  } catch (e) {
                      return false;
                  }
              };

              const resolveTargetEl = (el, sourceDesc) => {
                  if (!el) return null;
                  const txt = (el.textContent || "").trim();
                  if (negativeTextRegex.test(txt) || negativeTextContainsRegex.test(txt)) {
                      return null; // Bỏ qua ngay lập tức các nút mục lục, trang chủ, chương trước
                  }

                  const a = el.tagName === 'A' ? el : (el.closest('a') || el.querySelector('a'));
                  if (a) {
                      const aTxt = (a.textContent || "").trim();
                      if (negativeTextRegex.test(aTxt) || negativeTextContainsRegex.test(aTxt)) {
                          return null;
                      }
                      const validHref = isValidNextLink(a.href, a);
                      if (validHref) {
                          return { type: 'element', el: a, source: sourceDesc };
                      }
                  } else if (el) {
                      return { type: 'element', el: el, source: sourceDesc };
                  }
                  return null;
              };

              const chapterNumRegex = new RegExp('(\\\\d+)(?:\\\\.html|\\\\.htm|/)?(?:\\\\?.*)?$');

              // 1. Duyệt danh sách các quy tắc đã lưu của trang web (Ưu tiên từ MỚI NHẤT đến CŨ NHẤT)
              const savedRules = window.__TienHiepHelpers.getSavedNextRules();
              for (const savedRule of savedRules) {
                  // 1.1 Khớp URL trực tiếp (direct_url)
                  if (savedRule.customUrl) {
                      const validHref = isValidNextLink(savedRule.customUrl);
                      if (validHref) {
                          return { type: 'url', url: validHref, source: 'Quy tắc URL trực tiếp (' + savedRule.customUrl + ')' };
                      }
                  }

                  // 1.2 Khớp bằng Selector đã lưu chính xác
                  const selectorsToTry = [];
                  if (Array.isArray(savedRule.selectors)) {
                      selectorsToTry.push(...savedRule.selectors);
                  }
                  if (savedRule.selector && !selectorsToTry.includes(savedRule.selector)) {
                      selectorsToTry.unshift(savedRule.selector);
                  }

                  for (const sel of selectorsToTry) {
                      try {
                          if (sel === 'a' || sel === 'button') continue;
                          const foundEls = Array.from(document.querySelectorAll(sel));
                          for (const el of foundEls) {
                              const resolved = resolveTargetEl(el, 'Quy tắc chỉ định (' + sel + ')');
                              if (resolved) return resolved;
                          }
                      } catch (e) {}
                  }

                  // 1.3 Khớp bằng vị trí chính xác trong container đã chỉ định
                  if (savedRule.containerSelector) {
                      try {
                          const container = document.querySelector(savedRule.containerSelector);
                          if (container) {
                              const links = Array.from(container.querySelectorAll('a, button')).filter(el => {
                                  const txt = (el.textContent || "").trim();
                                  return !negativeTextRegex.test(txt) && !negativeTextContainsRegex.test(txt);
                              });
                              if (savedRule.childIndex !== undefined && links[savedRule.childIndex]) {
                                  const candidate = links[savedRule.childIndex];
                                  const resolved = resolveTargetEl(candidate, 'Chỉ định: đúng vị trí trong cụm');
                                  if (resolved) return resolved;
                              }
                          }
                      } catch (e) {}
                  }

                  // 1.4 Khớp bằng chữ đã chỉ định
                  if (savedRule.text && !negativeTextContainsRegex.test(savedRule.text)) {
                      const targetTxt = savedRule.text.trim().toLowerCase();
                      const allCandidates = Array.from(document.querySelectorAll("a, button, [role='button']"));
                      for (const el of allCandidates) {
                          const t = (el.textContent || "").trim().toLowerCase();
                          if (t && (t === targetTxt || t.includes(targetTxt))) {
                              const resolved = resolveTargetEl(el, 'Chữ nút đã chỉ định: ' + savedRule.text);
                              if (resolved) return resolved;
                          }
                      }
                  }
              }

              // 2. Tự động tăng số chương (+1) trên URL hiện tại (ĐỘ CHÍNH XÁC CAO NHẤT KHI ĐỌC TRUYỆN LIÊN TỤC)
              try {
                  const numMatch = currentHref.match(chapterNumRegex);
                  if (numMatch) {
                      const currentNum = parseInt(numMatch[1], 10);
                      const nextNum = currentNum + 1;
                      const allLinks = Array.from(document.querySelectorAll("a[href]"));
                      
                      for (const a of allLinks) {
                          const validHref = isValidNextLink(a.href, a);
                          if (!validHref) continue;
                          const targetMatch = validHref.match(chapterNumRegex);
                          if (targetMatch && parseInt(targetMatch[1], 10) === nextNum) {
                              return { type: 'element', el: a, source: 'Tự động link URL (+1)' };
                          }
                      }
                  }
              } catch (e) {}

              // 3. Khớp từ khóa chương sau chính xác (100% Text Match)
              const regexExact = /^\s*(下一章|下一页|下一頁|下页|下頁|chương sau|tiếp theo|hồi sau|trang sau|next chapter|next page|sau)\s*$/i;
              const textCandidates = Array.from(document.querySelectorAll("a[href], button, [role='button'], a"));
              for (const el of textCandidates) {
                  const txt = (el.textContent || "").trim();
                  if (regexExact.test(txt)) {
                      const resolved = resolveTargetEl(el, 'Khớp chữ: ' + txt);
                      if (resolved) return resolved;
                  }
              }

              // 4. Các Selector chuẩn của các nền tảng truyện (Lọc bỏ các :last-child bừa bãi có thể trúng bookmark/mục lục)
              const commonSelectors = [
                  '#page_next a', '.page_next a', '#page_next', '.page_next',
                  'a[rel="next"]', '[rel="next"]',
                  '.next-btn', '#next-chap', '.next', '#next', '.next-chapter', '#next-chapter',
                  '[id*="next-chap"]', '[class*="next-chap"]', '[id*="next_url"]', '[class*="next_url"]',
                  '#next_url',
                  '#pb_next', '#pt_next', '#linkNext', '.linkNext', '#chapter_next',
                  'a.next', 'a.nextchapter', 'a.btn-next'
              ];
              for (const sel of commonSelectors) {
                  try {
                      const candidates = Array.from(document.querySelectorAll(sel));
                      for (const el of candidates) {
                          const resolved = resolveTargetEl(el, 'Selector chuẩn: ' + sel);
                          if (resolved) return resolved;
                      }
                  } catch (e) {}
              }

              // 5. Thẻ <a> chứa cụm từ chương sau (Loose match có chọn lọc)
              const looseKeywords = ['下一章', '下一页', '下一頁', 'chương sau', 'trang sau', 'hồi sau'];
              const looseLinks = Array.from(document.querySelectorAll("a[href]"));
              for (const a of looseLinks) {
                  const txt = (a.textContent || "").trim();
                  if (looseKeywords.some(kw => txt.includes(kw))) {
                      const resolved = resolveTargetEl(a, 'Link chứa từ khóa: ' + txt);
                      if (resolved) return resolved;
                  }
              }

              return null;
          },
          
          checkAndTriggerAutoNext: (force = true, delaySeconds = 0) => {
              if (window.isTtsPlaying && !force) return false;

              const target = window.__TienHiepHelpers.findNextTarget();

              if (target) {
                  const delay = (delaySeconds !== undefined && delaySeconds !== null) ? Number(delaySeconds) : 0;
                  if (delay <= 0) {
                      try {
                          localStorage.setItem('__tienhiep_auto_translate_active', 'true');
                          if (target.type === 'url') {
                              window.location.href = target.url;
                          } else if (target.type === 'element' && target.el) {
                              const el = target.el;
                              const anchor = el.tagName === "A" ? el : (el.closest('a') || el.querySelector('a'));
                              if (anchor && anchor.href && !anchor.href.startsWith("javascript:")) {
                                  window.location.href = anchor.href;
                              } else {
                                  el.click();
                              }
                          }
                      } catch (err) {}
                      return true;
                  }

                  const existingCountdown = document.getElementById("__next_chapter_countdown");
                  if (existingCountdown) existingCountdown.remove();

                  const tip = document.createElement("div");
                  tip.id = "__next_chapter_countdown";
                  tip.style = "position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#4f46e5,#3730a3);color:#fff;padding:10px 18px;border-radius:12px;z-index:99999;font-size:12px;font-weight:bold;box-shadow:0 8px 24px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.25);display:flex;align-items:center;gap:10px;font-family:sans-serif;";
                  
                  let remaining = delay;
                  tip.innerHTML = '<span>⏱️ Chuyển chương sau trong <b id="__next_sec" style="color:#fde047;font-size:14px;">' + remaining + '</b>s...</span><button id="__cancel_next_sec" style="background:rgba(239,68,68,0.8);border:none;color:#fff;padding:3px 8px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:bold;">Hủy</button>';
                  document.body.appendChild(tip);

                  let isCancelled = false;
                  const timer = setInterval(() => {
                      remaining--;
                      const secEl = document.getElementById("__next_sec");
                      if (secEl) secEl.innerText = remaining;
                      if (remaining <= 0) clearInterval(timer);
                  }, 1000);

                  const cancelBtn = document.getElementById("__cancel_next_sec");
                  if (cancelBtn) {
                      cancelBtn.onclick = () => {
                          isCancelled = true;
                          clearInterval(timer);
                          tip.remove();
                      };
                  }

                  setTimeout(() => {
                      clearInterval(timer);
                      if (isCancelled) return;
                      try {
                          localStorage.setItem('__tienhiep_auto_translate_active', 'true');
                          if (target.type === 'url') {
                              window.location.href = target.url;
                          } else if (target.type === 'element' && target.el) {
                              const el = target.el;
                              const anchor = el.tagName === "A" ? el : (el.closest('a') || el.querySelector('a'));
                              if (anchor && anchor.href && !anchor.href.startsWith("javascript:")) {
                                  window.location.href = anchor.href;
                              } else {
                                  el.click();
                              }
                          }
                      } catch (err) {}
                      tip.remove();
                  }, delay * 1000);
                  return true;
              } else if (force) {
                  const tip = document.createElement("div");
                  tip.style = "position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;padding:12px 18px;border-radius:10px;z-index:99999;font-size:12px;font-weight:bold;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-family:sans-serif;max-width:320px;";
                  tip.innerText = '⚠️ Không tìm thấy nút Chương Sau! Hãy dùng nút Chỉ Định Nút trên thanh công cụ để ghi nhớ nút cho truyện này.';
                  document.body.appendChild(tip);
                  setTimeout(() => tip.remove(), 4000);
                  return false;
              }
              return false;
          },

          checkAndTriggerAutoPrev: () => {
              let prevBtn = null;
              const selector = '.prev-btn, #prev-chap, .prev, #prev, .prev-chapter, #prev-chapter, [id*="prev-chap"], [class*="prev-chap"], a[rel="prev"]';
              const selectors = selector.split(",").map(s => s.trim());
              for (const sel of selectors) {
                  try {
                      const el = document.querySelector(sel);
                      if (el) {
                          prevBtn = el;
                          break;
                      }
                  } catch (e) {}
              }

              if (!prevBtn) {
                  const regex = /^\\s*(上一章|上一页|上一頁|chương trước|trang trước|hồi trước|prev chapter)\\s*$/i;
                  prevBtn = Array.from(document.querySelectorAll("a, button, span")).find(el => {
                      return regex.test((el.textContent || "").trim());
                  });
              }

              if (prevBtn) {
                  localStorage.setItem('__tienhiep_auto_translate_active', 'true');
                  const a = prevBtn.tagName === 'A' ? prevBtn : (prevBtn.closest('a') || prevBtn.querySelector('a'));
                  if (a && a.href && !a.href.startsWith("javascript:")) {
                      window.location.href = a.href;
                  } else {
                      prevBtn.click();
                  }
                  return true;
              }
              return false;
          },

          startTeachNextMode: () => {
              window.__isTeachingNext = true;
              const existingBanner = document.getElementById("__teach_next_banner");
              if (existingBanner) existingBanner.remove();
              const existingBox = document.getElementById("__teach_highlighter_box");
              if (existingBox) existingBox.remove();

              // Banner hướng dẫn dùng custom element <teach-banner> để miễn nhiễm với toàn bộ CSS reset/dark mode của trang
              const banner = document.createElement("teach-banner");
              banner.id = "__teach_next_banner";
              banner.style.cssText = "position:fixed !important;top:16px !important;left:50% !important;transform:translateX(-50%) !important;background:linear-gradient(135deg,#6366f1,#4338ca) !important;color:#ffffff !important;padding:10px 20px !important;border-radius:14px !important;z-index:2147483645 !important;font-size:13px !important;font-weight:bold !important;box-shadow:0 12px 32px rgba(0,0,0,0.6) !important;display:flex !important;align-items:center !important;gap:12px !important;border:1px solid rgba(255,255,255,0.3) !important;font-family:system-ui,sans-serif !important;cursor:default !important;";
              banner.innerHTML = '<div style="display:flex;align-items:center;gap:8px;"><span>🎯 <b>Chỉ định Nút Chương Sau:</b> Rê chuột & Click vào nút Chương Sau</span></div><div style="display:flex;gap:6px;"><button id="__reset_teach_next" style="background:rgba(255,255,255,0.2) !important;border:none !important;color:#fff !important;padding:5px 10px !important;border-radius:6px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;">Khôi phục mặc định</button><button id="__cancel_teach_next" style="background:rgba(239,68,68,0.85) !important;border:none !important;color:#fff !important;padding:5px 10px !important;border-radius:6px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;">Hủy</button></div>';
              document.body.appendChild(banner);

              // Khung highlight bôi sáng dùng custom element <teach-highlighter>
              // Không dùng <div> để không bao giờ bị dính các CSS selector div { background-color: #111118 !important } của Dark Mode!
              const highlightBox = document.createElement("teach-highlighter");
              highlightBox.id = "__teach_highlighter_box";
              // Nền mờ vàng cam xuyên thấu (translucent), viền phát sáng rực rỡ - chữ bên dưới nhìn rõ 100% ở cả chế độ sáng & tối
              highlightBox.style.cssText = "position:fixed !important;pointer-events:none !important;z-index:2147483640 !important;outline:2.5px solid #f59e0b !important;outline-offset:-1px !important;background:rgba(245,158,11,0.18) !important;box-shadow:0 0 16px rgba(245,158,11,0.65), inset 0 0 12px rgba(245,158,11,0.2) !important;border-radius:6px !important;display:none !important;box-sizing:border-box !important;will-change:top,left,width,height !important;";

              const tagBadge = document.createElement("teach-badge");
              tagBadge.id = "__teach_tag_badge";
              tagBadge.style.cssText = "position:absolute !important;bottom:100% !important;left:0 !important;margin-bottom:4px !important;background:#f59e0b !important;color:#0f172a !important;font-size:11px !important;font-weight:800 !important;padding:3px 8px !important;border-radius:4px !important;white-space:nowrap !important;box-shadow:0 2px 10px rgba(0,0,0,0.6) !important;font-family:system-ui,sans-serif !important;letter-spacing:0.3px !important;line-height:1.4 !important;z-index:2147483641 !important;";
              highlightBox.appendChild(tagBadge);
              document.body.appendChild(highlightBox);

              let currentTarget = null;
              let rafLoopId = null;

              // Loop liên tục cập nhật vị trí border theo element (kể cả khi scroll/resize)
              const startRafLoop = () => {
                  if (rafLoopId) return; // đã chạy rồi
                  const loop = () => {
                      if (!currentTarget) {
                          rafLoopId = null;
                          return;
                      }
                      const rect = currentTarget.getBoundingClientRect();
                      if (rect.width > 0 && rect.height > 0) {
                          highlightBox.style.setProperty("display", "block", "important");
                          highlightBox.style.setProperty("left", rect.left + "px", "important");
                          highlightBox.style.setProperty("top", rect.top + "px", "important");
                          highlightBox.style.setProperty("width", rect.width + "px", "important");
                          highlightBox.style.setProperty("height", rect.height + "px", "important");

                          const tagName = currentTarget.tagName.toLowerCase();
                          const idStr = currentTarget.id ? "#" + currentTarget.id : "";
                          const className = currentTarget.className;
                          const classStr = className && typeof className === "string"
                              ? "." + className.trim().split(/\s+/)[0]
                              : "";
                          const textSnippet = (currentTarget.textContent || "").trim().slice(0, 20);
                          const href = currentTarget.href || (currentTarget.querySelector ? (currentTarget.querySelector('a') || {}).href : '') || '';
                          const hrefStr = href ? ' → ' + href.split('/').slice(-2).join('/') : '';
                          tagBadge.innerText = (tagName + idStr + classStr) + (textSnippet ? ' | "' + textSnippet + '"' : '') + hrefStr + ' ✔ Click để chọn';
                      } else {
                          highlightBox.style.setProperty("display", "none", "important");
                      }
                      rafLoopId = requestAnimationFrame(loop);
                  };
                  rafLoopId = requestAnimationFrame(loop);
              };

              const stopRafLoop = () => {
                  if (rafLoopId) {
                      cancelAnimationFrame(rafLoopId);
                      rafLoopId = null;
                  }
              };

              const onMouseMove = (e) => {
                  if (banner.contains(e.target)) {
                      currentTarget = null;
                      highlightBox.style.setProperty("display", "none", "important");
                      stopRafLoop();
                      return;
                  }

                  // Ưu tiên element gần nhất là a/button, fallback về chính e.target
                  const target = e.target.closest('a, button, [role="button"], [onclick], [id*="next"], [class*="next"]') || e.target;
                  if (!target || target === document.body || target === document.documentElement) {
                      currentTarget = null;
                      highlightBox.style.setProperty("display", "none", "important");
                      return;
                  }

                  // Nếu không phải là nút bấm/link mà là vùng chứa truyện khổng lồ (> 70% màn hình), không bôi đen cả trang
                  const rect = target.getBoundingClientRect();
                  const isInteractive = target.closest('a, button, [role="button"], [onclick], [id*="next"], [class*="next"]');
                  if (!isInteractive && (rect.width >= window.innerWidth * 0.75 && rect.height >= window.innerHeight * 0.5)) {
                      currentTarget = null;
                      highlightBox.style.setProperty("display", "none", "important");
                      return;
                  }

                  if (currentTarget !== target) {
                      currentTarget = target;
                      startRafLoop(); // loop bám theo element mới liên tục
                  }
              };

              const generateSmartRule = (target) => {
                  const anchor = target.tagName === 'A' ? target : (target.closest('a') || target.querySelector('a') || target);
                  const selectors = [];
                  let containerSelector = '';
                  let childIndex = undefined;

                  const rawHref = (anchor && anchor.getAttribute) ? anchor.getAttribute('href') : '';
                  const fullHref = anchor ? (anchor.href || '') : '';
                  const text = (target.textContent || (anchor ? anchor.textContent : '') || '').trim();

                  // Tạo mẫu URL (Path Pattern) nếu có href hợp lệ
                  let urlPattern = null;
                  if (rawHref && !rawHref.startsWith('javascript:')) {
                      // VD: 12345.html hoặc /book/32053/12345.html -> phát hiện số chương
                      const m = rawHref.match(new RegExp('^(.*?)(\\\\d+)(\\\\.[a-zA-Z]+|/)?$'));
                      if (m) {
                          urlPattern = { prefix: m[1], suffix: m[3] || '' };
                      }
                  }

                  // 1. Selector ID trực tiếp
                  if (anchor && anchor.id) {
                      selectors.push('#' + anchor.id);
                  }
                  if (anchor && anchor.getAttribute && anchor.getAttribute('rel') === 'next') {
                      selectors.push('a[rel="next"]');
                  }

                  // 2. Phân tích cụm cha (Container)
                  const parent = anchor ? anchor.parentElement : null;
                  if (parent) {
                      if (parent.id) {
                          selectors.push('#' + parent.id + ' ' + anchor.tagName.toLowerCase());
                          containerSelector = '#' + parent.id;
                      } else if (parent.className && typeof parent.className === 'string') {
                          const pClasses = parent.className.trim().split(/\s+/).filter(c => c && !c.includes(':'));
                          if (pClasses.length > 0) {
                              selectors.push('.' + pClasses[0] + ' ' + anchor.tagName.toLowerCase());
                              containerSelector = '.' + pClasses[0];
                          }
                      }

                      const siblings = Array.from(parent.querySelectorAll('a, button'));
                      const idx = siblings.indexOf(anchor);
                      if (idx !== -1) {
                          childIndex = idx;
                          if (containerSelector) {
                              if (idx === siblings.length - 1) {
                                  selectors.push(containerSelector + ' a:last-child');
                              } else {
                                  selectors.push(containerSelector + ' a:nth-child(' + (idx + 1) + ')');
                              }
                          }
                      }
                  }

                  // 3. Class của nút
                  if (anchor && anchor.className && typeof anchor.className === 'string') {
                      const classes = anchor.className.trim().split(/\s+/).filter(c => c && !c.includes(':'));
                      if (classes.length > 0) {
                          selectors.push(anchor.tagName.toLowerCase() + '.' + classes[0]);
                      }
                  }

                  // 4. Fallback thẻ
                  if (anchor && anchor.tagName) {
                      selectors.push(anchor.tagName.toLowerCase());
                  }

                  const uniqueSelectors = Array.from(new Set(selectors.filter(Boolean)));

                  return {
                      selector: uniqueSelectors[0] || 'a',
                      selectors: uniqueSelectors,
                      containerSelector,
                      childIndex,
                      text,
                      urlPattern,
                      rawHref,
                      pattern: 'smart_teach'
                  };
              };

              const onClick = (e) => {
                  if (banner.contains(e.target)) return;
                  e.preventDefault();
                  e.stopPropagation();

                  const target = e.target.closest('a, button, [role="button"], [onclick]') || e.target;
                  const ruleData = generateSmartRule(target);

                  window.__TienHiepHelpers.saveNextRule(ruleData);

                  cleanup();
                  banner.style.background = "linear-gradient(135deg,#10b981,#059669)";
                  banner.innerHTML = "<span>✅ Đã ghi nhớ chuẩn xác nút Chương Sau! Đang chuyển trang...</span>";
                  setTimeout(() => {
                      banner.remove();
                      window.__TienHiepHelpers.checkAndTriggerAutoNext(true);
                  }, 800);
              };

              const cleanup = () => {
                  window.__isTeachingNext = false;
                  currentTarget = null;
                  stopRafLoop();
                  document.removeEventListener("mousemove", onMouseMove, true);
                  document.removeEventListener("click", onClick, true);
                  if (highlightBox) highlightBox.remove();
              };

              document.addEventListener("mousemove", onMouseMove, true);
              document.addEventListener("click", onClick, true);

              const cancelBtn = document.getElementById("__cancel_teach_next");
              if (cancelBtn) {
                  cancelBtn.onclick = (e) => {
                      e.stopPropagation();
                      cleanup();
                      banner.remove();
                  };
              }

              const resetBtn = document.getElementById("__reset_teach_next");
              if (resetBtn) {
                  resetBtn.onclick = (e) => {
                      e.stopPropagation();
                      window.__TienHiepHelpers.deleteNextRule();
                      cleanup();
                      banner.style.background = "linear-gradient(135deg,#3b82f6,#2563eb)";
                      banner.innerHTML = "<span>🔄 Đã khôi phục cài đặt mặc định cho truyện này!</span>";
                      setTimeout(() => {
                          banner.remove();
                      }, 1200);
                  };
              }
          }
      };
      
      window.__translatePromises = window.__translatePromises || {};
      window.__transId = window.__transId || 0;
      window.__receiveTranslations = (id, results) => {
          if (window.__translatePromises[id]) {
              window.__translatePromises[id](results);
              delete window.__translatePromises[id];
          }
      };

      let translateQueue = [];
      let translateTimeout = null;
      let isTranslating = false;

      async function translateNodes(nodes) {
        const texts = nodes.map(n => n.nodeValue);
        try {
          const id = window.__transId++;
          const translations = await new Promise((resolve) => {
              window.__translatePromises[id] = resolve;
              if (window.parent && window.parent !== window) {
                  window.parent.postMessage({ type: "TRANSLATE_REQ", id, texts }, "*");
              }
              console.log("[TRANSLATE_REQ]" + JSON.stringify({ id, texts }));
              setTimeout(() => {
                 if (window.__translatePromises[id]) {
                     window.__translatePromises[id]([]);
                     delete window.__translatePromises[id];
                 }
              }, 12000);
          });

          if (translations && translations.length === nodes.length) {
            if (window.__autoTranslateObserver) window.__autoTranslateObserver.disconnect();
            translations.forEach((trans, idx) => {
              const node = nodes[idx];
              if (node && trans) {
                if (!${useTypewriter} || trans.length < 5) { 
                    node.nodeValue = trans; 
                    return; 
                }
                const words = trans.split(/(?<=\\s+)/);
                node.nodeValue = "";
                let i = 0;
                function typeWriter() {
                    if (i < words.length) {
                        node.nodeValue += words[i]; i++;
                        requestAnimationFrame(() => setTimeout(typeWriter, 5));
                    }
                }
                typeWriter();
              }
            });
            if (window.__autoTranslateObserver) {
              window.__autoTranslateObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
            }
          }
          return translations;
        } catch(e) { console.error("Translate API Error:", e); return []; }
      }

      const processTranslateQueue = () => {
        if (translateQueue.length > 0 && !isTranslating && window.__autoTranslateEnabled) {
          isTranslating = true;
          const batch = translateQueue.splice(0, 80);
          translateNodes(batch).finally(() => {
            isTranslating = false;
            if (translateQueue.length > 0) setTimeout(processTranslateQueue, 80);
            else {
              clearTimeout(window.__translateCompleteTimeout);
              window.__translateCompleteTimeout = setTimeout(() => {
                  if (window.parent && window.parent !== window) {
                      let res = { title: document.title, text: document.body.innerText };
                      if (window.__TienHiepHelpers) {
                          res = window.__TienHiepHelpers.extractCleanChapterText();
                      }
                      window.parent.postMessage({
                          type: "TRANSLATION_COMPLETE",
                          title: res.title,
                          text: res.text
                      }, "*");
                  }
                  console.log("[Translation Complete]");
              }, 800);
            }
          });
        }
      };

      window.__collectAndTranslateNodes = (root) => {
        if (!window.__autoTranslateEnabled) return;
        const chineseRegex = /[\u4e00-\u9fa5]/;
        const nodes = []; const stack = [root || document.body];
        while (stack.length > 0) {
          const node = stack.pop(); if (!node) continue;
          if (node.nodeType === 3) {
            const currentVal = node.nodeValue;
            const origVal = node.__original_chinese__;
            // Bỏ qua nếu node đã được dịch (origVal tồn tại và currentVal khác gốc = đã dịch)
            if (origVal && currentVal !== origVal) continue;
            // Kiểm tra có chữ Trung không
            const checkVal = origVal || currentVal;
            if (checkVal && chineseRegex.test(checkVal)) {
              const tag = node.parentNode?.nodeName;
              if (tag !== "SCRIPT" && tag !== "STYLE" && tag !== "NOSCRIPT") {
                if (!origVal) node.__original_chinese__ = currentVal;
                // Tránh thêm node trùng vào queue
                if (!translateQueue.includes(node)) nodes.push(node);
              }
            }
          } else {
            if (node.shadowRoot) stack.push(node.shadowRoot);
            let child = node.lastChild; while (child) { stack.push(child); child = child.previousSibling; }
          }
        }
        if (nodes.length > 0) {
          translateQueue.push(...nodes);
          if (!translateTimeout) translateTimeout = setTimeout(() => { translateTimeout = null; processTranslateQueue(); }, 80);
        }
      };

      // ═══ CHẾ ĐỘ TỐI & BẢO VỆ CHẶN QUẢNG CÁO LIÊN TỤC (MẶC ĐỊNH THEO CÀI ĐẶT CỦA NGƯỜI DÙNG) ═══
      window.__tienhiepDarkMode = (function() {
        try {
          return localStorage.getItem('__tienhiep_dark_mode_active') === 'true';
        } catch(e) {
          return false;
        }
      })();
      window.__tienhiepCleanAds = true;

      // CSS chế độ tối - nền tối cho toàn trang (loại trừ UI chỉ định chương và highlight đọc truyện)
      const DARK_BG_CSS = 'html, body { background-color: #111118 !important; background: #111118 !important; } div:not(#__teach_highlighter_box):not(#__teach_next_banner):not(#__teach_tag_badge):not([id^="__teach"]):not([id^="__cancel"]):not([id^="__reset"]):not(#tienhiep-active-highlight):not([id*="tienhiep-active"]), teach-highlighter, teach-badge, teach-banner, p:not(#tienhiep-active-highlight):not([id*="tienhiep-active"]), span:not(#tienhiep-active-highlight):not([id*="tienhiep-active"]), ul, ol, li, section, article, main, header, footer, nav, aside, dl, dt, dd, table, thead, tbody, tfoot, tr, th, td, blockquote, form, fieldset, legend, label, pre, code, .content, #content, [class*="content"], [class*="read"], [id*="content"], [id*="chapter"], [class*="chapter"], [class*="wrap"], [class*="box"], [class*="container"], [class*="main"] { background-color: #111118 !important; background: #111118 !important; border-color: #2a2a3a !important; box-shadow: none !important; } .title, .breadcrumb, .topbar, .nlist_page { background-color: #181926 !important; border-color: #2e3050 !important; } img, .pic, picture, video, canvas, svg { background-color: transparent !important; } teach-highlighter, #__teach_highlighter_box { background-color: rgba(245,158,11,0.18) !important; outline: 2.5px solid #f59e0b !important; box-shadow: 0 0 16px rgba(245,158,11,0.65), inset 0 0 12px rgba(245,158,11,0.2) !important; border-radius: 6px !important; } teach-banner, #__teach_next_banner, teach-badge, #__teach_tag_badge { background-color: unset; color: unset; } #tienhiep-active-highlight, span#tienhiep-active-highlight { background-color: #f59e0b !important; background: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 4px !important; padding: 2px 6px !important; box-shadow: 0 0 16px rgba(245, 158, 11, 0.95) !important; border-bottom: 2px solid #b45309 !important; display: inline !important; } ::highlight(tienhiep-tts-highlight) { background-color: #f59e0b !important; color: #000000 !important; }';
      // CSS màu chữ - áp dụng riêng để có specificity cao hơn, loại trừ UI chỉ định
      const DARK_COLOR_CSS = 'body *:not(#__teach_highlighter_box):not(#__teach_next_banner):not(#__teach_tag_badge):not([id^="__teach"]):not([id^="__cancel"]):not([id^="__reset"]):not(teach-highlighter):not(teach-badge):not(teach-banner):not(#tienhiep-active-highlight):not([id*="tienhiep-active"]) { color: #e8ecf0 !important; } h1, h2, h3, h4, h5, h6, [class*="title"], .title, [id*="title"] { color: #ffffff !important; } a, a:link, a:visited, a * { color: #93c5fd !important; text-decoration: none !important; } a:hover, a:hover * { color: #bfdbfe !important; } button:not([id^="__"]), a.button, a.s1, .btn, input[type="button"], input[type="submit"] { background-color: #e11d48 !important; color: #ffffff !important; border-color: #be123c !important; } input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select { background-color: #1c1a3a !important; color: #f0f4ff !important; border: 1px solid #4f46e5 !important; } img, canvas, svg, video, picture { opacity: 0.92 !important; background-color: transparent !important; } .nlist_page a, .breadcrumb a { color: #a5b4fc !important; }';

      const DARK_THEME_CSS = DARK_BG_CSS + ' ' + DARK_COLOR_CSS;

      window.__ensureDarkMode = () => {
        const contentSelectors = [
          '#content', '.content', '.read-content', '.chapter-content',
          '[id*="chapter"]', '[class*="chapter"]', '[class*="readarea"]',
          '.booktext', '#booktext', '.txt', '#txt', '.chapter', '.article-content',
          '.novel-content', '.story-content', '.text-content', '[id*="content"]'
        ];

        // Nếu KHÔNG BẬT Dark Mode: dọn sạch 100% style tối, trả trang về MẶC ĐỊNH hoàn toàn
        if (!window.__tienhiepDarkMode) {
          const s = document.getElementById('__tienhiep_dark_style');
          if (s) s.remove();
          try {
            if (document.body) {
              document.body.style.removeProperty('background-color');
              document.body.style.removeProperty('color');
            }
            for (const sel of contentSelectors) {
              const els = document.querySelectorAll(sel);
              els.forEach(el => {
                if (el && el.style) {
                  el.style.removeProperty('background-color');
                  el.style.removeProperty('color');
                }
                if (el) {
                  el.querySelectorAll('p, span, div, font, h1, h2, h3, a').forEach(child => {
                    if (child && child.style) {
                      child.style.removeProperty('color');
                      child.style.removeProperty('background-color');
                    }
                  });
                }
              });
            }
          } catch(e) {}
          return;
        }

        // Chèn/cập nhật style tag nếu đang BẬT Dark Mode
        let styleEl = document.getElementById('__tienhiep_dark_style');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = '__tienhiep_dark_style';
          (document.head || document.documentElement).appendChild(styleEl);
        }
        styleEl.textContent = DARK_THEME_CSS;

        // JS ép màu trực tiếp cho body và container nội dung chính khi BẬT Dark Mode
        try {
          if (document.body) {
            document.body.style.setProperty('background-color', '#111118', 'important');
            document.body.style.setProperty('color', '#e8ecf0', 'important');
          }

          for (const sel of contentSelectors) {
            try {
              const els = document.querySelectorAll(sel);
              els.forEach(el => {
                if (el && el.style) {
                  el.style.setProperty('background-color', '#111118', 'important');
                  el.style.setProperty('color', '#e8ecf0', 'important');
                }
                // Ép màu cho tất cả thẻ p và span bên trong
                if (el) {
                  el.querySelectorAll('p, span, div, font').forEach(child => {
                    if (child.style) {
                      child.style.setProperty('color', '#e8ecf0', 'important');
                      if (child.style.backgroundColor && child.style.backgroundColor !== 'transparent' &&
                          child.style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                        child.style.setProperty('background-color', '#111118', 'important');
                      }
                    }
                  });
                }
              });
            } catch(e) {}
          }
        } catch(e) {}
      };

      // Chặn triệt để document.write inject script quảng cáo
      try {
        if (!window.__tienhiepDocWriteIntercepted) {
          window.__tienhiepDocWriteIntercepted = true;
          const origWrite = document.write.bind(document);
          const origWriteln = document.writeln.bind(document);
          const isAdSnippet = (str) => {
            if (!str || typeof str !== 'string') return false;
            return /(geniees|magsrv|popads|propeller|adsterra|cpm|zoneid|guanggao|doubleclick)/i.test(str) || str.toLowerCase().includes('/ad');
          };
          document.write = function(...args) {
            if (args.some(isAdSnippet)) {
              console.log('[TienHiep AdBlock] Đã vô hiệu hóa document.write tải script quảng cáo');
              return;
            }
            return origWrite(...args);
          };
          document.writeln = function(...args) {
            if (args.some(isAdSnippet)) {
              console.log('[TienHiep AdBlock] Đã vô hiệu hóa document.writeln tải script quảng cáo');
              return;
            }
            return origWriteln(...args);
          };
        }
      } catch(e) {}

      // ════ CHẶN CLICK-HIJACKING & PHỦ MÀNG BỌC TRONG SUỐT ════
      try {
        if (!window.__tienhiepClickInterceptorAttached) {
          window.__tienhiepClickInterceptorAttached = true;
          window.addEventListener('click', (e) => {
            if (!window.__tienhiepCleanAds) return;
            // Nếu đang trong chế độ Chỉ Định Nút Tiếp, không chặn click!
            if (window.__isTeachingNext) return;

            // Bắt phần tử bị click
            const target = e.target;
            if (!target) return;

            // Bỏ qua nếu là banner hướng dẫn của app
            if (target.closest && target.closest('#__teach_next_banner, #__teach_highlighter_box')) return;

            // Kiểm tra thẻ <a> hoặc phần tử có sự kiện mở link
            const link = target.closest ? target.closest('a') : null;
            if (link && link.href) {
              const href = link.href.trim();
              const isAd = /(magsrv|geniees|popads|propeller|adsterra|cpm|zoneid|guanggao|doubleclick|affiliate|track|bet|casino|game|18\+)/i.test(href);
              let linkHost = '';
              let currentHost = window.location.hostname;
              try { linkHost = new URL(href).hostname; } catch(err) {}

              // Nếu là link quảng cáo hoặc click vào thẻ trong suốt toàn màn hình nhảy sang domain lạ
              if (isAd || (linkHost && currentHost && linkHost !== currentHost && !href.includes('chapter') && !href.includes('.html'))) {
                console.log('[TienHiep AdBlock] 🚫 Đã chặn click-hijack chuyển trang:', href);
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                if (link.parentNode) link.remove();
                return false;
              }
            }
          }, true); // Bắt ở capture phase trước khi trang web nhận được event!
        }
      } catch(e) {}

      window.__ensureCleanAds = () => {
        if (!window.__tienhiepCleanAds) {
          const s = document.getElementById('__tienhiep_adblock_style');
          if (s) s.remove();
          return;
        }
        if (window.open !== window.__tienhiepBlockedOpen) {
          window.__tienhiepBlockedOpen = function() {
            console.log('[TienHiep AdBlock] Chặn popup window.open');
            return null;
          };
          window.open = window.__tienhiepBlockedOpen;
        }

        let adStyle = document.getElementById('__tienhiep_adblock_style');
        if (!adStyle) {
          adStyle = document.createElement('style');
          adStyle.id = '__tienhiep_adblock_style';
          adStyle.textContent = \`
            iframe[src*="ad"], iframe[src*="union"], iframe[src*="cpm"], iframe[src*="pop"], iframe[src*="geniees"], iframe[src*="magsrv"], iframe[src*="vantage"],
            [class*="popup-wrap"], [class*="modal-wrap"], [id*="bonus"], [class*="bonus"],
            [class*="vantage"], [id*="vantage"], [class*="captcha"], [id*="captcha"], [class*="recaptcha"], [id*="recaptcha"],
            [class*="gift"], [id*="gift"], [class*="redpack"], [id*="redpack"], [class*="hongbao"], [class*="reward"],
            .advertisement, .advertising, [class*="banner-ad"], [id*="banner-ad"],
            [class*="float-ad"], [id*="float-ad"], [class*="popup-ad"], [id*="popup-ad"],
            ins.adsbygoogle, .google-ad, [id*="google_ads"], #ad_top, #ad_bottom, #ad_left, #ad_right,
            .bottom-ad, .top-ad, .side-ad, .tuiguang, [class*="tuiguang"], [id*="tuiguang"],
            .guanggao, [class*="guanggao"], [id*="guanggao"], [class*="pop-win"], [id*="pop-win"],
            .float-window, .app-download-bar, .download-banner,
            [class*="modal-backdrop"], [class*="overlay-mask"], [class*="popup-overlay"] {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              width: 0 !important;
              pointer-events: none !important;
              opacity: 0 !important;
            }
          \`;
          (document.head || document.documentElement).appendChild(adStyle);
        }

        const spamSelectors = [
          'iframe[src*="ad"]', 'iframe[src*="union"]', 'iframe[src*="cpm"]', 'iframe[src*="pop"]', 'iframe[src*="geniees"]', 'iframe[src*="magsrv"]', 'iframe[src*="vantage"]',
          '[class*="popup-wrap"]', '[class*="modal-wrap"]', '[id*="bonus"]', '[class*="bonus"]',
          '[class*="gift"]', '[id*="gift"]', '[class*="redpack"]', '[id*="redpack"]', '[class*="hongbao"]', '[class*="reward"]',
          '.tuiguang', '[class*="tuiguang"]', '[id*="tuiguang"]',
          '.guanggao', '[class*="guanggao"]', '[id*="guanggao"]',
          'ins.adsbygoogle', '.google-ad', '[id*="google_ads"]',
          '#ad_top', '#ad_bottom', '#ad_left', '#ad_right',
          '.bottom-ad', '.top-ad', '.side-ad',
          '[class*="pop-win"]', '[id*="pop-win"]',
          '.float-window', '.app-download-bar', '.download-banner',
          '[class*="vantage"]', '[id*="vantage"]'
        ];
        spamSelectors.forEach(s => {
          try {
            document.querySelectorAll(s).forEach(el => {
              if (el.id === '__teach_next_banner' || el.id === '__teach_highlighter_box') return;
              if (el.innerText && el.innerText.length > 500 && (el.querySelectorAll('p').length > 2)) return;
              el.remove();
            });
          } catch(e) {}
        });

        // Quét và tiêu diệt các modal / dialog popup nổi, hộp quà và màng bọc trong suốt (invisible overlays)
        try {
          const fakeCaptchaPattern = /not a robot|i['’]m not a robot|click the button|human verification|verify you are human|prove you are not a robot/i;
          const adTextPattern = /vantage|hoa hồng|hoa hong|tham gia ngay|đăng ký ngay|kiếm tiền|đối tác|affiliate|forex|crypto|trading|betting|nhà cái|casino|đặt cược|tài xỉu|nổ hũ|game bài|congratulations|bonus|get bonus|approved|lucky\\s*draw|trúng thưởng|nhận thưởng|vòng quay|nạp thẻ|tải app|download app|đăng ký nhận quà/i;
          const floatingEls = document.querySelectorAll('div, section, aside, dialog, a, form');
          const windowWidth = window.innerWidth || document.documentElement.clientWidth;
          const windowHeight = window.innerHeight || document.documentElement.clientHeight;

          floatingEls.forEach(el => {
            if (el.id === '__teach_next_banner' || el.id === '__teach_highlighter_box') return;
            if (el.closest && el.closest('#__teach_next_banner, #__teach_highlighter_box')) return;
            if (el.id === 'content' || el.classList.contains('content') || el.classList.contains('read-content') || el.classList.contains('txtnav')) return;

            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex, 10);
            const isPositioned = style.position === 'fixed' || style.position === 'absolute';
            const text = (el.innerText || '').trim();

            // 1. Tiêu diệt Popup giả mạo "I'm not a robot" / Captcha & Backdrop bao ngoài
            if (fakeCaptchaPattern.test(text)) {
              console.log('[TienHiep AdBlock] 🚫 Gỡ bỏ fake captcha robot modal:', el);
              // Tìm container fixed/absolute cao nhất của popup
              let topModal = el;
              while (topModal.parentElement && topModal.parentElement !== document.body && topModal.parentElement !== document.documentElement) {
                const pStyle = window.getComputedStyle(topModal.parentElement);
                if (pStyle.position === 'fixed' || pStyle.position === 'absolute') {
                  topModal = topModal.parentElement;
                } else {
                  break;
                }
              }
              topModal.remove();

              // Dọn dẹp sạch sẽ tất cả màng đen backdrop phủ toàn màn hình
              document.querySelectorAll('div, section, aside, form').forEach(bg => {
                if (bg.id === 'content' || bg.classList.contains('content') || bg.classList.contains('read-content') || bg.classList.contains('txtnav')) return;
                const bgStyle = window.getComputedStyle(bg);
                if (bgStyle.position === 'fixed' || bgStyle.position === 'absolute') {
                  const bgRect = bg.getBoundingClientRect();
                  if (bgRect.width >= windowWidth * 0.75 && bgRect.height >= windowHeight * 0.75) {
                    if (!bg.innerText || bg.innerText.trim().length < 100 || fakeCaptchaPattern.test(bg.innerText)) {
                      bg.remove();
                    }
                  }
                }
              });
              if (document.body) {
                document.body.style.overflow = '';
                document.body.style.pointerEvents = '';
              }
              if (document.documentElement) {
                document.documentElement.style.overflow = '';
                document.documentElement.style.pointerEvents = '';
              }
              return;
            }

            // 2. Tiêu diệt màng bọc vô hình trong suốt (Overlay Click-Jacking che phủ toàn màn hình)
            if (isPositioned && (zIndex > 20 || zIndex === 2147483647)) {
              const isFullScreen = rect.width >= windowWidth * 0.7 && rect.height >= windowHeight * 0.7;
              const isTransparent = parseFloat(style.opacity) < 0.1 || style.visibility === 'hidden' || style.backgroundColor === 'transparent' || style.backgroundColor === 'rgba(0, 0, 0, 0)';
              if (isFullScreen && isTransparent && (!el.innerText || el.innerText.trim().length < 50)) {
                console.log('[TienHiep AdBlock] 🚫 Gỡ bỏ màng che click-jacking trong suốt:', el);
                el.remove();
                return;
              }
            }

            // 3. Tiêu diệt widget nổi quảng cáo Vantage / Hoa Hồng / Cờ Bạc / Hộp quà
            if (isPositioned) {
              const hasAdKeyword = adTextPattern.test(text);
              const hasAdIframe = el.querySelector('iframe[src*="ad"], iframe[src*="cpm"], iframe[src*="magsrv"], iframe[src*="geniees"], iframe[src*="vantage"]');
              const hasAdAction = /get bonus|download|cài đặt|nhận ngay|tham gia ngay|bonus|gift|redpack|hongbao/i.test(text);
              
              // Nhận diện hộp quà bằng SVG/Canvas/Img nhỏ nổi ở góc có badge số thông báo
              const isSmallFloatingWidget = (rect.width > 0 && rect.width < 180 && rect.height > 0 && rect.height < 180);
              const hasBadgeOrIcon = el.querySelector('svg, img, canvas, [class*="badge"], [class*="num"], [class*="count"], [class*="gift"], [class*="redpack"], [class*="bonus"]');
              const isNearBottomOrCorner = (rect.bottom >= windowHeight - 160 || rect.top <= 160 || rect.left <= 100 || rect.right >= windowWidth - 100);

              if (hasAdKeyword || hasAdIframe || hasAdAction || (isSmallFloatingWidget && (hasBadgeOrIcon || text === '1' || text === '!') && isNearBottomOrCorner && text.length <= 15)) {
                if (!el.innerText || el.innerText.length < 500) {
                  console.log('[TienHiep AdBlock] 🚫 Gỡ bỏ popup hộp quà / floating widget:', el);
                  el.remove();
                  if (document.body && document.body.style.overflow === 'hidden') document.body.style.overflow = '';
                  if (document.documentElement && document.documentElement.style.overflow === 'hidden') document.documentElement.style.overflow = '';
                }
              }
            }
          });
        } catch(e) {}
      };

      window.__ensureDarkMode();
      window.__ensureCleanAds();

      window.__autoTranslateObserver = new MutationObserver((mutations) => {
        if (window.__tienhiepDarkMode) window.__ensureDarkMode();
        if (window.__tienhiepCleanAds) window.__ensureCleanAds();

        if (!window.__autoTranslateEnabled) return;
        const chineseRegex = /[\u4e00-\u9fa5]/;
        mutations.forEach(m => {
          if (m.type === "characterData") {
            const node = m.target;
            if (node.nodeType === 3) {
              const currentVal = node.nodeValue;
              const origVal = node.__original_chinese__;
              // Nếu node đã có bản gốc và hiện tại != gốc -> đã dịch, bỏ qua
              if (origVal && currentVal !== origVal) return;
              // Chỉ gửi dịch nếu có chữ Trung
              if (chineseRegex.test(currentVal)) {
                window.__collectAndTranslateNodes(node);
              }
            }
          } else if (m.type === "childList") {
            m.addedNodes.forEach(node => {
              if (node.nodeType === 1 || node.nodeType === 3) window.__collectAndTranslateNodes(node);
            });
          }
        });
      });
      const rootTarget = document.body || document.documentElement;
      if (rootTarget) {
        window.__autoTranslateObserver.observe(rootTarget, { childList: true, subtree: true, characterData: true });
      }

      setInterval(() => {
        if (window.__tienhiepDarkMode) window.__ensureDarkMode();
        if (window.__tienhiepCleanAds) window.__ensureCleanAds();
      }, 1500);

      window.toggleAutoTranslate = (enabled) => {
        window.__autoTranslateEnabled = enabled;
        if (enabled) {
          if (window.__autoTranslateObserver && rootTarget) {
            try {
              window.__autoTranslateObserver.observe(rootTarget, { childList: true, subtree: true, characterData: true });
            } catch(e) {}
          }
          window.__collectAndTranslateNodes(document.body);
        } else {
          // 1. Tạm dừng observer để tránh loop sự kiện làm đơ trình duyệt
          if (window.__autoTranslateObserver) {
            try {
              window.__autoTranslateObserver.disconnect();
            } catch(e) {}
          }
          // 2. Hủy toàn bộ hàng đợi dịch đang chờ
          translateQueue.length = 0;
          if (translateTimeout) {
            clearTimeout(translateTimeout);
            translateTimeout = null;
          }
          // 3. Dọn sạch overlay dạy nút nếu còn sót
          const b = document.getElementById("__teach_next_banner");
          if (b) b.remove();
          const box = document.getElementById("__teach_highlighter_box");
          if (box) box.remove();

          // 4. Khôi phục chữ gốc mượt mà
          try {
            const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT, null);
            let n = walker.nextNode();
            while (n) {
              if (n.__original_chinese__) {
                n.nodeValue = n.__original_chinese__;
              }
              n = walker.nextNode();
            }
          } catch(e) {}
        }
        return enabled;
      };
    }
  })();`;
}
