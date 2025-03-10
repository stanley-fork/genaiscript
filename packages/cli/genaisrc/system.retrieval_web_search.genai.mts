system({
    title: "Web Search",
    description: "Function to do a web search.",
})

export default function (ctx: ChatGenerationContext) {
    const { defTool } = ctx
    defTool(
        "retrieval_web_search",
        "Search the web for a user query using Tavily or Bing Search.",
        {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Search query.",
                },
                count: {
                    type: "integer",
                    description: "Number of results to return.",
                },
            },
            required: ["query"],
        },
        async (args) => {
            const { query, count } = args
            const webPages = await retrieval.webSearch(query, {
                count,
                ignoreMissingProvider: true,
            })
            if (!webPages)
                return "error: no web search provider configured (https://microsoft.github.io/genaiscript/reference/scripts/web-search/)"
            return YAML.stringify(
                webPages.map((f) => ({
                    url: f.filename,
                    content: f.content,
                }))
            )
        }
    )
}
