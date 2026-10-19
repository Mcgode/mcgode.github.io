---
layout: post
title: "Rendering directional shadow maps in 2026 - Part 1"
date: 2026-10-19
categories: [articles]
lab: true
published: true
---

![Illustration](/assets/img/articles/shadow-maps/illustration.png)

A few weeks ago, I was working on implementing a shadow map solution for one of my engine samples, and was quite 
surprised at how complicated it was to find up-to-date information on the subject. Not to shame any of the devs who 
have been publishing articles on the subject on it, but most articles tend to either focus too much on only a part of
the subject, or are outdated.

It resulted in me having to spend a considerable amount of time researching and experimenting with different approaches 
before finally finding a solution that worked for me.

So, to aid future developers who may be facing similar challenges, I decided to write a series of articles on the 
subject, where I will try and present a comprehensive and up-to-date approach to rendering directional shadow maps.
I will try to cover the many known techniques at each step, both the ones that are still relevant and the ones that 
have been superseded by newer techniques.

As this is a long and complicated topic, I have decided to break it down into four parts:
- Part 1: Rendering a simple directional shadow map
- Part 2: Shadow biasing
- Part 3: Shadow filtering
- Part 4: Cascaded shadow maps

All along these articles, I will be providing interactive demos, both to illustrate and to allow you to navigate the
scene, change the parameters, and see the possible issues for yourself. 
The scenes will be rendered using three.js WebGPU, so make sure to use a compatible browser. As such, code samples 
will be provided in JavaScript (for CPU code) and WGSL (for shaders).

We will be using the following demo scene:

{% include lab-viewport.liquid
    demo="unshadowed"
    caption="Drag to orbit, right-drag to pan. Click the viewport to enable scroll-zoom." %}