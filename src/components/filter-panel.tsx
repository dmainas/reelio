import { Badge } from "@/components/ui/badge";
import { groupName } from "@/lib/library";
import type { LibraryFilter, SavedPost } from "@/lib/types";

type FilterPanelProps = {
  posts: SavedPost[];
  filter: LibraryFilter;
  onFilter: (filter: LibraryFilter) => void;
};

export function FilterPanel({ posts, filter, onFilter }: FilterPanelProps) {
  const groups = countBy(posts, (post) => groupName(post));
  const tags = countBy(
    posts.flatMap((post) => post.tags.map((tag) => ({ tag }))),
    (entry) => entry.tag,
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <FilterButton
          active={filter.kind === "all"}
          count={posts.length}
          label="All posts"
          testId="filter-all"
          onClick={() => onFilter({ kind: "all" })}
        />
      </div>
      <section className="flex flex-col gap-1">
        <h2 className="px-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Suggested groups
        </h2>
        {groups.length === 0 ? (
          <p className="px-2.5 text-sm text-muted-foreground">Groups appear after captions are organized.</p>
        ) : (
          groups.map((group) => (
            <FilterButton
              key={group.name}
              active={filter.kind === "group" && filter.name === group.name}
              count={group.count}
              label={group.name}
              testId={`group-${slug(group.name)}`}
              onClick={() => onFilter({ kind: "group", name: group.name })}
            />
          ))
        )}
      </section>
      <section className="flex flex-col gap-1">
        <h2 className="px-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Your tags
        </h2>
        {tags.length === 0 ? (
          <p className="px-2.5 text-sm text-muted-foreground">Tags you add on a post collect here.</p>
        ) : (
          tags.map((tag) => (
            <FilterButton
              key={tag.name}
              active={filter.kind === "tag" && filter.name === tag.name}
              count={tag.count}
              label={tag.name}
              testId={`tag-filter-${slug(tag.name)}`}
              onClick={() => onFilter({ kind: "tag", name: tag.name })}
            />
          ))
        )}
      </section>
    </div>
  );
}

function FilterButton({
  active,
  count,
  label,
  onClick,
  testId,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={active}
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
    >
      <span className="truncate">{label}</span>
      <Badge variant={active ? "secondary" : "outline"} className={active ? "bg-primary-foreground/15 text-primary-foreground" : ""}>
        {count}
      </Badge>
    </button>
  );
}

function countBy<T>(items: T[], nameOf: (item: T) => string): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const name = nameOf(item);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function slug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}
