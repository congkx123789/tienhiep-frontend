// Webview Injected Script Module for Tiên Hiệp Browser Reader
// Handles in-page text extraction, translation nodes observation, multi-strategy Next/Prev navigation, and Teach Next Mode.

export function createTranslateScript(useTypewriter = false) {
  return `(() => {
    if (!window.__translatorInitialized) {
      window.__translatorInitialized = true;
      window.__autoTranslateEnabled = false;
      window.isTtsPlaying = false;

      // Lock String.prototype.tran to stop scripts like chinese.js from corrupting Vietnamese text
      try {
        window.zh_init = function() {};
        window.zh_tran = function() {};
        window.zh_tranBody = function() {};
        window.zh_getLang = function() {};
        Object.defineProperty(String.prototype, 'tran', {
          value: function() { return this.toString(); },
          writable: false,
          configurable: false
        });
        const hideGbkLang = () => {
          try {
            document.querySelectorAll('.lang, #zh_click_s, #zh_click_t, .textsel').forEach(el => el.remove());
            if (!document.getElementById('__tienhiep_hide_gbk_lang')) {
              const s = document.createElement('style');
              s.id = '__tienhiep_hide_gbk_lang';
              s.textContent = '.lang, #zh_click_s, #zh_click_t, .textsel { display: none !important; }';
              (document.head || document.documentElement).appendChild(s);
            }
          } catch(err) {}
        };
        hideGbkLang();
        document.addEventListener('DOMContentLoaded', hideGbkLang);
        setTimeout(hideGbkLang, 500);
        setTimeout(hideGbkLang, 1500);

        const adaptDesktopLayout = () => {
          try {
            document.querySelectorAll('table, td, th, div, span, p').forEach(el => {
              const w = el.getAttribute('width');
              if (w && (w.endsWith('px') || parseInt(w) >= 450)) {
                el.setAttribute('data-prev-width', w);
                el.setAttribute('width', '100%');
              }
              if (el.style && el.style.width && parseInt(el.style.width) >= 450) {
                el.style.width = '100%';
                el.style.maxWidth = '100vw';
              }
            });
            const readingContainer = document.querySelector('#content, .content, #booktxt, #htmlContent, .read-content, .yd_text2, .showtxt, #chaptercontent, [id*="content"], [class*="content"]');
            if (readingContainer) {
              document.body.style.maxWidth = '100vw';
              document.body.style.overflowX = 'hidden';
              readingContainer.style.maxWidth = '100vw';
              readingContainer.style.width = '100%';
              readingContainer.style.wordBreak = 'break-word';
              readingContainer.style.overflowWrap = 'break-word';
              readingContainer.style.boxSizing = 'border-box';
            }
          } catch(err) {}
        };
        adaptDesktopLayout();
        document.addEventListener('DOMContentLoaded', adaptDesktopLayout);
        setTimeout(adaptDesktopLayout, 500);
        setTimeout(adaptDesktopLayout, 1500);
      } catch(e) {}
      
      window.__TienHiepHelpers = {
          getEffectiveUrl: () => {
              let raw = window.__originalUrl || (document.querySelector('base') && document.querySelector('base').href) || document.baseURI || window.location.href;
              if (!raw || raw.startsWith('about:') || raw === 'null') {
                  raw = window.__originalUrl || (document.querySelector('base') && document.querySelector('base').href) || document.baseURI || '';
              }
              try {
                  return new URL(raw);
              } catch(e) {
                  return {
                      href: raw || '',
                      origin: (raw && raw.startsWith('http')) ? (new URL(raw).origin) : '',
                      host: '',
                      hostname: '',
                      pathname: '',
                      search: '',
                      protocol: ''
                  };
              }
          },

          extractCleanChapterText: () => {
              const effUrl = window.__TienHiepHelpers.getEffectiveUrl();
              const host = effUrl.hostname || window.location.hostname || '';
              const apexHost = host.replace(/^www\./, '');
              let mainEl = null;

              // 0. Ưu tiên cao nhất: Selector vùng đọc do người dùng chỉ định (Dạy vùng đọc)
              try {
                  const savedSel = localStorage.getItem('__tienhiep_content_selector_' + host) ||
                                   localStorage.getItem('__tienhiep_content_selector_' + apexHost);
                  if (savedSel) {
                      const el = document.querySelector(savedSel);
                      if (el && (el.innerText || "").trim().length > 35) {
                          mainEl = el;
                      }
                  }
              } catch(e) {}

              // 1. Selector đặc thù theo từng tên miền lớn
              if (!mainEl) {
                  const SELECTORS = {
                      "qidian": ".read-content, #read-content",
                      "fanqie": ".muye-reader-content-novel",
                      "truyenfull": "#chapter-c, .chapter-c",
                      "tangthuvien": ".box-chap, #chapter-content",
                      "metruyenchu": "#chapter-detail",
                      "hjwzw": "#content, .content",
                      "uukanshu": "#contentbox, .contentbox",
                      "69shuba": ".txtnav",
                      "69shu": ".txtnav",
                      "biquge": ".showtxt, #content, #chaptercontent",
                      "xbiquge": "#content, .showtxt",
                      "b520": "#content, .content"
                  };

                  for (const [domain, selector] of Object.entries(SELECTORS)) {
                      if (host.includes(domain) || apexHost.includes(domain)) {
                          const els = selector.split(",").map(s => s.trim());
                          for (const sel of els) {
                              const el = document.querySelector(sel);
                              if (el && (el.innerText || "").trim().length > 40) {
                                  mainEl = el;
                                  break;
                              }
                          }
                      }
                      if (mainEl) break;
                  }
              }

              // 2. Quét qua danh sách selector chuẩn toàn cầu (Universal Novel Selectors)
              if (!mainEl) {
                  const UNIVERSAL_SELECTORS = [
                      ".txtnav", "#content", "#txtContent", "#chaptercontent", "#chapterContent",
                      "#contentbox", ".read-content", "#read-content", ".muye-reader-content-novel",
                      "#chapter-c", ".chapter-c", ".box-chap", "#chapter-detail", ".showtxt",
                      ".novel-content", ".reading-content", "article", ".entry-content",
                      "#htmlContent", ".article-content", ".page-content", ".yd_text2", "#nr1",
                      "#BookText", "#booktxt", ".book_con", "#acontent", ".reader-content",
                      ".chapter_content", "#novelcontent", "#viewcontent", "#content_text",
                      ".content-text", "#chapter-body", ".chapter-body", "#text_content"
                  ];
                  for (const sel of UNIVERSAL_SELECTORS) {
                      const el = document.querySelector(sel);
                      if (el) {
                          const txt = (el.innerText || "").trim();
                          let linkLen = 0;
                          el.querySelectorAll("a").forEach(a => linkLen += (a.innerText || "").length);
                          const density = linkLen / (txt.length || 1);
                          if (txt.length > 200 && density < 0.25) {
                              mainEl = el;
                              break;
                          }
                      }
                  }
              }

              // 3. Phân tích cây DOM Heuristic: Tìm node cha chứa khối bài viết chính
              if (!mainEl) {
                  let bestEl = null;
                  let bestScore = -1;
                  
                  document.querySelectorAll("div, article, section, main").forEach(el => {
                      if (el.closest('nav, header, footer, aside, .menu, .search, .navbar, .sidebar, .comments, [id*="comment"]')) {
                          return;
                      }

                      const text = (el.innerText || "").trim();
                      const textLength = text.length;
                      if (textLength < 250) return;

                      let linkTextLength = 0;
                      el.querySelectorAll("a").forEach(a => linkTextLength += (a.innerText || "").length);

                      const linkDensity = linkTextLength / (textLength || 1);
                      if (linkDensity > 0.15) return;

                      const pCount = el.querySelectorAll("p").length;
                      const brCount = el.querySelectorAll("br").length;
                      const score = textLength * (1 - linkDensity) * (pCount + (brCount / 2) + 1);
                      if (score > bestScore) {
                          bestScore = score;
                          bestEl = el;
                      }
                  });
                  if (bestEl && bestScore > 150) {
                      mainEl = bestEl;
                  }
              }

              // Nếu vẫn không tìm thấy khối nội dung chương (VD: Đang ở Trang chủ hoặc Mục lục web)
              if (!mainEl) {
                  return {
                      title: document.title || "Trang chủ",
                      text: "",
                      isChapter: false,
                      error: "NOT_CHAPTER_PAGE"
                  };
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
              clone.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(String.fromCharCode(10))));
              clone.querySelectorAll('p').forEach(p => p.appendChild(document.createTextNode(String.fromCharCode(10))));

              let paragraphs = [];
              const isNav = /^(chương trước|chương sau|trở lại|danh sách|mục lục|trang trước|trang sau|上一章|下一章|回目录)$/i;
              const hasWord = /[a-zA-Z0-9\u4e00-\u9fa5\u00C0-\u1EF9]/;

              const rawLines = (clone.textContent || "").split(new RegExp('[\\r\\n]+'));
              rawLines.forEach(line => {
                  const txt = line.trim();
                  if (txt && hasWord.test(txt) && !isNav.test(txt)) paragraphs.push(txt);
              });

              if (paragraphs.length === 0) {
                  const pTags = clone.querySelectorAll("p");
                  pTags.forEach(p => {
                      const txt = (p.textContent || "").trim();
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

              // Ghép các đoạn bằng ký tự xuống dòng thật sự (ASCII 10)
              const newlineSep = String.fromCharCode(10) + String.fromCharCode(10);
              return { title: chapterTitle, text: paragraphs.join(newlineSep) };
          },

          // ─── TAP-TO-READ: Gán data-tts-idx cho từng đoạn văn trên DOM thực ───
          indexParagraphsForTTS: () => {
              const host = window.__TienHiepHelpers.getEffectiveUrl().hostname || '';
              let mainEl = null;

              try {
                  const savedSel = localStorage.getItem('__tienhiep_content_selector_' + host);
                  if (savedSel) {
                      const el = document.querySelector(savedSel);
                      if (el && (el.innerText || "").trim().length > 30) {
                          mainEl = el;
                      }
                  }
              } catch(e) {}

              if (!mainEl) {
                  const UNIVERSAL_SELECTORS = [
                      ".txtnav", "#content", "#txtContent", "#chaptercontent", "#chapterContent",
                      "#contentbox", ".read-content", "#read-content", ".muye-reader-content-novel",
                      "#chapter-c", ".chapter-c", ".box-chap", "#chapter-detail", ".showtxt",
                      ".novel-content", ".reading-content", "article", ".entry-content",
                      "#htmlContent", ".article-content", ".page-content", ".yd_text2", "#nr1",
                      "#BookText", "#booktxt", ".book_con", "#acontent", ".reader-content",
                      ".chapter_content", "#novelcontent", "#viewcontent"
                  ];
                  for (const sel of UNIVERSAL_SELECTORS) {
                      const el = document.querySelector(sel);
                      if (el && (el.innerText || "").trim().length > 150) {
                          mainEl = el;
                          break;
                      }
                  }
              }
              if (!mainEl) {
                  mainEl = document.querySelector('article, main, #content, .content, .read-content') || document.body;
              }

              const isNav = /^(chương trước|chương sau|trở lại|danh sách|mục lục|trang trước|trang sau|上一章|下一章|回目录)$/i;
              const hasWord = /[a-zA-Z0-9\u4e00-\u9fa5\u00C0-\u1EF9]/;

              // Xóa index cũ trước khi gán lại
              mainEl.querySelectorAll('[data-tts-idx]').forEach(el => {
                  el.removeAttribute('data-tts-idx');
                  el.style.cursor = '';
              });

              let idx = 0;
              let pTags = Array.from(mainEl.querySelectorAll("p"));
              if (pTags.length === 0) {
                  pTags = Array.from(document.querySelectorAll(".txtnav p, #content p, .read-content p, article p, p"));
              }
              const indexedEls = [];

              if (pTags.length > 0) {
                  pTags.forEach(p => {
                      const txt = (p.innerText || p.textContent || "").trim();
                      if (txt && hasWord.test(txt) && !isNav.test(txt)) {
                          p.setAttribute('data-tts-idx', String(idx));
                          p.style.cursor = 'pointer';
                          indexedEls.push(p);
                          idx++;
                      }
                  });
              }
              
              const mainTextLen = (mainEl.innerText || mainEl.textContent || '').trim().length;
              // Nếu số thẻ p tìm thấy quá ít (< 3) nhưng văn bản trong container rất dài (> 200 ký tự)
              // -> Đây là dạng trang web như 69shuba, Biquge sử dụng Text Nodes xen kẽ thẻ <br>
              if (indexedEls.length < 3 && mainTextLen > 200) {
                  try {
                      // Reset lại index
                      indexedEls.forEach(el => el.removeAttribute('data-tts-idx'));
                      indexedEls.length = 0;
                      idx = 0;

                      const childNodes = Array.from(mainEl.childNodes);
                      let currentBatch = [];
                      const fragment = document.createDocumentFragment();

                      const flushBatch = () => {
                          if (currentBatch.length === 0) return;
                          const combinedText = currentBatch.map(n => n.textContent || '').join('').trim();
                          if (combinedText && hasWord.test(combinedText) && !isNav.test(combinedText)) {
                              const p = document.createElement('p');
                              p.setAttribute('data-tts-idx', String(idx));
                              p.className = 'tienhiep-tts-paragraph';
                              p.style.cssText = 'margin: 14px 0 !important; line-height: 1.85 !important; cursor: pointer !important; word-break: break-word !important;';
                              currentBatch.forEach(n => p.appendChild(n));
                              fragment.appendChild(p);
                              indexedEls.push(p);
                              idx++;
                          } else {
                              currentBatch.forEach(n => fragment.appendChild(n));
                          }
                          currentBatch = [];
                      };

                      for (let i = 0; i < childNodes.length; i++) {
                          const node = childNodes[i];
                          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
                              flushBatch();
                          } else if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && ['SPAN', 'FONT', 'B', 'I', 'EM', 'STRONG', 'A'].includes(node.tagName))) {
                              currentBatch.push(node);
                          } else {
                              flushBatch();
                              fragment.appendChild(node);
                          }
                      }
                      flushBatch();

                      if (indexedEls.length > 0) {
                          mainEl.innerHTML = '';
                          mainEl.appendChild(fragment);
                      }
                  } catch(wrapErr) {
                      console.warn('[TienHiep TTS] Lỗi khi bọc đoạn văn bản:', wrapErr);
                  }
              }

              // ── CSS highlight đoạn đang đọc (Bôi màu vàng dạ quang nổi bật chuẩn sách, viền tím đậm) ──
              let ttsStyle = document.getElementById('__tienhiep_tts_para_style');
              if (!ttsStyle) {
                  ttsStyle = document.createElement('style');
                  ttsStyle.id = '__tienhiep_tts_para_style';
                  ttsStyle.textContent = '[data-tts-idx]:hover { outline: 2px dashed rgba(139,92,246,0.6) !important; outline-offset: 3px !important; border-radius: 4px !important; } [data-tts-active="true"] { background: #fef08a !important; color: #0f172a !important; border-left: 6px solid #7c3aed !important; padding: 6px 12px !important; border-radius: 6px !important; box-shadow: 0 4px 18px rgba(124, 58, 237, 0.35) !important; transition: all 0.2s ease !important; display: block !important; } [data-tts-active="true"] * { color: #0f172a !important; } .tienhiep-tts-active-span { background: #fef08a !important; color: #0f172a !important; border-left: 4px solid #7c3aed !important; padding: 2px 6px !important; border-radius: 4px !important; box-shadow: 0 2px 10px rgba(124, 58, 237, 0.35) !important; display: inline-block !important; }';
                  (document.head || document.documentElement).appendChild(ttsStyle);
              }

              // ── Click listener Tap-to-Read (chỉ đăng ký 1 lần) ──
              if (!window.__tienhiepTapToReadInstalled) {
                  window.__tienhiepTapToReadInstalled = true;
                  document.addEventListener('click', (e) => {
                      if (window.__isTeachingNext) return;
                      const el = e.target && e.target.closest ? e.target.closest('[data-tts-idx]') : null;
                      if (!el) return;
                      const paraIdx = parseInt(el.getAttribute('data-tts-idx'), 10);
                      if (isNaN(paraIdx)) return;
                      
                      const sentenceSnippet = (el.textContent || '').trim().slice(0, 80);
                      try {
                          window.parent.postMessage({ type: 'TAP_PARAGRAPH', paraIdx, sentenceText: sentenceSnippet }, '*');
                      } catch(err) {}
                      
                      document.querySelectorAll('[data-tts-active="true"]').forEach(el2 => {
                          el2.removeAttribute('data-tts-active');
                          el2.style.backgroundColor = '';
                          el2.style.color = '';
                          el2.style.borderLeft = '';
                          el2.style.padding = '';
                          el2.style.borderRadius = '';
                          el2.style.boxShadow = '';
                      });
                      document.querySelectorAll('.tienhiep-tts-active-span').forEach(sp => {
                          const parent = sp.parentNode;
                          if (parent) {
                              while (sp.firstChild) parent.insertBefore(sp.firstChild, sp);
                              parent.removeChild(sp);
                          }
                      });
                      el.setAttribute('data-tts-active', 'true');
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, true);
              }

              // Gán thẻ span id="s-X" data-sid="X" cho từng câu để bôi đen O(1) chính xác tuyệt đối
              try {
                  let sentenceCounter = 0;
                  const validCharRegex = /[\p{L}\p{N}]/u;
                  indexedEls.forEach(pEl => {
                      if (pEl.querySelector('.tts-sentence')) return;
                      const text = (pEl.textContent || '').trim();
                      if (!text) return;
                      const parts = text.split(/([.!?。！？]+["”'’」]?\s*)/);
                      const sList = [];
                      let cur = "";
                      for (let pi = 0; pi < parts.length; pi++) {
                          const part = parts[pi];
                          cur += part;
                          if (/[.!?。！？]/.test(part) || cur.length > 250) {
                              if (cur.trim() && validCharRegex.test(cur)) {
                                  sList.push(cur.trim());
                              }
                              cur = "";
                          }
                      }
                      if (cur.trim() && validCharRegex.test(cur)) {
                          sList.push(cur.trim());
                      }
                      if (sList.length > 0) {
                          pEl.innerHTML = '';
                          sList.forEach(sText => {
                              const span = document.createElement('span');
                              span.id = 's-' + sentenceCounter;
                              span.setAttribute('data-sid', String(sentenceCounter));
                              span.className = 'tts-sentence';
                              span.textContent = sText + ' ';
                              pEl.appendChild(span);
                              sentenceCounter++;
                          });
                      }
                  });
              } catch(wrapSentencesErr) {}

              return { indexed: idx, total: indexedEls.length };
          },

          // Helper kiểm tra phần tử có phải container lớn của toàn bộ trang không (chặn bôi đen toàn bộ)
          isLargeContainerEl: (el) => {
              if (!el || el === document.body || el === document.documentElement) return true;
              if (el.classList && (el.classList.contains('txtnav') || el.classList.contains('read-content') || el.classList.contains('content'))) return true;
              if (el.id === 'content' || el.tagName === 'ARTICLE' || el.tagName === 'MAIN' || el.tagName === 'SECTION') return true;
              const txt = (el.innerText || el.textContent || '').trim();
              if (txt.length > 500) return true;
              if (el.querySelectorAll && el.querySelectorAll('p').length >= 2) return true;
              return false;
          },

          // Dọn dẹp highlight cũ
          clearAllTtsHighlights: () => {
              if (typeof CSS !== 'undefined' && CSS.highlights) {
                  try { CSS.highlights.delete('tienhiep-tts-highlight'); } catch(e) {}
              }
              document.querySelectorAll('#tienhiep-active-highlight').forEach(el => {
                  const parent = el.parentNode;
                  if (parent) {
                      const txt = document.createTextNode(el.textContent);
                      parent.replaceChild(txt, el);
                      parent.normalize();
                  }
              });
              document.querySelectorAll('.tienhiep-tts-active-span').forEach(sp => {
                  const parent = sp.parentNode;
                  if (parent) {
                      while (sp.firstChild) parent.insertBefore(sp.firstChild, sp);
                      parent.removeChild(sp);
                  }
              });
              document.querySelectorAll('[data-tts-active="true"]').forEach(a => {
                  a.removeAttribute('data-tts-active');
                  a.style.backgroundColor = '';
                  a.style.color = '';
                  a.style.borderLeft = '';
                  a.style.padding = '';
                  a.style.borderRadius = '';
                  a.style.boxShadow = '';
              });
              document.querySelectorAll('[data-tts-active-para="true"]').forEach(p => {
                  p.removeAttribute('data-tts-active-para');
                  p.style.borderLeft = '';
                  p.style.paddingLeft = '';
              });
          },

          // Bôi sáng đoạn đang đọc nhẹ nhàng (không đổi màu nền toàn bộ gây rối mắt)
          highlightActiveParagraph: (paraIdx) => {
              if (typeof paraIdx !== 'number' || isNaN(paraIdx) || paraIdx < 0) return;
              let target = document.querySelector('[data-tts-idx="' + paraIdx + '"]');
              if (!target) {
                  const allP = Array.from(document.querySelectorAll('.txtnav p, #content p, .read-content p, article p, p'));
                  if (allP[paraIdx]) target = allP[paraIdx];
              }
              if (target && !window.__TienHiepHelpers.isLargeContainerEl(target)) {
                  document.querySelectorAll('[data-tts-active-para="true"]').forEach(p => {
                      if (p !== target) {
                          p.removeAttribute('data-tts-active-para');
                          p.style.borderLeft = '';
                          p.style.paddingLeft = '';
                      }
                  });
                  target.setAttribute('data-tts-active-para', 'true');
                  target.style.borderLeft = '4px solid #8b5cf6';
                  target.style.paddingLeft = '8px';
                  target.style.transition = 'border-left 0.2s ease';
              }
          },

          // Bôi sáng chính xác CÂU đang đọc (Chuẩn 1:1 ID Indexing O(1))
          highlightSentence: (sentenceText, sentenceId) => {
              // 0. Đảm bảo style highlight luôn tồn tại trong document
              let ttsStyle = document.getElementById('__tienhiep_tts_para_style');
              if (!ttsStyle) {
                  ttsStyle = document.createElement('style');
                  ttsStyle.id = '__tienhiep_tts_para_style';
                  ttsStyle.textContent = '::highlight(tienhiep-tts-highlight) { background-color: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 3px !important; } #tienhiep-active-highlight, span#tienhiep-active-highlight, .tts-active-sentence { background-color: #f59e0b !important; background: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 4px !important; padding: 2px 4px !important; box-shadow: 0 0 14px rgba(245, 158, 11, 0.85) !important; border-bottom: 2px solid #b45309 !important; display: inline !important; } [data-tts-active-para="true"] { border-left: 4px solid #8b5cf6 !important; padding-left: 8px !important; transition: border-left 0.2s ease !important; }';
                  (document.head || document.documentElement).appendChild(ttsStyle);
              }

              // 1. ƯU TIÊN TUYỆT ĐỐI: Khớp 1:1 theo ID O(1)
              const sId = typeof sentenceId === 'number' ? sentenceId : (parseInt(sentenceId, 10));
              if (!isNaN(sId)) {
                  const targetEl = document.getElementById('s-' + sId);
                  if (targetEl) {
                      document.querySelectorAll('.tts-active-sentence, #tienhiep-active-highlight').forEach(el => {
                          el.classList.remove('tts-active-sentence');
                          el.style.backgroundColor = '';
                          el.style.color = '';
                          el.style.boxShadow = '';
                          el.style.borderBottom = '';
                      });
                      targetEl.classList.add('tts-active-sentence');
                      targetEl.style.backgroundColor = '#f59e0b';
                      targetEl.style.color = '#000000';
                      targetEl.style.borderRadius = '4px';
                      targetEl.style.boxShadow = '0 0 14px rgba(245, 158, 11, 0.85)';
                      targetEl.style.borderBottom = '2px solid #b45309';

                      // Đánh dấu nhẹ paragraph cha
                      const parentPara = targetEl.closest('p, [data-tts-idx], .tienhiep-tts-paragraph');
                      if (parentPara && !window.__TienHiepHelpers.isLargeContainerEl(parentPara)) {
                          document.querySelectorAll('[data-tts-active-para="true"]').forEach(p => {
                              if (p !== parentPara) {
                                  p.removeAttribute('data-tts-active-para');
                                  p.style.borderLeft = '';
                                  p.style.paddingLeft = '';
                              }
                          });
                          parentPara.setAttribute('data-tts-active-para', 'true');
                          parentPara.style.borderLeft = '4px solid #8b5cf6';
                          parentPara.style.paddingLeft = '8px';
                      }

                      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      return;
                  }
              }

              if (!sentenceText || typeof sentenceText !== 'string') return;
              window.__lastTtsSentence = sentenceText;

              // 2. Chuẩn hóa chuỗi tìm kiếm an toàn (Fallback nếu chưa index ID)
              const rawTarget = sentenceText.trim();
              if (rawTarget.length < 2) return;

              function stripPunct(str, isCore) {
                  const skipCodes = new Set([34, 39, 8220, 8221, 171, 187, 12302, 12303, 12300, 12301, 65288, 65289, 40, 41, 8212, 45, 32, 9, 13, 10]);
                  const endSkipCodes = isCore
                      ? new Set([...skipCodes, 46, 44, 33, 63, 58, 59, 8230])
                      : skipCodes;
                  let start = 0;
                  while (start < str.length && skipCodes.has(str.charCodeAt(start))) start++;
                  let end = str.length - 1;
                  while (end >= start && endSkipCodes.has(str.charCodeAt(end))) end--;
                  return str.substring(start, end + 1).trim();
              }

              const cleanTarget = stripPunct(rawTarget, false);
              const coreWord = stripPunct(rawTarget, true);
              if (!cleanTarget && !coreWord) return;

              function normalizeStr(str) {
                  if (!str) return '';
                  return str
                      .replace(/[\\uff01-\\uff5e]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
                      .replace(/[\\u3000\\u00a0\\t\\r\\n]+/g, ' ')
                      .replace(/[“”«»『』]/g, '"')
                      .replace(/[‘’]/g, "'")
                      .trim();
              }

              // 2. Xác định container nội dung truyện
              const container = document.querySelector('#content, .content, .read-content, #read-content, #chapter-c, .chapter-c, .box-chap, #chapter-content, #contentbox, .txtnav, .showtxt, #chapter-detail, .muye-reader-content-novel, article, main') || document.body;

              // 3. Thu thập tất cả TextNode hợp lệ
              const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
                  acceptNode: function(node) {
                      const p = node.parentElement;
                      if (!p) return NodeFilter.FILTER_REJECT;
                      const tag = p.nodeName;
                      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'BUTTON' || (tag === 'A' && p.closest('.nav, #nav, .header, #header'))) return NodeFilter.FILTER_REJECT;
                      if (p.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"]')) return NodeFilter.FILTER_REJECT;
                      return NodeFilter.FILTER_ACCEPT;
                  }
              }, false);

              const allNodes = [];
              let n;
              while ((n = walker.nextNode())) {
                  if (n.nodeValue && n.nodeValue.trim().length > 0) {
                      allNodes.push(n);
                  }
              }

              if (allNodes.length === 0) return;

              // Vị trí tìm kiếm tiếp diễn về phía trước (tránh nhảy giật lùi ngược)
              let startIdx = 0;
              if (window.__lastTTSHighlightedNode && document.contains(window.__lastTTSHighlightedNode)) {
                  const lastIdx = allNodes.indexOf(window.__lastTTSHighlightedNode);
                  if (lastIdx !== -1) {
                      startIdx = lastIdx;
                  }
              }

              function checkNode(node) {
                  const val = node.nodeValue || '';
                  if (!val) return null;

                  // Khớp 1: Khớp chuỗi chính xác
                  const exactIdx = val.indexOf(cleanTarget);
                  if (exactIdx !== -1) {
                      return { node, startIdx: exactIdx, matchLen: cleanTarget.length };
                  }

                  // Khớp 2: Chuẩn hóa khoảng trắng & dấu câu
                  const normVal = normalizeStr(val).toLowerCase();
                  const normTarget = normalizeStr(cleanTarget).toLowerCase();
                  if (normTarget && normVal.includes(normTarget)) {
                      const simpleIdx = val.toLowerCase().indexOf(normTarget);
                      if (simpleIdx !== -1) {
                          return { node, startIdx: simpleIdx, matchLen: normTarget.length };
                      }
                      const normIdx = normVal.indexOf(normTarget);
                      return { node, startIdx: Math.max(0, Math.min(normIdx, val.length - 1)), matchLen: Math.min(normTarget.length, val.length) };
                  }

                  // Khớp 3: Khớp từ lõi
                  if (coreWord && coreWord !== cleanTarget) {
                      const coreIdx = val.indexOf(coreWord);
                      if (coreIdx !== -1) {
                          return { node, startIdx: coreIdx, matchLen: coreWord.length };
                      }
                      const normCore = normalizeStr(coreWord).toLowerCase();
                      if (normCore && normVal.includes(normCore)) {
                          const simpleCore = val.toLowerCase().indexOf(normCore);
                          if (simpleCore !== -1) {
                              return { node, startIdx: simpleCore, matchLen: normCore.length };
                          }
                          const normIdx = normVal.indexOf(normCore);
                          return { node, startIdx: Math.max(0, Math.min(normIdx, val.length - 1)), matchLen: Math.min(normCore.length, val.length) };
                      }
                  }

                  // Khớp 4: Khớp tiền tố (nếu câu dài >= 12 ký tự)
                  if (cleanTarget.length >= 12) {
                      const prefix = cleanTarget.slice(0, Math.min(25, Math.floor(cleanTarget.length * 0.7)));
                      const pIdx = val.indexOf(prefix);
                      if (pIdx !== -1) {
                          return { node, startIdx: pIdx, matchLen: Math.min(cleanTarget.length, val.length - pIdx) };
                      }
                      const normPrefix = normalizeStr(prefix).toLowerCase();
                      if (normVal.includes(normPrefix)) {
                          const spIdx = val.toLowerCase().indexOf(normPrefix);
                          if (spIdx !== -1) {
                              return { node, startIdx: spIdx, matchLen: Math.min(cleanTarget.length, val.length - spIdx) };
                          }
                      }
                  }

                  return null;
              }

              // Quét xuôi về trước từ node hiện tại
              let match = null;
              for (let i = startIdx; i < allNodes.length; i++) {
                  match = checkNode(allNodes[i]);
                  if (match) break;
              }

              // Fallback: nếu không tìm thấy phía dưới, quét từ đầu
              if (!match && startIdx > 0) {
                  for (let i = 0; i < startIdx; i++) {
                      match = checkNode(allNodes[i]);
                      if (match) break;
                  }
              }

              if (!match) return;

              const { node, startIdx: foundStart, matchLen } = match;
              window.__lastTTSHighlightedNode = node;

              // Đánh dấu nhẹ paragraph chứa câu
              const parentPara = node.parentElement ? node.parentElement.closest('p, [data-tts-idx], .tienhiep-tts-paragraph') : null;
              if (parentPara && !window.__TienHiepHelpers.isLargeContainerEl(parentPara)) {
                  document.querySelectorAll('[data-tts-active-para="true"]').forEach(p => {
                      if (p !== parentPara) {
                          p.removeAttribute('data-tts-active-para');
                          p.style.borderLeft = '';
                          p.style.paddingLeft = '';
                      }
                  });
                  parentPara.setAttribute('data-tts-active-para', 'true');
                  parentPara.style.borderLeft = '4px solid #8b5cf6';
                  parentPara.style.paddingLeft = '8px';
              }

              // Áp dụng highlight cho câu
              if (typeof CSS !== 'undefined' && CSS.highlights) {
                  try {
                      const range = new Range();
                      const safeStart = Math.max(0, Math.min(foundStart, node.nodeValue.length));
                      const safeEnd = Math.max(safeStart, Math.min(safeStart + matchLen, node.nodeValue.length));
                      range.setStart(node, safeStart);
                      range.setEnd(node, safeEnd);
                      CSS.highlights.set('tienhiep-tts-highlight', new Highlight(range));

                      const el = node.parentElement || node;
                      if (el && typeof el.scrollIntoView === 'function') {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                      return;
                  } catch(e) {}
              }

              // Fallback dùng DOM wrap
              const oldHighlight = document.getElementById('tienhiep-active-highlight');
              if (oldHighlight && oldHighlight.parentNode) {
                  const parent = oldHighlight.parentNode;
                  const textNode = document.createTextNode(oldHighlight.textContent);
                  parent.replaceChild(textNode, oldHighlight);
                  parent.normalize();
              }

              const pNode = node.parentNode;
              if (pNode) {
                  const textVal = node.nodeValue || '';
                  const safeStart = Math.max(0, Math.min(foundStart, textVal.length));
                  const safeLen = Math.min(matchLen, textVal.length - safeStart);

                  const beforeText = textVal.substring(0, safeStart);
                  const matchedText = textVal.substring(safeStart, safeStart + safeLen);
                  const afterText = textVal.substring(safeStart + safeLen);

                  const fragment = document.createDocumentFragment();
                  if (beforeText) fragment.appendChild(document.createTextNode(beforeText));

                  const span = document.createElement('span');
                  span.id = 'tienhiep-active-highlight';
                  span.className = 'tienhiep-tts-active-span';
                  span.style.cssText = 'background-color: #f59e0b !important; background: #f59e0b !important; color: #000000 !important; font-weight: 700 !important; border-radius: 4px !important; padding: 2px 4px !important; box-shadow: 0 0 14px rgba(245, 158, 11, 0.85) !important; display: inline !important; border-bottom: 2px solid #b45309 !important; transition: all 0.15s ease;';
                  span.textContent = matchedText;
                  fragment.appendChild(span);

                  if (afterText) fragment.appendChild(document.createTextNode(afterText));
                  pNode.replaceChild(fragment, node);
                  window.__lastTTSHighlightedNode = span;
                  span.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
          },

          getNovelKeys: () => {
              const effUrl = window.__TienHiepHelpers.getEffectiveUrl();
              const host = effUrl.hostname || '';
              const path = effUrl.pathname || '';
              const parts = path.split('/').filter(Boolean);
              let novelKey = host;

              if (parts.length > 1) {
                  const lastPart = parts[parts.length - 1];
                  if (lastPart.includes('.') || /^\d+$/.test(lastPart)) {
                      novelKey = host + '/' + parts.slice(0, parts.length - 1).join('/');
                  } else {
                      novelKey = host + '/' + parts.join('/');
                  }
              } else if (parts.length === 1) {
                  const onlyPart = parts[0];
                  if (!onlyPart.includes('.') && !/^\d+$/.test(onlyPart)) {
                      novelKey = host + '/' + onlyPart;
                  }
              }
              return { host, novelKey, pathname: path, url: effUrl.href };
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
              const effUrl = window.__TienHiepHelpers.getEffectiveUrl();
              const currentHref = effUrl.href;
              const currentPath = effUrl.pathname;
              const currentOrigin = (effUrl.origin && effUrl.origin !== 'null') ? effUrl.origin : undefined;
              const baseForUrl = currentOrigin || (effUrl.href && effUrl.href.startsWith('http') ? effUrl.href : undefined);

              // Danh sách từ khóa cấm tuyệt đối (không bao giờ được là nút Next)
              const negativeTextRegex = /^(目录|回目录|返回目录|目录页|首页|返回首页|书页|书目|书架|加入书签|书签|上一章|上一页|上一頁|上页|上頁|chương trước|trang trước|hồi trước|mục lục|danh sách|trang chủ|tủ sách|dấu trang)$/i;
              const negativeTextContainsRegex = /(回目录|返回目录|目录|首页|书架|书签|上一章|上一页|上一頁|chương trước|mục lục|trang chủ)/i;
              const nextKeywordRegex = /(下一章|下一页|下一頁|下页|下頁|chương sau|tiếp theo|hồi sau|trang sau|next chapter|next page)/i;

              let nextButtonPointsToBookInfo = false;

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
                      let resolved;
                      if (baseForUrl) {
                          resolved = new URL(targetHref, baseForUrl);
                      } else {
                          resolved = new URL(targetHref);
                      }
                      if (resolved.protocol === 'javascript:') return false;
                      if (resolved.href === currentHref) return false;
                      if (currentOrigin && resolved.origin === currentOrigin && resolved.pathname === currentPath && resolved.search === (effUrl.search || '')) return false;
                      
                      const candidateTxt = candidateEl ? (candidateEl.textContent || "").trim() : "";
                      const isExplicitNextBtn = nextKeywordRegex.test(candidateTxt);

                      // Nếu link trỏ về đúng thư mục gốc truyện (VD: /book/32053/ hoặc /book/32053.htm)
                      const pathTrimmed = resolved.pathname.replace(new RegExp('/+$'), '');
                      const currentPathTrimmed = currentPath.replace(new RegExp('/+$'), '');
                      const isParentBookDir = currentPathTrimmed.startsWith(pathTrimmed) && currentPathTrimmed.length > pathTrimmed.length;
                      const isBookInfoPage = new RegExp('/book/\\d+(\\.htm)?$', 'i').test(resolved.pathname);

                      if (isParentBookDir || isBookInfoPage) {
                          if (isExplicitNextBtn) {
                              nextButtonPointsToBookInfo = true;
                          }
                          return false;
                      }

                      // Kiểm tra URL có phải là trang mục lục / trang chủ không
                      if (isNegativeUrl(resolved.pathname) || isNegativeUrl(resolved.href)) return false;

                      // Nếu có phần tử, kiểm tra text của nó
                      if (candidateEl) {
                          if (negativeTextRegex.test(candidateTxt) || negativeTextContainsRegex.test(candidateTxt)) {
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

              // Nếu tìm thấy nút Chương Sau nhưng nút đó trỏ về trang giới thiệu/mục lục truyện
              // -> Đây là chương mới nhất của truyện (chưa ra chương mới)
              if (nextButtonPointsToBookInfo) {
                  return { type: 'last_chapter', source: 'Nút Chương Sau trỏ về thông tin truyện (Đã hết chương)' };
              }

              return null;
          },

          triggerNavigation: (target) => {
              if (!target) return false;
              try {
                  localStorage.setItem('__tienhiep_auto_translate_active', 'true');
              } catch(e) {}

              let destUrl = '';
              let clickEl = null;

              if (typeof target === 'string') {
                  destUrl = target;
              } else if (target.type === 'url' && target.url) {
                  destUrl = target.url;
              } else if (target.type === 'element' && target.el) {
                  clickEl = target.el;
                  const anchor = clickEl.tagName === "A" ? clickEl : (clickEl.closest('a') || clickEl.querySelector('a'));
                  if (anchor && anchor.href && !anchor.href.startsWith("javascript:")) {
                      destUrl = anchor.href;
                  }
              } else if (target.tagName) {
                  clickEl = target;
                  const anchor = clickEl.tagName === "A" ? clickEl : (clickEl.closest('a') || clickEl.querySelector('a'));
                  if (anchor && anchor.href && !anchor.href.startsWith("javascript:")) {
                      destUrl = anchor.href;
                  }
              }

              if (destUrl) {
                  let fullUrl = destUrl;
                  try {
                      const effUrl = window.__TienHiepHelpers.getEffectiveUrl();
                      const baseForNav = (effUrl.origin && effUrl.origin !== 'null' ? effUrl.origin : null) || effUrl.href;
                      if (baseForNav && baseForNav.startsWith('http')) {
                          fullUrl = new URL(destUrl, baseForNav).href;
                      } else {
                          fullUrl = new URL(destUrl, window.location.href).href;
                      }
                  } catch(e) {}

                  if (window.parent && window.parent !== window) {
                      window.parent.postMessage({ type: 'NAVIGATE_REQ', url: fullUrl }, '*');
                      return true;
                  }
                  window.location.href = fullUrl;
                  return true;
              }

              if (clickEl) {
                  clickEl.click();
                  return true;
              }
              return false;
          },
          
          checkAndTriggerAutoNext: (force = true, delaySeconds = 0) => {
              if (window.isTtsPlaying && !force) return false;

              const target = window.__TienHiepHelpers.findNextTarget();

              // Nếu đã đến chương cuối cùng hiện có của truyện
              if (target && target.type === 'last_chapter') {
                  if (window.parent && window.parent !== window) {
                      window.parent.postMessage({ type: 'LAST_CHAPTER_REACHED' }, '*');
                  }
                  const tip = document.createElement("div");
                  tip.style = "position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:12px 18px;border-radius:10px;z-index:99999;font-size:12px;font-weight:bold;box-shadow:0 4px 16px rgba(0,0,0,0.3);font-family:sans-serif;max-width:320px;";
                  tip.innerText = '🎉 Bạn đã nghe đến chương mới nhất hiện có của truyện! Hãy chờ tác giả ra chương mới.';
                  document.body.appendChild(tip);
                  setTimeout(() => tip.remove(), 5000);
                  return false;
              }

              if (target) {
                  if (window.parent && window.parent !== window) {
                      window.parent.postMessage({ type: 'NEXT_CHAPTER_FOUND' }, '*');
                  }
                  const delay = (delaySeconds !== undefined && delaySeconds !== null) ? Number(delaySeconds) : 0;
                  if (delay <= 0) {
                      return window.__TienHiepHelpers.triggerNavigation(target);
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
                      window.__TienHiepHelpers.triggerNavigation(target);
                      tip.remove();
                  }, delay * 1000);
                  return true;
              } else if (force) {
                  if (window.parent && window.parent !== window) {
                      window.parent.postMessage({ type: 'NEXT_CHAPTER_NOT_FOUND', url: window.location.href }, '*');
                  }
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
                  return window.__TienHiepHelpers.triggerNavigation(prevBtn);
              }
              return false;
          },

          startTeachNextMode: () => {
              window.__isTeachingNext = true;
              const existingBanner = document.getElementById("__teach_next_banner");
              if (existingBanner) existingBanner.remove();
              const existingBox = document.getElementById("__teach_highlighter_box");
              if (existingBox) existingBox.remove();
              const existingCrosshair = document.getElementById("__teach_crosshair_target");
              if (existingCrosshair) existingCrosshair.remove();

              // Helper gắn sự kiện cảm ứng siêu nhạy tức thì (0ms lag) cho mọi nút bấm điều khiển
              const bindInstantAction = (el, fn) => {
                  if (!el) return;
                  let isLocked = false;
                  const handler = (e) => {
                      if (isLocked) return;
                      isLocked = true;
                      setTimeout(() => { isLocked = false; }, 320);
                      try {
                          e.preventDefault();
                          e.stopPropagation();
                          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                      } catch(err) {}
                      fn(e);
                  };
                  el.addEventListener('pointerdown', handler, { passive: false, capture: true });
                  el.addEventListener('touchstart', handler, { passive: false, capture: true });
                  el.addEventListener('click', handler, { passive: false, capture: true });
              };

              // 1. Banner chỉ định nút & vùng đọc: Cố định mép trên, layout flex hàng ngang, chuẩn Touch Mobile
              const banner = document.createElement("teach-banner");
              banner.id = "__teach_next_banner";
              banner.style.cssText = "position:fixed !important;top:10px !important;left:8px !important;right:8px !important;max-width:700px !important;margin:0 auto !important;background:linear-gradient(135deg,#0f172a,#1e1b4b) !important;color:#ffffff !important;padding:8px 12px !important;border-radius:14px !important;z-index:2147483647 !important;font-size:12px !important;font-weight:bold !important;box-shadow:0 14px 40px rgba(0,0,0,0.92) !important;display:flex !important;flex-direction:row !important;align-items:center !important;justify-content:space-between !important;gap:8px !important;border:1.5px solid rgba(129,140,248,0.6) !important;font-family:system-ui,sans-serif !important;box-sizing:border-box !important;pointer-events:auto !important;-webkit-user-select:none !important;user-select:none !important;";
              banner.innerHTML = '<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;overflow:hidden;"><span id="__teach_info_text" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;color:#c7d2fe;">🎯 <b>Chỉ định:</b> Rê tâm ngắm vào Nút hoặc Vùng đọc</span></div><div style="display:flex;align-items:center;gap:6px;flex-shrink:0;"><button id="__read_from_here" style="display:none;background:linear-gradient(135deg,#8b5cf6,#6d28d9) !important;border:none !important;color:#fff !important;padding:7px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(139,92,246,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">📖 Đọc từ đây</button><button id="__scope_toggle_btn" style="display:none;background:linear-gradient(135deg,#0ea5e9,#0284c7) !important;border:none !important;color:#fff !important;padding:7px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(14,165,233,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">📦 Cả vùng</button><button id="__save_content_area" style="display:none;background:linear-gradient(135deg,#10b981,#059669) !important;border:none !important;color:#fff !important;padding:7px 12px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(16,185,129,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">✓ Lưu vùng này</button><button id="__back_to_chunk" style="display:none;background:rgba(255,255,255,0.2) !important;border:none !important;color:#fff !important;padding:7px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">📄 1 Đoạn</button><button id="__confirm_teach_next" style="display:none;background:linear-gradient(135deg,#10b981,#059669) !important;border:none !important;color:#fff !important;padding:7px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;box-shadow:0 0 12px rgba(16,185,129,0.6) !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">✓ Lưu nút</button><button id="__test_next_teach" style="display:none;background:linear-gradient(135deg,#f59e0b,#d97706) !important;border:none !important;color:#fff !important;padding:7px 9px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">⏭ Thử</button><button id="__reset_teach_next" style="background:rgba(255,255,255,0.18) !important;border:none !important;color:#fff !important;padding:7px 9px !important;border-radius:8px !important;cursor:pointer !important;font-weight:600 !important;font-size:11px !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;">Mặc định</button><button id="__cancel_teach_next" style="background:linear-gradient(135deg,#ef4444,#dc2626) !important;border:none !important;color:#fff !important;padding:7px 11px !important;border-radius:8px !important;cursor:pointer !important;font-weight:bold !important;font-size:12px !important;touch-action:manipulation !important;pointer-events:auto !important;min-height:36px !important;box-shadow:0 0 10px rgba(239,68,68,0.5) !important;">✕ Hủy</button></div>';
              document.body.appendChild(banner);

              // 2. Khung viền bôi sáng phần tử
              const highlightBox = document.createElement("teach-highlighter");
              highlightBox.id = "__teach_highlighter_box";
              highlightBox.style.cssText = "position:fixed !important;pointer-events:none !important;z-index:2147483640 !important;outline:2.5px solid #f59e0b !important;outline-offset:-1px !important;background:rgba(245,158,11,0.2) !important;box-shadow:0 0 18px rgba(245,158,11,0.7), inset 0 0 12px rgba(245,158,11,0.25) !important;border-radius:6px !important;display:none !important;box-sizing:border-box !important;will-change:top,left,width,height !important;";
              document.body.appendChild(highlightBox);

              // 2.1 Floating Detail Badge: Cố định theo góc nhìn màn hình, bám sát tâm ngắm, không bị trôi khi cuộn
              const floatingBadge = document.createElement("div");
              floatingBadge.id = "__teach_floating_badge";
              floatingBadge.style.cssText = "position:fixed !important;pointer-events:auto !important;display:none !important;background:linear-gradient(135deg,#0f172a,#1e1b4b) !important;border:1.5px solid #f59e0b !important;color:#ffffff !important;border-radius:10px !important;padding:6px 10px !important;font-size:11px !important;font-family:system-ui,sans-serif !important;white-space:nowrap !important;box-shadow:0 8px 24px rgba(0,0,0,0.92) !important;z-index:2147483647 !important;align-items:center !important;gap:8px !important;box-sizing:border-box !important;max-width:94vw !important;";
              floatingBadge.innerHTML = '<div style="display:flex;flex-direction:column;gap:2px;min-width:0;overflow:hidden;"><div style="display:flex;align-items:center;gap:5px;"><span id="__teach_badge_type_tag" style="background:#f59e0b;color:#0f172a;font-weight:900;padding:1px 5px;border-radius:4px;font-size:9px;">MỤC TIÊU</span><span id="__teach_badge_name" style="font-weight:bold;color:#fde047;max-width:140px;overflow:hidden;text-overflow:ellipsis;">...</span></div><div id="__teach_badge_sub" style="font-size:10px;color:#94a3b8;max-width:190px;overflow:hidden;text-overflow:ellipsis;">...</div></div><div style="display:flex;align-items:center;gap:4px;flex-shrink:0;"><button id="__teach_badge_prev" title="Chọn nút trước trong cụm" style="background:rgba(255,255,255,0.18) !important;border:none !important;color:#fff !important;padding:5px 8px !important;border-radius:6px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">◀</button><button id="__teach_badge_next" title="Chọn nút sau trong cụm" style="background:rgba(255,255,255,0.18) !important;border:none !important;color:#fff !important;padding:5px 8px !important;border-radius:6px !important;cursor:pointer !important;font-weight:bold !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">▶</button><button id="__teach_badge_read" style="display:none;background:linear-gradient(135deg,#8b5cf6,#6d28d9) !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 10px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">📖 Đọc</button><button id="__teach_badge_scope" style="display:none;background:linear-gradient(135deg,#0ea5e9,#0284c7) !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 9px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;min-height:30px !important;touch-action:manipulation !important;">📦 Cả vùng</button><button id="__teach_badge_save" style="background:#10b981 !important;border:none !important;color:#fff !important;font-weight:bold !important;padding:6px 10px !important;border-radius:6px !important;cursor:pointer !important;font-size:11px !important;box-shadow:0 0 10px rgba(16,185,129,0.6) !important;min-height:30px !important;touch-action:manipulation !important;">✓ Lưu</button></div>';
              document.body.appendChild(floatingBadge);

              // 3. TÂM NGẮM RÊ KÉO DI ĐỘNG (Draggable Reticle / Crosshair Target)
              const crosshair = document.createElement("teach-crosshair");
              crosshair.id = "__teach_crosshair_target";
              const initX = Math.max(10, Math.round(window.innerWidth / 2 - 34));
              const initY = Math.max(80, Math.round(window.innerHeight * 0.65 - 34));
              crosshair.style.cssText = "position:fixed !important;left:" + initX + "px !important;top:" + initY + "px !important;width:68px !important;height:68px !important;z-index:2147483646 !important;cursor:grab !important;touch-action:none !important;user-select:none !important;-webkit-user-select:none !important;display:flex !important;align-items:center !important;justify-content:center !important;border-radius:50% !important;border:3px dashed #f59e0b !important;background:rgba(245,158,11,0.25) !important;box-shadow:0 0 24px rgba(245,158,11,0.8), inset 0 0 12px rgba(245,158,11,0.3) !important;box-sizing:border-box !important;";
              crosshair.innerHTML = '<div id="__teach_ch_h" style="position:absolute;width:100%;height:2px;background:#f59e0b !important;top:50%;left:0;pointer-events:none;transform:translateY(-50%);"></div><div id="__teach_ch_v" style="position:absolute;height:100%;width:2px;background:#f59e0b !important;left:50%;top:0;pointer-events:none;transform:translateX(-50%);"></div><div id="__teach_ch_dot" style="width:16px;height:16px;border-radius:50%;background:#ef4444 !important;border:2px solid #ffffff !important;box-shadow:0 0 10px #ef4444 !important;pointer-events:none;z-index:2;"></div><div id="__teach_ch_lbl" style="position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:6px;background:#f59e0b !important;color:#0f172a !important;font-size:11px !important;font-weight:900 !important;padding:5px 12px !important;border-radius:8px !important;white-space:nowrap !important;box-shadow:0 4px 14px rgba(0,0,0,0.85) !important;pointer-events:auto !important;cursor:grab !important;touch-action:none !important;letter-spacing:0.3px !important;border:1.5px solid #ffffff !important;user-select:none !important;-webkit-user-select:none !important;">🎯 RÊ TÂM NGẮM</div>';
              document.body.appendChild(crosshair);

              let currentTarget = null;
              let currentScope = 'chunk'; // 'chunk' (1 đoạn) | 'container' (cả vùng đọc chương)
              let currentChunkTarget = null;
              let currentContainerTarget = null;
              let isTargetParagraph = false;
              let rafLoopId = null;

              // ─── TÌM VÙNG CHỨA CẢ CHƯƠNG TRUYỆN (CONTENT CONTAINER) ───
              const findContentContainer = (target) => {
                  if (!target || target === document.body || target === document.documentElement) return null;

                  // 1. Kiểm tra các selector vùng đọc phổ biến của các trang truyện
                  const NOVEL_SELECTORS = [
                      ".txtnav", "#content", "#chaptercontent", "#chapterContent", "#contentbox",
                      ".read-content", "#read-content", ".muye-reader-content-novel", "#chapter-c",
                      ".chapter-c", ".box-chap", "#chapter-detail", ".showtxt", ".novel-content",
                      ".reading-content", "article", ".entry-content", "#htmlContent", ".article-content",
                      ".page-content", ".yd_text2", "#nr1", "#BookText", "#booktxt", ".book_con",
                      "#acontent", ".reader-content", ".chapter_content", "#novelcontent", "#viewcontent",
                      "#content_text", ".content-text", "#chapter-body", ".chapter-body", "#text_content"
                  ];

                  for (const sel of NOVEL_SELECTORS) {
                      try {
                          const matched = target.closest ? target.closest(sel) : null;
                          if (matched && matched !== document.body && matched !== document.documentElement) {
                              const pCount = matched.querySelectorAll('p, [data-tts-idx]').length;
                              const txtLen = (matched.innerText || '').trim().length;
                              if (pCount >= 2 || txtLen > 150) {
                                  return matched;
                              }
                          }
                      } catch(e) {}
                  }

                  // 2. Nếu target chính là container
                  const directPCount = target.querySelectorAll ? target.querySelectorAll('p, [data-tts-idx]').length : 0;
                  if (directPCount >= 3) return target;

                  // 3. Leo ngược cây DOM tìm node tổ tiên chứa nhiều đoạn văn nhất
                  let curr = target.parentElement;
                  let bestCandidate = null;
                  let maxPCount = 0;

                  while (curr && curr !== document.body && curr !== document.documentElement) {
                      const tag = curr.tagName.toLowerCase();
                      if (tag === 'header' || tag === 'footer' || tag === 'nav' || tag === 'aside') break;

                      const id = (curr.id || '').toLowerCase();
                      const cls = typeof curr.className === 'string' ? curr.className.toLowerCase() : '';
                      if (id === 'app' || id === '__next' || id === 'root') break;

                      const pCount = curr.querySelectorAll('p, [data-tts-idx]').length;
                      const textLen = (curr.innerText || '').trim().length;

                      if (/(content|chapter|read|article|txtnav|showtxt|booktext|yd_text)/i.test(id + ' ' + cls)) {
                          if (pCount >= 2 || textLen > 200) {
                              return curr;
                          }
                      }

                      if (pCount >= 3 && pCount >= maxPCount) {
                          maxPCount = pCount;
                          bestCandidate = curr;
                      }

                      curr = curr.parentElement;
                  }

                  return bestCandidate || target.parentElement || target;
              };

              const generateContainerSelector = (el) => {
                  if (!el || el === document.body || el === document.documentElement) return '';

                  // 1. Nhận diện các class / ID container truyện tiêu chuẩn
                  const STANDARD_CONTAINERS = [
                      '.txtnav', '#content', '#chaptercontent', '#chapterContent',
                      '.read-content', '#read-content', '.muye-reader-content-novel',
                      '#chapter-c', '.chapter-c', '.box-chap', '#chapter-detail',
                      '.showtxt', '.novel-content', '.reading-content', 'article'
                  ];
                  for (const std of STANDARD_CONTAINERS) {
                      try {
                          if (el.matches && el.matches(std)) return std;
                          const closest = el.closest ? el.closest(std) : null;
                          if (closest && closest !== document.body && closest !== document.documentElement) {
                              return std;
                          }
                      } catch(e) {}
                  }

                  // 2. ID: Bỏ qua các ID chứa số chương ngẫu nhiên (VD: #content_41051913 hoặc #chapter-568)
                  if (el.id && !/\d{4,}/.test(el.id)) {
                      return '#' + el.id;
                  }

                  // 3. Class độc nhất không chứa số ngẫu nhiên
                  if (el.className && typeof el.className === 'string') {
                      const classes = el.className.trim().split(/\s+/).filter(c => c && !c.includes(':') && !c.includes('/') && !/\d{4,}/.test(c));
                      if (classes.length > 0) {
                          for (const cls of classes) {
                              const singleClass = '.' + cls;
                              try {
                                  if (document.querySelectorAll(singleClass).length === 1) return singleClass;
                              } catch(e) {}
                          }
                          if (classes.length > 1) {
                              const combined = '.' + classes.slice(0, 2).join('.');
                              try {
                                  if (document.querySelectorAll(combined).length === 1) return combined;
                              } catch(e) {}
                          }
                      }
                  }

                  // 4. Nếu node cha có ID chuẩn
                  if (el.parentElement && el.parentElement.id && !/\d{4,}/.test(el.parentElement.id)) {
                      return '#' + el.parentElement.id + ' > ' + el.tagName.toLowerCase();
                  }

                  const tag = el.tagName.toLowerCase();
                  if (tag === 'article') return 'article';
                  const firstCls = el.className && typeof el.className === 'string' ? el.className.trim().split(/\s+/).find(c => c && !/\d{4,}/.test(c)) : '';
                  return tag + (firstCls ? '.' + firstCls : '');
              };

              // Tinh chỉnh mục tiêu: Nhận diện Nút Chuyển Trang HOẶC Đoạn Văn Bản Đọc theo cây HTML
              const refineToBestTarget = (rawEl, cx, cy) => {
                  if (!rawEl || rawEl === document.body || rawEl === document.documentElement) return null;
                  
                  // Nếu trúng link A hoặc BUTTON hoặc con của chúng
                  const directAnchor = rawEl.tagName === 'A' ? rawEl : rawEl.closest('a');
                  if (directAnchor) return directAnchor;
                  
                  const directBtn = rawEl.tagName === 'BUTTON' ? rawEl : rawEl.closest('button');
                  if (directBtn) return directBtn;

                  // Nếu là đoạn văn bản (P, có [data-tts-idx], hoặc text node)
                  const pEl = rawEl.tagName === 'P' ? rawEl : (rawEl.closest('[data-tts-idx]') || rawEl.closest('p'));
                  if (pEl) return pEl;

                  // Nếu là container chứa các link (chỉ khi KHÔNG chứa nhiều đoạn văn bản p)
                  const pCountInRaw = rawEl.querySelectorAll ? rawEl.querySelectorAll('p, [data-tts-idx]').length : 0;
                  if (pCountInRaw === 0) {
                      const candidateLinks = Array.from(rawEl.querySelectorAll('a[href], button, [role="button"]')).filter(el => {
                          const r = el.getBoundingClientRect();
                          return r.width > 0 && r.height > 0;
                      });

                      if (candidateLinks.length > 0) {
                          const nextRel = candidateLinks.find(a => a.getAttribute('rel') === 'next');
                          if (nextRel) return nextRel;

                          const nextKwRegex = /(下一章|下一页|下一頁|下页|下頁|chương sau|tiếp theo|hồi sau|trang sau|next chapter|next page|sau|trang kế)/i;
                          const nextKw = candidateLinks.find(a => nextKwRegex.test((a.textContent || '').trim()));
                          if (nextKw) return nextKw;

                          if (cx !== undefined && cy !== undefined) {
                              let closest = candidateLinks[0];
                              let minDist = Infinity;
                              candidateLinks.forEach(a => {
                                  const r = a.getBoundingClientRect();
                                  const acx = r.left + r.width / 2;
                                  const acy = r.top + r.height / 2;
                                  const d = Math.hypot(cx - acx, cy - acy);
                                  if (d < minDist) {
                                      minDist = d;
                                      closest = a;
                                  }
                              });
                              return closest;
                          }
                          return candidateLinks[candidateLinks.length - 1];
                      }
                  }

                  return rawEl;
              };

              const updateHighlight = () => {
                  if (!currentTarget) {
                      highlightBox.style.setProperty("display", "none", "important");
                      floatingBadge.style.setProperty("display", "none", "important");
                      return;
                  }
                  const rect = currentTarget.getBoundingClientRect();
                  if (rect.width > 0 && rect.height > 0) {
                      highlightBox.style.setProperty("display", "block", "important");
                      highlightBox.style.setProperty("left", rect.left + "px", "important");
                      highlightBox.style.setProperty("top", rect.top + "px", "important");
                      highlightBox.style.setProperty("width", rect.width + "px", "important");
                      highlightBox.style.setProperty("height", rect.height + "px", "important");

                      // Định kiểu khung viền theo chế độ (Chunk = Vàng cam, Container = Xanh Cyan rực rỡ)
                      if (currentScope === 'container') {
                          highlightBox.style.setProperty("outline", "3.5px solid #0ea5e9", "important");
                          highlightBox.style.setProperty("background", "rgba(14,165,233,0.18)", "important");
                          highlightBox.style.setProperty("box-shadow", "0 0 25px rgba(14,165,233,0.85), inset 0 0 18px rgba(14,165,233,0.22)", "important");
                          floatingBadge.style.setProperty("border", "1.5px solid #0ea5e9", "important");
                      } else {
                          highlightBox.style.setProperty("outline", "2.5px solid #f59e0b", "important");
                          highlightBox.style.setProperty("background", "rgba(245,158,11,0.2)", "important");
                          highlightBox.style.setProperty("box-shadow", "0 0 18px rgba(245,158,11,0.7), inset 0 0 12px rgba(245,158,11,0.25)", "important");
                          floatingBadge.style.setProperty("border", "1.5px solid #f59e0b", "important");
                      }

                      // FloatingBadge luôn bám sát tâm ngắm Crosshair, không bị trôi khi cuộn khối dài
                      floatingBadge.style.setProperty("display", "flex", "important");
                      const chRect = crosshair.getBoundingClientRect();
                      let badgeTop = chRect.bottom + 12;
                      if (badgeTop + 55 > window.innerHeight) {
                          badgeTop = Math.max(50, chRect.top - 58);
                      }
                      let badgeLeft = Math.max(8, Math.min(window.innerWidth - 330, chRect.left + 34 - 150));
                      floatingBadge.style.setProperty("top", badgeTop + "px", "important");
                      floatingBadge.style.setProperty("left", badgeLeft + "px", "important");
                  } else {
                      highlightBox.style.setProperty("display", "none", "important");
                      floatingBadge.style.setProperty("display", "none", "important");
                  }
              };

              const startRafLoop = () => {
                  if (rafLoopId) return;
                  const loop = () => {
                      updateHighlight();
                      if (currentTarget) {
                          rafLoopId = requestAnimationFrame(loop);
                      } else {
                          rafLoopId = null;
                      }
                  };
                  rafLoopId = requestAnimationFrame(loop);
              };

              const stopRafLoop = () => {
                  if (rafLoopId) {
                      cancelAnimationFrame(rafLoopId);
                      rafLoopId = null;
                  }
              };

              // Cập nhật giao diện khi thay đổi target hoặc đổi scope (Chunk vs Container)
              const updateTargetUI = () => {
                  if (!currentTarget) return;

                  const infoText = document.getElementById("__teach_info_text");
                  const confirmBtn = document.getElementById("__confirm_teach_next");
                  const readBtn = document.getElementById("__read_from_here");
                  const scopeToggleBtn = document.getElementById("__scope_toggle_btn");
                  const saveContentBtn = document.getElementById("__save_content_area");
                  const backToChunkBtn = document.getElementById("__back_to_chunk");
                  const testNextBtn = document.getElementById("__test_next_teach");
                  const badgeTypeTag = document.getElementById("__teach_badge_type_tag");
                  const badgeName = document.getElementById("__teach_badge_name");
                  const badgeSub = document.getElementById("__teach_badge_sub");
                  const badgePrevBtn = document.getElementById("__teach_badge_prev");
                  const badgeNextBtn = document.getElementById("__teach_badge_next");
                  const badgeSaveBtn = document.getElementById("__teach_badge_save");
                  const badgeReadBtn = document.getElementById("__teach_badge_read");
                  const badgeScopeBtn = document.getElementById("__teach_badge_scope");

                  const isLinkOrBtn = !!currentTarget.closest('a, button, [role="button"], [id*="next"], [class*="next"]');
                  const textContent = (currentTarget.textContent || "").trim();
                  const textSnippet = textContent.slice(0, 22);
                  const tag = currentTarget.tagName.toLowerCase();

                  if (isLinkOrBtn) {
                      // Nhắm vào Nút Chuyển Trang
                      const idStr = currentTarget.id ? ('#' + currentTarget.id) : '';
                      const href = currentTarget.href || (currentTarget.querySelector ? (currentTarget.querySelector('a') || {}).href : '') || '';
                      const hrefSnippet = href ? ' → ' + href.split('/').slice(-1)[0] : '';
                      const displayName = textSnippet || (tag + idStr);

                      if (badgeTypeTag) {
                          badgeTypeTag.textContent = "NÚT CHUYỂN";
                          badgeTypeTag.style.background = "#10b981";
                      }
                      if (infoText) {
                          infoText.innerHTML = '🎯 Đã nhắm nút: <b style="color:#fde047;">' + displayName + '</b>' + (hrefSnippet ? ' <span style="opacity:0.75;">' + hrefSnippet + '</span>' : '');
                      }
                      if (badgePrevBtn) badgePrevBtn.style.setProperty("display", "inline-flex", "important");
                      if (badgeNextBtn) badgeNextBtn.style.setProperty("display", "inline-flex", "important");
                      if (readBtn) readBtn.style.setProperty("display", "none", "important");
                      if (scopeToggleBtn) scopeToggleBtn.style.setProperty("display", "none", "important");
                      if (saveContentBtn) saveContentBtn.style.setProperty("display", "none", "important");
                      if (backToChunkBtn) backToChunkBtn.style.setProperty("display", "none", "important");
                      if (badgeReadBtn) badgeReadBtn.style.setProperty("display", "none", "important");
                      if (badgeScopeBtn) badgeScopeBtn.style.setProperty("display", "none", "important");

                      if (confirmBtn) {
                          confirmBtn.style.setProperty("display", "inline-flex", "important");
                          confirmBtn.innerHTML = '✓ Lưu nút: ' + (textSnippet ? ('"' + textSnippet.slice(0, 10) + '"') : tag);
                      }
                      if (badgeSaveBtn) {
                          badgeSaveBtn.style.setProperty("display", "inline-flex", "important");
                          badgeSaveBtn.innerHTML = '✓ Lưu';
                          badgeSaveBtn.style.background = "#10b981";
                      }
                      if (testNextBtn) testNextBtn.style.setProperty("display", "inline-flex", "important");
                      if (badgeName) badgeName.textContent = displayName;
                      if (badgeSub) badgeSub.textContent = (tag + idStr) + (hrefSnippet ? hrefSnippet : '');
                  } else if (currentScope === 'container') {
                      // ── CHẾ ĐỘ CẢ VÙNG ĐỌC (CONTAINER MODE): ÔM TRỌN 100% CÁC ĐOẠN VĂN CỦA CHƯƠNG ──
                      const container = currentTarget;
                      const pCount = container.querySelectorAll ? container.querySelectorAll('p, [data-tts-idx]').length : 0;
                      const textLen = (container.innerText || "").trim().length;
                      const sel = generateContainerSelector(container);

                      if (badgeTypeTag) {
                          badgeTypeTag.textContent = "📦 CẢ VÙNG ĐỌC";
                          badgeTypeTag.style.background = "#0ea5e9";
                      }
                      if (badgeName) badgeName.textContent = sel || 'Vùng chứa truyện';
                      if (badgeSub) badgeSub.textContent = (pCount > 0 ? ('Gồm ' + pCount + ' đoạn văn • ') : '') + textLen.toLocaleString('vi-VN') + ' ký tự';

                      if (infoText) {
                          infoText.innerHTML = '🎯 <b>Vùng chứa cả chương:</b> <b style="color:#38bdf8;">' + (sel || 'Khối truyện') + '</b> (' + pCount + ' đoạn • ' + textLen.toLocaleString('vi-VN') + ' chữ)';
                      }

                      if (badgePrevBtn) badgePrevBtn.style.setProperty("display", "none", "important");
                      if (badgeNextBtn) badgeNextBtn.style.setProperty("display", "none", "important");
                      if (readBtn) readBtn.style.setProperty("display", "none", "important");
                      if (confirmBtn) confirmBtn.style.setProperty("display", "none", "important");
                      if (testNextBtn) testNextBtn.style.setProperty("display", "none", "important");

                      if (scopeToggleBtn) scopeToggleBtn.style.setProperty("display", "none", "important");
                      if (saveContentBtn) {
                          saveContentBtn.style.setProperty("display", "inline-flex", "important");
                          saveContentBtn.innerHTML = '✓ Lưu vùng này';
                      }
                      if (backToChunkBtn) {
                          backToChunkBtn.style.setProperty("display", "inline-flex", "important");
                          backToChunkBtn.innerHTML = '📄 1 Đoạn';
                      }

                      if (badgeReadBtn) badgeReadBtn.style.setProperty("display", "none", "important");
                      if (badgeScopeBtn) {
                          badgeScopeBtn.style.setProperty("display", "inline-flex", "important");
                          badgeScopeBtn.innerHTML = '📄 1 Đoạn';
                          badgeScopeBtn.style.background = "rgba(255,255,255,0.2)";
                      }
                      if (badgeSaveBtn) {
                          badgeSaveBtn.style.setProperty("display", "inline-flex", "important");
                          badgeSaveBtn.innerHTML = '✓ Lưu vùng này';
                          badgeSaveBtn.style.background = "#10b981";
                      }
                  } else {
                      // ── CHẾ ĐỘ 1 ĐOẠN (CHUNK MODE): NHẮM VÀO 1 ĐOẠN ĐƠN LẺ ĐỂ ĐỌC HOẶC MỞ RỘNG VÙNG ──
                      let paraIdx = parseInt(currentTarget.getAttribute('data-tts-idx'));
                      let totalParas = document.querySelectorAll('[data-tts-idx]').length;
                      if (isNaN(paraIdx) || totalParas === 0) {
                          const allP = Array.from(document.querySelectorAll('p'));
                          paraIdx = allP.indexOf(currentTarget);
                          totalParas = allP.length;
                      }
                      const stepDisplay = (paraIdx >= 0) ? ('Đoạn ' + (paraIdx + 1)) : 'Đoạn văn';
                      const stepSub = (paraIdx >= 0 && totalParas > 0) ? ('Bước ' + (paraIdx + 1) + '/' + totalParas) : 'Đoạn đọc theo cây HTML';

                      if (badgeTypeTag) {
                          badgeTypeTag.textContent = stepDisplay.toUpperCase();
                          badgeTypeTag.style.background = "#8b5cf6";
                      }
                      if (infoText) {
                          infoText.innerHTML = '🎯 <b>' + stepDisplay + ':</b> <span style="color:#c4b5fd;">\"' + textSnippet + '...\"</span>';
                      }
                      if (badgePrevBtn) badgePrevBtn.style.setProperty("display", "inline-flex", "important");
                      if (badgeNextBtn) badgeNextBtn.style.setProperty("display", "inline-flex", "important");
                      if (confirmBtn) confirmBtn.style.setProperty("display", "none", "important");
                      if (testNextBtn) testNextBtn.style.setProperty("display", "none", "important");
                      if (saveContentBtn) saveContentBtn.style.setProperty("display", "none", "important");
                      if (backToChunkBtn) backToChunkBtn.style.setProperty("display", "none", "important");

                      if (readBtn) {
                          readBtn.style.setProperty("display", "inline-flex", "important");
                          readBtn.innerHTML = '📖 Đọc từ đây';
                      }
                      if (scopeToggleBtn) {
                          scopeToggleBtn.style.setProperty("display", "inline-flex", "important");
                          scopeToggleBtn.innerHTML = '📦 Cả vùng';
                      }

                      if (badgeReadBtn) {
                          badgeReadBtn.style.setProperty("display", "inline-flex", "important");
                          badgeReadBtn.innerHTML = '📖 Đọc';
                      }
                      if (badgeScopeBtn) {
                          badgeScopeBtn.style.setProperty("display", "inline-flex", "important");
                          badgeScopeBtn.innerHTML = '📦 Cả vùng';
                          badgeScopeBtn.style.background = "linear-gradient(135deg,#0ea5e9,#0284c7)";
                      }
                      if (badgeSaveBtn) badgeSaveBtn.style.setProperty("display", "none", "important");

                      if (badgeName) badgeName.textContent = textSnippet ? ('\"' + textSnippet + '...\"') : stepDisplay;
                      if (badgeSub) badgeSub.textContent = stepSub + ' • Bấm "📦 Cả vùng" để ôm trọn cả bài';
                  }
              };

              // Chuyển đổi giữa Chế độ Đoạn (1 chunk) và Chế độ Vùng Chứa (Container cả chương)
              const applyTargetScope = (newScope) => {
                  currentScope = newScope;
                  if (currentScope === 'container') {
                      const container = currentContainerTarget || (currentChunkTarget ? findContentContainer(currentChunkTarget) : null) || (currentTarget ? findContentContainer(currentTarget) : null);
                      if (container) {
                          currentTarget = container;
                          currentContainerTarget = container;
                      }
                  } else {
                      const chunk = currentChunkTarget || (currentTarget ? (currentTarget.tagName === 'P' ? currentTarget : currentTarget.querySelector('p')) : null);
                      if (chunk) {
                          currentTarget = chunk;
                          currentChunkTarget = chunk;
                      }
                  }
                  updateTargetUI();
                  updateHighlight();
              };

              const handleTargetCandidate = (rawTarget, cx, cy) => {
                  if (!rawTarget) return;
                  if (rawTarget.closest && rawTarget.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]')) {
                      return;
                  }

                  const target = refineToBestTarget(rawTarget, cx, cy);
                  if (!target || target === document.body || target === document.documentElement) {
                      return;
                  }

                  const isLinkOrBtn = !!target.closest('a, button, [role="button"], [id*="next"], [class*="next"]');
                  const textContent = (target.textContent || "").trim();
                  isTargetParagraph = !isLinkOrBtn && (target.tagName === 'P' || target.hasAttribute('data-tts-idx') || textContent.length > 15);

                  if (isTargetParagraph) {
                      currentChunkTarget = target;
                      currentContainerTarget = findContentContainer(target);
                      if (currentScope === 'container' && currentContainerTarget) {
                          currentTarget = currentContainerTarget;
                      } else {
                          currentTarget = target;
                      }
                  } else {
                      currentTarget = target;
                  }

                  startRafLoop();
                  updateTargetUI();
                  updateHighlight();
              };

              // Chuyển đổi giữa các nút hoặc các đoạn văn bản kế tiếp / trước đó
              const shiftTargetSibling = (dir) => {
                  if (!currentTarget) return;
                  if (isTargetParagraph) {
                      const allParas = Array.from(document.querySelectorAll('[data-tts-idx], p')).filter(el => {
                          const r = el.getBoundingClientRect();
                          return r.width > 0 && r.height > 0 && (el.textContent || '').trim().length > 5;
                      });
                      if (allParas.length > 1) {
                          let currIdx = allParas.indexOf(currentTarget);
                          if (currIdx === -1) currIdx = 0;
                          let nextIdx = currIdx + dir;
                          if (nextIdx < 0) nextIdx = allParas.length - 1;
                          if (nextIdx >= allParas.length) nextIdx = 0;
                          currentTarget = allParas[nextIdx];
                          handleTargetCandidate(currentTarget);
                          currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          return;
                      }
                  }

                  const parent = currentTarget.parentElement;
                  if (!parent) return;
                  const siblings = Array.from(parent.querySelectorAll('a, button, [role="button"], p')).filter(el => {
                      const r = el.getBoundingClientRect();
                      return r.width > 0 && r.height > 0;
                  });
                  if (siblings.length <= 1) return;
                  const currIdx = siblings.indexOf(currentTarget);
                  if (currIdx === -1) return;
                  let nextIdx = currIdx + dir;
                  if (nextIdx < 0) nextIdx = siblings.length - 1;
                  if (nextIdx >= siblings.length) nextIdx = 0;
                  currentTarget = siblings[nextIdx];
                  handleTargetCandidate(currentTarget);
              };

              // Quét phần tử dưới tâm ngắm bằng elementsFromPoint
              const detectUnderCrosshair = (centerX, centerY) => {
                  let elements = [];
                  if (typeof document.elementsFromPoint === 'function') {
                      elements = document.elementsFromPoint(centerX, centerY) || [];
                  } else {
                      crosshair.style.setProperty("display", "none", "important");
                      const single = document.elementFromPoint(centerX, centerY);
                      crosshair.style.setProperty("display", "flex", "important");
                      if (single) elements = [single];
                  }
                  for (const el of elements) {
                      if (!el) continue;
                      if (el === crosshair || crosshair.contains(el)) continue;
                      if (el === banner || banner.contains(el)) continue;
                      if (el === highlightBox || highlightBox.contains(el)) continue;
                      if (el === floatingBadge || floatingBadge.contains(el)) continue;
                      handleTargetCandidate(el, centerX, centerY);
                      break;
                  }
              };

              // Dragging Logic cho Crosshair
              let isDraggingCrosshair = false;
              let dragOffset = { x: 34, y: 34 };

              const onDragMove = (clientX, clientY) => {
                  if (!isDraggingCrosshair) return;
                  const newLeft = Math.max(0, Math.min(window.innerWidth - 68, clientX - dragOffset.x));
                  const newTop = Math.max(45, Math.min(window.innerHeight - 68, clientY - dragOffset.y));
                  crosshair.style.setProperty("left", newLeft + "px", "important");
                  crosshair.style.setProperty("top", newTop + "px", "important");

                  const centerX = newLeft + 34;
                  const centerY = newTop + 34;
                  detectUnderCrosshair(centerX, centerY);
              };

              const startDrag = (clientX, clientY) => {
                  isDraggingCrosshair = true;
                  crosshair.style.cursor = 'grabbing';
                  const rect = crosshair.getBoundingClientRect();
                  dragOffset.x = clientX - rect.left;
                  dragOffset.y = clientY - rect.top;
              };

              const endDrag = () => {
                  if (isDraggingCrosshair) {
                      isDraggingCrosshair = false;
                      crosshair.style.cursor = 'grab';
                  }
              };

              // Pointer Events Native
              crosshair.addEventListener("pointerdown", (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startDrag(e.clientX, e.clientY);
                  try { crosshair.setPointerCapture(e.pointerId); } catch(err) {}
              });

              crosshair.addEventListener("pointermove", (e) => {
                  if (!isDraggingCrosshair) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onDragMove(e.clientX, e.clientY);
              });

              const onPointerEnd = (e) => {
                  if (!isDraggingCrosshair) return;
                  endDrag();
                  try { crosshair.releasePointerCapture(e.pointerId); } catch(err) {}
              };
              crosshair.addEventListener("pointerup", onPointerEnd);
              crosshair.addEventListener("pointercancel", onPointerEnd);

              // Touch Events Fallback
              crosshair.addEventListener("touchstart", (e) => {
                  if (e.touches && e.touches[0]) {
                      e.preventDefault();
                      e.stopPropagation();
                      startDrag(e.touches[0].clientX, e.touches[0].clientY);
                  }
              }, { passive: false });

              const onTouchMove = (e) => {
                  if (isDraggingCrosshair && e.touches && e.touches[0]) {
                      e.preventDefault();
                      e.stopPropagation();
                      onDragMove(e.touches[0].clientX, e.touches[0].clientY);
                  }
              };
              window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
              window.addEventListener("touchend", endDrag, { passive: true, capture: true });
              window.addEventListener("touchcancel", endDrag, { passive: true, capture: true });

              crosshair.addEventListener("mousedown", (e) => {
                  if (e.button === 0) {
                      e.preventDefault();
                      e.stopPropagation();
                      startDrag(e.clientX, e.clientY);
                  }
              });

              const onMouseMove = (e) => {
                  if (isDraggingCrosshair) onDragMove(e.clientX, e.clientY);
              };
              document.addEventListener("mousemove", onMouseMove);
              document.addEventListener("mouseup", endDrag);

              // Khởi chạy quét lần đầu ngay tại vị trí khởi tạo
              setTimeout(() => {
                  detectUnderCrosshair(initX + 34, initY + 34);
              }, 150);

              const generateSmartRule = (target) => {
                  const anchor = target.tagName === 'A' ? target : (target.closest('a') || target.querySelector('a') || target);
                  const selectors = [];
                  let containerSelector = '';
                  let childIndex = undefined;

                  const rawHref = (anchor && anchor.getAttribute) ? anchor.getAttribute('href') : '';
                  const text = (target.textContent || (anchor ? anchor.textContent : '') || '').trim();

                  let urlPattern = null;
                  if (rawHref && !rawHref.startsWith('javascript:')) {
                      const m = rawHref.match(new RegExp('^(.*?)(\\\\d+)(\\\\.[a-zA-Z]+|/)?$'));
                      if (m) {
                          urlPattern = { prefix: m[1], suffix: m[3] || '' };
                      }
                  }

                  if (anchor && anchor.id) selectors.push('#' + anchor.id);
                  if (anchor && anchor.getAttribute && anchor.getAttribute('rel') === 'next') selectors.push('a[rel="next"]');

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

                  if (anchor && anchor.className && typeof anchor.className === 'string') {
                      const classes = anchor.className.trim().split(/\s+/).filter(c => c && !c.includes(':'));
                      if (classes.length > 0) selectors.push(anchor.tagName.toLowerCase() + '.' + classes[0]);
                  }

                  if (anchor && anchor.tagName) selectors.push(anchor.tagName.toLowerCase());
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

              // Hành động: Lưu nút chuyển trang vào Queue rules theo tên miền
              const saveAndApplyRule = (target) => {
                  if (!target) return;
                  const ruleData = generateSmartRule(target);
                  window.__TienHiepHelpers.saveNextRule(ruleData);

                  cleanup();
                  banner.style.background = "linear-gradient(135deg,#10b981,#059669)";
                  banner.innerHTML = "<span>✅ Đã lưu nút Chuyển Trang vào bộ nhớ theo tên miền! Tự chuyển trang...</span>";
                  setTimeout(() => {
                      banner.remove();
                      const navigated = window.__TienHiepHelpers.triggerNavigation(target);
                      if (!navigated) {
                          window.__TienHiepHelpers.checkAndTriggerAutoNext(true);
                      }
                  }, 700);
              };

              // Hành động: Lưu vùng đọc theo cây DOM cho toàn bộ tên miền
              const saveContentAreaRule = (target) => {
                  if (!target) return;
                  const container = (currentScope === 'container' && target) ? target : findContentContainer(target);
                  if (!container) return;
                  const selector = generateContainerSelector(container);
                  const pCount = container.querySelectorAll ? container.querySelectorAll('p, [data-tts-idx]').length : 0;
                  const host = window.__TienHiepHelpers.getEffectiveUrl().hostname || window.location.hostname || '';
                  if (host && selector) {
                      try {
                          localStorage.setItem('__tienhiep_content_selector_' + host, selector);
                      } catch(e) {}
                  }

                  // Hiệu ứng viền xanh lá chớp sáng xác nhận
                  highlightBox.style.setProperty("outline", "4px solid #10b981", "important");
                  highlightBox.style.setProperty("background", "rgba(16,185,129,0.25)", "important");
                  highlightBox.style.setProperty("box-shadow", "0 0 35px rgba(16,185,129,0.95)", "important");

                  // Chạy lại gán chỉ mục data-tts-idx cho các đoạn văn trong vùng mới
                  if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
                      window.__TienHiepHelpers.indexParagraphsForTTS();
                  }

                  // Gửi thông điệp lên React App / BrowserContext
                  if (window.parent && window.parent !== window) {
                      window.parent.postMessage({ type: 'CONTENT_AREA_SAVED', selector, host }, '*');
                  }

                  banner.style.background = "linear-gradient(135deg,#059669,#10b981)";
                  banner.innerHTML = "<span>✅ Đã lưu vùng đọc: <b>" + selector + "</b> (" + pCount + " đoạn văn) cho tên miền này!</span>";
                  setTimeout(() => {
                      cleanup();
                      banner.remove();
                  }, 1200);
              };

              // Hành động: Đọc từ đoạn văn bản đã chọn (chỉ định chính xác bước / đoạn)
              const readFromTargetParagraph = (target) => {
                  if (!target) return;
                  let paraIdx = parseInt(target.getAttribute('data-tts-idx'));
                  if (isNaN(paraIdx)) {
                      const allParas = Array.from(document.querySelectorAll('[data-tts-idx]'));
                      paraIdx = allParas.indexOf(target);
                      if (paraIdx === -1) {
                          const allP = Array.from(document.querySelectorAll('p'));
                          paraIdx = allP.indexOf(target);
                      }
                  }
                  if (paraIdx < 0) paraIdx = 0;

                  // Highlight ngay lập tức trên DOM
                  if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.highlightActiveParagraph === 'function') {
                      window.__TienHiepHelpers.highlightActiveParagraph(paraIdx);
                  }

                  const sentenceSnippet = (target.textContent || '').trim().slice(0, 80);
                  // Bắn thông điệp lên parent window để AudioPlayer bắt đầu đọc từ bước/đoạn này
                  if (window.parent && window.parent !== window) {
                      window.parent.postMessage({ type: 'START_TTS_FROM_PARAGRAPH', paraIdx, sentenceText: sentenceSnippet }, '*');
                  }

                  cleanup();
                  banner.style.background = "linear-gradient(135deg,#8b5cf6,#6d28d9)";
                  banner.innerHTML = "<span>📖 Bắt đầu đọc từ bước " + (paraIdx + 1) + "...</span>";
                  setTimeout(() => { banner.remove(); }, 800);
              };

              // Chạm trực tiếp vào phần tử trên trang để di chuyển tâm ngắm đến đó (Tap-to-Target)
              let tapStartX = 0;
              let tapStartY = 0;
              let tapStartTime = 0;

              const onDocTouchStart = (e) => {
                  if (!window.__isTeachingNext || !e.touches || !e.touches[0]) return;
                  const isControl = e.target && e.target.closest && e.target.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]');
                  if (isControl) return;
                  tapStartTime = Date.now();
                  tapStartX = e.touches[0].clientX;
                  tapStartY = e.touches[0].clientY;
              };

              const onDirectTap = (e) => {
                  if (!window.__isTeachingNext) return;
                  const isControl = e.target && e.target.closest && e.target.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]');
                  if (isControl) return;

                  // Chặn đứng hoàn toàn mọi click / nhảy link của trang web trong lúc đang nhắm
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();

                  let clientX = e.clientX;
                  let clientY = e.clientY;
                  if ((clientX === undefined || clientY === undefined) && e.changedTouches && e.changedTouches[0]) {
                      clientX = e.changedTouches[0].clientX;
                      clientY = e.changedTouches[0].clientY;
                  }

                  let target = refineToBestTarget(e.target, clientX, clientY);
                  if (!target && clientX !== undefined && clientY !== undefined) {
                      const els = document.elementsFromPoint ? document.elementsFromPoint(clientX, clientY) : [document.elementFromPoint(clientX, clientY)];
                      for (const el of els) {
                          if (el && !el.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"]')) {
                              target = refineToBestTarget(el, clientX, clientY);
                              if (target) break;
                          }
                      }
                  }

                  if (target && target !== document.body && target !== document.documentElement) {
                      const rect = target.getBoundingClientRect();
                      const targetX = Math.max(0, Math.min(window.innerWidth - 68, rect.left + rect.width / 2 - 34));
                      const targetY = Math.max(45, Math.min(window.innerHeight - 68, rect.top + rect.height / 2 - 34));
                      crosshair.style.setProperty("left", targetX + "px", "important");
                      crosshair.style.setProperty("top", targetY + "px", "important");
                      handleTargetCandidate(target, clientX, clientY);
                  }
              };

              const onDocTouchEnd = (e) => {
                  if (!window.__isTeachingNext) return;
                  const isControl = e.target && e.target.closest && e.target.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"], [id^="__confirm"], [id^="__cancel"], [id^="__reset"], [id^="__read"], [id^="__test"], [id^="__save_content"], [id^="__scope"], [id^="__back"]');
                  if (isControl) return;

                  const touch = (e.changedTouches && e.changedTouches[0]) || null;
                  if (touch && (Date.now() - tapStartTime < 450)) {
                      const dist = Math.hypot(touch.clientX - tapStartX, touch.clientY - tapStartY);
                      if (dist < 18) {
                          onDirectTap(e);
                      }
                  }
              };

              window.addEventListener("touchstart", onDocTouchStart, { passive: true, capture: true });
              window.addEventListener("touchend", onDocTouchEnd, { passive: false, capture: true });
              window.addEventListener("click", onDirectTap, { passive: false, capture: true });

              const cleanup = () => {
                  window.__isTeachingNext = false;
                  currentTarget = null;
                  currentChunkTarget = null;
                  currentContainerTarget = null;
                  currentScope = 'chunk';
                  stopRafLoop();
                  window.removeEventListener("touchstart", onDocTouchStart, { passive: true, capture: true });
                  window.removeEventListener("touchend", onDocTouchEnd, { passive: false, capture: true });
                  window.removeEventListener("click", onDirectTap, { passive: false, capture: true });
                  window.removeEventListener("touchmove", onTouchMove, { passive: false, capture: true });
                  window.removeEventListener("touchend", endDrag, { passive: true, capture: true });
                  window.removeEventListener("touchcancel", endDrag, { passive: true, capture: true });
                  document.removeEventListener("mousemove", onMouseMove);
                  document.removeEventListener("mouseup", endDrag);
                  if (highlightBox) highlightBox.remove();
                  if (floatingBadge) floatingBadge.remove();
                  if (crosshair) crosshair.remove();
              };

              // ── GẮN SỰ KIỆN TỨC THÌ (INSTANT TOUCH) CHO TẤT CẢ CÁC NÚT TRÊN BANNER & BADGE ──
              // 1. Nút Đỏ Hủy Tâm Ngắm
              const cancelBtn = document.getElementById("__cancel_teach_next");
              bindInstantAction(cancelBtn, () => {
                  cleanup();
                  banner.remove();
              });

              // 2. Nút Mặc định (Khôi phục cài đặt gốc)
              const resetBtn = document.getElementById("__reset_teach_next");
              bindInstantAction(resetBtn, () => {
                  window.__TienHiepHelpers.deleteNextRule();
                  const host = window.__TienHiepHelpers.getEffectiveUrl().hostname || window.location.hostname || '';
                  if (host) {
                      try { localStorage.removeItem('__tienhiep_content_selector_' + host); } catch(e) {}
                  }
                  cleanup();
                  banner.style.background = "linear-gradient(135deg,#3b82f6,#2563eb)";
                  banner.innerHTML = "<span>🔄 Đã khôi phục cài đặt mặc định cho trang này!</span>";
                  setTimeout(() => { banner.remove(); }, 900);
              });

              // 3. Nút Lưu Nút Chuyển Trang
              const confirmBtn = document.getElementById("__confirm_teach_next");
              bindInstantAction(confirmBtn, () => {
                  if (currentTarget) saveAndApplyRule(currentTarget);
              });

              // 4. Nút Đọc Từ Đây (Khi nhắm vào đoạn văn bản)
              const readBtn = document.getElementById("__read_from_here");
              bindInstantAction(readBtn, () => {
                  if (currentTarget) readFromTargetParagraph(currentTarget);
              });

              // 5. Nút Chuyển Đổi Sang Cả Vùng Đọc (Container Scope) trên Banner
              const scopeToggleBtn = document.getElementById("__scope_toggle_btn");
              bindInstantAction(scopeToggleBtn, () => {
                  applyTargetScope('container');
              });

              // 5.1 Nút Lưu Vùng Đọc này trên Banner (khi đang ở Container Mode)
              const saveContentBtn = document.getElementById("__save_content_area");
              bindInstantAction(saveContentBtn, () => {
                  if (currentTarget) saveContentAreaRule(currentTarget);
              });

              // 5.2 Nút Quay lại 1 Đoạn trên Banner
              const backToChunkBtn = document.getElementById("__back_to_chunk");
              bindInstantAction(backToChunkBtn, () => {
                  applyTargetScope('chunk');
              });

              // 6. Nút Chuyển Trang Thử
              const testNextBtn = document.getElementById("__test_next_teach");
              bindInstantAction(testNextBtn, () => {
                  if (currentTarget) {
                      cleanup();
                      banner.remove();
                      window.__TienHiepHelpers.triggerNavigation(currentTarget);
                  }
              });

              // 7. Các nút trên Floating Detail Badge
              const badgeSaveBtn = document.getElementById("__teach_badge_save");
              bindInstantAction(badgeSaveBtn, () => {
                  if (currentScope === 'container' && currentTarget) {
                      saveContentAreaRule(currentTarget);
                  } else if (currentTarget) {
                      saveAndApplyRule(currentTarget);
                  }
              });

              const badgeReadBtn = document.getElementById("__teach_badge_read");
              bindInstantAction(badgeReadBtn, () => {
                  if (currentTarget) readFromTargetParagraph(currentTarget);
              });

              const badgeScopeBtn = document.getElementById("__teach_badge_scope");
              bindInstantAction(badgeScopeBtn, () => {
                  if (currentScope === 'chunk') {
                      applyTargetScope('container');
                  } else {
                      applyTargetScope('chunk');
                  }
              });

              const badgePrevBtn = document.getElementById("__teach_badge_prev");
              bindInstantAction(badgePrevBtn, () => {
                  shiftTargetSibling(-1);
              });

              const badgeNextBtn = document.getElementById("__teach_badge_next");
              bindInstantAction(badgeNextBtn, () => {
                  shiftTargetSibling(1);
              });

              // Double-tap vào tâm ngắm để xác nhận nhanh
              let lastCrosshairTap = 0;
              crosshair.addEventListener("touchend", () => {
                  if (isDraggingCrosshair) return;
                  const now = Date.now();
                  if (now - lastCrosshairTap < 350 && currentTarget) {
                      if (currentScope === 'container') {
                          saveContentAreaRule(currentTarget);
                      } else if (isTargetParagraph) {
                          readFromTargetParagraph(currentTarget);
                      } else {
                          saveAndApplyRule(currentTarget);
                      }
                  }
                  lastCrosshairTap = now;
              });
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

      // Bộ nhớ Cache Bản Dịch Toàn Cục (Tức Thì 0ms) & Gom Chữ Trùng
      window.__translationCache = window.__translationCache || new Map();
      let uniqueTranslateQueue = [];
      let targetGroupsMap = new Map();
      let translateTimeout = null;
      let isTranslating = false;

      function applyTranslatedText(target, transText) {
        if (!target || !transText) return;
        try {
          if (target.type === "text") {
            const node = target.node;
            if (!node || !node.parentNode) return;
            node.nodeValue = transText;
          } else if (target.type === "attr") {
            const el = target.element;
            if (!el) return;
            el.setAttribute(target.attr, transText);
            if (target.attr === "value" && "value" in el) el.value = transText;
          } else if (target.type === "title") {
            document.title = transText;
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: "TITLE_UPDATED", title: transText }, "*");
            }
          }
        } catch(e) {}
      }

      async function processTranslateQueue() {
        if (uniqueTranslateQueue.length === 0 || isTranslating || !window.__autoTranslateEnabled) return;
        isTranslating = true;

        const batchUniqueTexts = uniqueTranslateQueue.splice(0, 70);
        try {
          const id = window.__transId++;
          const reqPayload = JSON.stringify({ id, texts: batchUniqueTexts });
          const translations = await new Promise((resolve) => {
            window.__translatePromises[id] = resolve;
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: "TRANSLATE_REQ", id, texts: batchUniqueTexts }, "*");
            }
            console.log("[TRANSLATE_REQ]" + reqPayload);
            setTimeout(() => {
              if (window.__translatePromises[id]) {
                window.__translatePromises[id]([]);
                delete window.__translatePromises[id];
              }
            }, 14000);
          });

          if (translations && Array.isArray(translations)) {
            if (window.__autoTranslateObserver) {
              try { window.__autoTranslateObserver.disconnect(); } catch(e) {}
            }

            batchUniqueTexts.forEach((origText, idx) => {
              const trans = translations[idx];
              if (trans) {
                // 1. Lưu vào cache dịch toàn cục
                window.__translationCache.set(origText, trans);
                const trimmed = origText.trim();
                if (trimmed && !window.__translationCache.has(trimmed)) {
                  window.__translationCache.set(trimmed, trans.trim());
                }

                // 2. Áp dụng đồng loạt cho TOÀN BỘ các vị trí trùng khớp trên trang
                const targets = targetGroupsMap.get(origText) || [];
                targets.forEach(t => applyTranslatedText(t, trans));
                targetGroupsMap.delete(origText);
              }
            });

            if (window.__autoTranslateObserver) {
              const root = document.body || document.documentElement;
              if (root) {
                try {
                  window.__autoTranslateObserver.observe(root, { childList: true, subtree: true, characterData: true });
                } catch(e) {}
              }
            }
          }
        } catch(err) {
          console.error("[Translate Batch Error]", err);
        } finally {
          isTranslating = false;
          if (uniqueTranslateQueue.length > 0) {
            setTimeout(processTranslateQueue, 60);
          } else {
            clearTimeout(window.__translateCompleteTimeout);
            window.__translateCompleteTimeout = setTimeout(() => {
              if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
                window.__TienHiepHelpers.indexParagraphsForTTS();
              }
              if (window.__lastTtsSentence && window.__TienHiepHelpers && typeof window.__TienHiepHelpers.highlightSentence === 'function') {
                window.__TienHiepHelpers.highlightSentence(window.__lastTtsSentence);
              }
              if (window.parent && window.parent !== window) {
                let res = { title: document.title, text: document.body.innerText };
                if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.extractCleanChapterText === 'function') {
                  res = window.__TienHiepHelpers.extractCleanChapterText();
                }
                window.parent.postMessage({
                  type: "TRANSLATION_COMPLETE",
                  title: res.title,
                  text: res.text
                }, "*");
              }
            }, 300);
          }
        }
      }

      window.__collectAndTranslateNodes = (root) => {
        if (!window.__autoTranslateEnabled) return;
        const chineseRegex = /[\\u4e00-\\u9fa5]/;
        const currentRoot = root || document.body || document.documentElement;
        if (!currentRoot) return;

        // Chỉ dịch khi trên trang có chữ Trung Quốc (Selective Chinese Translation)
        const sampleCheckText = (document.body ? document.body.innerText : '') || document.title || '';
        if (!chineseRegex.test(sampleCheckText)) {
          return;
        }

        // 1. Dịch document.title nếu có chữ Trung
        if (document.title && chineseRegex.test(document.title)) {
          const rawTitle = document.title.trim();
          if (window.__translationCache.has(rawTitle)) {
            applyTranslatedText({ type: "title" }, window.__translationCache.get(rawTitle));
          } else {
            if (!targetGroupsMap.has(rawTitle)) {
              targetGroupsMap.set(rawTitle, []);
              uniqueTranslateQueue.push(rawTitle);
            }
            targetGroupsMap.get(rawTitle).push({ type: "title", orig: rawTitle });
          }
        }

        // 2. Quét toàn bộ Text Nodes (GOM CHỮ TRÙNG TOÀN BỘ)
        try {
          const walker = document.createTreeWalker(
            currentRoot,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: function(node) {
                if (!node || !node.nodeValue) return NodeFilter.FILTER_REJECT;
                const parent = node.parentNode;
                if (!parent) return NodeFilter.FILTER_REJECT;
                const tag = parent.nodeName;
                if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA") {
                  return NodeFilter.FILTER_REJECT;
                }
                if (parent.closest && parent.closest('#__teach_next_banner, teach-banner, teach-crosshair, #__teach_crosshair_target, [id^="__teach"]')) {
                  return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          );

          let node = walker.nextNode();
          while (node) {
            const rawVal = node.nodeValue;
            if (rawVal && chineseRegex.test(rawVal)) {
              const trimmed = rawVal.trim();
              if (trimmed.length > 0) {
                if (!node.__original_chinese__) node.__original_chinese__ = rawVal;

                // Nếu đã có bản dịch trong cache -> Thay thế tức thì 0ms!
                if (window.__translationCache.has(rawVal)) {
                  node.nodeValue = window.__translationCache.get(rawVal);
                } else if (window.__translationCache.has(trimmed)) {
                  const cached = window.__translationCache.get(trimmed);
                  node.nodeValue = rawVal.replace(trimmed, cached);
                } else {
                  // Gom toàn bộ các node có cùng rawVal vào 1 nhóm duy nhất
                  if (!targetGroupsMap.has(rawVal)) {
                    targetGroupsMap.set(rawVal, []);
                    uniqueTranslateQueue.push(rawVal);
                  }
                  const list = targetGroupsMap.get(rawVal);
                  if (!list.some(t => t.node === node)) {
                    list.push({ type: "text", node: node, orig: rawVal });
                  }
                }
              }
            }
            node = walker.nextNode();
          }
        } catch(e) {}

        // 3. Quét các thuộc tính placeholder, title, alt, value
        try {
          if (currentRoot.querySelectorAll) {
            const attrEls = currentRoot.querySelectorAll('[placeholder], [title], [alt], input[type="button"], input[type="submit"]');
            attrEls.forEach(el => {
              ["placeholder", "title", "alt", "value"].forEach(attr => {
                const val = el.getAttribute(attr);
                if (val && chineseRegex.test(val)) {
                  if (window.__translationCache.has(val)) {
                    applyTranslatedText({ type: "attr", element: el, attr }, window.__translationCache.get(val));
                  } else {
                    if (!targetGroupsMap.has(val)) {
                      targetGroupsMap.set(val, []);
                      uniqueTranslateQueue.push(val);
                    }
                    const list = targetGroupsMap.get(val);
                    if (!list.some(t => t.element === el && t.attr === attr)) {
                      list.push({ type: "attr", element: el, attr, orig: val });
                    }
                  }
                }
              });
            });
          }
        } catch(e) {}

        if (uniqueTranslateQueue.length > 0 && !translateTimeout) {
          translateTimeout = setTimeout(() => {
            translateTimeout = null;
            processTranslateQueue();
          }, 60);
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
            if (link) {
              const rawHref = (link.getAttribute('href') || '').trim();
              let href = link.href ? link.href.trim() : '';

              // Xử lý relative link hoặc link bị resolve nhầm thành http://localhost/... do iframe
              const effUrl = window.__TienHiepHelpers ? window.__TienHiepHelpers.getEffectiveUrl() : null;
              const baseHref = effUrl && effUrl.origin && effUrl.origin !== 'null' ? effUrl.href : (window.__originalUrl || '');
              if (rawHref && (rawHref.startsWith('/') || !rawHref.includes('://')) && !rawHref.startsWith('javascript:') && !rawHref.startsWith('#')) {
                try {
                  if (baseHref) {
                    href = new URL(rawHref, baseHref).href;
                  }
                } catch(e) {}
              } else if (href && (href.startsWith('http://localhost') || href.startsWith('capacitor://localhost'))) {
                try {
                  if (baseHref) {
                    const u = new URL(href);
                    href = new URL(u.pathname + u.search + u.hash, baseHref).href;
                  }
                } catch(e) {}
              }

              const isAd = /(magsrv|geniees|popads|propeller|adsterra|cpm|zoneid|guanggao|doubleclick|affiliate|track\.|click\.|ads\.|bet\b|casino\b|18\+)/i.test(href);
              
              // 1. Chặn nếu rõ ràng là mạng lưới quảng cáo lừa đảo / cờ bạc
              if (isAd) {
                console.log('[TienHiep AdBlock] 🚫 Đã chặn click quảng cáo:', href);
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                if (link.parentNode) link.remove();
                return false;
              }

              // 2. Với các link duyệt web thông thường: Intercept và gửi lên app cha để proxy & dịch mượt mà
              if (href && !href.startsWith('javascript:') && !href.startsWith('#') && !href.includes('void(0)')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                console.log('[TienHiep Link Interceptor] 🌐 Điều hướng qua proxy app:', href);
                if (window.parent && window.parent !== window) {
                  window.parent.postMessage({ type: 'NAVIGATE_REQ', url: href }, '*');
                } else {
                  window.location.href = href;
                }
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
          adStyle.textContent = [
            'iframe[src*="ad"], iframe[src*="union"], iframe[src*="cpm"], iframe[src*="pop"], iframe[src*="geniees"], iframe[src*="magsrv"], iframe[src*="vantage"],',
            '[class*="popup-wrap"], [class*="modal-wrap"], [id*="bonus"], [class*="bonus"],',
            '[class*="vantage"], [id*="vantage"], [class*="captcha"], [id*="captcha"], [class*="recaptcha"], [id*="recaptcha"],',
            '[class*="gift"], [id*="gift"], [class*="redpack"], [id*="redpack"], [class*="hongbao"], [class*="reward"],',
            '.advertisement, .advertising, [class*="banner-ad"], [id*="banner-ad"],',
            '[class*="float-ad"], [id*="float-ad"], [class*="popup-ad"], [id*="popup-ad"],',
            'ins.adsbygoogle, .google-ad, [id*="google_ads"], #ad_top, #ad_bottom, #ad_left, #ad_right,',
            '.bottom-ad, .top-ad, .side-ad, .tuiguang, [class*="tuiguang"], [id*="tuiguang"],',
            '.guanggao, [class*="guanggao"], [id*="guanggao"], [class*="pop-win"], [id*="pop-win"],',
            '.float-window, .app-download-bar, .download-banner,',
            '[class*="modal-backdrop"], [class*="overlay-mask"], [class*="popup-overlay"] {',
            '  display: none !important;',
            '  visibility: hidden !important;',
            '  height: 0 !important;',
            '  width: 0 !important;',
            '  pointer-events: none !important;',
            '  opacity: 0 !important;',
            '}'
          ].join(String.fromCharCode(10));
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
        if (enabled) {
          const chineseRegex = /[\\u4e00-\\u9fa5]/;
          const sampleCheckText = (document.body ? document.body.innerText : '') || document.title || '';
          if (!chineseRegex.test(sampleCheckText)) {
            window.__autoTranslateEnabled = false;
            return;
          }
        }
        window.__autoTranslateEnabled = enabled;
        if (window.__TienHiepHelpers) window.__TienHiepHelpers.__autoTranslateEnabled = enabled;
        if (enabled) {
          if (window.__autoTranslateObserver && rootTarget) {
            try {
              window.__autoTranslateObserver.observe(rootTarget, { childList: true, subtree: true, characterData: true });
            } catch(e) {}
          }
          if (typeof window.__collectAndTranslateNodes === "function") {
            window.__collectAndTranslateNodes(document.body || document.documentElement);
          }
        } else {
          // 1. Tạm dừng observer để tránh loop sự kiện làm đơ trình duyệt
          if (window.__autoTranslateObserver) {
            try {
              window.__autoTranslateObserver.disconnect();
            } catch(e) {}
          }
          // 2. Hủy toàn bộ hàng đợi dịch đang chờ
          uniqueTranslateQueue.length = 0;
          targetGroupsMap.clear();
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

      if (window.__TienHiepHelpers) {
        window.__TienHiepHelpers.toggleAutoTranslate = window.toggleAutoTranslate;
      }

      // Tự động kiểm tra và kích hoạt dịch nếu đang bật lưu trạng thái tự dịch
      try {
        if (localStorage.getItem("__tienhiep_auto_translate_active") === "true") {
          setTimeout(() => {
            if (typeof window.toggleAutoTranslate === "function") window.toggleAutoTranslate(true);
          }, 300);
        }
      } catch(e) {}
    }

    // Lắng nghe IPC trực tiếp từ BrowserContext
    if (!window.__tienhiep_injected_ipc) {
      window.__tienhiep_injected_ipc = true;
      window.addEventListener('message', (e) => {
        if (!e.data) return;
        const data = e.data;
        const action = data.action;

        if (action === 'TEACH_NEXT' || action === 'teach_next') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.startTeachNextMode === 'function') {
            window.__TienHiepHelpers.startTeachNextMode();
          }
        } else if (action === 'TRIGGER_NEXT' || action === 'next') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.checkAndTriggerAutoNext === 'function') {
            window.__TienHiepHelpers.checkAndTriggerAutoNext(true, data.delay || 0);
          }
        } else if (action === 'TRIGGER_PREV' || action === 'prev') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.checkAndTriggerAutoPrev === 'function') {
            window.__TienHiepHelpers.checkAndTriggerAutoPrev();
          }
        } else if (action === 'EXTRACT_TEXT' || action === 'audio') {
          let res = { title: document.title, text: document.body.innerText };
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.extractCleanChapterText === 'function') {
            res = window.__TienHiepHelpers.extractCleanChapterText();
          }
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'AUDIO_TEXT_RES',
              title: res.title,
              text: res.text
            }, '*');
          }
        } else if (action === 'TRANSLATE_RES' || action === 'translate_res') {
          if (typeof window.__receiveTranslations === 'function') {
            window.__receiveTranslations(data.id, data.translations || []);
          }
        } else if (action === 'TOGGLE_AUTO_TRANSLATE') {
          const fn = (window.__TienHiepHelpers && window.__TienHiepHelpers.toggleAutoTranslate) || window.toggleAutoTranslate;
          if (typeof fn === 'function') {
            fn(data.enabled);
          }
        } else if (action === 'FORCE_TRANSLATE') {
          const chineseRegex = /[\\u4e00-\\u9fa5]/;
          const sampleCheckText = (document.body ? document.body.innerText : '') || document.title || '';
          if (!chineseRegex.test(sampleCheckText)) {
            window.__autoTranslateEnabled = false;
            return;
          }
          window.__autoTranslateEnabled = true;
          if (typeof window.__collectAndTranslateNodes === 'function') {
            window.__collectAndTranslateNodes(document.body || document.documentElement);
          }
        } else if (action === 'TOGGLE_DARK_MODE') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.toggleDarkMode === 'function') {
            window.__TienHiepHelpers.toggleDarkMode(data.enabled);
          }
        } else if (action === 'CLEAN_ADS') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.toggleCleanAds === 'function') {
            window.__TienHiepHelpers.toggleCleanAds(data.enabled);
          }
        } else if (action === 'COPY_TEXT') {
          let res = { text: document.body.innerText };
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.extractCleanChapterText === 'function') {
            res = window.__TienHiepHelpers.extractCleanChapterText();
          }
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'COPY_TEXT_RES',
              text: res.text
            }, '*');
          }
        } else if (action === 'SET_TTS_PLAYING') {
          window.isTtsPlaying = !!data.playing;
        } else if (action === 'EXEC_HELPER') {
          if (data.fn && window.__TienHiepHelpers && typeof window.__TienHiepHelpers[data.fn] === 'function') {
            const args = Array.isArray(data.args) ? data.args : [];
            try { window.__TienHiepHelpers[data.fn](...args); } catch(err) {}
          }
        } else if (action === 'HIGHLIGHT_SENTENCE' || action === 'TTS_BOUNDARY') {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.highlightSentence === 'function') {
            window.__TienHiepHelpers.highlightSentence(data.sentenceText, data.sentenceId);
          }
        } else if (action === 'TOGGLE_AUTOSCROLL') {
          if (window.__scrollInterval) {
            clearInterval(window.__scrollInterval);
            window.__scrollInterval = null;
          } else {
            const speed = data.speed || 30;
            window.__scrollInterval = setInterval(() => {
              window.scrollBy({ top: 1, behavior: 'instant' });
            }, speed);
          }
        }
      });

      // Tự động phân đoạn gán chỉ mục ngay khi trang sẵn sàng
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => {
          if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
            window.__TienHiepHelpers.indexParagraphsForTTS();
          }
        }, 300);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            if (window.__TienHiepHelpers && typeof window.__TienHiepHelpers.indexParagraphsForTTS === 'function') {
              window.__TienHiepHelpers.indexParagraphsForTTS();
            }
          }, 300);
        });
      }

      // Thông báo cho parent iframe rằng trang đã sẵn sàng
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'PAGE_LOADED',
          url: (window.__TienHiepHelpers ? window.__TienHiepHelpers.getEffectiveUrl().href : '') || window.__originalUrl || window.location.href,
          title: document.title
        }, '*');
      }
    }
  })();`;
}
