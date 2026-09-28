---
layout: post
title: "Slang support for JetBrains IDEs"
date: September 2026
startDate: August 2026
tags: [Kotlin, "IntelliJ Platform", Tool]
imagePreview: /assets/img/portfolio/slang-intellij.png
importance: minor
defaultTagColor: "#ffffff44"
---

[Slang Language Support](https://plugins.jetbrains.com/plugin/26040-slang-language-support) is a
plugin I built for JetBrains IDEs, adding editor support for the
[Slang](https://shader-slang.com/) shading language.

![Syntax highlighting in the plugin](/assets/img/portfolio/slang-intellij.png)

The core of the plugin is an integration of [`slangd`](https://github.com/shader-slang/slang), the
official Slang language server, over LSP, bringing code completion, diagnostics, hover
documentation, go to definition, signature help, semantic highlighting, formatting and inlay hints
straight into the IDE. The plugin can also download and manage a matching `slangd` on its own, or
be pointed at one already on disk or on the `PATH`.

On top of that, it adds a few editor features that don't depend on the language server: offline
syntax highlighting with a dedicated color settings page, occurrence highlighting, auto-indentation,
brace and quote matching, comment toggling, and code folding for blocks, block comments and
`#if` / `#endif` regions.

Since Slang's front-end is a near-superset of HLSL, the plugin also lights up the same
language-server features for HLSL files (including Unreal's `.usf` / `.ush`) by default, with
optional GLSL support as well. It only claims a file extension where no other plugin already owns
it, so it stays out of the way in Rider or alongside a dedicated GLSL plugin.

The 0.2 rewrite of the plugin was largely built with an AI assistant, under my review and
direction, an interesting experiment in AI-assisted development for a fairly niche, LSP-heavy
plugin. It compiles cleanly, passes its unit tests and clears the JetBrains Plugin Verifier.

Source available on [GitHub](https://github.com/Mcgode/slang-intellij).

