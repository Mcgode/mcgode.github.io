---
layout: post
title: "Rendering directional shadow maps in 2026 - Part 2"
date: 2026-10-22
categories: [articles]
lab: true
math: true
published: true
unlisted: true
---

We ended the last part with the following state:

{% include lab-viewport.liquid
    demo="shadow-step"
    code="shadow/wgsl/base.wgsl"
    options='{"filter":"nearest", "viewControl":false}'
    caption="Drag to orbit, right-drag to pan. Click the viewport to enable scroll-zoom." %}
<br>

We technically have shadows, but at the expense of shadow acne.
Let's fix that.


# Shadow biasing

## The fundamental problem

Okay, first let's understand the problem. Why do we get this pattern? 
Remember our shadow map, and how it is basically a batched set of parallel rays, stored as intersection depth in a 
2D texture. 
These ray intersection results are what we use directly to determine if a fragment on screen is occluded.

The issue lies in the fact that this 2D texture has a resolution limit. 
What we actually store is the intersection result of the ray that passes at the center of the given texel.
But what we do is that we use this value as a comparison reference for any fragment, even those whose ray doesn't go 
through the center of the texel.
Because of that we get incorrect occlusion results, which leads to shadow acne.

Let's visualize it, it might be easier to understand:

{% include lab-viewport.liquid
    demo="shadow-step"
    code="shadow/wgsl/base.wgsl"
    options='{"filter":"nearest", "resolution":512, "view":"both"}'
    caption="Drag to orbit, right-drag to pan. Click the viewport to enable scroll-zoom." %}

I added debug quads that project the depth map texels onto the scene. Each quad corresponds to one shadow map texel.
If you look close, you can see that it is those quads that are actually casting shadows, not the scene geometry 
directly. (though technically the quads are just the scene geometry projected onto the 2D shadow map).

So, what was the point then?
Why do we even bother with this approach if it does not provide correct occlusion results?
Because it is still a great approximation which we can work around.

So how do we fix it? By accepting that we are dealing with an approximation, and that we can work around it by 
using a technique called shadow mapping bias.

## Constant shadow bias

So, as stated, the discrete nature of the shadow map is what leads to acne: 

{% include figure.liquid
    src="/assets/img/articles/shadow-maps/shadow-acne.png"
    caption='<a href="https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping">LearnOpenGL</a>, Joey de Vries, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>'
%}

When the mesh surface is not orthogonal to the light ray, a part of the surface is likely to "slip" below the texel 
depth quad. 
But what if we add a small offset to the depth value we sample from the shadow map? 

{% include figure.liquid
    src="/assets/img/articles/shadow-maps/shadow-bias.png"
    caption='<a href="https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping">LearnOpenGL</a>, Joey de Vries, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>'
%}

We call such an offset a shadow bias.
Let's try it out:

{% include lab-viewport.liquid
    demo="shadow-step"
    code="shadow/wgsl/constant-bias.wgsl"
    options='{"filter":"nearest"}'
    caption="Drag to orbit, right-drag to pan. Click the viewport to enable scroll-zoom." %}

{% include lab-code.liquid
    snippets='[
        {"src": "shadow/wgsl/constant-bias.wgsl", "prev": "shadow/wgsl/base.wgsl", "title": "Shadow visibility"}
    ]' %}

If you play around with the interactive demo, you'll notice that by using a big enough bias, the acne goes away. 
But start cranking the bias too high, and the shadow will start to detach itself from its caster, in a phenomenon
known as **Peter panning** (as a nod to Peter Pan's shadow getting detached from its owner).

You have to find a middle ground between getting rid of acne, and not peter panning.

You will likely note that we don't get a nice and easy formula for computing an optimal bias. It's because there is 
none. You need to find a good value by trial and error. Historically, artists have been responsible for setting up 
bias values. These are often set per light in a scene for the best visuals.

If you play around some more, you may notice that changing the resolution of the shadow map impacts the effect of bias.
That's because the texel world size gets greater, and while the bias is not exactly in world units but depth units,
as both are proportional to each other; the bias needs to be scaled proportionally to texel world width if you want 
to reuse your settings across different resolutions.

{% include lab-viewport.liquid
    demo="shadow-step"
    code="shadow/wgsl/texel-bias.wgsl"
    options='{"filter":"nearest"}'
    caption="Drag to orbit, right-drag to pan. Click the viewport to enable scroll-zoom." %}

{% include lab-code.liquid
    snippets='[
        {"src": "shadow/wgsl/texel-bias.wgsl", "prev": "shadow/wgsl/constant-bias.wgsl", "title": "Shadow visibility"}
    ]' %}

If you play around now and modify the shadow map resolution, you will notice that the bias behaviour now tends to
be a lot more predictable.

You might also notice that the higher the resolution, the lower the peter panning. 
This is because peter panning shifting is proportional to texel size. 
If the resolution is higher, the texel size is smaller, and thus the peter panning shifting is smaller, and less 
noticeable.

Finally, you may also notice that the steeper surfaces (compared to the light direction) require a higher bias to fully 
get rid of acne.
By the time you stop getting acne on the sphere, the shadows from other objects are already peter panning.
Frustrating, right? Let's improve that.

## Slope-based bias

As you may have noticed before, the greater the relative surface slope to the light direction, the greater bias 
you need to apply to get rid of acne. To the point where you have no choice but to peter pan.

So let's be smart about it. How about we use that relative slope to dynamically adjust the bias?

{% include lab-viewport.liquid
    demo="shadow-step"
    code="shadow/wgsl/slope-bias.wgsl"
    options='{"filter":"nearest"}'
    caption="Drag to orbit, right-drag to pan. Click the viewport to enable scroll-zoom." %}

{% include lab-code.liquid
    snippets='[
        {"src": "shadow/wgsl/slope-bias.wgsl", "prev": "shadow/wgsl/texel-bias.wgsl", "title": "Shadow visibility"}
    ]' %}

This method is what we call slope-based bias.
While there are variants of it, this formula is the closest to what is considered to be the standard one.

As you can see, it drastically reduces peter panning, as we can use much lower bias factors with it.

You may note that we are using a max clamping value that provides a hard limit to the bias.
This is because unclamped bias can still lead to excessive peter panning when using grazing angles:

{% include image-compare.liquid
    before="/assets/img/articles/shadow-maps/slope-bias-clamped.png"
    after="/assets/img/articles/shadow-maps/slope-bias-unclamped.png"
    before_label="Clamped"
    after_label="Unclamped"
    alt="Floor shadows with and without the bias clamp"
    caption="Drag the slider." %}

Do note that this tends to be an edge case, so for most cases you can keep a high-bias clamp.

## Hardware bias

Slope-based bias has become such a mainstream approach to shadow biasing that it is natively supported by graphics APIs. 
It is often referred to as "hardware bias" because it is typically implemented directly in the hardware, which can 
provide better performance compared to software-based biasing.

Hardware bias is applied at the rasterizer stage, before the depth test. 
As such, you actually use hardware bias for the shadow pass, not the main render pass. 
This means that the bias is pre-applied to the shadow map, so you don't need to apply it in the shader.

Setting up hardware bias is usually done when setting up a pipeline state object (PSO) depth stencil state,
though some APIs set it as a dynamic state (like Metal and OpenGL).
Thankfully, the hardware bias logic specification is universal between APIs, and I would recommend you read the
[WebGPU specification](https://www.w3.org/TR/webgpu/#depth-stencil-state) for more details.

The APIs take three bias parameters:
 - **Constant bias**
 - **Slope scale bias**
 - **Depth bias clamp** (optional, some APIs don't support it)

These are the same values we used in the previous demo, but with the caveat that the formula is a bit different:<br>
`bias = constantBias * r + slopeScaleBias * maxDepthSlope`<br>
 - `maxDepthSlope` is the maximum of the horizontal and vertical slopes of the fragment's depth value. 
In shader code, it would be equivalent to `max(abs(dpdx(depth)), abs(dpdy(depth)))`, with the nuance that, as this 
value is the same across all fragments of the same primitive, the fixed function has to compute it only once per 
triangle.
 - `r` is a bit more complicated. It is what we call the smallest resolvable depth difference.
Basically, it is the smallest depth delta between two distinct depths for the current primitive. 
For UNorm depth formats, it is `1/(2^bits - 1)`, where bits is the number of bits in the depth format,
because the minimum depth delta is the same independently of the current depth. 
For float formats, it is a bit more complicated, as the minimum depth delta is not constant across the primitive.
In that case, it is set to `2^(exp(max z)-23)`.
 - if available, the depth clamp is applied to `bias` afterward, and works the same as our `maxBias` value from the 
previous section.
It should be noted that three.js does not support bias clamping, so we can't use it in the demos.

In the demos, so far, I have used 16-bit UNorm depth formats, so I get `r = 1/65535`. 
Do note that `r` only affects the constant bias, not the slope factor.

A point to note is that, as `maxDepthSlope` is using derivatives, it already takes the resolution into account:
using derivatives means that this value is proportional to texel size.

Also, since we use a depth differential rather than the tangent of the angle between the normal and the light direction,
we are not using quite the same slope factor.
In theory, it is more accurate as it is based on the actual slope of the primitive, rather than using a normal that does 
not correspond to the actual geometry.

Since the setup is quite different, we can't use the same values as the previous part, so this will require another
trial and error process to find the right values:

{% include lab-viewport.liquid
    demo="shadow-step"
    code="shadow/wgsl/base.wgsl"
    options='{"filter":"nearest", "hardwareBias":true}'
    caption="Drag to orbit, right-drag to pan. Click the viewport to enable scroll-zoom." %}

{% include lab-code.liquid
    snippets='[
        {"src": "shadow/wgsl/base.wgsl", "prev": "shadow/wgsl/slope-bias.wgsl", "title": "Shadow visibility (we return to the original function, as the bias is pre-applied to the shadow map)"},
        {"src": "demos/shadow-step.js", "region": "hardware-bias", "title": "Hardware bias setup"}
    ]' %}

## Receiver plane bias

## Normal offset bias

## Back face shadow maps, a.k.a. side-stepping the issue entirely

## Summary

Previous part: [Part 1]({% link _articles/directional-shadow-maps-part-1.md %}).
Next part: [Part 3]({% link _articles/directional-shadow-maps-part-3.md %}).

# References

- LearnOpenGL - [Shadow mapping](https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping)
- Render Diagrams - [Shadowmap Bias](https://renderdiagrams.org/2024/12/18/shadowmap-bias/)
- WebGPU specification - [Depth stencil state](https://www.w3.org/TR/webgpu/#depth-stencil-state)
- Microsoft Docs - [Depth Bias](https://learn.microsoft.com/en-us/windows/win32/direct3d11/d3d10-graphics-programming-guide-output-merger-stage-depth-bias)
- Real-Time Rendering, 4th Edition - [7.4. Shadow maps](https://www.realtimerendering.com/)