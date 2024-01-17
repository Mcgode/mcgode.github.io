---
layout: post
title: "Wild Sheep Studio"
date: November 2021
startDate: May 2021
endDate: July 2023
tags: ["Professional", "Vulkan", "DirectX 12", "PS5"]
imagePreview: /assets/img/portfolio/wild-sheep-studio-big.png
importance: major
---

![Wild Sheep Studio Logo](/assets/img/portfolio/wild-sheep-studio.png)

Back in May 2021, I joined Wild Sheep Studio, a AA game studio based in Montpellier, France, as both 
a graphics and engine programmer for their project.
Given the size of the team and our use of an in-house engine, while my main job was as a graphics 
programmer, I've also worked on multiple occasions on the engine itself.

Due to confidentiality, I can't share anything precise, but I hope I'll get to show some 
of the work I've done there one day.

In the meantime I can share a non-exhaustive list of features I've worked on:
- setting up a render target texture reuse system, to reduce the render pipeline memory usage.
- implementation of motion vectors and modernization of the motion blur effect
- implementation and maintenance of a robust screen space reflections system
- improvement of fur shading
- implementation of a specialized draw system for vegetation instances, which allows for performant 
  multi-threaded registrations and un-registrations of many instances, with minimal contention.
- implementation of a hierarchical wind displacement system, to apply believable wind to objects 
  like trees.
- volumetric lighting maintenance and fixing
- porting engine to DirectX 12
