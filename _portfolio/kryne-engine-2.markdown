---
layout: post
title: "Kryne Engine 2"
date: September 2026
startDate: July 2021
tags: ["Vulkan", "DirectX 12", "Metal", "Game engine", "&#127959; Work in progress"]
imagePreview: /assets/img/portfolio/kryne-engine-2/physics-demo.png
permalink: /portfolio/kryne-engine-2:output_ext
importance: major
---

Kryne Engine 2 is my ongoing personal render/game engine project, a from-scratch, cross-platform engine written in
modern C++23, covering everything from the low-level RHI up to render-graph-driven rendering pipelines and sample
applications.

One of this engine's first concerns is performance, mainly due to my interest in the field.

## Features

### Modular architecture

The engine is built as a minimal [`Core`](https://github.com/Mcgode/KryneEngine2/tree/main/Core) — providing only
the base RHI, threading, memory, platform and math building blocks every other part relies on — plus a set of
independent, opt-in [`Modules`](https://github.com/Mcgode/KryneEngine2/tree/main/Modules) (render graph, file
system, GUI/ImGui, shader reflection, SDF text and texture rendering, physics, and more) that users only pull in
if and when they actually need them.

### Unit testing

I try to have as much unit testing as possible for the features as a way to try out some feature components during their
development. I also like to use them as non-regression tests. The engine and its modules are now covered by close to
200 test cases, run through CTest.

### Low-level rendering API

The engine supports Vulkan, DirectX 12 and Metal 4 as the backends for rendering, as the APIs allow for
multithreaded rendering and for many other low-level features such as memory reuse.

The backend was designed to be a low-overhead abstraction, meant to provide an API-agnostic interface while still
providing high performance, inspred by [Sebastian Aaltonen talk on the topic at Siggraph 2023](https://advances.realtimerendering.com/s2023/AaltonenHypeHypeAdvances2023.pdf)

### Job system

The engine uses a fibers system, which allows for interruptible workflows and an
highly concurrent execution of tasks.
I plan to use this system to have a heavily multithreaded execution of engine
code, where the main goal is to squeeze out as much available CPU time as possible,
similar to what [Naughty Dog did with their engine](https://www.gdcvault.com/play/1022186/Parallelizing-the-Naughty-Dog-Engine).

This system is functional, validated by unit tests, and is used throughout the engine and its samples.

### Memory Allocation

The engine integrates several memory allocators to better manage its RAM budget, including a TLSF allocator and a
stack allocator, on top of a generic index allocator used for handle-based resource pools. More allocation
strategies are planned as time goes on.

### Render graph

To enforce proper pass declaration and dependencies, and provide enhanced scheduling of CPU-side draw commands, the
engine features a [Render Graph module](https://github.com/Mcgode/KryneEngine2/tree/main/Modules/RenderGraph), along
with a companion debug module to visualize the built graph. It now drives the dedicated `RenderGraphDemo` sample.

For now it only supports a single sequential queue, but should be easily improved for multi-queue support.
I also plan to have some other features like in-flight temporary resources memory aliasing.

### Physics integration

A physics module wraps [Box3D](https://github.com/Mcgode/KryneEngine2/tree/main/Modules/Box3D) to bring rigid-body
simulation into the engine, exercised by the `PhysicsDemo` sample.

## Existing samples

### HelloTriangle

The classic graphics programming Hello Triangle. I set this sample up to test out the graphics API implementation.

![Screenshot](/assets/img/portfolio/kryne-engine-2/hello-triangle.png)

### ImGui demo

As stated by name, this is a sample with the only goal of running the ImGui demo window. This sample was used to test
the custom ImGui integration into the engine, and to test some graphics API features like descriptor sets.

![Screenshot](/assets/img/portfolio/kryne-engine-2/imgui-demo.png)

### Render graph demo

A sample scene rendered entirely through the render graph module, used to validate pass declaration, dependency
tracking and resource state transitions end to end.

### Physics demo

![Screenshot](/assets/img/portfolio/kryne-engine-2/physics-demo.png)

A sample exercising the Box3D-based physics module alongside the renderer, to validate the physics integration.
The sample is also a good way to experiment with concurrent loops: a variable-step render loop and a fixed-step game
loop, which includes the physics step. This was overall a great way to stress test the fiber system, and iron out
many of its kinks.

The demo provides a handful of loadable scenes to play with.

Here's a demo video to showcase it in action:
<video src="/assets/img/portfolio/kryne-engine-2/physics-demo.mp4" controls muted loop playsinline style="max-width: 100%;"></video>

### UI demo

![Screenshot](/assets/img/portfolio/kryne-engine-2/ui-demo.png)

A sample built on top of the GUI module, used to test engine-driven UI layout and rendering outside the ImGui
debug tooling.

Also used to test the text rendering library.

Source available on [GitHub](https://github.com/Mcgode/KryneEngine2).