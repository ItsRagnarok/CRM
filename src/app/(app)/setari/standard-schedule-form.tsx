"use client";

import { updateStandardSchedule } from "./actions";

const WEEKDAYS = [
  { value: 1, label: "L" },
  { value: 2, label: "Ma" },
  { value: 3, label: "Mi" },
  { value: 4, label: "J" },
  { value: 5, label: "V" },
  { value: 6, label: "S" },
  { value: 7, label: "D" },
];

export function StandardScheduleForm({
  hoursPerDay,
  workdays,
}: {
  hoursPerDay: number;
  workdays: number[];
}) {
  return (
    <form action={updateStandardSchedule} className="rounded-[13px] border border-border bg-white p-[22px]">
      <div className="mb-1 text-[15px] font-bold text-foreground">Program normal de lucru</div>
      <p className="mb-[18px] text-[12.5px] text-muted-2">
        Folosit ca referință în Pontaj → Concedii & absențe, pentru a calcula zilele lucrătoare dintr-un concediu.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-[#344054]">Ore/zi</label>
          <input
            name="hoursPerDay"
            type="number"
            min={1}
            max={12}
            step="0.5"
            defaultValue={hoursPerDay}
            className="w-full rounded-[9px] border border-[#d0d5dd] px-3.5 py-2.5 text-[13.5px] outline-none focus:border-electric"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12.5px] font-semibold text-[#344054]">Zile lucrătoare</label>
          <div className="flex gap-1.5">
            {WEEKDAYS.map((d) => (
              <label
                key={d.value}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[8px] border border-[#d0d5dd] text-[12px] font-bold has-[:checked]:border-electric has-[:checked]:bg-electric-soft has-[:checked]:text-electric"
              >
                <input
                  type="checkbox"
                  name="workday"
                  value={d.value}
                  defaultChecked={workdays.includes(d.value)}
                  className="sr-only"
                />
                {d.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="mt-[18px] rounded-[9px] bg-[#101828] px-[18px] py-2.5 text-[13px] font-bold text-white"
      >
        Salvează programul
      </button>
    </form>
  );
}
