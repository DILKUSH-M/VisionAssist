# Bounding-box localization evaluation

## Findings

COCO-SSD returns `[x, y, width, height]` in the dimensions of its input image.
The installed implementation converts its normalized output using the input
image dimensions, and VisionAssist normalizes those coordinates using the
video's actual `videoWidth` and `videoHeight`. The overlay maps the normalized
boxes through a centered `object-fit: cover` transform matching the camera
preview. The boxes are CSS-positioned elements, so canvas device-pixel-ratio
scaling is not involved.

The coordinate transforms are internally consistent once video metadata and
overlay dimensions are available. Model localization is therefore the most
likely source of persistently oversized boxes. The overlay now waits for valid
layout dimensions instead of temporarily drawing normalized boxes against the
cropped viewport.

## Recorded snapshot (not a controlled baseline)

The dashboard showed the following values when inspected:

| Metric | Observed value | Limitation |
| --- | ---: | --- |
| Model load | 1,007 ms | Dashboard's first-run value; not independently timed |
| Inference | 61 ms | A displayed sample, not an average |
| Processing FPS | 2.2 | Stale dashboard value; the camera was paused during inspection |
| Tensor memory | 17.2 MB | TensorFlow.js estimate; excludes browser and GPU allocations |
| Detection confidence | 43%, 54% | Two stale displayed detections; their arithmetic mean is 48.5% |

These values must not be used to claim a performance baseline or improvement.
The dashboard now reports rolling averages over the latest 20 processed frames
for timing and FPS, plus confidence averaged over detections in those frames.
Model load time remains the first-run measurement; tensor memory is the latest
TensorFlow.js estimate.

## Refinement prototype

The application retains `lite_mobilenet_v2` as the active backbone. Every fifth
processed frame, it may re-run that detector on one selected detection's
expanded ROI after the detection has persisted for at least three frames. The
ROI is limited to 512 pixels on its longest side. Only same-class, sufficiently
confident, smaller, well-contained predictions are accepted. Otherwise the
original box is kept. The accepted ROI estimate is cached briefly and displayed
separately from the dashed original box.

Original coordinates remain authoritative for lane analysis, hazard scoring,
and spoken guidance. The ROI result is an experimental second detector
prediction, not a segmentation mask or a claimed object boundary. Its
heuristic acceptance rules have not been validated against ground truth.
Dashboard ROI timing is averaged per processed frame, so frames without an ROI
attempt contribute zero.

## Evaluation limits and next measurements

No labeled images or videos are present in the workspace. IoU, precision,
recall, mAP, and localization improvement therefore cannot be calculated.
Likewise, `mobilenet_v1` and `mobilenet_v2` have not been compared on identical
representative inputs; the current backbone is retained rather than assuming
another option has tighter boxes.

For a valid comparison, use the same labeled images or video frames, browser,
device, TensorFlow.js backend, and camera resolution for each backbone and the
ROI prototype. Record model load time, rolling inference/FPS/confidence,
refinement time, and TensorFlow.js memory; calculate box IoU and detection
precision/recall against the annotations. Do not report accuracy gains without
those measurements.
