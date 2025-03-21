// cspell: disable
import * as vscode from "vscode"
import {
    AI_REQUEST_CHANGE,
    ExtensionState,
    REQUEST_OUTPUT_FILENAME,
    REQUEST_TRACE_FILENAME,
} from "./state"
import { showMarkdownPreview } from "./markdown"
import { registerCommand } from "./commands"
import { getChatCompletionCache } from "../../core/src/chatcache"
import {
    TRACE_NODE_PREFIX,
    CACHE_LLMREQUEST_PREFIX,
    CACHE_AIREQUEST_TRACE_PREFIX,
    CACHE_AIREQUEST_TEXT_PREFIX,
} from "../../core/src/constants"
import { extractFenced, renderFencedVariables } from "../../core/src/fence"
import { prettifyMarkdown } from "../../core/src/markdown"
import {
    logprobToMarkdown,
    topLogprobsToMarkdown,
} from "../../core/src/logprob"
import { fenceMD } from "../../core/src/mkmd"
import { renderTraceTree } from "../../core/src/traceparser"

const SCHEME = "genaiscript"

const noRequest = `
No GenAIScript request found yet. Please run a GenAIScript.
`
const noResponse = `
Waiting for GenAIScript response...
`

export function hasOutputOrTraceOpened() {
    return vscode.window.tabGroups.activeTabGroup?.tabs?.some((t) =>
        [REQUEST_OUTPUT_FILENAME, REQUEST_TRACE_FILENAME].some((f) =>
            t.label.includes(f)
        )
    )
}

class MarkdownTextDocumentContentProvider
    implements vscode.TextDocumentContentProvider
{
    constructor(readonly state: ExtensionState) {
        this.state.addEventListener(AI_REQUEST_CHANGE, () => {
            ;[REQUEST_OUTPUT_FILENAME, REQUEST_TRACE_FILENAME]
                .map((path) => infoUri(path))
                .forEach((uri) => {
                    this._onDidChange.fire(uri)
                })
        })
    }

    private _onDidChange: vscode.EventEmitter<vscode.Uri> =
        new vscode.EventEmitter<vscode.Uri>()
    readonly onDidChange: vscode.Event<vscode.Uri> = this._onDidChange.event

    private previewTraceNode(id: string) {
        const tree = this.state.aiRequest?.trace?.tree
        const node = tree?.nodes[id]
        if (typeof node === "object" && node?.type === "details")
            return node.content.map((n) => renderTraceTree(n, 3)).join("\n")
        return renderTraceTree(node, 3)
    }

    async provideTextDocumentContent(
        uri: vscode.Uri,
        token: vscode.CancellationToken
    ): Promise<string> {
        const aiRequest = this.state.aiRequest
        const computing = !!aiRequest?.computing
        const res = aiRequest?.response
        const wrap = (md: string) => {
            if (!aiRequest) return noRequest
            if (!md) return noResponse
            return `${computing ? `> **GenAIScript run in progress.**\n` : ""} 
${prettifyMarkdown(md)}    
            `
        }

        switch (uri.path) {
            case REQUEST_OUTPUT_FILENAME: {
                const tokens = res?.logprobs
                if (tokens?.length) {
                    if (tokens[0].topLogprobs?.length)
                        return wrap(
                            tokens
                                .map((lp) => topLogprobsToMarkdown(lp))
                                .join("\n")
                        )
                    else
                        return wrap(
                            tokens.map((lp) => logprobToMarkdown(lp)).join("\n")
                        )
                }
                let text = res?.text
                if (/^\s*\{/.test(text)) text = fenceMD(text, "json")
                return wrap(text)
            }
            case REQUEST_TRACE_FILENAME:
                return wrap(aiRequest?.trace.content)
        }
        if (uri.path.startsWith(TRACE_NODE_PREFIX)) {
            const id = uri.path
                .slice(TRACE_NODE_PREFIX.length)
                .replace(/\.md$/, "")
            return this.previewTraceNode(id)
        }
        if (uri.path.startsWith(CACHE_LLMREQUEST_PREFIX)) {
            const sha = uri.path
                .slice(CACHE_LLMREQUEST_PREFIX.length)
                .replace(/\.md$/, "")
            return previewOpenAICacheEntry(sha)
        }
        if (uri.path.startsWith(CACHE_AIREQUEST_TRACE_PREFIX)) {
            const sha = uri.path
                .slice(CACHE_AIREQUEST_TRACE_PREFIX.length)
                .replace(/\.md$/, "")
            return this.previewAIRequest(sha, "trace")
        }
        if (uri.path.startsWith(CACHE_AIREQUEST_TEXT_PREFIX)) {
            const sha = uri.path
                .slice(CACHE_AIREQUEST_TEXT_PREFIX.length)
                .replace(/\.md$/, "")
            return this.previewAIRequest(sha, "text")
        }
        return ""
    }

    private async previewAIRequest(sha: string, type: "trace" | "text") {
        const cache = this.state.aiRequestCache()
        const { key, val } = (await cache.getEntryBySha(sha)) || {}
        if (!key)
            return `## Oops
        
        Request \`${sha}\` not found in cache.
        `

        return type === "trace" ? val?.trace : val?.response?.text
    }
}

async function previewOpenAICacheEntry(sha: string) {
    const cache = getChatCompletionCache()
    const { key, val } = (await cache.getEntryBySha(sha)) || {}
    if (!key)
        return `## Oops
    
    Request \`${sha}\` not found in cache.
    `

    const extr = extractFenced(val.text)
    return `# Cached Request

-   \`${sha}\`

## Request

${Object.entries(key)
    .filter(([, value]) => typeof value !== "object")
    .map(([k, v]) => `-  ${k}: \`${JSON.stringify(v, null, 2)}\``)
    .join("\n")}

### Messages

${key.messages
    .map(
        (msg) => `-   **${msg.role}:**
\`\`\`\`\`
${
    typeof msg.content === "string"
        ? msg.content.trim()
        : JSON.stringify(msg.content)
}
\`\`\`\`\`
`
    )
    .join("\n")}

## Extracted variables    

${renderFencedVariables(extr)}

## Raw Response

\`\`\`\`\`
${val}
\`\`\`\`\`

`
}

export function infoUri(path: string) {
    return vscode.Uri.from({ scheme: SCHEME, path })
}

export function activateMarkdownTextDocumentContentProvider(
    state: ExtensionState
) {
    const { context } = state
    const { subscriptions } = context
    const provider = new MarkdownTextDocumentContentProvider(state)
    subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider(SCHEME, provider),
        registerCommand("genaiscript.request.open", async (id: string) => {
            const uri = infoUri(id || REQUEST_TRACE_FILENAME)
            await showMarkdownPreview(uri)
        }),
        registerCommand("genaiscript.request.open.trace", () => {
            state.dispatchAIRequestChange()
            return vscode.commands.executeCommand(
                "genaiscript.request.open",
                REQUEST_TRACE_FILENAME
            )
        }),
        registerCommand("genaiscript.request.open.output", async () => {
            state.dispatchAIRequestChange()
            return vscode.commands.executeCommand(
                "genaiscript.request.open",
                REQUEST_OUTPUT_FILENAME
            )
        })
    )
}
