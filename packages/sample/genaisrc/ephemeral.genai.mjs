script({
    title: "summarize all files with caching",
    files: "src/rag/markdown.md",
    model: "small",
    tests: [
        {
            files: "src/rag/markdown.md",
            keywords: "markdown",
        },
    ],
})

def("FILE", env.files, { cacheControl: "ephemeral" })

$`
Summarize all files in FILE in a single paragraph.
- Keep it short.
- At most 3 paragraphs.
- Consider all files at once, do NOT summarize files individually.
`.cacheControl("ephemeral")
