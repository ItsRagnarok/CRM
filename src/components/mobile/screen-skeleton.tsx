// Shown at once while a mobile screen loads, so a tap feels instant even when the server needs a moment.
export function ScreenSkeleton() {
  return (
    <div className="flex flex-col" aria-busy="true" aria-label="Se încarcă">
      <div className="m-hd">
        <div className="m-sk" style={{ width: 44, height: 44, borderRadius: 999 }} />
        <div className="m-sk" style={{ width: 160, height: 22 }} />
      </div>
      <div className="m-bd" style={{ overflow: "hidden" }}>
        <div className="m-sk" style={{ height: 110, borderRadius: 20 }} />
        <div className="m-sk" style={{ height: 76, borderRadius: 20 }} />
        <div className="m-sk" style={{ height: 76, borderRadius: 20 }} />
        <div className="m-sk" style={{ height: 76, borderRadius: 20 }} />
      </div>
    </div>
  );
}
