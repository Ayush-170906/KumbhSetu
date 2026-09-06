"use client";

type Camera = {
  id: number;
  name: string;
  location: string;
  image: string;
  status: string;
  confidence: number;
  detection: "face" | "weapon" | "crowd" | "behaviour" | "none";
};

const cameras: Camera[] = [
  {
    id: 1,
    name: "Camera 01",
    location: "Main Gate",
    image: "/images/cctv/camera1.jpg",
    status: "WATCHLIST MATCH",
    confidence: 92,
    detection: "face",
  },
  {
    id: 2,
    name: "Camera 02",
    location: "Pilgrim Pathway",
    image: "/images/cctv/camera2.jpg",
    status: "NORMAL",
    confidence: 100,
    detection: "none",
  },
  {
    id: 3,
    name: "Camera 03",
    location: "Entry Corridor",
    image: "/images/cctv/camera3.jpg",
    status: "WEAPON ALERT",
    confidence: 89,
    detection: "weapon",
  },
  {
    id: 4,
    name: "Camera 04",
    location: "Ghat Area",
    image: "/images/cctv/camera4.jpg",
    status: "NORMAL",
    confidence: 100,
    detection: "none",
  },
  {
    id: 5,
    name: "Camera 05",
    location: "River Ghat",
    image: "/images/cctv/camera5.jpg",
    status: "HIGH CROWD DENSITY",
    confidence: 84,
    detection: "crowd",
  },
  {
    id: 6,
    name: "Camera 06",
    location: "Parking Zone",
    image: "/images/cctv/camera6.jpg",
    status: "SUSPICIOUS ACTIVITY",
    confidence: 76,
    detection: "behaviour",
  },
];

export function SecurityView() {
  return (
    <div className="p-6">
      
      {/* HEADER */}
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          KumbhSetu Security Layer
        </p>

        <h1 className="text-3xl font-bold">
          Security Intelligence Center
        </h1>

        <p className="text-gray-500 mt-2">
          Concept view for CCTV monitoring and security alerts &mdash; simulated data,
          no live camera network connected.
        </p>
      </div>

      {/* STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

        <div className="border rounded-lg p-4 bg-white">
          <p className="text-sm text-gray-500">Cameras (mock)</p>
          <p className="text-3xl font-bold">24</p>
          <p className="text-xs text-gray-500 mt-2">
            ● Simulated
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-red-50">
          <p className="text-sm text-red-600">Watchlist Alerts</p>
          <p className="text-3xl font-bold text-red-700">1</p>
          <p className="text-xs text-red-600 mt-2">
            Verification required
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-red-50">
          <p className="text-sm text-red-600">Weapon Alerts</p>
          <p className="text-3xl font-bold text-red-700">1</p>
          <p className="text-xs text-red-600 mt-2">
            High priority
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-yellow-50">
          <p className="text-sm text-yellow-700">Crowd Risk</p>
          <p className="text-3xl font-bold text-yellow-700">HIGH</p>
          <p className="text-xs text-yellow-700 mt-2">
            2 zones require monitoring
          </p>
        </div>

      </div>

      {/* CCTV TITLE */}
      <div className="flex justify-between items-center mb-4">

        <div>
          <h2 className="text-xl font-bold">
            CCTV Intelligence &mdash; concept view
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            Mock feeds with illustrative detection overlays. Not connected to any real
            camera network &mdash; shows how operator alerts would surface.
          </p>
        </div>

        <div className="text-sm font-bold text-gray-500">
          ● SIMULATION
        </div>

      </div>

      {/* CAMERA GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {cameras.map((camera) => (

          <div
            key={camera.id}
            className="border rounded-lg overflow-hidden bg-white shadow"
          >

            {/* IMAGE */}
            <div className="relative h-64 bg-black">

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={camera.image}
                alt={camera.name}
                className="w-full h-full object-cover"
              />

              {/* DARK CCTV EFFECT */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

              {/* SIM badge */}
              <div className="absolute top-3 left-3 bg-gray-800/80 text-white text-xs px-3 py-1 rounded">
                SIM
              </div>

              {/* CAMERA NAME */}
              <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded">
                {camera.name}
              </div>

              {/* TIME */}
              <div className="absolute top-10 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded">
                10:24:32 AM
              </div>

              {/* FACE DETECTION */}
              {camera.detection === "face" && (
                <>
                  <div className="absolute left-[42%] top-[30%] w-16 h-24 border-4 border-red-500">
                    <div className="absolute -top-7 left-0 bg-red-600 text-white text-[10px] px-2 py-1 whitespace-nowrap">
                      MATCH 92%
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 bg-red-600 text-white text-xs px-3 py-2 rounded">
                    ⚠ WATCHLIST MATCH
                  </div>
                </>
              )}

              {/* WEAPON DETECTION */}
              {camera.detection === "weapon" && (
                <>
                  <div className="absolute right-[25%] top-[42%] w-24 h-16 border-4 border-red-500">
                    <div className="absolute -top-7 left-0 bg-red-600 text-white text-[10px] px-2 py-1 whitespace-nowrap">
                      OBJECT 89%
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 bg-red-600 text-white text-xs px-3 py-2 rounded">
                    ⚠ HIGH PRIORITY ALERT
                  </div>
                </>
              )}

              {/* CROWD DENSITY */}
              {camera.detection === "crowd" && (
                <>
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs px-3 py-2 rounded">
                    HIGH CROWD DENSITY
                  </div>

                  <div className="absolute bottom-3 left-3 bg-yellow-500 text-black text-xs px-3 py-2 rounded">
                    👥 Density: 78%
                  </div>
                </>
              )}

              {/* SUSPICIOUS BEHAVIOUR */}
              {camera.detection === "behaviour" && (
                <>
                  <div className="absolute left-[30%] top-[42%] w-10 h-20 border-2 border-yellow-400" />

                  <div className="absolute right-[28%] top-[40%] w-10 h-20 border-2 border-yellow-400" />

                  <div className="absolute bottom-3 left-3 bg-yellow-500 text-black text-xs px-3 py-2 rounded">
                    ⚠ SUSPICIOUS BEHAVIOUR
                  </div>
                </>
              )}

              {/* NORMAL */}
              {camera.detection === "none" && (
                <div className="absolute bottom-3 left-3 bg-green-600 text-white text-xs px-3 py-2 rounded">
                  ✓ NORMAL • NO ALERTS
                </div>
              )}

            </div>

            {/* CAMERA DETAILS */}
            <div className="p-4">

              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold">
                    {camera.location}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {camera.status}
                  </p>
                </div>

                <div className="text-sm font-bold">
                  {camera.confidence}%
                </div>
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}