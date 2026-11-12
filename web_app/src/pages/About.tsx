export function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 text-slate-50 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-700 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/20 sm:p-8 lg:p-10">
        <div className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">About VisionAssist</div>
        <h2 className="text-3xl font-bold text-white">AI-guided support for everyday navigation</h2>
        <div className="mt-6 space-y-5 text-base leading-7 text-slate-300">
          <p>
            VisionAssist is a browser-based assistive technology demo that uses a smartphone camera,
            on-device computer vision, and spoken audio to help visually impaired users understand their
            immediate surroundings.
          </p>
          <p>
            The application captures live video frames, runs object detection on the device, estimates
            the location of obstacles, and prioritizes walk-path hazards to suggest a likely clearer
            direction such as left or right.
          </p>
          <p>
            This project is intentionally experimental: it demonstrates how lightweight object detection,
            image geometry, and speech synthesis can work together in a mobile-first web app without sending
            camera data to an external API.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-700 bg-slate-950/50 p-5">
            <div className="text-sm font-semibold text-slate-100">Technologies</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
              <li>React + TypeScript + Vite</li>
              <li>Tailwind CSS for the mobile UI</li>
              <li>Browser MediaDevices API</li>
              <li>TensorFlow.js with COCO-SSD</li>
              <li>Web Speech API for voice feedback</li>
            </ul>
          </div>

          <div className="rounded-[1.5rem] border border-slate-700 bg-slate-950/50 p-5">
            <div className="text-sm font-semibold text-slate-100">Project objective</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
              <li>Understand surrounding objects and motion</li>
              <li>Identify likely walking obstacles</li>
              <li>Guide users toward a clearer route</li>
              <li>Provide a functional demo for academic evaluation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
