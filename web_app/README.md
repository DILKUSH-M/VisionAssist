# VisionAssist

VisionAssist is a mobile-first assistive technology demo for pedestrians. It uses a smartphone camera, browser-based object detection, and spoken voice prompts to help users understand nearby obstacles, identify a safer route, and make faster sense of their environment.

## Features

- Live camera access using `navigator.mediaDevices.getUserMedia()`
- Rear-camera preference for mobile devices
- On-device object detection using TensorFlow.js + COCO-SSD
- Corner-bracket bounding boxes, confidence labels, and shaded left/center/right path lanes
- Position analysis across left / center / right zones
- Path obstruction scoring and route suggestions
- Spoken obstacle locations with an approximate one- to four-step sidestep suggestion based on apparent object size
- Lane-based obstacle checks to recommend the side with fewer detected obstacles
- Voice feedback with the Web Speech API
- Responsive dark UI built with React, TypeScript, and Tailwind CSS
- Demo-video fallback for testing when camera access is unavailable

## Project structure

```text
VisionAssist/
  web_app/
    public/
    src/
    package.json
    vite.config.ts
    README.md
```

## Run locally

```bash
cd VisionAssist/web_app
npm install
npm run dev -- --host 0.0.0.0
```

Then open the local Vite URL in a browser or a mobile device on the same network.

## Browser notes

- Camera access is requested only from the user’s device browser.
- The app runs fully client-side; no mandatory backend is required.
- Object detection uses COCO-SSD `lite_mobilenet_v2` with TensorFlow.js. Bounding boxes show approximate detected regions, not exact object boundaries.
- A lower-frame ground analysis heuristic checks for brightness and contrast anomalies. It is not a pothole classifier or semantic segmentation model, and its result must not be treated as confirmation that a path is safe.
- Sidestep directions and step counts are rough visual estimates based on detected obstacle position, bounding-box width, and area. They cannot measure physical distance or confirm that a route is safe; users must stop if unsure.
- Lane checks compare detected object boxes with three regions in the lower part of the frame. “No obstacle detected” does not guarantee that the route is safe.
- If the browser blocks camera permission or the device lacks a camera, use the demo video upload option in the dashboard.

## Processing and evaluation

- Inference calls are sequential and scheduled at a 450 ms target interval; a slow frame cannot create overlapping model executions. Model loading starts alongside camera initialization to reduce first-alert delay.
- The dashboard reports observed processing cadence, model-load time, inference time, surface-analysis time, post-processing time, full cycle time, TF.js backend, and TensorFlow-managed tensor memory when available. Tensor memory does not include total browser or GPU memory.
- Lightweight class-and-IoU tracking provides stable IDs and persistence counts. It associates same-class detections across adjacent processed frames; it is not a full motion tracker.
- Hazard scores use interpretable components: class risk (25%), confidence (15%), centered position (15%), corridor overlap (25%), apparent box size (15%), and persistence (5%). These are initial heuristic weights, not weights tuned against a labeled dataset.
- Speech suppresses repeated messages for a cooldown period and does not interrupt an equal- or higher-priority active alert.
- Run `npm test` for focused checks of position classification, corridor overlap, hazard scoring, temporal association, alert persistence, and overlay crop geometry.
- No labeled evaluation dataset is included. Precision, recall, mAP, false-positive rates, and before/after accuracy improvements are therefore not reported. Device-specific latency numbers should be collected on the same phone, browser, test video, input resolution, and threshold before comparing model alternatives.

## Demo status

This is an experimental desktop/mobile prototype intended for academic and demonstration purposes. It is not a medical or real-world navigation product and should be used only as a proof of concept.
