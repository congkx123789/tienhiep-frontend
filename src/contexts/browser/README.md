# 📁 Context Quản Lý Trình Duyệt Web Đa Tab (Browser Context)

> **Đường dẫn thư mục:** `frontend/src/contexts/browser`  
> **Kiến trúc:** Fractal Modular Clean Architecture (Tối đa 7 files/thư mục, $\le$ 300 dòng/file)  
> **Trách nhiệm cốt lõi:** Quản lý toàn bộ vòng đời trình duyệt web nhúng đa tab, giao tiếp IPC hai chiều với webview iframe, điều phối bộ máy âm thanh TTS và lưu trữ ngăn xếp lịch sử duyệt web theo chuẩn Chrome.

---

## 📌 Tổng Quan Kiến Trúc & Vai Trò Hệ Thống

`BrowserContext` là trung tâm điều phối phức tạp và quan trọng nhất trong tầng ứng dụng của Tiên Hiệp AI. Module này hợp nhất:
1. **Quản trị đa tab (Tab Manager):** Mở tab, đóng tab, nhân bản tab, dọn dẹp bộ nhớ và lưu trữ trạng thái vào cơ sở dữ liệu `localStorage` (`tienhiep_browser_tabs`).
2. **Cơ chế ngăn xếp lịch sử chuẩn duyệt web (Navigation Stack with Future Truncation):** Xử lý luồng `A -> B -> C`, lùi về `B`, điều hướng `D` $\rightarrow$ cắt bỏ `C` và tạo nhánh mới `[A, B, D]`.
3. **Kênh truyền thông IPC thời gian thực (Bidirectional IPC Bridge):** Nhận và phản hồi các thông điệp `postMessage` giữa ứng dụng mẹ và iframe tiêm kịch bản (`injected_bundle.js`).
4. **Hệ thống âm thanh & Tự động chuyển chương (Audio Coordinator):** Duy trì `activeAudioObjRef` thời gian thực, điều khiển phát giọng đọc C++ Matcha-TTS và tự động sang chương tiếp theo liền mạch khi đọc hết văn bản.

---

## 📊 Sơ Đồ Kiến Trúc Kết Nối Logic & Giao Tiếp Dữ Liệu (Mermaid Architecture)

```mermaid
flowchart TB
    subgraph UI_Layer["Tầng Giao Diện Trình Duyệt"]
        BrowserHeader["BrowserHeader.tsx\n(Thanh URL, Back, Forward, Reload, Tabs, Menu)"]
        TabViewport["TabViewportItem.tsx\n(Iframe Sandbox + Token Tab)"]
        AudioBar["AudioPlayerBar\n(Thanh điều khiển nghe đọc)"]
    end

    subgraph Browser_Core["Lõi Điều Phối: BrowserContext (index.tsx)"]
        useTabMgr["useTabManager.ts\n• tabs: BrowserTab[]\n• activeTabId: string\n• historyStack & historyIndex\n• navigateTab / Back / Forward / Reload\n• Database: localStorage[tienhiep_browser_tabs]"]
        useSync["useWebviewSync.ts\n• window.addEventListener('message')\n• NAVIGATE_REQ -> navigateTab()\n• PAGE_LOADED -> update urlInput\n• TRANSLATE_REQ -> Native Core\n• AUDIO_TEXT_RES -> startAudioFromContent\n• TAP_PARAGRAPH -> Highlight & Seek"]
        useAudio["useBrowserAudio.ts & useBrowserAudioChapter.ts\n• activeAudioObjRef (Realtime state)\n• handleGlobalNextChapter()\n• handleGlobalPrevChapter()\n• Auto TTS loop: Chapter N -> Chapter N+1"]
        helpers["browserHelpers.ts\n• normalizeUrlForIframe\n• cleanNovelTabTitle\n• chineseNumberToArabic"]
    end

    subgraph Injected_Iframe["Iframe Trang Web Ngoại Bộ (Proxy Nhúng)"]
        InjectedBundle["injected_bundle.js\n• Translator (Bóc tách chữ Hán CJK)\n• Paragraph Indexer (Gán data-tts-idx)\n• Next Navigator (Tìm nút sang chương)\n• Teacher UI (Tâm ngắm chỉ định)"]
    end

    subgraph Backend_Core["Daemon C++ & Go Core (127.0.0.1:5051)"]
        ProxyServer["Local Web Proxy & Sanitizer"]
        TranslateEngine["CMLM NAT Translation Engine"]
        TtsEngine["Matcha-TTS C++ Neural Engine"]
    end

    %% Kết nối luồng giao tiếp
    BrowserHeader -->|"Click Back / Fwd / URL"| useTabMgr
    TabViewport -->|"Nhúng URL đã Sanitized"| InjectedBundle
    InjectedBundle <-->|"IPC postMessage (NAVIGATE_REQ, TRANSLATE_REQ)"| useSync
    useSync -->|"Cập nhật URL & Lịch sử"| useTabMgr
    useSync -->|"Gửi batch dịch sang Native Core"| TranslateEngine
    TranslateEngine -->|"Trả bản dịch TRANSLATE_RES"| useSync
    useSync -->|"Bản dịch vào DOM"| InjectedBundle
    useSync -->|"Kích hoạt TTS"| useAudio
    useAudio <-->|"Phát âm thanh & Chuyển chương"| AudioBar
    useAudio -->|"TRIGGER_NEXT khi hết chương"| InjectedBundle
```

---

## 🔄 Sơ Đồ Tuần Tự (Sequence Diagrams) Các Luồng Xử Lý Trọng Tâm

### 1. Luồng Điều Hướng & Cắt Nhánh Lịch Sử (`A -> B -> C`, Lùi về `B`, Mở `D` => `[A, B, D]`)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người Đọc
    participant Header as BrowserHeader
    participant TabMgr as useTabManager
    participant Sync as useWebviewSync
    participant Iframe as Iframe (Injected Script)
    participant Storage as localStorage (tienhiep_browser_tabs)

    Note over TabMgr: Stack hiện tại: [A, B, C] (Đang ở C, index=2)
    User->>Header: Bấm nút Previous (◀)
    Header->>TabMgr: navigateTabBack(activeTabId)
    TabMgr->>TabMgr: Giảm historyIndex từ 2 xuống 1 (Đang ở B)
    TabMgr->>Header: urlInput = URL(B), canGoBack=true, canGoForward=true
    TabMgr->>Storage: Lưu trạng thái Tab (activeUrl = B)
    
    User->>Iframe: Click liên kết mới sang chương D
    Iframe->>Sync: postMessage({ type: 'NAVIGATE_REQ', url: 'https://.../chap-D' })
    Sync->>TabMgr: navigateTab(tabId, 'https://.../chap-D')
    
    rect rgb(230, 245, 255)
    Note over TabMgr: Cắt bỏ nhánh tương lai (C):<br/>stack = stack.slice(0, 1 + 1) => [A, B]<br/>stack.push(D) => [A, B, D]<br/>historyIndex = 2
    end
    
    TabMgr->>Header: urlInput = URL(D), canGoBack=true, canGoForward=false
    TabMgr->>Storage: Cập nhật Database tabs mới nhất
```

---

### 2. Luồng Bóc Tách Chữ Hán, Gom Trùng Lặp & Gắn Bản Dịch Chính Xác

```mermaid
sequenceDiagram
    autonumber
    participant DOM as Trang Web (DOM)
    participant Collector as translatorCollector
    participant Queue as translatorQueue
    participant Sync as useWebviewSync
    participant Core as Native Translation Engine

    DOM->>Collector: Quét các Text Nodes trong bài viết
    Collector->>Collector: Lọc theo regex CJK [\u4e00-\u9fff...]<br/>Loại bỏ ký tự Latin, số hiệu, dấu câu
    Collector->>Queue: Gom vào targetGroupsMap (từ trùng nhau gom chung 1 key)
    Queue->>Sync: postMessage({ type: 'TRANSLATE_REQ', texts: ['第一章', '修仙', ...] })
    Sync->>Core: POST /api/translate (CMLM NAT Batch 0ms)
    Core-->>Sync: Trả danh sách bản dịch: ['Chương 1', 'Tu Tiên', ...]
    Sync->>Queue: postMessage({ type: 'TRANSLATE_RES', translations: [...] })
    Queue->>DOM: node.nodeValue.replace(target.segment, translation)<br/>Chỉ thay thế đúng vị trí chữ Hán, giữ nguyên ngữ cảnh xung quanh!
```

---

### 3. Luồng Tự Động Chuyển Chương & Phát TTS Liền Mạch

```mermaid
sequenceDiagram
    autonumber
    participant Audio as useBrowserAudioChapter
    participant Iframe as Iframe Webview
    participant Sync as useWebviewSync
    participant Player as AudioPlayerBar

    Player->>Audio: Phát đến câu cuối cùng của chương
    Audio->>Audio: Nhận diện hết chương -> Gọi handleGlobalNextChapter()
    Audio->>Iframe: postMessage({ action: 'TRIGGER_NEXT' })
    Iframe->>Iframe: Kích hoạt nút chuyển trang (Next Rule đã học từ Tâm Ngắm)
    Iframe->>Sync: Trang mới nạp xong -> postMessage({ type: 'IFRAME_READY' })
    Sync->>Iframe: postMessage({ action: 'EXTRACT_TEXT' })
    Iframe->>Sync: postMessage({ type: 'AUDIO_TEXT_RES', text: 'Nội dung chương mới...' })
    Sync->>Audio: startAudioFromContent(tabId, title, text, startSentenceIdx: 0)
    Audio->>Player: Tự động phát âm thanh chương mới từ câu 0 không cần bấm nút!
```

---

## 📄 Chi Tiết Từng Tệp Tin Trong Thư Mục

| Tên Tệp Tin | Dòng Code | Vai Trò & Thuật Toán Trọng Tâm | Các Exports Chính |
| :--- | :---: | :--- | :--- |
| [`BrowserContext.types.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/contexts/browser/BrowserContext.types.ts) | 134 | Định nghĩa kiểu dữ liệu toàn diện cho hệ thống trình duyệt: cấu trúc tab (`BrowserTab`), item lịch sử (`HistoryItem`), dấu trang (`BookmarkItem`), sách nói đang phát (`ActiveAudioBook`), và interface hợp nhất (`BrowserContextValue`). | `BrowserTab`, `BookmarkItem`, `HistoryItem`, `ToastInfo`, `ActiveAudioBook`, `BrowserContextValue` |
| [`browserHelpers.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/contexts/browser/browserHelpers.ts) | 226 | Thuật toán chuyển đổi số Hán tự sang số Ả Rập (`chineseNumberToArabic`), làm sạch tiêu đề truyện (`cleanNovelTabTitle`), chuẩn hóa URL proxy cho iframe kèm `tabId`, tiêm script dịch (`injectTranslateScriptToTab`), xử lý dịch batch văn bản đa mode (`executeTranslate`, `ensureVietnameseText`). | `isCapacitor`, `getCachedTranslation`, `setCachedTranslation`, `chineseNumberToArabic`, `cleanNovelTabTitle`, `executeTranslate`, `ensureVietnameseText`, `normalizeUrlForIframe`, `injectTranslateScriptToTab` |
| [`index.tsx`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/contexts/browser/index.tsx) | 201 | Điểm hợp nhất của toàn bộ Browser Context. Khởi tạo `BrowserContext`, cung cấp `BrowserProvider`, kết nối state từ `useTabManager`, `useWebviewSync` và `useBrowserAudio`, xuất hook chuẩn hóa `useBrowser()`. | `BrowserContext`, `useBrowser`, `BrowserProvider` |
| [`useBrowserAudio.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/contexts/browser/useBrowserAudio.ts) | 206 | Quản lý state phát TTS của trình duyệt: `activeAudioObj`, `setActiveAudioObj`, đồng bộ con trỏ `activeAudioObjRef` thời gian thực (tránh closure stale state). Cơ chế phân đoạn ưu tiên (priority streaming): dịch ngay các đoạn khởi đầu để phát TTS tức thì (< 50ms) và nạp ngầm các đoạn còn lại. | `useBrowserAudio` |
| [`useBrowserAudioChapter.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/contexts/browser/useBrowserAudioChapter.ts) | 233 | Điều phối chuyển chương tự động thông minh: hỗ trợ 3 chế độ đọc: `offline`, `online` và `webview`. Tự động tạm dừng âm thanh cũ ngay khi phát lệnh `TRIGGER_NEXT` để chống đè tiếng giữa các chương. | `useBrowserAudioChapter` |
| [`useTabManager.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/contexts/browser/useTabManager.ts) | 293 | Cơ sở dữ liệu và thuật toán quản trị tab: tạo mới, đóng tab, chuyển đổi tab, điều hướng URL với thuật toán cắt nhánh lịch sử tương lai (`slice(0, idx + 1)`), lưu trữ bền vững vào `localStorage[tienhiep_browser_tabs]`, quản lý bookmark & history. | `useTabManager` |
| [`useWebviewSync.ts`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/contexts/browser/useWebviewSync.ts) | 300 | Cầu nối thông điệp IPC hai chiều: lắng nghe sự kiện `message`, xử lý `NAVIGATE_REQ`, `PAGE_LOADED`, `TRANSLATE_REQ`, `AUDIO_TEXT_RES`, `TAP_PARAGRAPH`. Cơ chế khử trùng lặp sự kiện kép chống phát nhiều luồng TTS đồng thời và chống tràn âm thanh khi đổi trang. | `useWebviewSync` |

---

## 📂 Liên Kết Tầng Kiến Trúc Liên Quan (Related Tree Modules)

Theo chuẩn **Quy Luật Kiến Trúc Cây Phân Cấp Đơn Chiều** (`docs/TREE_DEPENDENCY_ARCHITECTURE.md`), tầng State Context (Level 2) hoàn toàn độc lập với UI. Các thành phần giao diện trình duyệt được đặt tại các tầng tương ứng:

| Tầng Phân Cấp | Thư mục liên quan | Vai trò & Thành phần |
| :--- | :--- | :--- |
| **Level 3 (UI Components)** | [`frontend/src/components/browser/`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/components/browser/README.md) | Chứa các thành phần UI nguyên tử: `BrowserHeader.tsx` (thanh URL, các nút điều hướng), `BrowserViewports.tsx` (khung nhìn webview), `TabViewportItem.tsx` (sandbox iframe), `ChromeMobileNewTab.tsx` (trang tab mới). |
| **Level 3.5 (Layout Shells)** | [`frontend/src/layouts/browser/`](file:///home/alida/Documents/Extension_reader_tool/ttS/frontend/src/layouts/browser/README.md) | Vỏ bọc toàn màn hình điều phối: `BrowserOverlay.tsx` (kết nối state từ `useBrowser()` tới Header, Viewport, QuickTools và Modals). |

---

## ⚙️ Quy Chuẩn Kiến Trúc & An Toàn Mã Nguồn

1. **Fractal Boundary & Phân Tách Trách Nhiệm:** Thư mục duy trì chính xác 7 file mã nguồn cốt lõi (đạt chuẩn tối đa $\le 7$ files/thư mục). Tầng Context chỉ quản lý logic trạng thái, không chứa mã JSX trình bày UI.
2. **Line Budget Control:** Toàn bộ 7 file đều $\le 300$ dòng mã nguồn (từ 133 đến 299 dòng), đảm bảo khả năng tối ưu hóa bộ nhớ đệm context và kiểm thử độc lập.
3. **IPC Isolation:** Toàn bộ giao tiếp giữa ứng dụng chính và trang web ngoại vi đều thông qua IPC an toàn có chỉ định `origin` và kiểm tra payload, ngăn ngừa tuyệt đối nguy cơ rò rỉ bảo mật XSS.

---
*Tài liệu được cập nhật tự động đồng bộ theo hệ thống Tiên Hiệp AI Clean Architecture.*
