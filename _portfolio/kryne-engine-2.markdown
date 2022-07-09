---
layout: post
title: "Kryne Engine 2"
date: July 2022
startDate: July 2021
tags: ["Vulkan", "Game engine", "&#127959; Work in progress"]
imagePreview: /assets/img/portfolio/kryne-engine-2/ke2-placeholder.png
permalink: /portfolio/kryne-engine-2:output_ext
importance: minor
---

This is a new personal render engine project, which I hope to one day be able to 
experiment new render techniques with one day (though as all engine projects out 
there, I doubt this will see the light of day).

This engine's first concern is performance, because I love optimising things, and
I love having my games running butter smooth even more.

## Features

### Low-level rendering API

The engine will use Vulkan as the backend for rendering, as the API allows for 
multi-threaded rendering and for many other low-level features such as memory 
reuse.

I'm still currently setting up the boilerplate though.

### Job system

The engine uses a fibers system, which allows for interruptible workflows and an
highly concurrent execution of tasks.
I plan to use this system to have a heavily multi-threaded execution of engine 
code, where the main goal is to squeeze out as much available CPU time as possible,
similar to what [Naughty Dog did with their engine](https://www.gdcvault.com/play/1022186/Parallelizing-the-Naughty-Dog-Engine). 

This system is currently functional but has yet to be truly battle-tested.
