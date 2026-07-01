class LocalTranslatorEngine {
  constructor() {
    this.dictVietphrase = null;
    this.dictNames = null;
    this.dictChar = null;
    this.isLoaded = false;
    this.isLoading = false;
    this.PRONOUNS = new Set(['我', '你', 'ta', '他', '她', '它', '们', '您', '自己', '我们', '你们', '他们', '她们', '它们', '大家', '谁', '什么']);
    this.NUM_KEYWORDS = new Set(["重", "阶", "品", "级", "层", "剑", "星", "转", "天", "色", "关", "重天"]);
    this.HANVIET_NUMBERS = {
        '0': 'Không', '1': 'Nhất', '2': 'Nhị', '3': 'Tam', '4': 'Tứ', '5': 'Ngũ', '6': 'Lục', '7': 'Thất', '8': 'Bát', '9': 'Cửu', '10': 'Thập',
        '一': 'Nhất', '二': 'Nhị', '三': 'Tam', '四': 'Tứ', '五': 'Ngũ', '六': 'Lục', '七': 'Thất', '八': 'Bát', '九': 'Cửu', '十': 'Thập',
        '百': 'Bách', '千': 'Thiên', '万': 'Vạn', '萬': 'Vạn', '几': 'Vài', '数': 'Số', '多': 'Đa', '半': 'Bán', '两': 'Lưỡng', '兩': 'Lưỡng'
    };
    this.LOCALIZERS = new Set(['上', '下', '中', 'li', '里', '外', '内', '內', '后', '後', '前', '旁', '侧', '側', '底', '间', '間']);
  }

  async loadDictionaries() {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;
    console.log("Loading offline dictionaries...");
    try {
        let texts;
        if (window.electron && window.electron.readDictionary) {
            texts = await Promise.all([
                window.electron.readDictionary("Vietphrase.txt"),
                window.electron.readDictionary("Aligned_HanViet.txt"),
                window.electron.readDictionary("HanViet_CharDict.txt")
            ]);
        } else {
            const urls = [
                "/dictionaries/Vietphrase.txt",
                "/dictionaries/Aligned_HanViet.txt",
                "/dictionaries/HanViet_CharDict.txt"
            ];
            
            const responses = await Promise.all(urls.map(url => fetch(url)));
            for (let res of responses) {
                if (!res.ok) throw new Error(`Failed to load ${res.url}`);
            }
            
            texts = await Promise.all(responses.map(res => res.text()));
        }

        this.dictVietphrase = this.parseDict(texts[0]);
        this.dictNames = this.parseDict(texts[1]);
        this.dictChar = this.parseDict(texts[2]);
        this.isLoaded = true;
        console.log("Offline Dictionaries loaded! Vietphrase:", this.dictVietphrase.size);
    } catch (e) {
        console.error("Error loading offline dictionaries:", e);
    } finally {
        this.isLoading = false;
    }
  }

  parseDict(text) {
    const map = new Map();
    const lines = text.split(/\r?\n/);
    for (let line of lines) {
        line = line.trim();
        if (!line || !line.includes("=")) continue;
        const idx = line.indexOf("=");
        const left = line.slice(0, idx).trim();
        const right = line.slice(idx + 1).trim();
        
        if (left.includes(",") && right.includes(",")) {
            const keys = left.split(",").map(k => k.trim()).filter(Boolean);
            const vals = right.split(",").map(v => v.trim()).filter(Boolean);
            if (keys.length === vals.length) {
                for (let k = 0; k < keys.length; k++) {
                    map.set(keys[k], vals[k]);
                }
                continue;
            }
        }
        if (left) map.set(left, right);
    }
    return map;
  }

  cleanAnnotation(text) {
    if (!text) return "";
    text = text.replace(/\{([^\{\}]+)\}/g, (m, content) => content.includes(':') ? content.split(':')[0].trim() : content.trim());
    return text.replace(/\s*\(\*[^)]*\)/g, '').trim();
  }

  formatTranslation(rawValue, word = "") {
    if (!rawValue) return "";
    const options = rawValue.split("/").map(o => this.cleanAnnotation(o)).filter(o => o.trim());
    if (options.length === 0) return "";
    if (options.length === 1) return options[0];
    
    if (word && word.length >= 2 && this.dictChar) {
        const hvSets = [];
        for (let char of word) {
            const readings = new Set();
            if (this.dictChar.has(char)) {
                const parts = this.dictChar.get(char).split("/");
                for (let r of parts) {
                    const rClean = r.trim().toLowerCase();
                    if (rClean) readings.add(rClean);
                }
            }
            if (readings.size > 0) hvSets.push(readings);
        }
        
        let bestOption = options[0];
        let bestScore = -1;
        
        for (let opt of options) {
            const optSyllables = opt.split(/\s+/).map(s => s.trim().toLowerCase()).filter(Boolean);
            let score = 0;
            for (let rSet of hvSets) {
                let found = false;
                for (let r of rSet) {
                    if (optSyllables.includes(r)) { found = true; break; }
                }
                if (found) score++;
            }
            if (score > bestScore) { bestScore = score; bestOption = opt; }
        }
        if (bestScore > 0) return bestOption;
    }
    return options[0];
  }

  capitalizePhrase(phrase) {
    const chars = 'a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ';
    const regex = new RegExp(`[${chars}]+`, 'g');
    return phrase.replace(regex, (match) => match.charAt(0).toUpperCase() + match.slice(1));
  }

  isChineseNumber(str) {
    return /^[0-9一二三四五六七八九十百千万几数多半两]+$/.test(str);
  }

  translateSentence(sentence, mode = 'advanced') {
    if (!this.isLoaded) return sentence;
    const leading = sentence.match(/^\s*/)?.[0] || "";
    const trailing = sentence.match(/\s*$/)?.[0] || "";
    const body = sentence.trim();
    if (!body) return sentence;
    
    let i = 0;
    const len = body.length;
    
    if (mode === 'hanviet') {
        let result = [];
        while (i < len) {
            const char = body[i];
            if (!/[\u4e00-\u9fa5]/.test(char)) {
                let nonChineseStr = "";
                while (i < len && !/[\u4e00-\u9fa5]/.test(body[i])) {
                    const c = body[i];
                    const punctMap = { '，': ',', '。': '.', '「': '"', '」': '"', '、': ',', '？': '?', '！': '!', '：': ':', '；': ';', '“': '"', '”': '"', '（': '(', '）': ')' };
                    nonChineseStr += punctMap[c] || c;
                    i++;
                }
                result.push(nonChineseStr);
                continue;
            }
            
            let matched = false;
            const maxSearchLen = Math.min(10, len - i);
            for (let l = maxSearchLen; l >= 1; l--) {
                const sub = body.substring(i, i + l);
                if (this.dictNames && this.dictNames.has(sub)) {
                    result.push(this.formatTranslation(this.dictNames.get(sub), sub));
                    i += l; matched = true; break;
                }
            }
            if (!matched) {
                const rawChar = body[i];
                if (this.dictChar && this.dictChar.has(rawChar)) {
                    result.push(this.dictChar.get(rawChar).split("/")[0]);
                } else {
                    result.push(rawChar);
                }
                i++;
            }
        }
        
        let output = "";
        for (let k = 0; k < result.length; k++) {
            const word = result[k];
            if (k > 0) {
                const prevWord = result[k-1];
                const isCurrentPunct = /^[,.!?:\\);\\]}"]+$/.test(word);
                const isPrevOpeningPunct = /^[\\(\\[\\{"]+$/.test(prevWord);
                if (!isCurrentPunct && !isPrevOpeningPunct && prevWord !== " " && word !== " ") output += " ";
            }
            output += word;
        }
        return leading + output.replace(/ {2,}/g, ' ').trim() + trailing;
    }
    
    let tokens = [];
    while (i < len) {
        const char = body[i];
        if (!/[\u4e00-\u9fa5]/.test(char)) {
            let nonChineseStr = "";
            while (i < len && !/[\u4e00-\u9fa5]/.test(body[i])) {
                const c = body[i];
                const punctMap = { '，': ',', '。': '.', '「': '"', '」': '"', '、': ',', '？': '?', '！': '!', '：': ':', '；': ';', '“': '"', '”': '"', '（': '(', '）': ')' };
                nonChineseStr += punctMap[c] || c;
                i++;
            }
            tokens.push({ word: nonChineseStr, translated: nonChineseStr, type: 'punctuation' });
            continue;
        }
        
        if (char === '的') {
            tokens.push({ word: '的', translated: 'đích', type: 'de' });
            i++; continue;
        }
        
        let matched = false;
        const maxSearchLen = Math.min(10, len - i);
        for (let l = maxSearchLen; l >= 1; l--) {
            const sub = body.substring(i, i + l);
            if (l > 1 && sub.includes('的') && sub.indexOf('的') > 0) continue;
            
            if (this.dictVietphrase && this.dictVietphrase.has(sub)) {
                let trans = this.formatTranslation(this.dictVietphrase.get(sub), sub);
                if (sub.endsWith('的') && sub.length > 1) {
                    if (trans.toLowerCase().endsWith(' đích')) trans = trans.slice(0, -5);
                    else if (trans.toLowerCase().endsWith('đích')) trans = trans.slice(0, -4);
                }
                tokens.push({ word: sub, translated: trans, type: 'phrase' });
                i += l; matched = true; break;
            }

            if (this.dictNames && this.dictNames.has(sub)) {
                let trans = this.capitalizePhrase(this.formatTranslation(this.dictNames.get(sub), sub));
                if (sub.endsWith('的') && sub.length > 1) {
                    if (trans.toLowerCase().endsWith(' đích')) trans = trans.slice(0, -5);
                    else if (trans.toLowerCase().endsWith('đích')) trans = trans.slice(0, -4);
                }
                tokens.push({ word: sub, translated: trans, type: 'name' });
                i += l; matched = true; break;
            }
        }
        
        if (!matched) {
            const rawChar = body[i];
            if (this.dictChar && this.dictChar.has(rawChar)) {
                tokens.push({ word: rawChar, translated: this.dictChar.get(rawChar).split("/")[0], type: 'char' });
            } else {
                tokens.push({ word: rawChar, translated: rawChar, type: 'other' });
            }
            i++;
        }
    }
    
    let groupedTokens = [];
    let j = 0;
    while (j < tokens.length) {
        let tok = tokens[j];
        if (this.isChineseNumber(tok.word) && j + 1 < tokens.length && this.NUM_KEYWORDS.has(tokens[j+1].word)) {
            let combinedWord = tok.word + tokens[j+1].word;
            let nextIdx = j + 2;
            if (nextIdx < tokens.length && (tokens[nextIdx].type === 'name' || tokens[nextIdx].type === 'phrase')) {
                combinedWord += tokens[nextIdx].word;
                nextIdx++;
            }
            
            let translatedParts = [];
            for (let char of combinedWord) {
                if (this.HANVIET_NUMBERS[char]) translatedParts.push(this.HANVIET_NUMBERS[char]);
                else if (this.dictChar && this.dictChar.has(char)) translatedParts.push(this.capitalizePhrase(this.dictChar.get(char).split("/")[0]));
                else translatedParts.push(char);
            }
            groupedTokens.push({ word: combinedWord, translated: translatedParts.join(" "), type: 'cultivation' });
            j = nextIdx;
        } else {
            groupedTokens.push(tok);
            j++;
        }
    }
    
    let finalTokens = [];
    if (mode === 'advanced') {
        let k = 0;
        const STOP_WORDS = new Set(['嗎', '吗', '呢', '吧', '呀', '啊', '了', '过', '過', '着', '著']);
        const VERB_INDICATORS = new Set([
            'nói', 'làm', 'đi', 'chạy', 'nghe', 'thấy', 'nhìn', 'đã', 'đang', 'sẽ', 'được', 'bị', 
            'muốn', 'phải', 'rời', 'gặp', 'biết', 'nghĩ', 'cho', 'khiến', 'yêu', 'thích', 'ghét', 
            'sợ', 'cười', 'khóc', 'mang', 'đưa', 'cầm', 'lấy', 'đứng', 'ngồi', 'nằm', 'ngủ', 
            'chết', 'sống', 'hát', 'viết', 'đọc', 'học', 'dạy', 'mua', 'bán', 'trả', 'nhận', 
            'gửi', 'nhớ', 'quên', 'hiểu', 'tin', 'ở', 'đến'
        ]);

        while (k < groupedTokens.length) {
            let tok = groupedTokens[k];
            if (tok.word === '的' && k > 0 && k < groupedTokens.length - 1) {
                let t_x = groupedTokens[k-1];
                let isVerb = /[过過了着著]/.test(t_x.word) || t_x.translated.toLowerCase().split(/\s+/).some(w => VERB_INDICATORS.has(w));
                
                let nextPos = k + 1;
                let y_tokens = [];
                while (nextPos < groupedTokens.length) {
                    let tok_next = groupedTokens[nextPos];
                    if (tok_next.type === 'punctuation' || tok_next.word === '的' || this.LOCALIZERS.has(tok_next.word) || STOP_WORDS.has(tok_next.word) || y_tokens.length >= 3) break;
                    y_tokens.push(tok_next);
                    nextPos++;
                }
                
                if (y_tokens.length > 0 && !isVerb) {
                    let y_translated = y_tokens.map(t => t.translated).join(" ");
                    let combined = (this.PRONOUNS.has(t_x.word) || t_x.type === 'name') ? y_translated + " của " + t_x.translated : y_translated + " " + t_x.translated;
                    if (finalTokens.length > 0) finalTokens.pop();
                    finalTokens.push({ word: t_x.word + '的' + y_tokens.map(t=>t.word).join(""), translated: combined, type: 'phrase' });
                    k = nextPos; continue;
                } else {
                    tok.translated = "";
                }
            }
            finalTokens.push(tok);
            k++;
        }
    } else {
        finalTokens = groupedTokens;
    }
    
    let output = "";
    for (let k = 0; k < finalTokens.length; k++) {
        const word = finalTokens[k].translated;
        if (!word) continue;
        if (output.length > 0) {
            const prevWord = finalTokens[k-1] ? finalTokens[k-1].translated : "";
            const isCurrentPunct = /^[,.!?:;()\[\]{}""'']+$/.test(word);
            const isPrevOpeningPunct = /^[([{"]+$/.test(prevWord);
            if (!isCurrentPunct && !isPrevOpeningPunct && prevWord !== " " && word !== " ") output += " ";
        }
        output += word;
    }
    
    return leading + output.replace(/ {2,}/g, ' ').trim() + trailing;
  }
}

export const localTranslator = new LocalTranslatorEngine();
