---
layout: post
title: "Kryne Engine 2"
date: June 2024
startDate: July 2021
tags: ["Vulkan", "DirectX 12", "Metal", "Game engine", "&#127959; Work in progress"]
imagePreview: /assets/img/portfolio/kryne-engine-2/ke2-placeholder.png
permalink: /portfolio/kryne-engine-2:output_ext
importance: major
---

This is a new personal render engine project, which I hope to one day be able to 
experiment new render techniques with.

One of this engine's first concern is performance, mainly due to my interest in the field.

## Features

### Unit testing

I try to have as much unit testing as possible for the features as a way to try out some feature components during their
development. I also like to use them as non-regression tests.

### Low-level rendering API

The engine supports Vulkan, DirectX 12 and Metal as the backends for rendering, as the APIs allows for 
multithreaded rendering and for many other low-level features such as memory reuse.

The backend was designed to be a low-overhead abstraction, meant to provide an API-agnostic interface while still
providing high performance, inspred by [Sebastian Aaltonen talk on the topic at Siggraph 2023](https://advances.realtimerendering.com/s2023/AaltonenHypeHypeAdvances2023.pdf)

### Job system

The engine uses a fibers system, which allows for interruptible workflows and an
highly concurrent execution of tasks.
I plan to use this system to have a heavily multithreaded execution of engine
code, where the main goal is to squeeze out as much available CPU time as possible,
similar to what [Naughty Dog did with their engine](https://www.gdcvault.com/play/1022186/Parallelizing-the-Naughty-Dog-Engine).

This system is currently functional and has a few unit tests to validate its core logic
However, it has yet to be truly battle-tested.

### Memory Allocation

I've started to integrate some memory allocators to the engine to better manage the engine RAM budget. 
The engine currently features a TLSF allocator, but I plan on adding more as time goes on.

### Render graph

To enforce proper pass declaration and dependencies, and provide enhanced scheduling of CPU-side draw commands, I have
been working on a simplified Render Graph system.

For now it only supports a single sequential queue, but should be easily improved for multi-queue support.
I also plan to have some other features like in-flight temporary resources memory aliasing.

## Existing samples

### HelloTriangle

The classic graphics programming Hello Triangle. I set this sample up to test out the graphics API implementation.

![Screenshot](/assets/img/portfolio/kryne-engine-2/hello-triangle.png)

### ImGui demo

As stated by name, this is a sample with the only goal of running the ImGui demo window. This sample was used to test 
the custom ImGui integration into the engine, and to test some graphics API features like descriptor sets. 

![Screenshot](/assets/img/portfolio/kryne-engine-2/imgui-demo.png)