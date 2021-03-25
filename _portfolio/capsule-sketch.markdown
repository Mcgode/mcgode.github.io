---
layout: post
title: "CapsuleSketch"
date: February 2021
endDate: March 2021
startDate: September 2020
tags: [Professional, WebGL, Raytracing, Raymarching]
imagePreview: /assets/img/portfolio/capsule-sketch.jpg
defaultTagColor: "#d0d0d088"
importance: major
---

[CapsuleSketch](https://capsulesketch.org/) is an online 3D modeler based around modeling with 
capsule primitives.

I joined the project as R&D intern Software Engineer, and was tasked with improving the rendering engine 
and implementing new 3D features.

While I have worked on multiple elements of the modeler, I'll only include the most relevant.


### Improved cone frustum raytracing

An issue of the modeler when I joined was that, as the capsules (which are a combination of two 
spheres and a cone frustum) got close to having two extremities of the same radius, the cone 
raytracing started to experience severe graphical artifacts.

![Graphical artifacts](/assets/img/portfolio/capsule-sketch/cone-artifact.png)
<p class="font-italic text-center">
  Graphical artifact example. Top radius is 4, bottom radius is 3.98
</p>

This issue was due to the way the cone is raytraced, which led to manipulating huge float numbers, 
resulting in 32-bit float precision errors. <br>
To mitigate the issue at the time, the cones were converted to cylinders if the radii ratio reached a
certain threshold. This allowed to avoid the issue, but led to another issue:
![Cylinder issue](/assets/img/portfolio/capsule-sketch/cylinder-issue.png)
<p class="font-italic text-center ">
  Left ratio: 3.8 / 4. Right ratio: 3.9 / 4.
</p>

To solve this issue, I had to implement an entirely new cone raytracing algorithm; one that would 
solve the float precision issue. The new algorithm revealed itself to be very stable in our use-case,
being able to handle even the same-radius situation really well.

[Demo](https://www.shadertoy.com/view/WddcDf):
<iframe width="640" height="360" frameborder="0" src="https://www.shadertoy.com/embed/WddcDf?gui=true&t=10&paused=true&muted=false" allowfullscreen></iframe>
<br>

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

Export example (GPU intensive !):
<iframe width="640" height="360" frameborder="0" src="https://www.shadertoy.com/embed/3d3fRf?gui=true&t=10&paused=true&muted=false" allowfullscreen></iframe>

If the demo has issues loading, use this [link](https://www.shadertoy.com/view/3d3fRf)


### Auto-skinning and posing

One of the features I worked on was setting up an automatic skinning process, which allowed the
implementation of a model posing feature, and should help in setting up an animation feature in the
near future.

This automatic skinning is possible thanks to the model structure. Since we're using spheres, cone 
frustums and triangles, the model can be represented as an undirected graph. This makes it easy to determine 
possible bones in trivial cases:
![Trivial skinning](/assets/img/portfolio/capsule-sketch/trivial-skinning.png)

However, once cycles start to appear, determining those bones becomes non-trivial. As a consequence, 
it was decided that cycle groups are non-bendable, and form a single bone. 

My next task then was to create an algorithm for finding cycle groups in an undirected graph, since
no suitable algorithm was found. In the end, an algorithm was found, and the feature was implemented.
Technical details should be provided in a future article.

![Cycle groups skinning](/assets/img/portfolio/capsule-sketch/cycle-groups-skinning.png)

Going from there, the next step was generating the proper model skeleton and applying the skinning to 
the model, then setting up the posing interface:
![Posing](/assets/img/portfolio/capsule-sketch/posing.png)

