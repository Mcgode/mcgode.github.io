---
layout: post
title: "Shadow lab spike"
date: 2026-10-19
categories: articles
lab: true
published: false
---

Scratch page used to validate the interactive viewport tooling. Not meant to be published: `published: false` keeps it
out of production builds, and it only shows up with `jekyll serve --unpublished`.

## Starting point: no shadows

The same scene and lighting as the demos below, without any shadow lookup.

{% include lab-viewport.liquid
   demo="unshadowed"
   caption="Drag to orbit, right-drag to pan. Click the viewport to enable scroll-zoom." %}

## Step 0: hard shadows

A single comparison against the shadow map. Orbit with the mouse, move the light with the sliders, and try
lowering the bias to see shadow acne.

{% include lab-viewport.liquid
   demo="shadow-step"
   code="shadow/wgsl/00-hard.wgsl"
   title="shadowVisibility: hard shadows"
   options='{"filter":"nearest"}'
   caption="Drag to orbit, right-drag to pan. Click the viewport to enable scroll-zoom." %}

## Step 1: percentage-closer filtering

The same lookup, averaged over a square kernel. The listing highlights what changed since the previous step.

{% include lab-viewport.liquid
   demo="shadow-step"
   code="shadow/wgsl/01-pcf.wgsl"
   prev="shadow/wgsl/00-hard.wgsl"
   title="shadowVisibility: PCF"
   options='{"filter":"nearest"}' %}

## Code listings

A viewport can list several snippets next to it: parts of real source files (JS or WGSL), a file compared with an
earlier version, or text written inline. Parts of a file are picked with `// #region` markers, so the listing is the
code that runs and cannot drift from it.

{% include lab-viewport.liquid
   demo="unshadowed"
   height=240
   snippets='[
     {"src": "shadow/directional-shadow-pass.js", "region": "shadow-map-target", "title": "JS: a depth texture to render into"},
     {"src": "shadow/directional-shadow-pass.js", "region": "frustum-fit", "title": "JS: placing the light camera"},
     {"src": "shadow/directional-shadow-pass.js", "region": "depth-pass", "title": "JS: the depth-only pass"},
     {"src": "shadow/wgsl/01-pcf.wgsl", "prev": "shadow/wgsl/00-hard.wgsl", "title": "WGSL: a file and what changed since the last one"},
     {"text": "// Text written inline, here with a diff against an earlier version\nconst radius = 2;\nconst width = 2 * radius + 1;", "prevText": "// Text written inline, here with a diff against an earlier version\nconst radius = 1;\nconst width = 2 * radius + 1;", "lang": "js", "title": "Inline JS"}
   ]'
   caption="Listings can also stand alone, without a viewport." %}

{% include lab-code.liquid
   snippets='[
     {"src": "shadow/lit-material.js", "title": "A whole JS file, shown on its own"},
     {"src": "shadow/showcase-scene.js", "collapsed": true, "title": "A collapsed listing"}
   ]' %}
