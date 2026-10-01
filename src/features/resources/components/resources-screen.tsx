"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScreenHeader } from "@/components/ui/screen-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { resourcesRepository, type Resource } from "../data/resources.repository";

function href(r: Resource): string | null {
  if (r.plan_id) return `/plan/?id=${r.plan_id}`;
  if (r.kind === "guided_journal") return "/planes";
  return r.url;
}

function ResourceLink({ r, className, children }: { r: Resource; className: string; children: React.ReactNode }) {
  const to = href(r);
  if (!to) return <div className={className}>{children}</div>;
  if (to.startsWith("https://")) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={to} className={className}>
      {children}
    </Link>
  );
}

/** Screen 8h · Recursos · Diario guiado y libros. */
export function ResourcesScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ["resources"], queryFn: resourcesRepository.list, staleTime: 10 * 60_000 });
  const news = useQuery({
    queryKey: ["ministry-news", user?.id],
    queryFn: () => resourcesRepository.ministryNews(user!.id),
    enabled: Boolean(user),
  });
  const setNews = useMutation({
    mutationFn: (on: boolean) => resourcesRepository.setMinistryNews(user!.id, on),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ministry-news"] }),
  });
  const featured = list.data?.find((r) => r.kind === "guided_journal");
  const books = (list.data ?? []).filter((r) => r.kind !== "guided_journal");
  const on = news.data ?? false;

  return (
    <div className="flex flex-col">
      <ScreenHeader title="Recursos" />
      {list.isPending ? <Skeleton className="mx-3 h-[170px] rounded-[28px]" /> : null}
      {featured ? (
        <div className="mx-3 flex items-center gap-4 rounded-[28px] bg-ink p-5 text-paper">
          <span
            className="flex h-[130px] w-24 flex-none -rotate-[4deg] flex-col justify-end rounded-[10px] p-2.5 font-display-x text-xs leading-[.95] text-ink shadow-[0_12px_24px_-8px_rgba(0,0,0,.6)]"
            style={{ background: featured.color ?? "#C6F432" }}
            aria-hidden
          >
            {featured.title}
          </span>
          <span className="flex flex-col gap-2">
            {featured.eyebrow ? <span className="eyebrow text-lime">{featured.eyebrow}</span> : null}
            {featured.description ? <span className="text-[15px] leading-[1.4]">{featured.description}</span> : null}
            <ResourceLink
              r={featured}
              className="flex h-10 items-center self-start rounded-full bg-lime px-4 text-[13px] font-bold text-ink"
            >
              Empezar en la app
            </ResourceLink>
          </span>
        </div>
      ) : null}

      {books.length ? (
        <>
          <h2 className="m-0 px-6 pt-[22px] pb-2.5 text-[17px] font-bold">Libros para estudiantes</h2>
          <ul className="m-0 grid list-none grid-cols-3 gap-2.5 px-3 p-0">
            {books.map((b) => (
              <li key={b.id}>
                <ResourceLink r={b} className="flex flex-col gap-1.5">
                  <span className="h-[140px] rounded-[10px]" style={{ background: b.color ?? "#D9D5CB" }} aria-hidden />
                  <span className="text-[13px] leading-[1.2] font-bold">{b.title}</span>
                </ResourceLink>
              </li>
            ))}
          </ul>
        </>
      ) : list.data && !featured ? (
        <p className="mx-3 my-0 rounded-[22px] bg-white px-[18px] py-4 text-sm text-ink/60">
          Pronto encontrarás aquí libros y materiales recomendados.
        </p>
      ) : null}

      <div className="mx-3 mt-[18px] flex items-center justify-between gap-3 rounded-[22px] bg-white p-[18px]">
        <span className="flex flex-col gap-[3px]">
          <span className="text-[15px] font-bold">Noticias del ministerio</span>
          <span className="text-xs text-ink/60">Anuncios y novedades cada mes</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Noticias del ministerio"
          disabled={news.isPending || setNews.isPending}
          onClick={() => setNews.mutate(!on)}
          className={`relative h-7 w-12 flex-none rounded-full transition-colors ${on ? "bg-stage-crece" : "bg-ink/15"}`}
        >
          <span
            className={`absolute top-[3px] size-[22px] rounded-full bg-white transition-all ${on ? "left-[23px]" : "left-[3px]"}`}
          />
        </button>
      </div>
    </div>
  );
}
