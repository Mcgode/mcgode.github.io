---
layout: post
title: "Project: Merge - Early prototype"
date: August 2020
tags: [UE4, Game prototype]
imagePreview: /assets/img/portfolio/project-merge.jpg
importance: minor
defaultTagColor: "#ffffff44"
---

This is a rough prototype of a game mechanic I wanted to try implementing: a realtime rewind mechanic.

To achieve this, the physical states of the game objects and the player are saved regularly in memory.
When rewinding, it is then just a matter of reapplying the states accordingly.
To have a smooth rewind animation, a linear interpolation is applied between these states.

To reduce the memory usage, those states aren't saved at a regular interval, but are instead saved 
when the physical value changes reach a variable threshold. This allows to compress the information
by only saving states when a value change is relevant.

<div class="ratio ratio-16x9">
    <iframe src="https://www.youtube.com/embed/vPMXBt8YsHA" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
