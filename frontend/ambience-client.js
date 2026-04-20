// ambience-client.js — wire the ambience rain sim into the fzt-showcase
// page. The sim runs locally in the browser; we subscribe to an ambience
// server's SSE stream for config + event broadcasts so all viewers see
// roughly the same atmosphere.
//
// Loaded as a plain script after ambience-sim.js. Uses window.AmbienceSim.

(function () {
	'use strict';
	// Debug: capture state on window so we can inspect from outside the IIFE.
	const debug = (window.__ambClientDebug = { started: Date.now() });

	// Server URL. Precedence:
	//   1. <script data-ambience-url="..."> on this script tag
	//   2. window.AMBIENCE_URL set before this script runs
	//   3. http://127.0.0.1:8080 when loaded from localhost
	//   4. https://ambience.romaine.life otherwise
	const scriptTag = document.currentScript;
	const isLocalhost =
		location.hostname === 'localhost' || location.hostname === '127.0.0.1';
	const AMBIENCE_URL =
		(scriptTag && scriptTag.dataset.ambienceUrl) ||
		window.AMBIENCE_URL ||
		(isLocalhost ? 'http://127.0.0.1:8080' : 'https://ambience.romaine.life');

	const canvas = document.getElementById('ambience-canvas');
	debug.canvasFound = !!canvas;
	debug.simFound = !!window.AmbienceSim;
	debug.ambienceUrl = AMBIENCE_URL;
	if (!canvas || !window.AmbienceSim) {
		debug.bailed = 'canvas or AmbienceSim missing';
		console.warn('ambience-client: canvas or AmbienceSim missing');
		return;
	}
	const ctx = canvas.getContext('2d');

	// Sim grid dimensions. Coarser than the canvas pixel grid — drops get
	// scaled up when rendered. Tuning: higher = finer rain, more CPU.
	const GRID_W = 200;
	const GRID_H = 100;

	function resize() {
		const dpr = window.devicePixelRatio || 1;
		canvas.width = Math.floor(window.innerWidth * dpr);
		canvas.height = Math.floor(window.innerHeight * dpr);
	}
	resize();
	window.addEventListener('resize', resize);

	const rain = new window.AmbienceSim.Rain(GRID_W, GRID_H, {});
	debug.rain = rain;

	let ready = false;
	window.AmbienceSim.subscribe(
		AMBIENCE_URL.replace(/\/+$/, '') + '/events',
		rain,
		() => { ready = true; debug.readyAt = Date.now(); }
	);

	// Combined 10 Hz tick: step the sim + render. We don't use rAF because
	// headless / background browser tabs pause it; the 10 Hz tick rate of
	// the sim doesn't benefit from 60 Hz rendering anyway.
	// { transparent: true } clears the canvas each frame so the page's own
	// background shows through between drops.
	let stepCount = 0;
	let renderCount = 0;
	setInterval(() => {
		if (ready) { rain.step(); stepCount++; debug.stepCount = stepCount; }
		rain.render(ctx, canvas.width, canvas.height, { transparent: true });
		renderCount++;
		debug.renderCount = renderCount;
	}, 100);
})();
