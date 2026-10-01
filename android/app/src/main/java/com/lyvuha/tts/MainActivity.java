package com.lyvuha.tts;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.browser.customtabs.CustomTabsIntent;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.webkit.WebView;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import java.util.Collections;

public class MainActivity extends BridgeActivity {

    private static final String DOCUMENT_START_TRANSLATION_SCRIPT =
        "(function() {\n" +
        "    if (window === window.top) return;\n" +
        "    if (window.__tienhiep_subframe_injected || window.__TienHiepHelpers) return;\n" +
        "    window.__tienhiep_subframe_injected = true;\n" +
        "    var CHINESE_REGEX = /[\\u4e00-\\u9fa5]/;\n" +
        "    var translatedNodes = new WeakSet();\n" +
        "    var pendingNodes = new WeakSet();\n" +
        "    var pendingRequests = new Map();\n" +
        "    var reqCounter = 0;\n" +
        "    var isEnabled = true;\n" +
        "    function collectChineseNodes(root) {\n" +
        "        if (!root) return [];\n" +
        "        var nodes = [];\n" +
        "        var walker = document.createTreeWalker(\n" +
        "            root,\n" +
        "            NodeFilter.SHOW_TEXT,\n" +
        "            {\n" +
        "                acceptNode: function(node) {\n" +
        "                    if (!node || !node.nodeValue) return NodeFilter.FILTER_REJECT;\n" +
        "                    var text = node.nodeValue.trim();\n" +
        "                    if (!text || !CHINESE_REGEX.test(text)) return NodeFilter.FILTER_REJECT;\n" +
        "                    var parent = node.parentElement;\n" +
        "                    if (!parent) return NodeFilter.FILTER_REJECT;\n" +
        "                    var tag = parent.tagName.toUpperCase();\n" +
        "                    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'CODE' || tag === 'PRE') {\n" +
        "                        return NodeFilter.FILTER_REJECT;\n" +
        "                    }\n" +
        "                    if (translatedNodes.has(node) || pendingNodes.has(node)) {\n" +
        "                        return NodeFilter.FILTER_REJECT;\n" +
        "                    }\n" +
        "                    return NodeFilter.FILTER_ACCEPT;\n" +
        "                }\n" +
        "            }\n" +
        "        );\n" +
        "        var n;\n" +
        "        while ((n = walker.nextNode())) {\n" +
        "            nodes.push(n);\n" +
        "        }\n" +
        "        return nodes;\n" +
        "    }\n" +
        "    function sendBatch(nodes) {\n" +
        "        if (!nodes || nodes.length === 0) return;\n" +
        "        for (var i = 0; i < nodes.length; i++) {\n" +
        "            pendingNodes.add(nodes[i]);\n" +
        "        }\n" +
        "        var id = ++reqCounter;\n" +
        "        var texts = nodes.map(function(n) { return n.nodeValue; });\n" +
        "        pendingRequests.set(id, nodes);\n" +
        "        try {\n" +
        "            window.top.postMessage({\n" +
        "                type: 'TRANSLATE_REQ',\n" +
        "                id: id,\n" +
        "                texts: texts\n" +
        "            }, '*');\n" +
        "        } catch (e) {\n" +
        "            console.error('[SubframeTranslator] postMessage error:', e);\n" +
        "        }\n" +
        "    }\n" +
        "    function streamText(node, fullText) {\n" +
        "        if (!node || !node.parentElement) return;\n" +
        "        var words = fullText.split(' ');\n" +
        "        if (words.length <= 4) {\n" +
        "            node.nodeValue = fullText;\n" +
        "            return;\n" +
        "        }\n" +
        "        var current = 0;\n" +
        "        var step = Math.max(2, Math.ceil(words.length / 10));\n" +
        "        var interval = setInterval(function() {\n" +
        "            if (!node || !node.parentElement) {\n" +
        "                clearInterval(interval);\n" +
        "                return;\n" +
        "            }\n" +
        "            current = Math.min(words.length, current + step);\n" +
        "            node.nodeValue = words.slice(0, current).join(' ');\n" +
        "            if (current >= words.length) {\n" +
        "                clearInterval(interval);\n" +
        "                node.nodeValue = fullText;\n" +
        "            }\n" +
        "        }, 16);\n" +
        "    }\n" +
        "    function scanAndTranslate() {\n" +
        "        if (!isEnabled) return;\n" +
        "        var root = document.body || document.documentElement;\n" +
        "        if (!root) return;\n" +
        "        var nodes = collectChineseNodes(root);\n" +
        "        if (nodes.length > 0) {\n" +
        "            var chunkSize = 25;\n" +
        "            for (var i = 0; i < nodes.length; i += chunkSize) {\n" +
        "                sendBatch(nodes.slice(i, i + chunkSize));\n" +
        "            }\n" +
        "        }\n" +
        "    }\n" +
        "    var debounceTimer = null;\n" +
        "    function scheduleScan() {\n" +
        "        if (!isEnabled) return;\n" +
        "        if (debounceTimer) clearTimeout(debounceTimer);\n" +
        "        debounceTimer = setTimeout(scanAndTranslate, 300);\n" +
        "    }\n" +
        "    function setupObserver() {\n" +
        "        var target = document.body || document.documentElement;\n" +
        "        if (!target) {\n" +
        "            setTimeout(setupObserver, 200);\n" +
        "            return;\n" +
        "        }\n" +
        "        var observer = new MutationObserver(function(mutations) {\n" +
        "            var hasNew = false;\n" +
        "            for (var i = 0; i < mutations.length; i++) {\n" +
        "                if (mutations[i].addedNodes && mutations[i].addedNodes.length > 0) {\n" +
        "                    hasNew = true;\n" +
        "                    break;\n" +
        "                }\n" +
        "            }\n" +
        "            if (hasNew) scheduleScan();\n" +
        "        });\n" +
        "        observer.observe(target, { childList: true, subtree: true });\n" +
        "    }\n" +
        "    function unwrapUrl(rawUrl) {\n" +
        "        try {\n" +
        "            var u = new URL(rawUrl);\n" +
        "            if (u.hostname.indexOf('google.') !== -1 && (u.pathname === '/url' || u.pathname.indexOf('/url') === 0)) {\n" +
        "                var target = u.searchParams.get('url') || u.searchParams.get('q');\n" +
        "                if (target && (target.indexOf('http://') === 0 || target.indexOf('https://') === 0)) {\n" +
        "                    return target;\n" +
        "                }\n" +
        "            }\n" +
        "        } catch (e) {}\n" +
        "        return rawUrl;\n" +
        "    }\n" +
        "    function setupClickInterceptor() {\n" +
        "        document.addEventListener('click', function(e) {\n" +
        "            var anchor = e.target && e.target.closest ? e.target.closest('a') : null;\n" +
        "            if (!anchor) return;\n" +
        "            var href = anchor.href;\n" +
        "            if (!href || href.indexOf('javascript:') === 0 || href.indexOf('#') === 0) return;\n" +
        "            if (href.indexOf(location.origin + location.pathname + '#') === 0) return;\n" +
        "            var finalUrl = unwrapUrl(href);\n" +
        "            e.preventDefault();\n" +
        "            e.stopPropagation();\n" +
        "            try {\n" +
        "                window.top.postMessage({\n" +
        "                    type: 'NAVIGATE_REQ',\n" +
        "                    url: finalUrl\n" +
        "                }, '*');\n" +
        "            } catch (err) {}\n" +
        "        }, true);\n" +
        "    }\n" +
        "    window.addEventListener('message', function(event) {\n" +
        "        var data = event.data;\n" +
        "        if (!data) return;\n" +
        "        if (data.action === 'TRANSLATE_RES') {\n" +
        "            var id = data.id;\n" +
        "            var translations = data.translations;\n" +
        "            var nodes = pendingRequests.get(id);\n" +
        "            if (nodes && Array.isArray(translations)) {\n" +
        "                for (var i = 0; i < nodes.length; i++) {\n" +
        "                    var node = nodes[i];\n" +
        "                    var trans = translations[i];\n" +
        "                    if (node) {\n" +
        "                        pendingNodes.delete(node);\n" +
        "                        if (trans && trans !== node.nodeValue) {\n" +
        "                            streamText(node, trans);\n" +
        "                            translatedNodes.add(node);\n" +
        "                        }\n" +
        "                    }\n" +
        "                }\n" +
        "                pendingRequests.delete(id);\n" +
        "            }\n" +
        "        } else if (data.action === 'NAV_GO_BACK') {\n" +
        "            window.history.back();\n" +
        "        } else if (data.action === 'NAV_GO_FORWARD') {\n" +
        "            window.history.forward();\n" +
        "        } else if (data.action === 'FORCE_TRANSLATE') {\n" +
        "            isEnabled = true;\n" +
        "            scanAndTranslate();\n" +
        "        } else if (data.action === 'TOGGLE_AUTO_TRANSLATE') {\n" +
        "            isEnabled = !!data.enabled;\n" +
        "            if (isEnabled) scanAndTranslate();\n" +
        "        }\n" +
        "    });\n" +
        "    if (document.readyState === 'loading') {\n" +
        "        document.addEventListener('DOMContentLoaded', function() {\n" +
        "            scanAndTranslate();\n" +
        "            setupObserver();\n" +
        "            setupClickInterceptor();\n" +
        "        });\n" +
        "    } else {\n" +
        "        scanAndTranslate();\n" +
        "        setupObserver();\n" +
        "        setupClickInterceptor();\n" +
        "    }\n" +
        "    window.addEventListener('load', function() {\n" +
        "        scanAndTranslate();\n" +
        "        setTimeout(scanAndTranslate, 1000);\n" +
        "        setTimeout(scanAndTranslate, 2500);\n" +
        "    });\n" +
        "})();";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeBrowserPlugin.class);
        super.onCreate(savedInstanceState);

        try {
            WebView webView = getBridge().getWebView();
            if (webView != null && WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
                WebViewCompat.addDocumentStartJavaScript(
                    webView,
                    DOCUMENT_START_TRANSLATION_SCRIPT,
                    Collections.singleton("*")
                );
            }
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Failed to add document start translation script", e);
        }
    }

    @CapacitorPlugin(name = "NativeBrowser")
    public static class NativeBrowserPlugin extends Plugin {
        @PluginMethod
        public void open(PluginCall call) {
            String urlStr = call.getString("url");
            if (urlStr == null || urlStr.isEmpty()) {
                call.reject("URL is empty");
                return;
            }
            try {
                CustomTabsIntent customTabsIntent = new CustomTabsIntent.Builder()
                    .setShowTitle(true)
                    .build();
                customTabsIntent.launchUrl(getActivity(), Uri.parse(urlStr));
                call.resolve();
            } catch (Exception e) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(urlStr));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getActivity().startActivity(intent);
                    call.resolve();
                } catch (Exception ex) {
                    call.reject(ex.getMessage());
                }
            }
        }
    }
}
