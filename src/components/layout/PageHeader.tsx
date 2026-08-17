import { FadeIn } from "@/components/motion/motion-primitives";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Slot kanan: tombol aksi atau ringkasan status */
  children?: React.ReactNode;
};

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <FadeIn>
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight text-ink leading-tight">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-soft">
              {description}
            </p>
          )}
        </div>
        {children && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
        )}
      </div>
    </FadeIn>
  );
}
