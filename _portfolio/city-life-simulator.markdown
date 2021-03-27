---
layout: post
title: "City life simulator"
startDate: March 2017
date: October 2017
endDate: October 2017
tags: [Unity, Experiment]
imagePreview: /assets/img/portfolio/city-life-simulator.png
importance: minor
---

This is my first experimental project. Those experimental projects were done with the goal in mind 
to experiment with one to two gameplay general concepts.
In this project, I tried to implement two important aspects of a game AI: pathfinding and decision. 
To do this I decided to implement a simulation of citizens living in a city, whose basic needs must 
be fulfilled.

The pathfinding was done by mapping nodes to building corners and entrances, then using Dijkstra 
algorithm for finding the best path (cycles in graph, no negative edge cost, so optimal algorithm). 
During this project, I wasn't familiar with the concept of heuristics, and as a consequence I didn't 
implement one in this project, but it wouldn't add much in terms of performance given the small graph 
I was working with.

The decision was handled using a Goal Oriented Action Planner (GOAP) which allowed me to map the 
needs of individual citizens onto a decision graph, and then play with the edge cost values to define 
their priorities given their current state.

