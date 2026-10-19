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
