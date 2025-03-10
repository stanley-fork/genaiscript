// This module defines a system tool that applies OpenAI's meta prompt guidelines to a user-provided prompt.
// The tool refines a given prompt to create a detailed system prompt designed to guide a language model for task completion.

system({
    // Metadata for the tool
    title: "Tool that applies OpenAI's meta prompt guidelines to a user prompt",
    description:
        "Modified meta-prompt tool from https://platform.openai.com/docs/guides/prompt-generation?context=text-out.",
})

export default function (ctx: ChatGenerationContext) {
    const { defTool } = ctx

    // Define the 'meta_prompt' tool with its properties and functionality
    defTool(
        "meta_prompt",
        "Tool that applies OpenAI's meta prompt guidelines to a user prompt. Modified from https://platform.openai.com/docs/guides/prompt-generation?context=text-out.",
        {
            // Input parameter for the tool
            prompt: {
                type: "string",
                description:
                    "User prompt to be converted to a detailed system prompt using OpenAI's meta prompt guidelines",
            },
        },
        // Asynchronous function that processes the user prompt
        async ({ prompt: userPrompt, context }) => {
            const res = await runPrompt(
                (_) => {
                    _.$`Given a task description or existing prompt in USER_PROMPT, produce a detailed system prompt to guide a language model in completing the task effectively.

# Guidelines

- Understand the Task: Grasp the main objective, goals, requirements, constraints, and expected output.
- Minimal Changes: If an existing prompt is provided, improve it only if it's simple. For complex prompts, enhance clarity and add missing elements without altering the original structure.
- Reasoning Before Conclusions**: Encourage reasoning steps before any conclusions are reached. ATTENTION! If the user provides examples where the reasoning happens afterward, REVERSE the order! NEVER START EXAMPLES WITH CONCLUSIONS!
    - Reasoning Order: Call out reasoning portions of the prompt and conclusion parts (specific fields by name). For each, determine the ORDER in which this is done, and whether it needs to be reversed.
    - Conclusion, classifications, or results should ALWAYS appear last.
- Examples: Include high-quality examples if helpful, using placeholders [in brackets] for complex elements.
   - What kinds of examples may need to be included, how many, and whether they are complex enough to benefit from placeholders.
- Clarity and Conciseness: Use clear, specific language. Avoid unnecessary instructions or bland statements.
- Formatting: Use markdown features for readability.
- Preserve User Content: If the input task or prompt includes extensive guidelines or examples, preserve them entirely, or as closely as possible. If they are vague, consider breaking down into sub-steps. Keep any details, guidelines, examples, variables, or placeholders provided by the user.
- Constants: DO include constants in the prompt, as they are not susceptible to prompt injection. Such as guides, rubrics, and examples.
- Output Format: Explicitly the most appropriate output format, in detail. This should include length and syntax (e.g. short sentence, paragraph, YAML, INI, CSV, JSON, etc.)
    - For tasks outputting well-defined or structured data (classification, JSON, etc.) bias toward outputting a YAML.

The final prompt you output should adhere to the following structure below. Do not include any additional commentary, only output the completed system prompt. SPECIFICALLY, do not include any additional messages at the start or end of the prompt. (e.g. no "---")

[Concise instruction describing the task - this should be the first line in the prompt, no section header]

[Additional details as needed.]

[Optional sections with headings or bullet points for detailed steps.]

# Steps [optional]

[optional: a detailed breakdown of the steps necessary to accomplish the task]

# Output Format

[Specifically call out how the output should be formatted, be it response length, structure e.g. JSON, markdown, etc]

# Examples [optional]

[Optional: 1-3 well-defined examples with placeholders if necessary. Clearly mark where examples start and end, and what the input and output are. User placeholders as necessary.]
[If the examples are shorter than what a realistic example is expected to be, make a reference with () explaining how real examples should be longer / shorter / different. AND USE PLACEHOLDERS! ]

# Notes [optional]

[optional: edge cases, details, and an area to call or repeat out specific important considerations]`
                    _.def("USER_PROMPT", userPrompt)
                },
                {
                    // Specify the model to be used
                    model: "large",
                    // Label for the prompt run
                    label: "meta-prompt",
                    // System configuration, including safety mechanisms
                    system: ["system.safety_jailbreak"],
                }
            )
            // Log the result or any errors for debugging purposes
            context.debug(String(res.text ?? res.error))
            return res
        }
    )
}
