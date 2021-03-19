---
layout: post
title: "CapsuleSketch"
date: February 2021
endDate: March 2021
startDate: September 2020
tags: [Professional, WebGL, Raytracing, Raymarching]
imagePreview: /assets/img/portfolio/capsule-sketch.jpg
importance: major
---

[CapsuleSketch](https://capsulesketch.org/) is an online 3D modeler based around modeling with 
capsule primitives.

I joined the project as R&D intern Software Engineer, and was tasked with improving the rendering engine 
and implementing new 3D features.


### Raymarching and ShaderToy export

One of the research topics for the modeler was the implementation of a raymarching render mode, using 
implicit surfaces. The end goal was to be able to use this implicit representation for implementing 
smooth edges.

Sadly though, it was discovered early on that raymarching such a complex multi-volume model was too 
GPU intensive, and could end up crashing the user browser on lower-end machines. As a consequence, 
the in-modeler feature was put on indefinite hold.

However, the feature was not entirely scrapped as it was decided that it could still be used as a 
communication tool by reaching out to the [ShaderToy](https://www.shadertoy.com) community. <br>
As such, the raymarching code was reused to be exportable as a ShaderToy-ready shader.

Export example:
<iframe width="640" height="360" frameborder="0" src="https://www.shadertoy.com/embed/3d3fRf?gui=true&t=10&paused=true&muted=false" allowfullscreen></iframe>

If the demo has issues loading, use this [link](https://www.shadertoy.com/view/3d3fRf)
