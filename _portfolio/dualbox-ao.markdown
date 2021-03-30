---
layout: post
title: "Dualbox - GPU-accelerated AO computing"
date: September 2019
startDate: June 2019
endDate: September 2019
tags: [Professional, WebGL]
imagePreview: /assets/img/portfolio/dualbox-ao.jpg
importance: major
---

During my work as an intern engineer at Dioxygen Software, I was tasked with the 
development and the implementation of a progressive ambient occlusion algorithm 
compatible with WebGL.

![Progressive AO preview](/assets/img/portfolio/dualbox-ao.jpg)
<p class="font-italic text-center">
  Computed scene AO, applied on a white material. 
  <a href="https://dualbox.com/apps/environment-shadows/dev">Run it</a>
</p>

This algorithm provides a high fidelity computing of the AO for a provided scene, and
is executed on the GPU, allowing for improved compute times.
The algorithm is equivalent to launching several hundreds of thousands of primary rays, 
which turned out to be tricky when limited to webGL

The computation can be made over multiple frames, to keep the scene from freezing when
computing the AO.

The algorithm can be applied in a few different pipelines:

- You can run it has a screen-space AO pass, allowing for pixel perfect 
  resolution. In this mode though, the compute process has to restart every time the
  scene or the camera changes:
  ![Update demo](/assets/img/portfolio/dualbox-ao-ss-update.gif)
  
  This approach gives the best results overall quality-wise, and doesn't require 
  anything like a UV map to be set up, making it work in pretty much all scenarios.
  
  With a powerful enough machine, it might be able to run in real-time, with its 
  sampling rate toned down. 
  
- The next approach is to use the algorithm to compute the AO texture directly. This
  allows for a one-time AO computing, provided the scene doesn't change as well. 
  
  While it can provide great results with a nicely mapped mesh, you're not safe from 
  encountering issues related to bad UV mapping.
  
- One last approach is to use the algorithm to compute a per-vertex AO value. It 
  features the same advantages as the AO map approach, but doesn't require any UV map
  to be set up beforehand. 
  
  Its main issue though is that if the vertex count is too low, it can lead to 
  artifacts.
  
Sadly, I cannot delve too much on the inner workings of the algorithm, as it is 
confidential, I can only discuss them with specific authorization. 
[Contact me](mailto:{{site.email}}) if interested.

You can try it [here](https://stl-viewer.dualbox.com/)

<p class="font-italic mt-5">Additional examples:</p>

![Skull example](/assets/img/portfolio/dualbox-ao/skull.jpg)

![Voronoi woman example](/assets/img/portfolio/dualbox-ao/voronoi.jpg)

![Witcher example](/assets/img/portfolio/dualbox-ao/witcher.jpg)
