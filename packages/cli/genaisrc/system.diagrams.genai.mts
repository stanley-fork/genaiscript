system({
    title: "Generate diagrams",
})

export default function (ctx: ChatGenerationContext) {
    const { $ } = ctx

    $`## Diagrams Format
Use mermaid syntax if you need to generate state diagrams, class inheritance diagrams, relationships.`
}
