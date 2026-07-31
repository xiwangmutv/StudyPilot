"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "./app-shell";
import { useStudyData } from "@/hooks/use-study-data";
import { firstPilotCore, type UserProfile } from "@/src/core";

/**
 * Settings are deliberately small: each option below changes real behavior.
 * Do not add a setting unless the product flow reads it.
 */
export function SettingsPage() {
  const data = useStudyData();
  const router = useRouter();
  const [draft, setDraft] = useState<UserProfile | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (data.ready) setDraft(data.settings);
  }, [data.ready, data.settings]);

  if (!data.ready || !draft) return null;

  const changed = JSON.stringify(draft) !== JSON.stringify(data.settings);
  const update = (changes: Partial<UserProfile>) => {
    setDraft((current) => (current ? { ...current, ...changes } : current));
    setNotice("");
  };
  const save = () => {
    data.updateSettings(draft);
    setNotice("设置已保存，并会在下一次启动时生效。");
  };
  const clearAll = () => {
    if (!window.confirm("确定要清除所有本地数据吗？此操作无法撤销。")) return;
    firstPilotCore.clearAll();
    router.push("/");
    router.refresh();
  };

  return (
    <AppShell settings={data.settings}>
      <section className="mx-auto max-w-2xl py-12 sm:py-20">
        <p className="text-xs font-semibold tracking-[.16em] text-[#7B7B73]">FIRSTPILOT</p>
        <h1 className="mt-3 font-display text-5xl tracking-[-.06em] sm:text-6xl">设置</h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#77776f]">
          只保留会真正改变 FirstPilot 行为的选项。
        </p>

        <div className="mt-9 overflow-hidden rounded-[24px] border border-[#e5e5dd] bg-white shadow-card">
          <SettingRow title="启动时长" description="首次进入行动时的倒计时。建议从 5 分钟开始；页面文案与计时器会同步使用这个时长。">
            <Segmented
              values={[3, 5, 8] as const}
              value={draft.starterMinutes}
              onChange={(starterMinutes) => update({ starterMinutes })}
              labels={{ 3: "3 分钟", 5: "5 分钟 · 推荐", 8: "8 分钟" }}
            />
          </SettingRow>
          <SettingRow title="启动辅助" description="允许时，FirstPilot 只会在判断呼吸有助于移除当前阻碍时，才建议一次呼吸；不会把呼吸塞进固定流程。">
            <Segmented
              values={["allow", "never"] as const}
              value={draft.breathingAssist}
              onChange={(breathingAssist) => update({ breathingAssist })}
              labels={{ allow: "允许呼吸辅助", never: "不使用呼吸" }}
            />
          </SettingRow>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-[#e5e5dd] bg-white shadow-card">
          <SettingRow title="外观" description="切换浅色或深色界面。">
            <Segmented
              values={["light", "dark"] as const}
              value={draft.theme}
              onChange={(theme) => update({ theme })}
              labels={{ light: "浅色", dark: "深色" }}
            />
          </SettingRow>
        </div>

        <div className="mt-6 rounded-[24px] border border-[#f0d8d4] bg-[#fff8f6] p-5 sm:p-6">
          <h2 className="font-semibold">数据</h2>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-[#806d69]">
            清除会永久移除本机的行动记录、成长档案与设置。
          </p>
          <button onClick={clearAll} className="mt-4 rounded-full border border-[#dca89e] px-4 py-2 text-sm font-medium text-[#9b4334]">
            清除本地数据
          </button>
        </div>

        <div className="mt-8 flex items-center justify-end gap-3">
          <span role="status" className="text-sm text-[#657149]">{notice}</span>
          <button onClick={save} disabled={!changed} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
            保存设置
          </button>
        </div>
      </section>
    </AppShell>
  );
}

function SettingRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="grid gap-4 border-b border-[#eeeeea] px-5 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8 sm:px-6"><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 max-w-md text-sm leading-relaxed text-[#77776f]">{description}</p></div><div className="sm:justify-self-end">{children}</div></div>;
}

function Segmented<T extends string | number>({ values, value, onChange, labels }: { values: readonly T[]; value: T; onChange: (value: T) => void; labels: Record<string, string> }) {
  return <div className="inline-flex max-w-full flex-wrap rounded-xl bg-[#f1f1ec] p-1">{values.map((item) => <button key={item} onClick={() => onChange(item)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${value === item ? "bg-white text-ink shadow-sm" : "text-[#77776f] hover:text-ink"}`}>{labels[String(item)]}</button>)}</div>;
}
