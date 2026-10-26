import {
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { BookOpen, MoreHorizontal, Pencil, Plus, Star } from "lucide-react";
import type { Document, PaperMetadataField } from "@neoread/core";
import { Button } from "@neoread/ui/components/button";
import { Input } from "@neoread/ui/components/input";
import { Textarea } from "@neoread/ui/components/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@neoread/ui/components/dropdown-menu";
import { patchPapers } from "./papers/actions";
import { Field } from "./papers/PaperDetail";
import { relativeTime, wasOpened } from "./papers/format";
import { DocumentBadges } from "./DocumentManagement";
import { BookCoverImage } from "./book-cover";
import { BookMenuItems, type BookMenuActions } from "./BookMenu";
import { updateLibraryPreferences, useReaderStore } from "./store";
import {
  clampDetailWidth,
  detailWidthRange,
  dragHorizontally,
  resizeStep,
} from "./papers/resize";

const bookFields: [PaperMetadataField, string, string?][] = [
  ["publisher", "出版社"],
  ["date", "出版日期", "2024 或 2024-05-17"],
  ["isbn", "ISBN"],
  ["language", "语言", "zh-CN"],
];

const saveDetailWidth = (detailWidth: number) =>
  void updateLibraryPreferences({
    books: {
      ...useReaderStore.getState().libraryPreferences.books,
      detailWidth,
    },
  });

/** The detail panel with the paper library's drag handle for its width. */
export function ResizableBookDetail(props: Parameters<typeof BookDetail>[0]) {
  const saved = useReaderStore((s) => s.libraryPreferences.books?.detailWidth);
  const [draft, setDraft] = useState<number>();
  const width = draft ?? saved;
  const resize = (e: ReactPointerEvent<HTMLElement>) => {
    const start =
      e.currentTarget.nextElementSibling?.getBoundingClientRect().width ?? 0;
    let next: number | undefined;
    dragHorizontally(
      e,
      // The panel sits on the right: dragging left widens it.
      (dx) => setDraft((next = clampDetailWidth(start - dx))),
      () => {
        if (next !== undefined) saveDetailWidth(next);
        setDraft(undefined);
      },
    );
  };
  const nudge = (e: ReactKeyboardEvent<HTMLElement>) => {
    const dx = { ArrowLeft: resizeStep, ArrowRight: -resizeStep }[e.key];
    if (!dx) return;
    e.preventDefault();
    const current =
      e.currentTarget.nextElementSibling?.getBoundingClientRect().width ?? 0;
    saveDetailWidth(clampDetailWidth(current + dx));
  };
  return (
    <>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="调整图书详情宽度"
        aria-valuemin={detailWidthRange.min}
        aria-valuemax={detailWidthRange.max}
        aria-valuenow={width}
        tabIndex={0}
        className="paper-detail-resizer"
        onPointerDown={resize}
        onKeyDown={nudge}
      />
      <BookDetail {...props} width={width} />
    </>
  );
}

/** The selected book's cover, details and the reader's own rating and notes. */
export function BookDetail({
  doc,
  actions,
  open,
  favorite,
  width,
}: {
  doc: Document;
  actions: BookMenuActions;
  open: (doc: Document) => void;
  favorite: (doc: Document) => void;
  width?: number;
}) {
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const m = doc.metadata;
  const percent = Math.round(doc.percentage * 100);
  return (
    <aside
      className="paper-detail book-detail"
      aria-label="图书详情"
      style={
        width
          ? ({ "--paper-detail-width": `${width}px` } as CSSProperties)
          : undefined
      }
    >
      <div className="paper-detail-body">
        <div className="book-detail-cover">
          <BookCoverImage doc={doc} />
        </div>
        <Textarea
          key={`${doc.id}:${doc.title}`}
          rows={1}
          aria-label="标题"
          className="paper-title-input"
          defaultValue={doc.title}
          onBlur={(e) => {
            const title = e.currentTarget.value.trim();
            if (!title) e.currentTarget.value = doc.title;
            else if (title !== doc.title) void patchPapers([[doc, { title }]]);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        />
        <Button className="paper-detail-open" onClick={() => open(doc)}>
          <BookOpen />
          {percent > 1 ? `继续阅读 · ${percent}%` : "开始阅读"}
        </Button>
        <div className="paper-detail-actions book-detail-actions">
          <Button
            size="sm"
            variant="outline"
            aria-label={doc.favorite ? "取消收藏" : "收藏文档"}
            title={doc.favorite ? "取消收藏" : "收藏文档"}
            aria-pressed={doc.favorite}
            onClick={() => favorite(doc)}
          >
            <Star
              className={doc.favorite ? "fill-current text-amber-500" : ""}
            />
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label="编辑文档信息"
            title="编辑文档信息"
            onClick={() => actions.edit(doc)}
          >
            <Pencil />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button size="sm" variant="outline" aria-label="更多操作" />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <BookMenuItems
                kind="dropdown"
                doc={doc}
                actions={actions}
                inPanel
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <dl className="paper-fields">
          <dt>评分</dt>
          <dd>
            <Rating doc={doc} />
          </dd>
          <dt>备注</dt>
          <dd>
            <Field doc={doc} name="remark" multiline />
          </dd>
          <dt>标签</dt>
          <dd className="book-detail-tags">
            <DocumentBadges document={doc} />
            <Button
              size="icon-xs"
              variant="ghost"
              className="rounded-full"
              aria-label="编辑标签"
              onClick={() => actions.edit(doc)}
            >
              <Plus />
            </Button>
          </dd>
        </dl>
        <div className="paper-fields-heading">
          <h3>图书信息</h3>
        </div>
        <dl className="paper-fields">
          <dt>作者</dt>
          <dd>
            <Input
              key={`${doc.id}:${doc.author}`}
              aria-label="作者"
              placeholder="—"
              className="paper-field-input"
              defaultValue={doc.author}
              maxLength={200}
              onBlur={(e) => {
                const author = e.currentTarget.value.trim();
                if (author !== doc.author)
                  void patchPapers([[doc, { author }]]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.currentTarget.value = doc.author;
                  e.currentTarget.blur();
                }
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
            />
          </dd>
          {bookFields.map(([name, label, placeholder]) => (
            <BookField
              key={name}
              doc={doc}
              name={name}
              label={label}
              placeholder={placeholder}
            />
          ))}
          <dt>文件</dt>
          <dd className="paper-field-static">
            {doc.type.toUpperCase()} · {(doc.size / 1024 / 1024).toFixed(1)} MB
          </dd>
          <dt>进度</dt>
          <dd className="paper-field-static">
            {doc.percentage > 0 ? `已读 ${percent}%` : "还未开始阅读"}
          </dd>
          <dt>添加于</dt>
          <dd className="paper-field-static">
            {relativeTime(doc.createdAt)}
            {wasOpened(doc) && ` · 上次打开 ${relativeTime(doc.lastOpenedAt)}`}
          </dd>
        </dl>
        {(doc.noteCount > 0 ||
          doc.highlightCount > 0 ||
          doc.openQuestionCount > 0) && (
          <p className="paper-annotation-counts">
            {[
              doc.noteCount && `${doc.noteCount} 条批注`,
              doc.highlightCount && `${doc.highlightCount} 处划线`,
              doc.openQuestionCount && `${doc.openQuestionCount} 个问题待回答`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <section className="paper-abstract">
          <div className="flex items-center justify-between">
            <h3>简介</h3>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setEditingDescription(!editingDescription)}
            >
              {editingDescription ? "完成" : m.abstract ? "编辑" : "添加"}
            </Button>
          </div>
          {editingDescription ? (
            <Field doc={doc} name="abstract" label="简介" multiline />
          ) : m.abstract ? (
            <>
              <p data-open={descriptionOpen}>{m.abstract}</p>
              <Button
                size="xs"
                variant="link"
                className="px-0"
                onClick={() => setDescriptionOpen(!descriptionOpen)}
              >
                {descriptionOpen ? "收起" : "展开全文"}
              </Button>
            </>
          ) : null}
        </section>
      </div>
    </aside>
  );
}

function BookField({
  doc,
  name,
  label,
  placeholder,
}: {
  doc: Document;
  name: PaperMetadataField;
  label: string;
  placeholder?: string;
}) {
  return (
    <>
      <dt>{label}</dt>
      <dd>
        <Field doc={doc} name={name} label={label} placeholder={placeholder} />
      </dd>
    </>
  );
}

/** Five stars; choosing the current score again clears it. */
function Rating({ doc }: { doc: Document }) {
  const rating = doc.metadata.rating ?? 0;
  const [hover, setHover] = useState(0);
  const shown = hover || rating;
  return (
    <div
      className="book-rating"
      role="radiogroup"
      aria-label="评分"
      onPointerLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Button
          key={n}
          size="icon-xs"
          variant="ghost"
          role="radio"
          aria-checked={rating === n}
          aria-label={`${n} 星`}
          title={rating === n ? "清除评分" : `${n} 星`}
          onPointerEnter={() => setHover(n)}
          onClick={() =>
            void patchPapers([
              [doc, { metadata: { rating: rating === n ? 0 : n } }],
            ])
          }
        >
          <Star
            className={n <= shown ? "fill-current text-amber-500" : undefined}
          />
        </Button>
      ))}
    </div>
  );
}
