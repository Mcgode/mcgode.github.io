---
layout: post
title: "Kryne Engine"
date: March 2021
endDate: May 2021
startDate: November 2020
tags: ["OpenGL", "Game engine"]
imagePreview: /assets/img/portfolio/kryne-engine.png
permalink: /portfolio/kryne-engine:output_ext
importance: major
---

### Quick overview

Kryne Engine is a personal game engine project, implemented in C++, using OpenGL with GLFW.

The main objective of this project was to get some actual experience on using C++ for a big project, 
and to experience for myself the problematics when designing even a basic game engine.

I have very little hope that this engine will ever be used to run an actual game, but since this is not 
the objective with this project, I don't really mind. 


### Original project

While the project itself started way back in 2019, at the time the objective was simply to set up 3D 
graphics demos, before I actually got to work in 3D graphics on a professional level.

While I was able to implement a few more "advanced" features like cascaded shadow maps, ultimately the
project was put on ice as I started to work on a professional level. <br>
The project code and features were implemented as I went and as a consequence it became messier and 
messier, pushing me to leave it.

![Cascaded shadow maps demo](/assets/img/portfolio/kryne-engine/csm.png)
<p class="font-italic text-center">
  One of the demos that I implemented back then, featuring cascaded shadow maps.
</p>


### Evolution

When I decided to work on it again, in November 2020, my first task was migrating it to a better 3D
pipeline, inspired by [three.js](https://threejs.org) pipeline at first. <br>
This allowed me to set up better tools and classes that I could reuse and extend more readily, making
the project a bit more viable.

As I was working on it though, I decided to go all in and implement something closer to a full-on 
game engine. The objective was to get some actual experience with building one, as it was one of my
fields of interest.


### Implementation

The engine uses an Entity-Component-System (ECS) architecture, which is articulated around a main 
Process class instance.

The engine uses a dynamic shader process, which allows the shader to dynamically change some of its 
values (in the form of #define preprocessors) and automatically recompile if needs be. <br>
It also supports #include directives, allowing for the reuse of shader code between very different 
shaders.

The feature I'm the proudest of so far is its multi-threading feature. The engine uses a dispatcher
class to allow for the execution of multiple instructions in parallel threads. <br>
The engine uses it in its game loop for updating entities and running systems in parallel.

The engine uses [Dear ImGui](https://github.com/ocornut/imgui) for rendering its UI, and has an 
integrated basic scene editor UI, which allows real-time changes to the scene.
![Kryne Engine screenshot](/assets/img/portfolio/kryne-engine.png)


### Going forward

While I had a few more features I wanted to work on, I ended up abandoning this 
project.

After working for several months on a professional game engine at Wild Sheep Studio,
I realised that the project was lacking in many areas. 
Many of the features I wanted were still lacking and I ended up finding the current 
project structure to be lacking.

So instead, I went ahead and decided to can all the existing work and build a new 
sleek engine with performance as the central concern.  

[New engine page](kryne-engine-2)
