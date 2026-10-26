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

Another approach for biasing is a method called **receiver plane bias**.
This method relies on two observations: the further a fragment is from the shadow texel center, the more it differs
from the store depth value; and at a shadow texel granularity, the geometry surface can be approximated as a plane.

Based on these observations, the technique biases the fragment depth value by:
 - first emulating the surface plane at the fragment position. Geometrically speaking, we retrieve the **tangent plane**.
 - computing the intersection between the plane and the ray passing at the shadow texel center
 - using this intersection as the fragment depth instead.

Let's illustrate this:

{% include figure.liquid 
    src="/assets/img/articles/shadow-maps/receiver-plane-planar.svg"
    max_height=500
    caption="Flat surface situation visualized" %}

With a flat surface, we get a perfect bias. That's pretty nice. But in practice we don't often get flat surfaces,
so let's see what we get with a curved surface. First, let's look at a convex one:

{% include figure.liquid 
    src="/assets/img/articles/shadow-maps/receiver-plane-curved.svg"
    max_height=500
    caption="Convex curved surface situation visualized" %}

Now we can see that we get some slight over-biasing, which is not ideal, but should be acceptable.
Let's now see a concave surface:

{% include figure.liquid 
    src="/assets/img/articles/shadow-maps/receiver-plane-concave.svg"
    max_height=500
    caption="Concave curved surface situation visualized" %}

Yeah... It was predictable, but sadly it is under-biasing. 
But it still helps in reducing the shadow acne, and with a bit more bias we can cover for situations like this.

Now let's see how we implement it shader-wise. 
There are two approaches to achieve it: using screen-space derivatives or manually calculating the tangent plane.

### Using screen-space derivatives

<div class="alert alert-info" role="alert">
This approach is best suited for situations where you get proper primitive screen-space derivatives.
As such it works great in forward rendering pipelines, but is not recommended for deferred rendering pipelines
(unless you have access to primitive-level geometry data using something like a visibility buffer).
</div>

This is the original approach, as presented by John Isidoro back in 2006 at GDC.

Basically, we want to retrieve

$$
b = \overrightarrow{CS} \cdot \frac{\partial z}{\partial UV}
$$

where $$b$$ is the receiver plane bias, $$\overrightarrow{CS}$$ is the UV-space vector from the texel center to the fragment shadow 
coordinates, and $$\frac{\partial z}{\partial UV}$$ is the partial derivative of the depth value in the UV-space.

$$\overrightarrow{CS}$$ is the easy part, as we can easily retrieve it from the shadow coords and the shadow map 
resolution:
```wgsl
let distanceToCenterUv = (fract(shadowCoord.xy * shadowResolution) - 0.5) / shadowResolution;
```

The partial derivative is a bit more tricky. With screen-space derivatives, we can get 
$$\frac{\partial z}{\partial XY}$$, $$\frac {\partial U} {\partial XY}$$ and $$\frac {\partial V} {\partial XY}$$:
```wgsl
let dz_dXY = vec2<f32>(dpdx(shadowCoord.z), dpdy(shadowCoord.z));
let dU_dXY = vec2<f32>(dpdx(shadowCoord.x), dpdy(shadowCoord.x));
let dV_dXY = vec2<f32>(dpdx(shadowCoord.y), dpdy(shadowCoord.y));
```
but that's not exactly what we need, which is $$\frac{\partial z}{\partial UV}$$.

Thankfully, as explained in Isidoro's presentation, we have a great mathematical too to help us out: the Jacobian.
{% include figure.liquid
    src="/assets/img/articles/shadow-maps/isidoro-jacobian.png"
    max_height=500
    caption="Courtesy of GDC Vault" %}
(do note that the slide uses $$d$$ instead of $$z$$ like we do)

Let's develop that inverse transpose:

$$
\def\arraystretch{3}
\def\p#1#2{\dfrac{\partial #1}{\partial #2}}
\begin{bmatrix}
\p{U}{X} & \quad \p{U}{Y} \\
\p{V}{X} & \quad \p{V}{Y}
\end{bmatrix}^{-T}
\quad = \quad
\dfrac{1}{\p{U}{X} \cdot \p{V}{Y} \; - \; \p{U}{Y} \cdot \p{V}{X}}
\quad
\begin{bmatrix}
\p{V}{Y} & \quad -\p{U}{Y} \\
-\p{V}{X} & \quad \p{U}{X}
\end{bmatrix}^T 
\\
\quad = \quad
\dfrac{1}{\p{U}{X} \cdot \p{V}{Y} \; - \; \p{U}{Y} \cdot \p{V}{X}}
\quad
\begin{bmatrix}
\p{V}{Y} & \quad -\p{V}{X} \\
-\p{U}{Y} & \quad \p{U}{X}
\end{bmatrix}
$$

That determinant can be zero, which happens only when the plane normal is perpendicular to the light direction.
Usually, that means that $$N \cdot L = 0$$, so for most cases we can ignore bias.

In shader code, this is translated to:
```wgsl
let det = dU_dXY.x * dV_dXY.y - dU_dXY.y * dV_dXY.x;

var dz_dUV = vec2<f32>(0.0, 0.0);
if (det != 0.0) {
    dz_dUV.x = dot(dz_dXY, vec2<f32>(dV_dXY.y, -dV_dXY.x)) / det;
    dz_dUV.y = dot(dz_dXY, vec2<f32>(-dU_dXY.y, dU_dXY.x)) / det;
}
```

We can then complete the formula:
```wgsl
let bias = dot(dz_dUV, distanceToCenterUv);
```

Let's try it:
{% include lab-viewport.liquid
    demo="shadow-step"
    code="shadow/wgsl/derivatives-receiver-plane.wgsl"
    options='{"filter":"nearest"}' %}
{% include lab-code.liquid
    snippets='[
        {"src": "shadow/wgsl/derivatives-receiver-plane.wgsl", "prev": "shadow/wgsl/base.wgsl", "title": "Shadow visibility"}
    ]' %}
<br>

You will notice that we've also added a bit of additional constant bias.
If you set it to zero, you will see that the receiver plane bias by itself is not enough.

If you look close, you will also notice that the concave parts of the scene (like where boxes meet the surface plane)
still have some self-shadowing artifacts, as we predicted earlier.

Overall, though, it provides a pretty good result with little tweaking required, and can be combined with other 
techniques to provide ideal results.

### Using a normal vector

When you don't have reliable access to primitive-level derivatives, you can still use the same principles using a 
provided normal vector.
On average, the closer the normal vector is to the actual geometric normal, the better.

The trick here is to project that normal into the light space, so that we can reuse the same logic as in the 
derivatives subsection.
```wgsl
let dz_dUV = -shadowNormal.xy / shadowNormal.z;
```

The question then becomes: How do we retrieve that normal vector in the first place? 
Since the light projection is an orthographic matrix, we can directly use the transpose inverse of the light-space
matrix (combined with the NDC-to-UV transform matrix) as a normal matrix and apply it directly.

If, instead, you use the light view-projection matrix (and manually apply the ndc-to-uv transform), then do not forget
to apply a `(2, -2, 1)` scale to the "shadow normal" after applying the normal matrix to it. 

{% include lab-viewport.liquid
    demo="shadow-step"
    code="shadow/wgsl/normal-receiver-plane.wgsl"
    options='{"filter":"nearest"}' %}
{% include lab-code.liquid
    snippets='[
        {"src": "shadow/wgsl/normal-receiver-plane.wgsl", "prev": "shadow/wgsl/derivatives-receiver-plane.wgsl", "title": "Shadow visibility"}
    ]' %}

I used this opportunity to also apply slope-based bias to show off how all techniques can be combined.

If you don't have the possibility of providing the light normal matrix, there is an alternative approach using the 
tangent and bitangent vectors. 
You can even generate some on the fly if need be:
```wgsl
fn generateTangentAndBitangent(normal: vec3<f32>) -> (vec3<f32>, vec3<f32>) {
    let v = select(vec3<f32>(0.0, 1.0, 0.0), vec3<f32>(1.0, 0.0, 0.0), abs(normal.y) > 0.99);
    let tangent = normalize(cross(normal, v));
    let bitangent = cross(normal, tangent);
    return (tangent, bitangent);
}
```

You can use their projection into shadow space to compute $$\frac {\partial z} {\partial UV}$$:
```wgsl
// Where one world unit along each tangent lands in shadowCoord space
let d1 = (lightSpaceMatrix * vec4<f32>(worldPosition + tangent, 1.0)).xyz - shadowCoord;
let d2 = (lightSpaceMatrix * vec4<f32>(worldPosition + bitangent, 1.0)).xyz - shadowCoord;

// dz = g.x * du + g.y * dv holds for both tangents, so solve for g = dz/d(u,v)
let det = d1.x * d2.y - d1.y * d2.x;
var dz_dUV = vec2<f32>(0.0);
if (abs(det) > 1e-8) {
    dz_dUV = vec2<f32>(
        d1.z * d2.y - d1.y * d2.z,
        d1.x * d2.z - d1.z * d2.x
    ) / det;
}
```

While it allows you to avoid having to produce and fetch a normal matrix, it is achieved at the cost of an additional 
matrix multiplication.

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
- [Shadow mapping tricks and techniques](https://gdcvault.com/play/1013442/Shadow-Mapping-Tricks-and), John Isidoro, GDC 2006.