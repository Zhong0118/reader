import {
  ArrowRightLeft,
  BookOpen,
  ChartColumn,
  FileDown,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Document, LibraryMode } from "@neoread/core";
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from "@neoread/ui/components/context-menu";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@neoread/ui/components/dropdown-menu";
import { exportAnnotatedPDFWithToast } from "./annotated-pdf-export";

const kits = {
  context: { Item: ContextMenuItem, Separator: ContextMenuSeparator },
  dropdown: { Item: DropdownMenuItem, Separator: DropdownMenuSeparator },
};

export interface BookMenuActions {
  overview: (doc: Document) => void;
  usage: (doc: Document) => void;
  edit: (doc: Document) => void;
  move?: (doc: Document, library: LibraryMode) => void;
  trash: (doc: Document) => void;
}

/** Menu items for one document in the book library. */
export function BookMenuItems({
  kind,
  doc,
  actions,
  inPanel = false,
}: {
  kind: keyof typeof kits;
  doc: Document;
  actions: BookMenuActions;
  /** The detail panel has its own edit button. */
  inPanel?: boolean;
}) {
  const K = kits[kind];
  return (
    <>
      <K.Item onClick={() => actions.overview(doc)}>
        <BookOpen />
        文档概要
      </K.Item>
      <K.Item onClick={() => actions.usage(doc)}>
        <ChartColumn />
        用量统计
      </K.Item>
      {!inPanel && (
        <K.Item onClick={() => actions.edit(doc)}>
          <Pencil />
          编辑文档信息
        </K.Item>
      )}
      {doc.type === "pdf" && (
        <K.Item onClick={() => void exportAnnotatedPDFWithToast(doc)}>
          <FileDown />
          导出带批注的 PDF
        </K.Item>
      )}
      {actions.move && (doc.type === "pdf" || doc.library === "papers") && (
        <K.Item
          onClick={() =>
            actions.move!(doc, doc.library === "papers" ? "books" : "papers")
          }
        >
          <ArrowRightLeft />
          {doc.library === "papers" ? "移到图书库" : "移到论文库"}
        </K.Item>
      )}
      <K.Separator />
      <K.Item variant="destructive" onClick={() => actions.trash(doc)}>
        <Trash2 />
        移到回收站
      </K.Item>
    </>
  );
}
