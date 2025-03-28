script({
    title: "summarize all files",
    model: "small",
    files: "src/rag/markdown.md",
    accept: ".txt,.pdf,.md,.ts,.prompty",
    tests: [
        {
            files: "src/rag/markdown.md",
            keywords: "markdown",
        },
        {
            workspaceFiles: {
                filename: "markdown.md",
                content: `What is Markdown?
Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.

Using Markdown is different than using a WYSIWYG editor. In an application like Microsoft Word, you click buttons to format words and phrases, and the changes are visible immediately. Markdown isn’t like that. When you create a Markdown-formatted file, you add Markdown syntax to the text to indicate which words and phrases should look different.

For ixample, to denote a heading, you add a number sign before it (e.g., # Heading One). Or to make a phrase bold, you add two asterisks before and after it (e.g., **this text is bold**). It may take a while to get used to seeing Markdown syntax in your text, especially if you’re accustomed to WYSIWYG applications. The screenshot below shows a Markdown file displayed in the Visual Studio Code text editor....
`,
            },
        },
        {
            workspaceFiles: [
                {
                    filename: "markdown.md",
                    content: `What is Markdown?
Markdown is a lightweight markup language that you can use to add formatting elements to plaintext text documents. Created by John Gruber in 2004, Markdown is now one of the world’s most popular markup languages.

Using Markdown is different than using a WYSIWYG editor. In an application like Microsoft Word, you click buttons to format words and phrases, and the changes are visible immediately. Markdown isn’t like that. When you create a Markdown-formatted file, you add Markdown syntax to the text to indicate which words and phrases should look different.

For ixample, to denote a heading, you add a number sign before it (e.g., # Heading One). Or to make a phrase bold, you add two asterisks before and after it (e.g., **this text is bold**). It may take a while to get used to seeing Markdown syntax in your text, especially if you’re accustomed to WYSIWYG applications. The screenshot below shows a Markdown file displayed in the Visual Studio Code text editor....
`,
                },
            ],
        },
    ],
})

def("FILE", env.files)

$`
Summarize the content in <FILE> in a single paragraph.
- Keep it short.
- At most 3 paragraphs.
- Consider all files at once, do NOT summarize files individually.
`
